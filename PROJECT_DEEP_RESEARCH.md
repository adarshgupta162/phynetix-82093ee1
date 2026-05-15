# PhyNetix Project Deep Research

## 1) Project Summary

PhyNetix is a full-stack, role-driven edtech platform for test preparation and academic operations.  
It combines:
- public marketing pages,
- student learning/testing workflows,
- multi-role staff/admin management,
- Supabase-backed data + authentication,
- and serverless edge functions for test/proctoring workflows.

Core implementation is in a React + TypeScript single-page app with Supabase as backend.

---

## 2) Technology Stack

### Frontend
- React 18 + TypeScript
- Vite 5 build tooling
- React Router v6 (route-driven app)
- TanStack React Query (data-fetching/cache layer)
- Tailwind CSS + shadcn/radix component ecosystem
- next-themes (dark mode + system theme support)

### UI/UX + Content Libraries
- framer-motion (animations)
- recharts (analytics charts)
- KaTeX / MathJax (math rendering)
- react-pdf / pdfjs-dist (PDF test workflow)
- xlsx + papaparse (bulk import / tabular ingestion use-cases)

### Backend / Platform
- Supabase (`@supabase/supabase-js`) for auth, data, row-level security model
- Supabase Edge Functions for secure backend operations

---

## 3) Runtime & Build Configuration

### Scripts (from `package.json`)
- `npm run dev` → starts Vite dev server
- `npm run build` → production build
- `npm run build:dev` → development-mode build
- `npm run lint` → ESLint
- `npm run preview` → preview production build

### Current observed validation state
- `npm run build` succeeds.
- `npm run lint` currently fails with an ESLint ENOENT related to generated `vite.config.ts.timestamp-*.mjs` resolution.

### Vite configuration highlights
- Host: `::`, port `8080`
- Path alias: `@` → `./src`
- React SWC plugin + lovable component tagger in development mode
- Dependency dedupe for React packages

---

## 4) Repository Structure (High-Level)

- `src/` → frontend application
  - `pages/` → route-level screens (public/student/admin)
  - `components/` → reusable UI and domain components
  - `hooks/` → auth/roles/enrollment/batch/platform hooks
  - `integrations/supabase/` → generated DB types + client
  - `lib/` → utilities (permissions, scoring, canonical URL, etc.)
- `supabase/`
  - `migrations/` → schema evolution SQL
  - `functions/` → edge functions (test lifecycle, notifications, proctoring)
  - `config.toml` → function security config

---

## 5) Application Architecture

## App composition (`src/main.tsx`, `src/App.tsx`)
- `ThemeProvider` at root
- `QueryClientProvider` for React Query
- `AuthProvider` for user/session/admin state
- `StaffRolesProvider` for active staff role model
- `ProfileGuard` to enforce profile completion
- React Router routes for all product modules

### Access-control layering
- `AdminRoute` gates admin endpoints (requires authenticated admin)
- profile completion enforcement (`ProfileGuard`)
- role metadata and capability model in `useStaffRoles` + `lib/permissions.ts`

---

## 6) Feature Map

## A) Public / Pre-login Experience
- Landing page
- About, Contact, Courses, Course detail
- Pricing, FAQ
- Legal pages: Privacy, Terms, Refund
- Test-series enrollment landing route

## B) Authentication
- Unified auth route (`/auth`, `/login`, `/signup`)
- Dedicated staff login route (`/staff-login`)
- Supabase Auth with PKCE flow in client config

## C) Student Experience
- Dashboard
- Test library (`/tests`)
- PDF test library (`/pdf-tests`)
- Test-taking (normal + PDF)
- Analysis pages, solutions, attempts history, analytics
- Question bank
- Settings + profile
- DPP module (listing + practice)
- Batch discovery, batch detail, my batches, checkout

## D) Staff / Admin Experience
- Central admin dashboard and department dashboards:
  - finance, academic, operations
- Test management:
  - creator, editor, fullscreen editor, analytics
  - separate PDF test create/edit/list flow
- Question bank and users management
- Batch management + bulk import
- Institutions management
- Staff community + requests
- Audit logs and settings
- Live monitoring (proctoring operations)
- PhyNetix Library management
- DPP manager/editor

---

## 7) Routing Inventory (from `src/App.tsx`)

### Public routes
- `/`
- `/about`, `/contact`, `/courses`, `/course/:courseId`
- `/pricing`, `/faq`, `/privacy`, `/terms`, `/refund`
- `/enroll/:testSeriesId`

### Auth routes
- `/auth`, `/login`, `/signup`, `/staff-login`

### Student routes
- `/dashboard`, `/tests`, `/pdf-tests`, `/question-bank`
- `/test/:testId`, `/pdf-test/:testId`
- `/test/:testId/analysis`, `/pdf-test/:testId/analysis`
- `/analysis/:testId`, `/solutions/:testId`
- `/profile`, `/attempts`, `/analytics`, `/settings`
- `/dpps`, `/dpp/:dppId`
- `/batches`, `/batches/:batchId`, `/my-batches`, `/checkout/:batchId`

