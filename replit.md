# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Nursing Review (nursing-quiz) - Mobile App (Expo)
- **Path**: `artifacts/nursing-quiz/`
- **Type**: Expo (React Native) mobile app
- **Purpose**: NCLEX-style nursing school quiz app with 10 subject categories and 65 challenging questions
- **Features**:
  - 10 subject categories: Nursing Fundamentals, Medical-Surgical, Pharmacology, OB & Maternity, Pediatrics, Psychiatric & Mental Health, Community & Public Health, Leadership & Management, Critical Care, Nutrition & Fluids
  - 65 NCLEX-style questions with answer choices, correct answers, and clinical rationale explanations
  - Progress tracking per category and overall with AsyncStorage persistence
  - Difficulty levels: Easy, Medium, Hard
  - Study tab + Progress/Stats tab
  - Question shuffling on each quiz attempt
  - Result screen with grade and score breakdown
- **State**: AsyncStorage (no backend required)
- **Key files**:
  - `data/questions.ts` - All question categories and questions data
  - `hooks/useQuizProgress.ts` - Progress tracking with AsyncStorage
  - `components/CategoryCard.tsx` - Category list item with progress bar
  - `components/QuestionCard.tsx` - Question display with answer selection and explanation
  - `components/ResultScreen.tsx` - End-of-quiz results
  - `app/(tabs)/index.tsx` - Home/Study screen
  - `app/(tabs)/stats.tsx` - Progress screen
  - `app/quiz/[categoryId].tsx` - Quiz screen

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
