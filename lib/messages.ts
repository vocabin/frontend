// One place for user-facing error copy.
// Rules: 해요체 · say what happened, then what to do next · never blame or pressure the user.

type ErrorKey = number | "network";

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  network: "연결이 불안정해요. 잠시 후 다시 시도해 주세요",
  400: "입력한 내용을 다시 확인해 주세요",
  401: "로그인이 만료됐어요. 다시 로그인해 주세요",
  403: "이 기능을 쓸 수 있는 권한이 없어요",
  404: "찾을 수 없어요. 목록에서 다시 열어 주세요",
  409: "이미 있는 항목이에요",
  429: "요청이 많아요. 잠시 후 다시 시도해 주세요",
  server: "일시적인 문제가 생겼어요. 잠시 후 다시 시도해 주세요",
};

export function errorStatus(e: unknown): number | undefined {
  return (e as { response?: { status?: number } }).response?.status;
}

// Maps an API error to copy; pass screen-specific wording for the statuses that matter there
export function apiErrorMessage(e: unknown, overrides: Partial<Record<ErrorKey, string>> = {}): string {
  const status = errorStatus(e);
  if (status === undefined) return overrides.network ?? DEFAULT_ERROR_MESSAGES.network;
  if (overrides[status]) return overrides[status] as string;
  if (DEFAULT_ERROR_MESSAGES[status]) return DEFAULT_ERROR_MESSAGES[status];
  return DEFAULT_ERROR_MESSAGES.server;
}
