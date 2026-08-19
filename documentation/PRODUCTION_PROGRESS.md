# Shootr Production Progress

Generated: 2026-07-24

Status terms: Not started, In progress, Implemented, Tested, Blocked, Requires external account, Requires legal review, Requires manual Apple configuration.

## Phase 0

| Requirement | Status | Notes |
|---|---|---|
| Inspect repository architecture | Implemented | See `PRODUCTION_CONVERSION_BASELINE.md`. |
| Read existing audit documentation | Implemented | Existing `audit-package/` reviewed. |
| Inventory mocked systems | Implemented | Current adapters are mock/local. |
| Run baseline checks | Implemented | See `documentation/baseline-checks/`. |
| Identify Apple blockers | Implemented | No native iOS project exists. |

## Sprint 1 Foundation

| Requirement | Status | Notes |
|---|---|---|
| Production environment configuration | Not started | Needs `APP_ENV`, `DEMO_MODE`, validation, and sanitized `.env.example`. |
| Database migrations | Not started | No database schema exists. |
| Authentication | Not started | Current auth is mock/client-only. |
| Account capabilities | Not started | Current roles are localStorage-only. |
| Row-level security and authorization | Not started | Requires real database/backend. |
| Demo isolation | Not started | Current `demoMode` is true and fixtures are visible in source. |

## Sprint 2 Shootr Operations

| Requirement | Status | Notes |
|---|---|---|
| Shootr onboarding records | Not started | Current onboarding is prototype/local. |
| Admin review workflow | Not started | Current admin routes are static/client-only. |
| Availability and service areas | Not started | Current service areas are fixtures. |
| Portfolio records | Not started | Current portfolio is demo assets/local metadata. |
| Payout onboarding | Not started | Requires Stripe Connect or equivalent. |

## Sprint 3 Booking Core

| Requirement | Status | Notes |
|---|---|---|
| Real eligibility and matching | Not started | Current matching is fixture scoring. |
| Server-enforced state machine | Not started | Current state transitions are frontend helpers. |
| Atomic booking acceptance | Not started | Requires server transaction/constraint. |
| Price quote snapshots | Not started | Current pricing is hardcoded service logic. |

## Later Sprints

| Area | Status | Notes |
|---|---|---|
| Payments and payouts | Not started | Requires external Stripe account. |
| Maps and live location | Not started | Requires external maps provider. |
| Messaging and notifications | Not started | Requires backend plus push/SMS/email providers. |
| Private Moments storage | Not started | Requires private object storage and processing. |
| Reviews, reputation, favorites | Not started | Needs backend records and moderation. |
| Safety, support, blocking, incidents | Not started | Needs policy and backend workflows. |
| Account deletion and retention | Not started | Needs backend deletion workflow; requires legal review. |
| Capacitor iOS shell | Not started | Requires manual Apple/Xcode configuration. |
| App Store readiness | Not started | Blocked until real app services and native shell exist. |
