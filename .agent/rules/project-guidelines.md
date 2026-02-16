---
trigger: always_on
---

# BriefForms — Project Guidelines

## Project Overview

**BriefForms** is a Ukrainian-language online form builder that allows administrators to create, publish, and manage surveys, quizzes, and data collection forms. End users can fill out and submit forms anonymously through public URLs.

Key capabilities:
- Create forms with multiple question types (text, single choice, multiple choice)
- Conditional/branching logic — show questions based on prior answers
- Publish/draft form management
- Admin panel with JWT-based authentication
- Anonymous public form submissions
- Response viewer table in the admin dashboard

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI Components | shadcn/ui (New York style) + Radix UI |
| Styling | Tailwind CSS v4 |
| State Management | Zustand |
| Database | Supabase (PostgreSQL) |
| Auth | Custom JWT via `jose` + httpOnly cookies |
| Notifications | Sonner |
| Icons | Lucide React |
| Font | Geist (`next/font`) |
| Package Manager | npm |

---

## Important Commands
```bash
# Start development server
npm run dev          # runs at http://localhost:3000

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

---

## Environment Variables

Create `.env.local` at the project root (never commit this file):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_strong_random_secret
```

---

## Database Setup

Run `supabase/migration.sql` in the Supabase SQL editor. It creates:

- `forms` — title, slug, is_published, created_at
- `questions` — label, type, order_index, parent_question_id, trigger_option_id
- `options` — label, order_index, belongs to a question
- `responses` — one row per form submission
- `answers` — individual answer values per response

RLS is enabled. The **anon key** allows public reads of published forms and public inserts into responses. The **service role key** bypasses RLS entirely and is used only in server-side API routes.

---

## Project Structure
```
src/
├── app/
│   ├── (admin)/                     # Protected admin route group
│   │   ├── dashboard/page.tsx       # Forms list
│   │   ├── dashboard/forms/new/     # Create form
│   │   ├── dashboard/forms/[formId]/          # Edit form
│   │   ├── dashboard/forms/[formId]/responses/ # View responses
│   │   └── layout.tsx               # Sidebar + header shell
│   ├── (public)/
│   │   └── forms/[formSlug]/
│   │       ├── page.tsx             # Public form (SSR)
│   │       └── success/page.tsx     # Post-submit confirmation
│   ├── api/
│   │   ├── auth/login/route.ts      # POST — issues JWT cookie
│   │   ├── auth/logout/route.ts     # POST — clears cookie
│   │   ├── forms/route.ts           # GET list, POST create
│   │   ├── forms/[formId]/route.ts  # GET, PUT, DELETE
│   │   ├── forms/[formId]/responses/route.ts  # GET (admin)
│   │   └── responses/route.ts       # POST (public submit)
│   ├── auth/login/page.tsx
│   ├── layout.tsx                   # Root layout + Toaster
│   └── page.tsx                     # Landing page
│
├── components/
│   ├── builder/
│   │   ├── FormBuilder.tsx          # Main builder container
│   │   ├── QuestionEditor.tsx       # Per-question editing UI
│   │   ├── QuestionTypeSelector.tsx
│   │   ├── OptionsList.tsx
│   │   └── ConditionalLogicEditor.tsx
│   ├── dashboard/
│   │   ├── FormCard.tsx
│   │   ├── FormsList.tsx
│   │   └── ResponsesTable.tsx
│   ├── forms/                       # Public renderer components
│   │   ├── FormRenderer.tsx
│   │   ├── QuestionRouter.tsx       # Switches on question.type
│   │   ├── ConditionalBlock.tsx     # Renders visible child questions
│   │   ├── TextQuestion.tsx
│   │   ├── SingleChoiceQuestion.tsx
│   │   └── MultipleChoiceQuestion.tsx
│   ├── layout/
│   │   ├── AdminSidebar.tsx
│   │   ├── AdminHeader.tsx
│   │   └── LogoutButton.tsx
│   └── ui/                          # shadcn/ui primitives
│
├── hooks/
│   ├── useFormBuilder.ts            # Orchestrates save + redirect
│   ├── useFormRenderer.ts           # Answer state + validation + submit
│   └── useConditionalLogic.ts       # Wraps getVisibleQuestions()
│
├── lib/
│   ├── auth/jwt.ts                  # signAdminToken / verifyAdminToken
│   ├── conditional-logic.ts         # Pure fn: getVisibleQuestions()
│   ├── supabase/
│   │   ├── admin.ts                 # Service-role client (server only)
│   │   ├── server.ts                # Anon client (server components)
│   │   └── client.ts                # Anon client (browser)
│   └── utils.ts                     # cn() helper
│
├── middleware.ts                    # Guards /dashboard/*, redirects login
│
├── store/
│   ├── formBuilderStore.ts          # Zustand — all builder state + actions
│   └── authStore.ts                 # Zustand — login state
│
└── types/
    ├── form.ts                      # Form, Question, Option, QuestionInput, OptionInput
    └── response.ts                  # FormResponse, Answer, AnswerInput
```

