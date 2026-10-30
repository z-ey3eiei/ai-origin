import "server-only";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

const cookieName = "origin_workspace";
export async function workspaceIdentity() {
  const cookieStore = await cookies();
  const existing = cookieStore.get(cookieName)?.value;
  if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing;
  const id = randomBytes(32).toString("hex");
  cookieStore.set(cookieName, id, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  return id;
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (new URL(origin).host !== host)
    throw new Error("Cross-origin mutations are not allowed.");
}
