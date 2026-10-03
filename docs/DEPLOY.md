# CI and deploy

Two long-lived branches, one environment each. A feature branch is a PR into
`develop`; `develop` merged into `main` is a production release.

```
commit ─▶ CI ─▶ docker build ─▶ registry ─▶ roll ─▶ smoke test
           │          │         :sha                           │
      pnpm verify     │         :staging | :production         │
                NEXT_PUBLIC_* baked in        revert + push ◀──┘ on failure
```

| Workflow                | Runs on                    | Does                                         |
| ----------------------- | -------------------------- | -------------------------------------------- |
| `ci.yml`                | every PR, weekly, dispatch | `pnpm verify` — lint, typecheck, test, build |
| `deploy-staging.yml`    | push to `develop`          | CI, then **staging**                         |
| `deploy-production.yml` | push to `main`             | CI, then **production**                      |
| `deploy.yml`            | called with an environment | build → ECR → restart over SSH → smoke       |
| `deploy-ghcr.yml`       | called with an environment | build → GHCR → restart → smoke test          |
| `deploy-ec2.yml`        | called with an environment | build → tarball → PM2 reload → smoke         |

Each deploy workflow calls the real `ci.yml` first, so only a commit that passed
ships — no second definition of "green". Each target takes the environment as an
**input**, so staging and production differ by one argument. A third environment
is a copy of `deploy-staging.yml` with a different branch and name; the deploy
itself is untouched.

That matters more here than on the API: `NEXT_PUBLIC_*` are inlined into the
bundle, so **an image belongs to exactly one environment**. Reading them from
environment-scoped variables is what lets one build definition produce a correct
staging and a correct production image.

CI sets throwaway literal values for those two variables (`next build` sets
`NODE_ENV=production`, which drops the development defaults, so the build would
otherwise fail). CI compiles an artefact it never ships; the real values are
environment-scoped and read by the deploy.

The weekly `ci.yml` schedule exists because a new advisory against a dependency
you already have arrives without a commit — `pnpm audit` has to run on a clock.

## Three deploy targets

Same trigger, same CI, same image — three ways to land it. `deploy.yml` is the
default; the other two are kept, and reached by changing one line in the caller:

```yaml
# .github/workflows/deploy-staging.yml
uses: ./.github/workflows/deploy.yml # or deploy-ghcr.yml, or deploy-ec2.yml
```

|                  | `deploy.yml`                      | `deploy-ghcr.yml`                 | `deploy-ec2.yml`                |
| ---------------- | --------------------------------- | --------------------------------- | ------------------------------- |
| Registry         | ECR                               | GHCR                              | none — tarball over SCP         |
| Runs on          | one EC2 host, `docker run`        | one EC2 host, `docker run`        | one EC2 host, PM2               |
| Auth to registry | **OIDC**, no stored AWS keys      | the run's own `GITHUB_TOKEN`      | n/a                             |
| Auth to host     | SSH key in `secrets.SSH_KEY`      | same SSH key                      | same SSH key                    |
| Rollout          | `rm -f` then `run` — seconds down | `rm -f` then `run` — seconds down | preflight port, then PM2 reload |
| Host needs       | Docker                            | Docker                            | Node + PM2                      |
| `SSH_HOST` unset | the run fails                     | image ships, rollout skips        | build runs, rollout skips       |

All three land on **one host**. `deploy.yml` is the default — the image lives in
your own ECR and CI reaches AWS over OIDC, so no long-lived AWS key exists
anywhere. `deploy-ghcr.yml` is the same rollout for someone with no AWS account.
`deploy-ec2.yml` needs no registry at all.

