# Serenity Breathing 🌿 — Comprehensive Project Guide & Architecture

> **Notice for Developers & AI Assistants**:  
> This file is the **Single Source of Truth** for the architecture, data models, design principles, component contracts, and development workflows of **Serenity Breathing**.  
> **Rule**: Whenever you modify or add any feature, schema, route, or configuration in this codebase, **you must update this document** to reflect the changes in the relevant sections and log the update in the [Project Change Log](#11-project-change-log--maintenance-record).

---

## Table of Contents
1. [Project Overview & Philosophy](#1-project-overview--philosophy)
2. [Complete Technology Stack](#2-complete-technology-stack)
3. [Project Directory Structure](#3-project-directory-structure)
4. [Application Architecture & Data Flow](#4-application-architecture--data-flow)
5. [Components & Modules Breakdown](#5-components--modules-breakdown)
6. [Data Models & Database Schema (Cloud Firestore)](#6-data-models--database-schema-cloud-firestore)
7. [Security Rules & Data Validation](#7-security-rules--data-validation)
8. [Design System, Theme & UI Conventions](#8-design-system-theme--ui-conventions)
9. [Critical Patterns, Gotchas & Safeguards](#9-critical-patterns-gotchas--safeguards)
10. [Developer Playbooks (How to Make Changes)](#10-developer-playbooks-how-to-make-changes)
11. [Deployment, PWA & Environment Variables](#11-deployment-pwa--environment-variables)
12. [Project Change Log & Maintenance Record](#12-project-change-log--maintenance-record)

---

## 1. Project Overview & Philosophy

### 1.1 What is Serenity Breathing?
**Serenity Breathing** is a digital mindfulness, breathwork, and wellness platform designed by **Hareram Kushwaha**. It blends scientifically-backed breathing techniques (Navy SEAL Box Breathing, 4-7-8 Sleep Method, Coherence Breathing, Energizing Morning/Power Rhythms) with real-time health analytics, streak tracking, mood shifts, and custom breath rhythm creators.

- **Live URL**: [https://serenity.hareramkushwaha.com.np](https://serenity.hareramkushwaha.com.np)
- **Author**: Hareram Kushwaha ([hareramkushwaha.com.np](https://hareramkushwaha.com.np))
- **License**: MIT
- **Current Version**: 1.3.0 Professional

### 1.2 Core Product Principles
1. **Zero-Lag UX & Optimistic UI**: User interactions (timer actions, slider modifications, habit checks) must respond instantaneously without waiting for network round-trips. Remote state syncs silently in the background with error fallbacks.
2. **Supportive, Non-Judgmental Health Language**: Health metrics such as BMI do not use stigmatizing labels; instead, they use mindful, encouraging categories (*Nourishment Needed*, *Pure Serenity*, *Self-care Goal*, *Health Priority*).
3. **Sub-Millisecond Breathing Precision**: Timers and phase transitions rely on `useRef` based counters rather than naive React interval state to eliminate frame drops and stale closure drift.
4. **Privacy-First & Cloud Persistence**: User sessions and habit streaks are isolated per authenticated user via strict Cloud Firestore security rules.

---

## 2. Complete Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime & Bundler** | [Vite](https://vitejs.dev/) | `^6.2.0` | Ultra-fast HMR and ESM-based production bundler |
| **Frontend Framework** | [React](https://react.dev/) | `^19.0.0` | Modern UI rendering with React 19 hooks |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `~5.8.2` | Strict end-to-end typing across components and data models |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.1.14` | Next-gen CSS engine using `@theme` and `@tailwindcss/vite` |
| **UI Primitives** | [shadcn/ui](https://ui.shadcn.com/) / [Base UI](https://base-ui.com/) | `^4.2.0` / `^1.4.0` | Accessible, unstyled foundation for UI components |
| **Animations** | [Motion (Framer)](https://motion.dev/) | `^12.38.0` | Smooth spring transitions, breath circle scaling, modal animations |
| **Backend & Auth** | [Firebase SDK](https://firebase.google.com/) | `^12.12.0` | Firebase Auth (Email/Password), Cloud Firestore (realtime sync) |
| **Theme Management** | [next-themes](https://github.com/pacocoursey/next-themes) | `^0.4.6` | Dark/Light mode theme switching with class strategy |
| **Notifications** | [Sonner](https://sonner.emilkowal.ski/) | `^2.0.7` | Non-intrusive toast notifications |
| **Icons** | [Lucide React](https://lucide.dev/) | `^0.546.0` | Modern, clean iconography |
| **Date Utilities** | [date-fns](https://date-fns.org/) | `^4.1.0` | Robust date comparison, streaks, and formatting |
| **Fonts** | `@fontsource-variable/geist` | `^5.2.8` | Variable Geist Sans font for modern typographic hierarchy |
| **Deployment Target** | Cloudflare Pages | - | Static hosting with custom HTTP security headers (`_headers`) |

---

## 3. Project Directory Structure

- [components.json](file:///home/ha-re-ram/Projects/Serenity-Breathing/components.json) — shadcn/ui configuration file (base-nova style)
- [firestore.rules](file:///home/ha-re-ram/Projects/Serenity-Breathing/firestore.rules) — Cloud Firestore security rules & schema validators
- [index.html](file:///home/ha-re-ram/Projects/Serenity-Breathing/index.html) — Main entrypoint with SEO meta, OpenGraph, JSON-LD schema
- [package.json](file:///home/ha-re-ram/Projects/Serenity-Breathing/package.json) — Project dependencies and npm scripts
- [tsconfig.json](file:///home/ha-re-ram/Projects/Serenity-Breathing/tsconfig.json) — TypeScript compiler config with path alias `@/*`
- [vite.config.ts](file:///home/ha-re-ram/Projects/Serenity-Breathing/vite.config.ts) — Vite config with Tailwind v4 & React plugins, path alias
- [components/ui/](file:///home/ha-re-ram/Projects/Serenity-Breathing/components/ui/) — shadcn UI primitives: button, card, dialog, drawer, input, label, progress, slider, sonner, tabs
- [lib/utils.ts](file:///home/ha-re-ram/Projects/Serenity-Breathing/lib/utils.ts) — Shared `cn()` utility (`clsx` + `tailwind-merge`)
- [public/_headers](file:///home/ha-re-ram/Projects/Serenity-Breathing/public/_headers) — Cloudflare Pages HTTP security headers & strict CSP
- [public/_redirects](file:///home/ha-re-ram/Projects/Serenity-Breathing/public/_redirects) — SPA redirection rule (`/* /index.html 200`)
- [public/icon.png](file:///home/ha-re-ram/Projects/Serenity-Breathing/public/icon.png) — App icon & PWA icon
- [public/manifest.json](file:///home/ha-re-ram/Projects/Serenity-Breathing/public/manifest.json) — Progressive Web App (PWA) manifest
- [public/robots.txt](file:///home/ha-re-ram/Projects/Serenity-Breathing/public/robots.txt) — Search engine crawler directives
- [public/sitemap.xml](file:///home/ha-re-ram/Projects/Serenity-Breathing/public/sitemap.xml) — Sitemap for SEO indexing
- [public/sw.js](file:///home/ha-re-ram/Projects/Serenity-Breathing/public/sw.js) — Service worker for offline asset caching (Cache-First)
- [src/App.tsx](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/App.tsx) — Root application component, auth flow, realtime data sync
- [src/firebase.ts](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/firebase.ts) — Firebase app, auth, db init and error handling
- [src/index.css](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/index.css) — Tailwind CSS v4 `@theme`, brand colors, dark mode tokens
- [src/main.tsx](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/main.tsx) — React DOM root render with ThemeProvider & Toaster
- [src/types.ts](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/types.ts) — TypeScript interfaces: `BreathingConfig`, `UserProfile`, `Habit`, `SessionRecord`
- [src/machines/](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/machines/) — Explicit, type-safe finite state machines and reducers:
  - `breathingSessionMachine.ts` — Breathwork session lifecycle (`preparing` -> `breathing` -> `paused` -> `reflecting` -> `completed`), accurate progress, pause/resume, deduplicated haptics
  - `authFormMachine.ts` — Authentication mode transitions (`signIn` | `signUp` | `forgotPassword`) and submission state
  - `onboardingMachine.ts` — 3-step onboarding wizard with bidirectional navigation (`reminder` <-> `rhythm` <-> `summary`)
  - `habitMachine.ts` — Pure habit evaluation (`completed_today` | `due` | `missed`) and streak progression
  - `sessionStreakMachine.ts` — Pure user session streak machine (`completed_today` | `due` | `missed`), streak-at-risk warning, non-duplicating same-day practice
  - `healthMetricMachine.ts` — Mindful BMI and holistic wellness categorization (`nourishment_needed` | `pure_serenity` | `self_care_goal` | `health_priority`)
  - `authSyncMachine.ts` — Firebase Auth and Firestore profile lifecycle (`initializing` -> `unauthenticated` | `syncing_profile` -> `ready` | `sync_error`)
  - `appNavigationMachine.ts` — Top-level tab navigation (`home` | `progress` | `settings`), active modal sessions, and preference clamping
  - `quoteMachine.ts` — Daily mindfulness inspiration lifecycle (`loading` -> `ready`) with user-triggered cycling
  - `debouncedSyncMachine.ts` — Optimistic local updates with debounced remote persistence (`idle` | `debouncing` | `saving` | `error`) and live UI status indicator
  - `soundMachine.ts` — Audio engine state machine for voice guidance, Tibetan singing bowl 432Hz chimes, procedural ambient soundscapes, and master mute controls
  - `machines.test.ts` — Native Node/TSX unit test suite for all 11 state machines
- [src/services/audioEngine.ts](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/services/audioEngine.ts) — Web Audio API procedural sound synthesizer (Zen 432Hz Drone, Ocean Waves, Gentle Rain, Solfeggio bell harmonics) & Web Speech API voice guide
- [src/constants/quotes.ts](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/constants/quotes.ts) — Curated list of mindfulness quotes & random picker
- [src/components/AuthScreen.tsx](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/components/AuthScreen.tsx) — Login, Registration & Password Reset screen
- [src/components/BreathingCircle.tsx](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/components/BreathingCircle.tsx) — Animated SVG/Framer circle with phase dilation & haptics
- [src/components/HomeScreen.tsx](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/components/HomeScreen.tsx) — Main dashboard: daily quote, mood check, duration, modes
- [src/components/MoodCheck.tsx](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/components/MoodCheck.tsx) — 5-stage emotional check-in component (anxious to happy)
- [src/components/OnboardingModal.tsx](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/components/OnboardingModal.tsx) — First-time user onboarding modal (reminder + cycle)
- [src/components/ProgressScreen.tsx](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/components/ProgressScreen.tsx) — Analytics, streaks, weekly bar charts, habit tracker, achievements
- [src/components/SessionScreen.tsx](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/components/SessionScreen.tsx) — Active breathwork screen, countdown timer, phase stepper


---

## 4. Application Architecture & Data Flow

```
                     ┌────────────────────────┐
                     │   Firebase Auth State  │
                     └──────────┬─────────────┘
                                │
                     ┌──────────▼─────────────┐
        ┌────────────┤  App.tsx (Root State)  ├────────────┐
        │            └──────────┬─────────────┘            │
        ▼                       ▼                          ▼
┌───────────────┐     ┌───────────────────┐      ┌──────────────────┐
│ Unauthenticated│     │   Authenticated   │      │ Active Session   │
│  AuthScreen   │     │  (Realtime Sync)  │      │  (Fullscreen)    │
└───────────────┘     └─────────┬─────────┘      └─────────┬────────┘
                                │                          │
          ┌─────────────────────┼────────────────────┐     │
          ▼                     ▼                    ▼     ▼
  ┌──────────────┐      ┌──────────────┐     ┌──────────────┐
  │  HomeScreen  │      │ProgressScreen│     │ Profile/Card │
  └──────────────┘      └──────────────┘     └──────────────┘
          │                     │                    ▲
          ▼                     ▼                    │
    Firestore:            Firestore:           Firestore:
    /sessions             /users/{uid}         /users/{uid}
```

### 4.1 State Management Breakdown
- **User Authentication**: Subscribes to `onAuthStateChanged(auth)`. If no user is logged in, displays `AuthScreen`.
- **User Profile**: Synced in realtime via `onSnapshot(doc(db, 'users', user.uid))`. If the profile document doesn't exist upon first login, automatically initializes it.
- **Sessions History**: Synced in realtime via `onSnapshot(query(collection(db, 'sessions'), where('uid', '==', user.uid)))`. Sorted descending by timestamp.
- **Active Breathwork Mode**: Triggered by user selecting a mode on `HomeScreen`. Overlays `SessionScreen` over the entire viewport. Upon completion, persists session to Firestore and updates the user's streak and total count.
- **Debounced Firestore Writes**: Complex sliders (e.g. custom breathing cycle: Inhale/Hold/Exhale/HoldPost) immediately update local React state for buttery smooth 60fps UI feedback, while an 800ms debounce ref (`breathingDebounceRef`) postpones Firestore `updateDoc` calls to prevent rate-limiting or unnecessary writes.

---

## 5. Components & Modules Breakdown

### 5.1 `src/App.tsx`
- **Role**: Central orchestrator. Handles authentication lifecycle, Firestore snapshot subscriptions, tab routing (`'home' | 'progress' | 'settings'`), theme toggling, custom breathing updates, habit completions, and session recording.
- **Key Functions**:
  - `startSession(mode: BreathingMode)`: Launches active breathwork overlay.
  - `endSession(duration, moodAfter)`: Writes document to `sessions` collection, recalculates streak, increments `totalSessions`, and updates `lastSessionDate`.
  - `handleToggleHabit(habitId)`: Checks off a habit for today and increments streak if completed on consecutive days.
  - `calculateBMI()`: Computes BMI based on height/weight with supportive mindful status strings.

### 5.2 `src/components/HomeScreen.tsx`
- **Role**: Daily landing screen.
- **Key Features**:
  - Displays user's active streak banner.
  - Displays a daily inspiration quote from `constants/quotes.ts`.
  - Quick Duration Selector (`1m`, `3m`, `5m`, `10m`).
  - Giant pulsing "Start Session" button.
  - Interactive grid of predefined breathing modes + Personal Rhythm card if custom cycle is configured.

### 5.3 `src/components/SessionScreen.tsx`
- **Role**: Immersive, distraction-free breathwork session engine.
- **Engine Logic**:
  - Tracks `phase` (`'inhale' | 'hold' | 'exhale' | 'holdPost'`) and `phaseCountdown`.
  - Uses `useRef` for `phaseRef` and `phaseCountdownRef` to completely prevent stale closures in the 1000ms `setInterval`.
  - Automatically advances through phases based on the active mode configuration.
  - Dispatches device haptic vibration (`navigator.vibrate(50)`) at phase transitions.
  - Warmup delay of 1 second before cycle begins.
  - Post-session mood check-in modal before recording to database.

### 5.4 `src/components/BreathingCircle.tsx`
- **Role**: Visual breath guide.
- **Animation Details**:
  - Outer dashed decorative ring expanding/contracting with smooth spring transitions.
  - Core circular element scaling to `1.5x` on Inhale/Hold and `1.0x` on Exhale/HoldPost with duration matching the exact seconds configured for each phase.
  - Phase label rendered in center with serif italic typography.

### 5.5 `src/components/ProgressScreen.tsx`
- **Role**: Wellness dashboard and habit tracker.
- **Sections**:
  1. **Stats Grid**: Total mindful minutes completed and current day streak.
  2. **Health Summary**: Age, gender, weight, height, and calculated BMI with color-coded badges.
  3. **Weekly Summary**: 7-day bar chart representing daily session counts.
  4. **Mood Insights**: Visual breakdown of emotional balance and post-session feelings.
  5. **Habit Tracker**: Custom habits list with streak counter, one-click completion toggle, and delete action.
  6. **Achievements**: Milestone badges (*First Breath*, *Consistency King*, *Zen Master*).
  7. **Recent History**: Paginated/scrolling list of recent breathwork sessions with mood emoji.

### 5.6 `src/components/AuthScreen.tsx`
- **Role**: Security & access control.
- **Features**:
  - Clean tabbed interface for Email/Password Sign In, Sign Up with Display Name, and Password Reset.
  - Connection error fallback if Firebase environment credentials are missing.

### 5.7 `src/components/OnboardingModal.tsx`
- **Role**: Guided first-time setup for new accounts.
- **Flow**:
  - **Step 1**: Daily Reminder Time preference.
  - **Step 2**: Breathing Cycle customization with 1-click presets (*Box*, *4-7-8*, *Balanced 5-5*).
  - **Step 3**: Summary confirmation and save to Firestore profile.

---

## 6. Data Models & Database Schema (Cloud Firestore)

All types are strictly defined in [`src/types.ts`](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/types.ts).

### 6.1 Collection: `users`
- **Document ID**: `userId` (Firebase Auth UID)
- **Fields**:

| Field Name | Type | Optional? | Description |
|---|---|---|---|
| `uid` | `string` | **No** | Must match authenticated user's UID |
| `displayName` | `string` | Yes | User's full name |
| `email` | `string` | Yes | Registered email address |
| `totalSessions` | `number` | **No** | Lifetime completed breathwork sessions |
| `currentStreak` | `number` | **No** | Consecutive days with at least 1 session |
| `lastSessionDate` | `string` | Yes | ISO 8601 timestamp (`YYYY-MM-DDTHH:mm:ss.sssZ`) |
| `reminderTime` | `string` | Yes | Daily notification reminder time (e.g. `"08:00"`) |
| `onboardingCompleted`| `boolean` | Yes | Tracks whether the user completed onboarding |
| `habits` | `Habit[]` | Yes | Array of habit objects (see sub-model below) |
| `healthDetails` | `object` | Yes | Sub-object containing `age`, `gender`, `weight`, `height`, `notes` |
| `customBreathingConfig`| `object` | Yes | Sub-object `{ inhale, hold, exhale, holdPost }` in seconds |

#### Sub-model: `Habit`
```typescript
interface Habit {
  id: string;              // UUID string
  name: string;            // Name of habit (e.g., "Morning Walk")
  streak: number;          // Current continuous day streak
  lastCompletedDate?: string; // ISO 8601 string of last completion
  createdAt: string;       // ISO 8601 string of creation
}
```

### 6.2 Collection: `sessions`
- **Document ID**: Auto-generated by Firestore
- **Fields**:

| Field Name | Type | Optional? | Description |
|---|---|---|---|
| `uid` | `string` | **No** | UID of the user who performed the session |
| `mode` | `BreathingMode` | **No** | `'calm' \| 'focus' \| 'sleep' \| 'morning' \| 'power' \| 'box'` |
| `duration` | `number` | **No** | Duration in seconds (must be > 0) |
| `timestamp` | `string` | **No** | ISO 8601 string of completion |
| `moodBefore` | `string` | Yes | User's selected mood prior to starting |
| `moodAfter` | `string` | Yes | User's selected mood following completion |

### 6.3 Predefined Breathing Modes
```typescript
calm:    { inhale: 4, exhale: 4,               label: 'Calm',    color: 'bg-soft-sage' }
focus:   { inhale: 4, hold: 4, exhale: 4, holdPost: 4, label: 'Focus',   color: 'bg-accent-green' }
sleep:   { inhale: 4, hold: 7, exhale: 8,      label: 'Sleep',   color: 'bg-deep-forest' }
morning: { inhale: 3, exhale: 3,               label: 'Morning', color: 'bg-cream' }
power:   { inhale: 1, exhale: 1,               label: 'Power',   color: 'bg-rose-400' }
box:     { inhale: 4, hold: 4, exhale: 4, holdPost: 4, label: 'Box',     color: 'bg-blue-400' }
```

---

## 7. Security Rules & Data Validation

Firestore rules are defined in [`firestore.rules`](file:///home/ha-re-ram/Projects/Serenity-Breathing/firestore.rules).
Key security policies:
1. **Ownership Isolation**: A user can only read, create, or update documents where `request.auth.uid == userId` or `request.resource.data.uid == request.auth.uid`.
2. **Strict Schema Constraints**:
   - `isValidUser`: Enforces that `totalSessions >= 0`, `currentStreak >= 0`, and any `lastSessionDate` matches an ISO 8601 date string pattern.
   - `isValidSession`: Restricts `mode` to allowed values, enforces `duration > 0`, and requires an ISO 8601 `timestamp`.
   - `isValidMood`: Restricts write access to user's own data with valid timestamps.
3. **Default Deny**: Any unmatched paths are explicitly rejected with `allow read, write: if false;`.

> ⚠️ **Important Reminder**: Whenever you add a new field to `users` or a new breathing mode to `BREATHING_MODES`, verify whether `firestore.rules` needs an update so writes are not blocked.

---

## 8. Design System, Theme & UI Conventions

The project uses **Tailwind CSS v4** with a custom color palette tailored for calming mindfulness. Configured in [`src/index.css`](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/index.css):

### 8.1 Palette Tokens

| Token Variable | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--color-bg-page` | `#F4F7F5` | `#0B130E` | Overall page backdrop (porcelain dew / nocturnal forest canopy) |
| `--color-accent-green` | `#245C42` | `#52B788` | Primary brand accent, primary CTA buttons (restorative eucalyptus jade) |
| `--color-soft-sage` | `#4E9A74` | `#74C69D` | Subtle indicators, active streaks, tags (dewy mountain mint-sage) |
| `--color-cream` | `#DDE6E0` | `#1D3327` | Borders, subtle dividers, pill backdrops (morning leaf / nocturnal pine) |
| `--color-deep-forest` | `#163326` | `#EDF5F0` | Headings, primary high-contrast text (evergreen obsidian / moonlit pearl) |

### 8.2 Typography
- **Headings & Meditative Text**: Georgia serif font (`font-serif`, `.serif`), italicized for calm, reflective moments.
- **Body & UI Controls**: `Geist Variable` sans-serif (`font-sans`), clean and modern.
- **Numbers & Timers**: `JetBrains Mono` (`font-mono`) for numerical precision without jitter.

### 8.3 Design Rules
- All cards must use subtle rounded corners (`rounded-[20px]` to `rounded-[32px]`), border outlines (`border border-cream`), and flat or soft shadows.
- Avoid harsh saturated primary colors (pure red, pure blue). Use earthy, muted tones.
- Dark mode is controlled via `next-themes` by toggling the `.dark` class on the root HTML element.

---

## 9. Critical Patterns, Gotchas & Safeguards

### 9.1 The Interval Stale-Closure Bug
**Problem**: In React, if an interval callback relies on state variables (`phase`, `countdown`), the interval either captures stale values or must be re-instantiated every single second. Re-instantiating every second can cause drift, skipped seconds, or audio/haptic jitter.  
**Solution**: [`SessionScreen.tsx`](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/components/SessionScreen.tsx) uses `phaseRef` and `phaseCountdownRef`. The `setInterval` runs continuously without restarting, reading and mutating the ref values synchronously while pushing updates to state only for rendering.

### 9.2 Firestore Write Debounce
**Problem**: Sliders or input fields that update Firestore on change will flood the database with dozens of writes per second, hitting rate limits and running up costs.  
**Solution**: Use `breathingDebounceRef` (`useRef<ReturnType<typeof setTimeout>>`). The component updates local state immediately for instant feedback and waits 800ms of user inactivity before issuing `updateDoc`.

### 9.3 Auth Initialization Safety Timeout
**Problem**: On slow connections or if third-party cookies are restricted, Firebase Auth may take several seconds to determine the user state, leaving the screen in an infinite loading spinner.  
**Solution**: A 3-second safety timeout in `App.tsx` forces `loading = false` so the user is never stuck indefinitely.

### 9.4 Tailwind CSS v4 Migration Nuance
**Notice**: This repository uses Tailwind CSS 4.0 (`@tailwindcss/vite`). It does **NOT** use `tailwind.config.js`. All design tokens, custom colors, and `@theme` directives are placed directly inside `src/index.css`.

### 9.5 Explicit State Machine Architecture (UX, DX, AX Elevation)
All core interactive flows that previously relied on implicit, scattered boolean flags (`isActive`, `isLogin`, `isResetting`, `showMoodAfter`, magic step numbers) are now formalized into pure, type-safe finite state machines located under `src/machines/`:
1. **Breathwork Session Machine**: Manages preparation countdown, cyclic phase advancement, pause/resume, accurate progress calculation against target duration, deduplicated haptics, and completion reflection.
2. **Auth Form Machine**: Eliminates invalid states (`isLogin: false, isResetting: true`) via a discriminated union (`signIn | signUp | forgotPassword`) with automatic error clearing on input.
3. **Onboarding Machine**: Provides explicit wizard stages with back-navigation support and preset clamping.
4. **Habit Machine**: Pure evaluation of habit streak progression (`completed_today | due | missed`), shared by both App orchestrator and Progress dashboard.
5. **Debounced Sync Machine**: Formalizes optimistic local updates and network debouncing with visible sync states.

---

## 10. Developer Playbooks (How to Make Changes)

### Playbook A: Adding a New Breathing Mode
1. Open [`src/types.ts`](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/types.ts):
   - Add the mode key to `BreathingMode` type:
     ```typescript
     export type BreathingMode = 'calm' | 'focus' | 'sleep' | 'morning' | 'power' | 'box' | 'your_new_mode';
     ```
   - Add the mode parameters to `BREATHING_MODES`:
     ```typescript
     your_new_mode: {
       inhale: 5,
       hold: 2,
       exhale: 5,
       holdPost: 0,
       label: 'Your Mode',
       description: 'Short mindful explanation',
       color: 'bg-soft-sage',
     },
     ```
2. Open [`firestore.rules`](file:///home/ha-re-ram/Projects/Serenity-Breathing/firestore.rules):
   - In `isValidSession(data)`, add `'your_new_mode'` to the allowed mode array:
     ```javascript
     data.mode in ['calm', 'focus', 'sleep', 'morning', 'power', 'box', 'your_new_mode']
     ```
3. Update this `PROJECT_GUIDE.md` under [6.3 Predefined Breathing Modes](#63-predefined-breathing-modes) and record the change in [Section 12](#12-project-change-log--maintenance-record).

---

### Playbook B: Adding a New Health Metric or User Profile Field
1. Open [`src/types.ts`](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/types.ts):
   - Add the new field to `UserProfile['healthDetails']` or root `UserProfile`.
2. Open [`src/App.tsx`](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/App.tsx):
   - If user-editable, add an input field in the Profile/Settings tab or hook up `handleUpdateHealthDetails`.
3. Open [`src/components/ProgressScreen.tsx`](file:///home/ha-re-ram/Projects/Serenity-Breathing/src/components/ProgressScreen.tsx):
   - Display the new metric in the Health Summary grid.
4. Open [`firestore.rules`](file:///home/ha-re-ram/Projects/Serenity-Breathing/firestore.rules):
   - Verify that `isValidUser(data)` doesn't reject the new key.
5. Update this `PROJECT_GUIDE.md` under [6.1 Collection: users](#61-collection-users) and record in [Section 12](#12-project-change-log--maintenance-record).

---

### Playbook C: Adding a New UI Component via shadcn/ui
1. Components reside in `components/ui/`.
2. Ensure components reference classes using the `cn()` helper from `@/lib/utils`.
3. Use brand colors (`text-deep-forest`, `bg-accent-green`, `border-cream`, `bg-soft-sage`) rather than generic Tailwind colors (`text-gray-900`, `bg-blue-600`).

---

## 11. Deployment, PWA & Environment Variables

### 11.1 Environment Variables
Create a `.env` file based on [`.env.example`](file:///home/ha-re-ram/Projects/Serenity-Breathing/.env.example):
```bash
VITE_FIREBASE_API_KEY="your-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
VITE_FIREBASE_MEASUREMENT_ID="your-measurement-id"
VITE_FIREBASE_DATABASE_ID="(default)"
```

### 11.2 Build & Verification Scripts
```bash
npm run dev      # Starts Vite development server on port 3000 (host: 0.0.0.0)
npm run build    # Runs Vite production build outputting to dist/
npm run preview  # Previews production build locally
npm run lint     # Runs TypeScript typecheck (tsc --noEmit)
npm test         # Runs native TSX state machine unit test suite
npm run clean    # Removes dist folder
```

### 11.3 Cloudflare Pages Deployment
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Headers & CSP**: [`public/_headers`](file:///home/ha-re-ram/Projects/Serenity-Breathing/public/_headers) enforces strict Content-Security-Policy. If you include assets or APIs from external domains, they **must** be whitelisted in `_headers`.
- **SPA Routing**: [`public/_redirects`](file:///home/ha-re-ram/Projects/Serenity-Breathing/public/_redirects) directs all traffic to `/index.html`.

---

## 12. Project Change Log & Maintenance Record

> **Rule for Collaborators & Agents**: Always append an entry below when you make functional, structural, or configuration changes to this repository.

| Date (YYYY-MM-DD) | Author / Agent | Changes Made | Files Affected |
|---|---|---|---|
| **2026-11-15** | Antigravity AI | **Visual Sanctuary & Eye-Ease Chromatic Overhaul (v1.3.1 Professional)**: Replaced legacy muddy olive-drab khaki (`#5A5A40`) and dingy stone (`#F5F5F0` / `#1A1A15`) with a tranquil, restorative Botanical Eucalyptus & Nocturnal Sanctuary palette. Light mode: porcelain morning dew (`#F4F7F5`), deep evergreen pine text (`#163326`, 12.8:1 AAA contrast), and eucalyptus jade (`#245C42`). Dark mode: nocturnal forest canopy (`#0B130E`, eliminates retinal fatigue), elevated nocturnal glass (`#13221A`), moonlit pearl ivory (`#EDF5F0`, 16.6:1 AAA contrast), and radiant seafoam mint (`#52B788`). Normalized small typography from hazy `opacity-40`/`50` to crisp `text-accent-green/80`. Upgraded breathing circles to vivid, distinct identities with clean white text. Updated meta theme-colors in `index.html` and `manifest.json`. All 11 tests passing, 0 lint errors, clean build. | `src/index.css`, `src/types.ts`, `src/App.tsx`, `src/components/*`, `index.html`, `public/manifest.json`, `qa_expert_audit_report.md`, `PROJECT_GUIDE.md` |
| **2026-11-15** | Antigravity AI | **Senior QA & UX/DX/AX Polish (v1.3.0 Professional)**: Conducted end-to-end audit documenting 18 defects in `qa_expert_audit_report.md`. Remediated WCAG AAA contrast violations across light/dark themes (mobile nav bar, desktop sidebar, dark mode button text), unlocked Web Audio API & Speech Synthesis on iOS Safari/Android user gestures synchronously, made habit checks reversible (untoggling accidental completions), added reactive `key` bindings to uncontrolled profile inputs to prevent async loading race conditions, added offline SPA navigate fallback to `public/sw.js` (v3), eliminated `as any` casts by formalizing `'custom'` in `BreathingMode`, added empty-state feedback in Progress screen, and verified 11/11 tests pass with zero type or build errors. | `public/sw.js`, `src/App.tsx`, `src/types.ts`, `src/services/audioEngine.ts`, `src/machines/habitMachine.ts`, `src/machines/machines.test.ts`, `src/components/HomeScreen.tsx`, `src/components/SessionScreen.tsx`, `src/components/AuthScreen.tsx`, `src/components/OnboardingModal.tsx`, `src/components/ProgressScreen.tsx`, `package.json`, `PROJECT_GUIDE.md` |
| **2026-11-15** | Antigravity AI | Removed mandatory login gate to make Serenity instantly accessible without login as a public wellness platform; local storage powers guest streaks, habits, and records with optional Cloud Sync in Profile. Built procedural Web Audio API & Speech Synthesis engine (`soundMachine` & `audioEngine`) featuring spoken phase guidance ("Breathe in", "Hold", "Breathe out"), 432Hz Tibetan singing bowl bells, procedural ambient soundscapes (Zen Drone, Ocean Waves, Gentle Rain), and master mute controls. Engineered Search-First SEO architecture with comprehensive JSON-LD graphs (`WebApplication`, `FAQPage`, `HowTo`) and prerendered fallback semantics. 11/11 unit tests passing. | `src/services/audioEngine.ts`, `src/machines/soundMachine.ts`, `src/machines/authSyncMachine.ts`, `src/components/SessionScreen.tsx`, `src/components/AuthScreen.tsx`, `src/App.tsx`, `index.html`, `public/sitemap.xml`, `PROJECT_GUIDE.md` |
| **2026-11-15** | Antigravity AI | Identified and formalized all remaining implicit state machines in the application to elevate UX, DX, and AX: `authSyncMachine` (resolves auth/profile race condition and screen flicker), `sessionStreakMachine` (centralizes streak evaluation and same-day preservation), `healthMetricMachine` (eliminates duplicated BMI calculations between Profile and Progress screens), `appNavigationMachine` (centralizes viewport, tabs, modal sessions, and preference clamping), `quoteMachine` (adds on-demand inspiration refresh), and full `debouncedSyncMachine` integration with live visual saving status pills for custom cycles. Added tests across all 10 machines in `machines.test.ts` (10/10 passing). Zero breaking changes. | `src/machines/*`, `src/App.tsx`, `src/components/HomeScreen.tsx`, `src/components/ProgressScreen.tsx`, `PROJECT_GUIDE.md` |
| **2026-11-11** | Antigravity AI | Formalized all implicit state machines into type-safe, pure state machines under `src/machines/` (`breathingSessionMachine`, `authFormMachine`, `onboardingMachine`, `habitMachine`, `debouncedSyncMachine`). Elevates UX (warmup countdown, session pause/resume, accurate target duration progress, back-step onboarding, deduplicated haptics), DX (strict TypeScript discriminated unions, pure reducers, zero impossible states), and AX (self-documenting transition graphs, automated test suite). Added `npm test` script. | `src/machines/*`, `src/components/SessionScreen.tsx`, `src/components/BreathingCircle.tsx`, `src/components/AuthScreen.tsx`, `src/components/OnboardingModal.tsx`, `src/components/ProgressScreen.tsx`, `src/App.tsx`, `package.json`, `PROJECT_GUIDE.md` |
| **2026-09-16** | Antigravity AI | Created comprehensive master project guide & architecture reference (`PROJECT_GUIDE.md`) to serve as the permanent living knowledge base for all future updates and refactors. | `PROJECT_GUIDE.md`, `README.md` |

---
*End of Project Guide. Keep this file updated on every iteration!*
