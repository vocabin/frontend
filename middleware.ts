import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 개발 환경에서는 로그인 없이 전체 페이지 접근 허용
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Refresh Token 쿠키 존재 여부로 인증 확인
  const hasRefreshToken = request.cookies.has("refresh_token");
  if (!hasRefreshToken) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/|.*\\.png$).*)"],
};