None of the three is zero-downtime: `docker rm -f` then `docker run` is a hard
cutover of a few seconds. Removing that window means more than one instance
behind a load balancer — see [Later](#later-when-you-want-it).

All three inline `NEXT_PUBLIC_*` at build time and fail before the build if
either is unset, so **an image still belongs to exactly one environment** — an
ECR image tagged `:staging` can never be promoted to production.

## Set these up

`develop` does not exist until you create it — `deploy-staging.yml` waits on it:

```bash
git switch -c develop && git push -u origin develop
```

Create a **staging** and a **production** environment (Settings → Environments).
Both take the same variable names with that environment's values — these three
whatever the target, plus the block below for the one you deploy with:

| Name                   | Kind     | Notes                                                           |
| ---------------------- | -------- | --------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`  | variable | With the version, e.g. `https://staging-api.example.com/api/v1` |
| `NEXT_PUBLIC_APP_NAME` | variable | The name in the header and page titles                          |
| `APP_URL`              | variable | Smoke-test target, e.g. `https://staging.example.com`           |

The two `NEXT_PUBLIC_*` are **build** inputs, checked before the build because a
missing one otherwise fails as a 20-line `next build` error instead of a variable
name. **Changing either means a new image, not a restart.** Neither may ever hold
a secret — both ship to the browser.

Protect both branches (Settings → Branches): require the CI check and a review
before merge. Add required reviewers to the `production` environment to make the
deploy itself an approval gate.

### For `deploy.yml` — ECR over OIDC

| Name             | Kind     | Notes                                                        |
| ---------------- | -------- | ------------------------------------------------------------ |
| `AWS_ROLE_ARN`   | variable | Role the run assumes over OIDC. **No access keys anywhere.** |
| `AWS_REGION`     | variable | e.g. `ap-south-1`                                            |
| `ECR_REPOSITORY` | variable | Optional. Defaults to `enterprise-frontend`.                 |

No secret is needed on the AWS side — that is the point of OIDC. The run trades
its GitHub token for a short-lived session, pushes the image, then pipes an ECR
password over SSH into `docker login` on the host. **The host holds no AWS
credential and needs no AWS CLI**, which is one less thing to provision and
rotate.

**The AWS side, once per account:**

1. **OIDC provider**, so a run can trade its GitHub token for an AWS session:

   ```bash
   aws iam create-open-id-connect-provider --client-id-list sts.amazonaws.com \
     --url https://token.actions.githubusercontent.com
   ```

2. **Deploy role** — `AWS_ROLE_ARN`. The trust policy is the security boundary:
   without the `sub` condition, any repository on GitHub could assume it.

   ```jsonc
   "Condition": { "StringEquals": {
     "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
     "token.actions.githubusercontent.com:sub": [
       "repo:ORG@<org-id>/REPO@<repo-id>:environment:staging",
       "repo:ORG@<org-id>/REPO@<repo-id>:environment:production"
     ]
   }}
   ```

   **Read the `sub` off a real token — do not assume the format.** Where an
   owner has immutable IDs enabled, the claim is
   `repo:ORG@<org-id>/REPO@<repo-id>:environment:ENV`, not the plain
   `repo:ORG/REPO:environment:ENV` in every tutorial — and a policy pinning the
   wrong one is denied with an error that says nothing about why. Print the real
   claim from a step before the credentials step:

   ```yaml
   - run: |
       TOKEN=$(curl -sH "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
         "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com" | jq -r .value)
       python3 -c "import base64,json,sys;p=sys.argv[1].split('.')[1];print(json.loads(base64.urlsafe_b64decode(p+'='*(-len(p)%4)))['sub'])" "$TOKEN"
   ```

   One role can serve both apps and both environments — list all four `sub`
   values. Splitting production into its own role is tighter, and worth it once
   production data is real.

   Permissions: **ECR push on this repository, and nothing else.** The deploy
   calls no other AWS service.

   ```jsonc
   { "Effect": "Allow", "Action": "ecr:GetAuthorizationToken", "Resource": "*" },
   { "Effect": "Allow",
     "Resource": "arn:aws:ecr:<region>:<account>:repository/enterprise-frontend",
     "Action": ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage"] }
   ```

3. **ECR repository** — created by hand; the deploy only pushes. `scanOnPush`
   enabled, tag mutability left **MUTABLE** (the deploy re-points a `:staging` /
   `:production` tag every run), and a lifecycle rule expiring untagged images
   after 14 days.

### The host — all three targets

| Name       | Kind     | Notes                                                |
| ---------- | -------- | ---------------------------------------------------- |
| `SSH_HOST` | variable | Public DNS or IP                                     |
| `SSH_USER` | variable | `ec2-user`, `ubuntu`, …                              |
| `APP_PORT` | variable | Host port to publish. Defaults to 3000.              |
| `SSH_KEY`  | secret   | Private key, whole PEM including the BEGIN/END lines |

`deploy-ghcr.yml` and `deploy-ec2.yml` **skip their rollout** when `SSH_HOST` is
unset, which is what lets you wire CI up before a server exists. `deploy.yml`
requires it and fails in preflight.

**The host, once per environment** — one instance each, nothing shared:

1. **A key pair** — the public half in the deploy user's `~/.ssh/authorized_keys`,
   the private half whole, BEGIN/END lines included, in `SSH_KEY`.
2. **Docker**, with the deploy user in the `docker` group — for `deploy.yml` and
   `deploy-ghcr.yml`. No registry credential to place: both pipe a password in
   over stdin from the runner, ECR's in one case, `GITHUB_TOKEN`'s in the other.
3. **For `deploy-ec2.yml`:** Node (the version in `.nvmrc`) and PM2, with
   `pm2 startup` run once so the app comes back after a reboot, and
   `/var/www/enterprise-frontend` owned by the deploy user — the workflow writes
   releases there but does not create or chown it. No pnpm: the standalone
   build ships its own dependencies.
4. **nginx or an ALB in front for TLS** — no target terminates it, and this app
   is broken over plain HTTP either way (see [below](#serve-it-over-https)).

**No env file, nothing else.** `NEXT_PUBLIC_*` are baked into the image and the
Dockerfile already sets `NODE_ENV`, `PORT` and `HOSTNAME=0.0.0.0`, so this app
has no runtime configuration to put on a host. A `--env-file` here would
silently change nothing — and if the file is absent, `docker run` refuses to
start at all.

**When it fails.** `sts:AssumeRoleWithWebIdentity` denied — the `sub` in item 2
does not match the real claim; decode the token and compare byte for byte. The
run fails before the build naming a variable — that `NEXT_PUBLIC_*` is unset for
the environment. `docker login` says _cannot perform an interactive login from a
non TTY device_ — the password piped into it was empty, so look at the step that
produced it. The container runs but the smoke test fails — nothing fronts
`APP_PORT`, or `APP_URL` does not point at this host.

## Staging vs production

Identical pipeline, different inputs — but unlike the API, **not** an identical
image, because the API URL is compiled in.

|                       | Staging                   | Production                            |
| --------------------- | ------------------------- | ------------------------------------- |
| Branch                | `develop`                 | `main`                                |
| Approval              | none                      | required reviewers on the environment |
| Image tag             | `:<sha>` and `:staging`   | `:<sha>` and `:production`            |
| `NEXT_PUBLIC_API_URL` | the staging API           | the production API                    |
| Backend               | staging API, its own data | production API                        |

A staging image can never be promoted to production — it has the staging API URL
inside it. Production always builds its own.

## What a deploy does

`deploy.yml`, step by step:

1. **CI** — `pnpm verify` on the exact commit. Nothing proceeds if it fails.
2. **Preflight** — the run fails immediately if any required variable is unset for
   that environment, naming the one to set.
3. **Credentials** — the run assumes the AWS role over OIDC: short-lived, and
   scoped by the trust policy to this repo and this environment.
4. **Build and push** — `docker build` with both `NEXT_PUBLIC_*` as build args,
   inlined into the bundle here, into ECR with **two tags**: the commit SHA (what
   the host pulls) and the environment name (a pointer you can read to answer
   "what is on staging?").
5. **Log the host in** — the runner pipes an ECR password over SSH into
   `docker login` on the host. The credential is the runner's and lasts 12 hours;
   the host stores no AWS key of its own.
6. **Restart** — over SSH: `docker pull`, `docker rm -f`, then `docker run` with
   `--restart unless-stopped` so the container returns after a reboot, and
   `docker image prune -f` to stop the disk filling with old layers.
7. **Smoke test** — `curl` against `APP_URL/healthz`.

**The other two** build the same image and swap only the registry half.
`deploy-ghcr.yml` publishes to GHCR and is otherwise identical. `deploy-ec2.yml`
uses no registry at all: it ships the standalone output as a tarball, boots it on
a spare port as a preflight check, then symlinks it live and reloads PM2.

## Rollout safety and rollback

**The window.** `docker rm -f` then `docker run` is a hard cutover on a single
instance — expect a few seconds of connection refusals, on all three targets.
Removing that window means more than one instance behind a load balancer, which
is an ECS or Kubernetes rollout.

**Chunk names change every build.** A browser holding the old HTML will request
`/_next/static/*` files the new container does not have. Users mid-session see a
failed chunk load until they reload — normal for any SPA deploy, and the reason
`<ErrorTrap>` exists. Deploy during a quiet window, or serve static assets from a
CDN that keeps the previous build's chunks around.

**Deploy the API first when a release spans both.** This app is compiled against
one API version; ship the backend change (which is additive, per its contract
rules) before the UI that depends on it.

**To roll back**, revert the commit and push. The branch then still says what is
running, CI proves the revert, and the pipeline redeploys it the same way it
deployed the fault. That is the recovery path to reach for first.

**When you need it faster than a pipeline run**, the previous image is still in
the registry by SHA — on the instance:

```bash
docker rm -f enterprise-frontend
docker run -d --name enterprise-frontend --restart unless-stopped -p 3000:3000 \
  <account>.dkr.ecr.<region>.amazonaws.com/enterprise-frontend:<previous-sha>
```

Then revert the commit anyway, so the branch and the running container agree.
Note the environment tag (`:staging`, `:production`) still points at the bad
build until the next deploy — trust the SHA, not the pointer, during an incident.

**Deploy** can also be run by hand from the Actions tab (`workflow_dispatch`)
against a chosen environment.

## What the app needs from a host

`output: "standalone"` — the image ships the server plus traced deps, runs as
`node`, and honours `PORT`/`HOSTNAME`. `pnpm start` runs that same server locally
(`next start` cannot serve a standalone build); it copies `static/` and `public/`
in first, exactly as the Dockerfile does. On boot it logs which API the build was
compiled against — the one thing `NEXT_PUBLIC_*` hides at runtime. `/healthz`
answers the ALB target group and any ECS or Kubernetes probe, and is excluded from
the navigation gate.

## Serve it over HTTPS

Browsers gate a growing list of APIs on a _secure context_ — HTTPS or
`localhost`. Since `localhost` is always one, anything depending on them works in
development and fails only once deployed.

`crypto.randomUUID` is the one that bites first: `undefined` over plain HTTP, and
since the request id is attached in the axios interceptor, that used to take
sign-in down before any request left the browser. `createRequestId` now falls
back to `crypto.getRandomValues` — but service workers, the clipboard and the
rest of WebCrypto are still gated, so terminate TLS at your load balancer rather
than relying on the fallback.

## Later, when you want it

**More than one instance.** Everything above lands on a single host. An ECS
service or a Kubernetes deployment behind a load balancer buys a health-gated
rolling rollout and a circuit breaker that reverts a bad revision on its own —
and it replaces this one workflow file plus `ecs:*` and `iam:PassRole` on the
deploy role. Nothing else moves: the image, the build and the branch model are
already right for it.

Versioned GitHub Releases, release-please (auto version, CHANGELOG, tag) and a
PR-log comment all sit on top of this as a workflow that calls the deploy. Two
things make release automation fail quietly, so plan for both: a PR opened by the
default `GITHUB_TOKEN` **triggers no workflows** (use a PAT or GitHub App token,
or the release PR can never satisfy branch protection), and a tag pushed by that
token **raises no event** (so deploy must be _called_ by the release job, never
triggered by the tag).
