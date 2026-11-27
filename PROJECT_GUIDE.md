# Serenity Breathing 🌿 — Comprehensive Technical Architecture & Engineering Guide

> **Single Source of Truth**:  
> This document details the architectural decisions, state machine formalisms, data models, audio engine algorithms, accessibility standards, and engineering playbooks for **Serenity Breathing**.

---

## 1. Executive Summary & Vision

**Serenity Breathing** is a high-performance, privacy-first digital mindfulness and guided breathwork web application designed by **Hareram Kushwaha**. Built as a public sanctuary without paywalls or accounts, it bridges scientifically validated respiratory physiology with modern web capabilities:
* **Immediate Zero-Latency Access**: Usable in <2 seconds with zero logins, zero passwords, and zero analytics surveillance.
* **100% Client-Side Privacy**: All personal session history, habit streaks, custom cycle configurations, and health metrics reside strictly on the user's device via `localStorage`.
* **Clinical Respiratory Rhythms**: Navy SEAL Box Breathing (4-4-4-4), 4-7-8 Sleep Method (Dr. Andrew Weil), 5-5 Coherence (HRV baroreflex resonance), Morning Vitality (3-3), and Power Breath (1-1).
* **Pure Mathematical State Graphs**: 10 deterministic finite state machines ensure impossible UI states cannot exist.
* **Zero-Bandwidth Procedural Audio**: Real-time Web Audio API frequency synthesis (432Hz Solfeggio singing bowls, ocean waves, gentle rain) with spoken voice guidance.
* **Offline-First PWA**: High-resilience Service Worker with Screen Wake Lock API and cross-platform installation on iOS, Android, macOS, and Windows.

---

## 2. Technology Stack & Decision Matrix

