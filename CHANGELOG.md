# Changelog

## [1.2.0](https://github.com/gajendra-devstree/enterprise-frontend/compare/v1.1.0...v1.2.0) (2026-08-27)


### Features

* implement user avatar upload and removal functionality with S3 integration ([df3449b](https://github.com/gajendra-devstree/enterprise-frontend/commit/df3449b38273a6438d47945b98d54592bac20282))

## [1.1.0](https://github.com/gajendra-devstree/enterprise-frontend/compare/v1.0.0...v1.1.0) (2026-08-25)


### Features

* add debug step to output OIDC subject claim for AWS role configuration ([0b77a17](https://github.com/gajendra-devstree/enterprise-frontend/commit/0b77a17c48d1496885d80f04f0ab493493505909))
* add OIDC claim debugger step to deployment workflow ([e09d47b](https://github.com/gajendra-devstree/enterprise-frontend/commit/e09d47bc8be0bfb0cb6149bd3c1b95d5f37f6bba))

## 1.0.0 (2026-08-24)


### Features

* add AccessDenied component for handling permission errors ([91daf9e](https://github.com/gajendra-devstree/enterprise-frontend/commit/91daf9e6f7c82a223b9973657d2787f3b048fab1))
* add CI/CD deployment workflow and health check endpoint ([2b9cd04](https://github.com/gajendra-devstree/enterprise-frontend/commit/2b9cd049c54c5741c45b2a81f77f494c2bf06b6a))
* add EC2 deployment workflow and update staging and production p… ([f79ce20](https://github.com/gajendra-devstree/enterprise-frontend/commit/f79ce202ecbe97bc99f4e1a7035abb902786200f))
* add EC2 deployment workflow and update staging and production pipelines to use it ([36b314e](https://github.com/gajendra-devstree/enterprise-frontend/commit/36b314eda924330afc6d14ccbd67d864c55dd8ab))
* add ecosystem.config.js to enable zero-downtime deployments via PM2 reload ([8f57019](https://github.com/gajendra-devstree/enterprise-frontend/commit/8f57019cd494f49450b53c7f8e7c95536e743fc5))
* add GitHub Actions workflow to build, publish, and deploy via SSH ([b747adc](https://github.com/gajendra-devstree/enterprise-frontend/commit/b747adcea4d62c0abe43d3435553d7ce7c5a3b8f))
* add release-please workflow for automated versioning and changelogs ([e79dd8e](https://github.com/gajendra-devstree/enterprise-frontend/commit/e79dd8e44fb8d880472b7fd7052b1ae420c5510e))
* enhance design system with elevation ladder and semantic tokens ([9a2d9da](https://github.com/gajendra-devstree/enterprise-frontend/commit/9a2d9da5c86e77804d568e82198f046044cacc6a))
* implement generic CRUD API hooks and FormDialog component with validation and dirty state handling ([d9762eb](https://github.com/gajendra-devstree/enterprise-frontend/commit/d9762eb03fad141c839abffc7ff202bf4a6d7a07))
* implement pre-flight check and automatic cleanup in EC2 deployment workflow ([243052a](https://github.com/gajendra-devstree/enterprise-frontend/commit/243052a6757334e5b8079a0eeae5ed91699d1c72))
* update dependabot configuration for improved dependency management ([2b3b95e](https://github.com/gajendra-devstree/enterprise-frontend/commit/2b3b95ead4e82e6d1a68eca34871e377888a8ea6))
* update GitHub Actions to use latest versions of checkout, pnpm, Node, cache, Buildx, and login actions ([0e04f3d](https://github.com/gajendra-devstree/enterprise-frontend/commit/0e04f3d7181e77fc3a1fcbee6e6dc959c55a5894))


### Bug Fixes

* load nvm environment before restarting pm2 process in EC2 deployment workflow ([5aa44e6](https://github.com/gajendra-devstree/enterprise-frontend/commit/5aa44e661b73d2c4bd616a6789135e558b654394))
* replace shorthand directory check with explicit conditional in deployment workflow ([b155814](https://github.com/gajendra-devstree/enterprise-frontend/commit/b155814e388050f2790f3ecec7878306fa728bed))
