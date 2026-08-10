import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

// Cookies can't be mutated from a Server Component render, so a stale
// session (structurally valid JWT, but pointing at a user that no longer
// exists) is handed off here to actually clear the cookie before bouncing
// back to /login — see getCurrentUser in dal.ts.
export async function GET(request: Request) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url));
}