| Layer | Technology | Decision Rationale |
|---|---|---|
| **Runtime & Build** | [Vite 6](https://vitejs.dev/) | Sub-second Hot Module Replacement (HMR) and optimized Rollup chunking |
| **Framework** | [React 19](https://react.dev/) | Concurrent UI rendering with strict hooks and error boundaries |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) | Strict compile-time type verification with path aliases |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Theme tokens via `@theme`, Zero-runtime CSS, WCAG AAA compliant |
| **State Machine** | Pure TypeScript Reducers (`src/machines/`) | Explicit state graphs following XState principles without bundle overhead |
| **Audio Engine** | Web Audio API & Web Speech API | Algorithmic soundscapes with 0kB audio asset overhead |
| **Animation** | [Motion (Framer)](https://motion.dev/) | Smooth spring physics and synchronized breath dilation |
| **Offline & PWA** | Custom Service Worker (`sw.js`) | Network-First with fast timeout fallback, cache self-healing |
| **Display Persistence** | Screen Wake Lock API | Prevents device display sleep during active breathwork |

---

## 3. Directory Structure

```
Serenity-Breathing/
├── index.html                   # Entry point, SEO/GEO metadata, JSON-LD schemas
├── package.json                 # Dependency graph & verification scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Bundling & chunking configuration
├── components.json              # UI component definitions
├── components/ui/               # Accessible UI primitives:
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── label.tsx
│   └── slider.tsx
├── lib/
│   └── utils.ts                 # Classname merge utility (clsx + tailwind-merge)
├── public/
│   ├── _headers                 # Cloudflare Pages / Edge CDN cache & CSP directives
│   ├── _redirects               # SPA routing fallback (/* /index.html 200)
│   ├── icon.png                 # Master brand icon (512x512)
│   ├── manifest.json            # PWA Web Manifest (maskable & any icons)
│   ├── robots.txt               # Search engine indexing rules
│   ├── sitemap.xml              # XML Sitemap with image metadata
│   └── sw.js                    # Resilient Service Worker & notification clicks
├── src/
│   ├── App.tsx                  # Root orchestrator & tab routing
│   ├── index.css                # Tailwind v4 botanical circadian theme tokens
│   ├── main.tsx                 # DOM root, ThemeProvider, SW registration
│   ├── types.ts                 # TypeScript domain interfaces
│   ├── components/
│   │   ├── BreathingCircle.tsx  # Dynamic expanding/contracting breath indicator
│   │   ├── ErrorBoundary.tsx    # Unhandled error catcher with self-healing reset
│   │   ├── HomeScreen.tsx       # Dashboard: quick start, mood check, mode grid
│   │   ├── MoodCheck.tsx        # 5-stage emotional check-in component
│   │   ├── OnboardingModal.tsx  # 3-step setup wizard (reminder + presets)
│   │   ├── ProgressScreen.tsx   # Habit streaks, analytics, BMI evaluator, history
│   │   ├── PWAInstallBanner.tsx # Cross-platform install guide (iOS/Android/Desktop)
│   │   └── SessionScreen.tsx    # Fullscreen breathwork engine & goal dialog
│   ├── constants/
│   │   └── quotes.ts            # Mindfulness quotes & randomized selection
│   ├── hooks/
│   │   ├── usePWAInstall.ts     # PWA install prompt lifecycle & platform detector
│   │   └── useWakeLock.ts       # Screen Wake Lock hook with visibility recovery
│   ├── machines/                # 10 Pure Finite State Machines & Unit Tests:
│   │   ├── appNavigationMachine.ts
│   │   ├── breathingSessionMachine.ts
│   │   ├── debouncedSyncMachine.ts
│   │   ├── habitMachine.ts
│   │   ├── healthMetricMachine.ts
│   │   ├── onboardingMachine.ts
│   │   ├── quoteMachine.ts
│   │   ├── sessionStreakMachine.ts
│   │   ├── soundMachine.ts
│   │   ├── userDataMachine.ts
│   │   ├── index.ts
│   │   └── machines.test.ts     # Native Node/TSX test suite (10/10 passing)
│   ├── services/
│   │   └── audioEngine.ts       # Procedural audio synthesis & spoken cues
│   └── utils/
│       └── reminderManager.ts   # Daily reminder scheduler & browser notifications
└── scripts/
    ├── test_responsive.cjs      # Puppeteer automated 9-viewport responsive tests
    ├── test_functional_interactive.cjs # Puppeteer user interaction verification
    └── test_user_fixes.cjs      # Targeted regression test suite
```

---

## 4. State Machine Architecture (`src/machines/`)

Every domain workflow is modeled as a pure reducer `(state, event) => nextState` with zero side effects:

1. **`breathingSessionMachine`**: Controls session phases (`preparing` -> `breathing` -> `paused` -> `reflecting` -> `completed`), phase countdowns, completed cycles, target duration reach, and target extension (`EXTEND_TARGET`).
2. **`userDataMachine`**: Manages user profile, habit streaks, custom cycle preferences, and session history with 100% offline persistence.
3. **`onboardingMachine`**: 3-step setup wizard with bidirectional navigation (`reminder` <-> `rhythm` <-> `summary`) and preset selection.
4. **`sessionStreakMachine`**: Pure day-streak progression engine preventing duplicate counts on the same calendar day while flagging at-risk streaks.
5. **`habitMachine`**: Evaluates habit status (`completed_today` | `due` | `missed`) with reversible completion toggles.
6. **`healthMetricMachine`**: Evaluates mindful, supportive BMI categories (*Nourishment Needed*, *Pure Serenity*, *Self-care Goal*, *Health Priority*).
7. **`appNavigationMachine`**: Coordinates active tabs (`home` | `progress` | `settings`), fullscreen breath overlays, and clamps durations between 1–60 minutes.
8. **`quoteMachine`**: Inspiration quote state lifecycle with user cycling.
9. **`soundMachine`**: Controls audio preferences, ambient soundscape selections, volume leveling, and master mute.
10. **`debouncedSyncMachine`**: Immediate optimistic state updates with debounced disk writes to eliminate storage throttling.

---

## 5. Procedural Audio Engine (`src/services/audioEngine.ts`)

Serenity uses zero external audio files. Everything is synthesized procedurally in real time:
* **Tibetan Singing Bowl (432Hz)**: Uses 4 sine wave oscillators tuned to Solfeggio harmonics (`f`, `2f`, `3f`, `4.1f`) modulated by a 3.5Hz Low-Frequency Oscillator (LFO) for authentic acoustic resonance.
* **Zen Drone**: Multi-oscillator root and octave pad with subtle binaural detuning (`432Hz` & `436Hz`).
* **Ocean Waves**: Filtered pink/white noise generated through an AudioWorklet / buffer node modulated by a 0.1Hz sine LFO mimicking slow coastal swells.
* **Gentle Rain**: High-pass filtered stochastic noise with dynamic volume dips.
* **Spoken Voice Guidance**: Driven by the browser's native `SpeechSynthesisUtterance` configured with relaxed pitch (0.95) and soothing cadence (0.85).

---

## 6. Client-Side Data Storage Schema

All data is structured strictly in `src/types.ts` and stored in `localStorage`:

* **`serenity_user_profile`**:
  ```ts
  interface UserProfile {
    uid: string;
    displayName: string;
    totalSessions: number;
    currentStreak: number;
    lastSessionDate?: string;
    reminderTime?: string;
    habits?: Habit[];
    healthDetails?: { age?: string; gender?: string; weight?: string; height?: string };
    customBreathingConfig?: { inhale: number; hold: number; exhale: number; holdPost: number };
  }
  ```
* **`serenity_sessions`**: Array of `SessionRecord` objects containing timestamp, duration, mode, and mood before/after.
* **`serenity_audio_settings`**: Volume, soundscape, bell, and voice settings.

---

## 7. Verification & Quality Assurance Playbook

Run these commands before any commit or deployment:

```bash
# 1. State machine pure unit tests (Node test runner)
npm test

# 2. Strict TypeScript compiler check
npm run lint

# 3. Production Vite compilation & tree-shaking
npm run build

# 4. Real browser automation & responsive inspection
node scripts/test_user_fixes.cjs
node scripts/test_responsive.cjs
node scripts/test_functional_interactive.cjs
```

---

## 8. Author & Maintenance Record

* **Author**: Hareram Kushwaha
* **Contact**: [hareramkushwaha054@gmail.com](mailto:hareramkushwaha054@gmail.com)
* **Live Deployment**: [https://serenity.hareramkushwaha.com.np](https://serenity.hareramkushwaha.com.np)
* **License**: MIT