### Admin routes (guarded)
- `/admin`, `/admin/select-role`
- `/admin/finance`, `/admin/academic`, `/admin/operations`
- `/admin/batches`, `/admin/question-bank`, `/admin/tests`
- `/admin/live-monitoring`
- `/admin/test-creator`, `/admin/test-editor/:testId`, `/admin/fullscreen-editor/:testId`
- `/admin/test-analytics/:testId`
- `/admin/pdf-tests`, `/admin/pdf-tests/create`, `/admin/pdf-tests/:testId/edit`
- `/admin/users`, `/admin/settings`
- `/admin/community`, `/admin/audit-logs`, `/admin/requests`
- `/admin/phynetix-library`
- `/admin/dpps`, `/admin/dpp-editor/:dppId`
- `/admin/bulk-import`, `/admin/institutions`

---

## 8) Role System & Permissions

### Role families
Defined app roles include:
- `admin`
- departmental admins: `academic_admin`, `operations_admin`, `finance_admin`, `marketing_admin`
- operational roles: `head`, `manager`, `teacher`, `data_manager`, `test_manager`
- `student`

### Role architecture
- `useAuth` determines authenticated user + admin status from `user_roles`.
- `useStaffRoles` loads all roles for staff users and supports active-role switching.
- `lib/permissions.ts` maps each role to explicit capability flags (tests, users, finance, notifications, settings, batches, etc.).

This enables both coarse route guarding and fine-grained feature authorization.

---

## 9) Supabase Data Model (from generated `types.ts`)

Key domain tables include:
- identity/admin: `profiles`, `user_roles`, `staff_requests`, `audit_logs`
- academic content: `courses`, `chapters`, `questions`, `test_subjects`, `test_sections`, `test_section_questions`, `test_questions`, `tests`
- attempts/analysis: `test_attempts`, `qb_attempts`, `qb_bookmarks`, `question_bookmarks`
- question bank hierarchy: `qb_courses`, `qb_chapters`, `qb_questions`
- DPP domain: `dpps`, `dpp_questions`, `dpp_attempts`
- batch/commercial: `batches`, `batch_tests`, `batch_enrollments`, `payments`, `coupons`, `coupon_usage`
- organization model: `institutions`, `institution_members`, `departments`
- communication: `notifications`, `community_messages`
- library: `phynetix_library`
- proctoring/monitoring: `proctoring_test_settings`, `proctoring_user_overrides`, `proctoring_sessions`, `proctoring_events`, `monitoring_sessions`, `monitoring_events`

### Database helper functions (typed)
Includes functions such as:
- `has_role`, `is_staff`, `is_super_admin`
- `has_test_access`, `is_enrolled_in_batch`, `join_batch_with_code`
- `get_user_institution_id`, `user_completed_test`

---

## 10) Supabase Edge Functions

Project includes edge functions for:
- test lifecycle: `start-test`, `get-test-questions`, `submit-test`, `recalculate-scores`
- proctoring: `start-proctoring-session`, `stop-proctoring-session`, `log-proctoring-event`, `admin-proctoring-sessions`, `auto-submit-expired`
- notifications: `send-notification`, `send-bulk-notification`
- admin operations: `create-staff-user`, `admin-reset-password`, `delete-user`
- utility workflows: `extract-answer-key`

Security posture in `supabase/config.toml` shows JWT verification enabled for configured functions.

---

## 11) Security & Session Notes

- Supabase client uses persisted sessions and token auto-refresh.
- Auth flow uses PKCE.
- Admin route protection is enforced in frontend and expected to be backed by role-aware backend policies.
- Profile completion is actively enforced after authentication through a guard dialog workflow.

---

## 12) UI System & Design Characteristics

- Tailwind theme uses tokenized CSS variables for dark/light mode.
- Custom semantic colors exist for domains like physics/chemistry/maths plus success/warning.
- Gradient design system is documented in `GRADIENT_USAGE.md`.
- shadcn/radix primitives are used widely for standardized accessible UI patterns.

---

## 13) Observed Product Capabilities (Consolidated)

1. Multi-role educational platform (student + complex staff hierarchy).
2. Full test lifecycle: creation, publishing, taking, analysis, and attempts tracking.
3. Dual test modality support (normal + PDF-based tests).
4. DPP practice subsystem with attempt recording/scoring.
5. Question-bank ecosystem with bookmarking/attempt tracking.
6. Batch commerce + enrollment + coupon/payment model.
7. Institutional administration and membership model.
8. Community + notifications + request/audit workflows.
9. Live proctoring and monitoring with event/session persistence.
10. Profile completion and role-based UX segmentation.

---

## 14) Environment & Deployment Inputs

Environment variables currently used by frontend integration:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Deployment metadata:
- `vercel.json` exists (deployment integration present).

---

## 15) Suggested Next Documentation Improvements

1. Replace default README with a product-specific README referencing this document.
2. Add architecture diagrams (frontend modules, auth flow, data domains).
3. Add a dedicated API contracts doc for each edge function.
4. Add role-permission matrix table for non-technical admins.
5. Add operational runbooks (proctoring incidents, payment issues, bulk import troubleshooting).

