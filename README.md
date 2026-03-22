# Vocabin Frontend

영어 학습 웹앱 Vocabin의 프론트엔드입니다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Font | Pretendard |

## 실행 방법

### Docker Compose (권장)

```bash
docker-compose up -d
```

### 로컬 직접 실행

```bash
npm install
npm run dev
```

개발 서버: http://localhost:3000

## 라우팅

| URL | 설명 |
|-----|------|
| `/` | 메인 — 오늘 복습할 단어 요약 |
| `/words` | 단어 목록 (주차별 필터) |
| `/words/upload` | CSV 업로드 |
| `/study/flashcard` | 플래시카드 모드 |
| `/study/speedrun` | 스피드 런 모드 |
| `/study/weak` | 취약 단어 모드 |
| `/stats` | 학습 통계 |

## UI 컨셉

- 토스 스타일 플랫 디자인 (흰 배경, 카드 중심)
- 메인 컬러: `#185FA5`
- 정답: `#3B6D11` / 오답: `#A32D2D`
