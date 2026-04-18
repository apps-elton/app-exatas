# GeoTeach i18n - Internationalization Design Spec

## Overview

Migrate GeoTeach from a custom `LanguageContext` (2 languages, ~120 keys) to **react-i18next** with support for 12 languages, browser detection, and a flag-based language selector.

## Languages

| # | Language | Code | Flag | RTL |
|---|----------|------|------|-----|
| 1 | Portugues (Brasil) | pt-BR | BR | No |
| 2 | English | en | US | No |
| 3 | Espanol (LATAM) | es | MX | No |
| 4 | Francais | fr | FR | No |
| 5 | Deutsch | de | DE | No |
| 6 | Italiano | it | IT | No |
| 7 | Russkiy | ru | RU | No |
| 8 | Nihongo | ja | JP | No |
| 9 | Zhongwen | zh-CN | CN | No |
| 10 | Hangugeo | ko | KR | No |
| 11 | Al-Arabiyya | ar | SA | Yes |
| 12 | Hindi | hi | IN | No |

## Architecture

### Dependencies

```
react-i18next
i18next
i18next-browser-languagedetector
```

### File Structure

```
src/
  i18n/
    index.ts                    # i18next init + config
    locales/
      pt-BR.json
      en.json
      es.json
      fr.json
      de.json
      it.json
      ru.json
      ja.json
      zh-CN.json
      ko.json
      ar.json
      hi.json
  components/
    LanguageSelector.tsx        # New flag-based dropdown (replaces LanguageToggle.tsx)
```

### i18n Configuration (`src/i18n/index.ts`)

- Initialize i18next with `react-i18next` and `i18next-browser-languagedetector`
- Fallback language: `pt-BR`
- Detection order: `localStorage` -> `navigator` -> fallback
- localStorage key: `space-sculptor-language` (backward compatible)
- Import all locale JSON files statically (app is not large enough to need lazy loading)

### Translation Key Structure

Flat keys organized by namespace prefix. Migrate all existing keys from `LanguageContext` and add new keys for hardcoded strings.

Namespaces:
- `common.*` — shared buttons, labels, actions (Save, Cancel, Delete, etc.)
- `auth.*` — login, signup, password reset
- `dashboard.*` — dashboard page content
- `projects.*` — projects page content
- `admin.*` — admin panel pages
- `sidebar.*` — navigation sidebar labels
- `geometry.*` — 3D geometry tool (existing Space Sculptor keys)
- `settings.*` — settings page
- `errors.*` — error messages, toasts
- `languages.*` — language names in their own language

## Language Selector Component

### Design

- Dropdown/popover with scrollable list
- Each item: flag emoji + language name in its own language
  - e.g., "Deutsch", "Nihongo", "Al-Arabiyya"
- Current language shown as selected with flag
- Uses shadcn/ui `Popover` + `Command` or `DropdownMenu` for consistency

### Placement

1. **Header (logged in):** In the top navbar, near the user avatar/profile area
2. **Login/Signup pages:** Top-right corner, standalone position

### Behavior

- Clicking a language immediately switches the UI
- Persists selection to localStorage
- Sets `document.documentElement.dir` to `rtl` when Arabic is selected, `ltr` otherwise
- Sets `document.documentElement.lang` to the active locale code

## RTL Support (Arabic)

- Set `dir="rtl"` on `<html>` element when `ar` is active
- Use Tailwind `rtl:` variant for layout-sensitive styles
- Use CSS logical properties where needed (`ms-`, `me-`, `ps-`, `pe-` in Tailwind)
- Components using absolute positioning or directional margins need review

## Migration Plan

### What Gets Removed

- `src/context/LanguageContext.tsx` — replaced by i18next
- `src/components/LanguageToggle.tsx` — replaced by `LanguageSelector`
- All `useLanguage()` imports throughout the codebase

### What Gets Modified

- Every component/page using `useLanguage()` -> switch to `useTranslation()` from react-i18next
- Every component/page with hardcoded Portuguese strings -> use `t()` function
- `App.tsx` or `main.tsx` -> import `src/i18n/index.ts` (replaces `LanguageProvider`)
- `LanguageProvider` wrapper removed from component tree

### Hardcoded Strings to Extract

Key areas with hardcoded Portuguese:
- `src/pages/Dashboard.tsx` — greetings, descriptions
- `src/pages/Projects.tsx` — project labels, confirmations, copy suffix
- `src/pages/Login.tsx` — test account labels
- `src/pages/Settings.tsx` — settings labels
- `src/components/AppSidebar.tsx` — navigation items, role/plan labels
- `src/pages/admin/*` — all admin panel pages
- Toast messages throughout the app
- Error messages and validation strings
- `src/components/ErrorBoundary.tsx` — error display text

## Date/Number Formatting

- Use browser-native `Intl.DateTimeFormat` configured with the active i18next locale
- Use `Intl.NumberFormat` for number display
- No additional library needed (date-fns locale packs are optional future enhancement)

## Testing Considerations

- Verify all pages render without missing translation keys (console warnings from i18next)
- Verify language switching works on all routes
- Verify RTL layout for Arabic doesn't break critical UI
- Verify localStorage persistence across page reloads
- Verify browser language detection on first visit

## Out of Scope

- URL-based locale routing (`/en/dashboard`, `/pt/dashboard`) — not needed for this app
- Server-side rendering locale — app is SPA only
- Backend/API error message translation — handled client-side by error code mapping
- Lazy loading of locale files — app size doesn't warrant it yet
- Professional translation review — initial translations generated, can be refined later
