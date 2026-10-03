// Liveness probe for ECS/Kubernetes — must stay public and outside the auth gate.
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json({ status: "ok" });
}
