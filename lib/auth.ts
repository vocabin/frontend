/**
 * Access Token을 JS 메모리(변수)에 저장합니다.
 * localStorage 사용 금지 — XSS 공격 방지
 */

let accessToken = "";

export function getAccessToken(): string {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = "";
}

export function isAuthenticated(): boolean {
  return accessToken !== "";
}