---

## Auth Workflow

1. Admin POSTs to `/api/auth/login` → Supabase Auth validates credentials
2. Server signs an **HS256 JWT** (`jose`) and sets it as `httpOnly` `admin_token` cookie (24h)
3. `middleware.ts` runs on every `/dashboard/*` request and verifies the token; invalid/missing token redirects to `/auth/login`
4. Mutating API routes also verify the token independently before acting
5. Public routes (`/forms/[slug]`, `POST /api/responses`) have no auth requirement

---

## Conditional Logic System

- Any `single_choice` or `multiple_choice` question can act as a **parent**
- A **child question** carries `parent_question_id` + `trigger_option_id`
- The child is displayed only when the parent's current answer includes its `trigger_option_id`
- Nesting is recursive — a child can itself be a parent

The pure function `getVisibleQuestions()` in `src/lib/conditional-logic.ts` is the single source of truth. It is consumed by `useConditionalLogic` → `useFormRenderer` → `FormRenderer` + `ConditionalBlock`.

---

## Key Workflows

### Creating a Form
1. Visit `/dashboard/forms/new` → `FormBuilder` renders with empty `useFormBuilderStore` state
2. Admin fills in metadata and adds questions/options
3. Save → `POST /api/forms` → server creates a UUID map (client IDs → server IDs), inserts questions (no FK fields first), inserts options, then sets `trigger_option_id` in a second pass to avoid FK violations

### Editing a Form
1. `/dashboard/forms/[formId]` fetches the form → calls `loadForm()` on the store
2. Save → `PUT /api/forms/[formId]`
3. Server runs a multi-pass update: nullify all trigger IDs → delete removed questions (cascade clears child options/answers) → sanitize orphaned answers → upsert questions (pass 1, no FK fields) → upsert options → set `parent_question_id` (pass 2) → set `trigger_option_id` (pass 3)

### Public Form Submission
1. Form is server-rendered (SSR) in `(public)/forms/[formSlug]/page.tsx`
2. `FormRenderer` + `useFormRenderer` manage answers in local React state
3. On submit, only answers for currently **visible** questions are sent
4. `POST /api/responses` creates a `response` row + `answer` rows → client redirects to `/forms/[slug]/success`

## Useful Docs:
schacn: https://ui.shadcn.com/llms.txt
next.js: https://nextjs.org/docs/llms-full.txt

## Supabase Client Usage Rules

| Client file | Key used | When to use |
|---|---|---|
| `lib/supabase/admin.ts` | Service role | API routes that need to bypass RLS |
| `lib/supabase/server.ts` | Anon | Server Components reading public data |
| `lib/supabase/client.ts` | Anon | Browser-side reads of public data |

> **Never** import the admin client in client-side components or expose the service role key publicly.