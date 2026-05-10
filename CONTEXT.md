# Vocabin 프론트엔드 컨텍스트

퀴즐렛 단어를 주차별로 관리하고 플래시카드 / 스피드 런 / 취약 단어 모드로 복습하는 개인용 영어 학습 웹앱.

---

## 백엔드 프로젝트 위치

```
로컬: /Users/imin-u/study/vocabin/backend
GitHub: https://github.com/vocabin/backend
```

- Spring Boot (Java 21) + MariaDB
- 로컬 실행: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger-ui/index.html` ← API 명세 전체 확인 가능
- 백엔드 API 시나리오 전체: `/Users/imin-u/study/vocabin/CONTEXT.md`

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 폰트 | Pretendard |
| HTTP 클라이언트 | axios (설치 필요) |

---

## 디자인 시스템

| 항목 | 값 |
|------|-----|
| 컨셉 | 토스 스타일 플랫 디자인 |
| 배경 | 흰색 (`#ffffff`) |
| 카드 배경 | 연한 회색 (`#f5f5f5`) |
| 메인 컬러 | `#185FA5` (블루) — `text-primary`, `bg-primary` |
| 정답 색상 | `#3B6D11` (초록) — `text-correct` |
| 오답 색상 | `#A32D2D` (빨강) — `text-wrong` |
| 코너 반경 | `rounded-xl` (기본), `rounded-2xl` (카드) |
| 폰트 | Pretendard (이미 globals.css에 적용됨) |
| 불필요한 장식 없이 핵심 정보만 표시 ||

커스텀 색상은 `globals.css`의 `@theme`에 이미 등록되어 있음:
```css
--color-primary: #185FA5
--color-correct: #3B6D11
--color-wrong: #A32D2D
```

---

## 라우팅 구조

```
app/
├── page.tsx                  # / — 홈 (세트별 진행률 카드 + 오늘 통계 요약)
├── words/
│   ├── page.tsx              # /words — 단어 목록 (세트 탭 필터 + 수정/삭제)
│   └── upload/page.tsx       # /words/upload — CSV 업로드
├── study/
│   ├── flashcard/page.tsx    # /study/flashcard — 플래시카드 모드
│   ├── speedrun/page.tsx     # /study/speedrun — 스피드 런 모드
│   └── weak/page.tsx         # /study/weak — 취약 단어 모드
└── stats/page.tsx            # /stats — 학습 통계
```

인증 페이지 (추가 필요):
```
app/
├── login/page.tsx
└── register/page.tsx
```

---

## 레이아웃

- **데스크탑**: 좌측 사이드바 (네비게이션)
- **모바일**: 하단 탭바
- `app/layout.tsx`에 공통 레이아웃 적용

사이드바/탭바 메뉴:
| 메뉴 | 경로 |
|------|------|
| 홈 | `/` |
| 단어 | `/words` |
| 통계 | `/stats` |

---

## 인증 방식

- **Access Token**: JS 메모리(변수)에 저장 — `localStorage` 사용 금지
- **Refresh Token**: HttpOnly Secure 쿠키 (서버가 자동 설정, 프론트에서 직접 접근 불가)
- **401 처리**: Axios interceptor에서 자동으로 `/api/auth/refresh` 호출 후 원래 요청 재시도
- **로그아웃**: `/api/auth/logout` 호출 → Access Token 메모리에서 제거

---

## 페이지별 API

### 홈 (`/`)
| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/word-sets` | 세트 목록 + 진행률 카드 |
| GET | `/api/stats/summary` | 오늘 복습할 단어 수 / 이번 주 정답률 / 연속 학습일 |

### 단어 목록 (`/words`)
| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/word-sets` | 상단 탭 필터 목록 |
| GET | `/api/word-sets/{wordSetId}/words` | 선택한 세트의 단어 목록 |
| PUT | `/api/words/{wordId}` | 단어 수정 |
| DELETE | `/api/words/{wordId}` | 단어 삭제 |

### 단어 업로드 (`/words/upload`)
| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/word-sets` | 세트 선택 드롭다운 |
| POST | `/api/word-sets` | 새 세트 생성 |
| POST | `/api/word-sets/{wordSetId}/upload/quizlet` | Quizlet 파일 업로드 |
| POST | `/api/word-sets/{wordSetId}/upload/template` | 앱 템플릿 업로드 |

### 플래시카드 (`/study/flashcard`)
| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/word-sets/{wordSetId}/words` | 학습할 단어 목록 |
| POST | `/api/study/records` | O/X 결과 기록 (mode=FLASHCARD) |
| PUT | `/api/words/{wordId}` | 카드 우상단 수정 버튼 |

### 스피드 런 (`/study/speedrun`)
| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/word-sets/{wordSetId}/words` | 학습할 단어 목록 |
| POST | `/api/study/records` | O/X 결과 기록 (mode=SPEEDRUN) |

### 취약 단어 (`/study/weak`)
| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/words/weak` | 취약 단어 목록 (오답 3회 이상) |

- 쿼리 파라미터: `?wordSetId={id}` (선택)

### 통계 (`/stats`)
| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/stats/summary` | 총 단어 수 / 전체 정답률 / 연속 학습일 / 총 세션 수 |
| GET | `/api/stats/weekly` | 이번 주 요일별 정답률 (차트) |
| GET | `/api/stats/calendar` | 월별 학습 히트맵 (`?year=&month=`) |
| GET | `/api/word-sets/progress` | 세트별 진행률 |

### 설정 (`/settings`)
| Method | Endpoint | 용도 |
|--------|----------|------|
| GET | `/api/members/me` | 내 계정 정보 (닉네임, 이메일) |
| PUT | `/api/members/me/nickname` | 닉네임 수정 |
| PUT | `/api/members/me/password` | 비밀번호 변경 |
| GET | `/api/settings` | 학습 설정 조회 (하루 목표, 랜덤 여부) |
| PUT | `/api/settings` | 학습 설정 수정 |
| POST | `/api/auth/logout` | 로그아웃 |
| DELETE | `/api/members/me` | 회원 탈퇴 |

### 인증
| Method | Endpoint | 용도 |
|--------|----------|------|
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/login` | 로그인 → Access Token 반환 + Refresh Token 쿠키 설정 |
| POST | `/api/auth/refresh` | Access Token 재발급 (Axios interceptor에서 자동 호출) |

---

## 개발 시 참고

- 모든 API 요청 헤더에 `Authorization: Bearer {accessToken}` 포함 (로그인/회원가입 제외)
- API 베이스 URL: `http://localhost:8080` (개발 환경)
- Axios 인스턴스를 공통으로 만들고 interceptor로 토큰 자동 첨부 권장
- Swagger에서 요청/응답 스펙 직접 확인 가능: `http://localhost:8080/swagger-ui/index.html`
