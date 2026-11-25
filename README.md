# HirePath — Learn Smarter. Build Skills. Get Hired.

HirePath is an AI-powered career readiness and educational platform aligning academic coursework with industry engineering and product expectations (supporting UN Sustainable Development Goal 4: Quality Education and SDG 8: Decent Work).

## Architecture Overview

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Recharts, Lucide React, Motion, jsPDF.
- **Backend**: Express + TypeScript (`server.ts`) on port `3000` with Socket.IO real-time events, Firebase Admin token verification, sliding-window rate limiting, and server-side Gemini AI integration.
- **Database & Auth**: Firebase Authentication (Google Sign-In) + Cloud Firestore with split PII isolation (`users_public` vs `users_private`) and audited `firestore.rules`.
- **AI Engine**: `@google/genai` SDK (`gemini-4-hydrogen` with `ThinkingLevel.HIGH` for deep career reasoning, personalized roadmaps, skill-gap plans, ATS critiques, and interview scoring; `gemini-3.1-flash-lite` for fast chat and summary drafts).

## Key Features

1. **Learner Dashboard**: Real-time readiness indicator, roadmap completion, skill coverage, Recharts weekly activity chart, recommended verified resources, and earned milestones.
2. **Career Explorer**: 12 career tracks with technical/soft skill benchmarks, prerequisites, tech stack, suggested projects, and interview topics.
3. **AI Personalized Learning Roadmaps**: 8-stage Gemini-generated learning tracks with interactive lesson checkboxes persisted in Firestore.
4. **Skill-Gap Diagnostics**: Radar and bar charts comparing user skills against career tracks or live recruiter job listings, plus AI 4-week improvement plans.
5. **Verified Resource Library**: Search, category/difficulty filters, sorting, pagination, and persistent bookmarks using verified documentation URLs.
6. **HirePath AI Career Assistant**: Multi-turn chat with saved conversation history and Deep Thinking / Fast Q&A mode toggle.
7. **ATS Resume Builder**: Live preview across three clean templates, Gemini summary & ATS review, and client-side PDF download.
8. **Interview Prep Studio**: Timed practice across Technical, HR, and Role-Specific questions with Gemini rubric scoring.
9. **Server-Graded Quizzes**: Timed assessments with server-side answer verification, explanations, and automatic skill profile updates.
10. **Jobs Board, Recruiter Portal, Community & Admin Console**: Real-time Socket.IO notifications, candidate skill comparison, moderation reports, and platform analytics.

## Local Development

```bash
npm install
npm run dev
```

The Express + Vite + Socket.IO server runs on `http://localhost:3000`.

## Environment Variables

Configure via `.env` or runtime secrets:

- `GEMINI_API_KEY`: Google Gemini API key (server-side only).
- `APP_URL`: Public application URL.

## Verification & Testing

```bash
npm run lint
npm run build
npx eslint firestore.rules
npx tsx --test tests/api.test.ts
```

## Docker Deployment

```bash
docker compose up --build -d
```
