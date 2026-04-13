# Phase 3: Production Readiness - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add audit logging, LGPD compliance, and Resend email scaffold so the system meets minimum legal and operational requirements for production in Brazil.

**Architecture:** Audit log via PostgreSQL triggers (SECURITY DEFINER functions write to audit_log table). LGPD compliance via a public privacy page, cookie consent banner, and a database function for data export. Resend integration scaffolded with env var, ready for API key.

**Tech Stack:** PostgreSQL triggers, React components, Supabase RPC, Resend SDK

**Findings covered:** F7, F12, F29, F34

**Note:** F30 (Stripe) is deferred — requires Stripe API keys and a dedicated integration plan. F6 (security headers) already implemented in Phase 1. F8 (project limits) already enforced in database. F12 (duplicate subscription tables) already resolved — `subscribers` table was removed.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `supabase/migrations/20260412100001_audit_log_triggers.sql` | Triggers to write audit entries |
| Create | `src/pages/Privacy.tsx` | LGPD privacy policy page |
| Create | `src/components/CookieConsent.tsx` | Cookie consent banner |
| Create | `supabase/migrations/20260412100002_export_user_data.sql` | RPC for LGPD data export |
| Create | `src/lib/resend.ts` | Resend email scaffold |
| Modify | `src/App.tsx` | Add /privacy route and CookieConsent |

---

### Task 1: Activate Audit Log Triggers (F7)

### Task 2: LGPD Privacy Page (F34)

### Task 3: Cookie Consent Banner (F34)

### Task 4: LGPD Data Export Function (F34)

### Task 5: Resend Email Scaffold (F29)
