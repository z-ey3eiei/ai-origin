import { NextResponse, type NextRequest } from "next/server";
import { publicBetaMessage, release } from "@/lib/release";

export function middleware(request: NextRequest) {
  const isMutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  const isKnowledgeSearch = request.nextUrl.pathname === "/api/knowledge";
  if (release.publicReadOnly && (isMutation || isKnowledgeSearch)) {
    return NextResponse.json(
      { error: publicBetaMessage },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.next();
}

export const config = { matcher: ["/api/:path*"] };
