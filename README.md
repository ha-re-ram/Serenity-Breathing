# Serenity Breathing 🌿
### *The Gold Standard for Digital Mindfulness & Breathwork.*

**Serenity Breathing** is a premium, open mindfulness and guided breathwork platform designed by [Hareram Kushwaha](https://hareramkushwaha.com.np). Engineered for immediate tranquility and cognitive focus, it blends scientifically-proven respiratory patterns with real-time health analytics, procedural ambient soundscapes, voice guidance, and an offline-first architecture usable without logging in.

[![Version](https://img.shields.io/badge/Version-1.3.1-soft--sage.svg?color=245C42)](https://github.com/ha-re-ram/Serenity-Breathing/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build: Success](https://img.shields.io/badge/Build-Passing-brightgreen.svg)](https://github.com/ha-re-ram/Serenity-Breathing/actions)
[![WCAG: AAA](https://img.shields.io/badge/WCAG-AAA_Compliant-emerald.svg)](https://serenity.hareramkushwaha.com.np)

🔗 **Live Platform**: [https://serenity.hareramkushwaha.com.np/](https://serenity.hareramkushwaha.com.np/)

---

## ✨ Features (v1.3.1 Professional)

- **🌿 Instant Access (Zero-Login Public Sanctuary)**:
  - Practice immediately without creating an account, passwords, or hitting paywalls.
  - All sessions, habit streaks, health metrics, and custom breathing cycles persist safely and privately on your device.
- **🎯 Scientifically Proven Breathing Patterns**:
  - **Calm (4-4)**: Simple autonomic nervous system regulation.
  - **Box Breathing (4-4-4-4)**: Navy SEAL focus technique for high-stress clarity.
  - **Sleep Method (4-7-8)**: Dr. Andrew Weil's natural tranquilizer for insomnia relief.
  - **Coherence (5-5)**: Optimizes Heart Rate Variability (HRV) and emotional equilibrium.
  - **Morning Vitality (3-3) & Power Breath (1-1)**: Invigorating oxygenation rhythms.
  - **Personal Rhythm Creator**: Fully customizable inhale, hold, exhale, and hold-post timing.
- **🔊 Procedural Sound Engine & Spoken Voice Guidance**:
  - Soothing voice cues (*"Breathe in"*, *"Hold"*, *"Breathe out"*).
  - Authentic 432Hz Tibetan singing bowl bell harmonic transition chimes.
  - Procedural soundscapes (Zen 432Hz Drone, Ocean Waves, Gentle Rain, Pure Silence) with live volume slider and master mute.
- **🎨 Botanical Eucalyptus & Nocturnal Sanctuary Design**:
  - Morning Dew light palette (`#F4F7F5`) and Midnight Forest dark canopy (`#0B130E`) with WCAG AAA contrast ratios (12.8:1 to 16.6:1).
  - Eliminates retinal fatigue during nighttime bedside practice.
- **📱 Responsive Mobile-First Architecture**:
  - Fluid responsiveness across all devices (from 320px compact screens to 4K monitors).
  - Dynamic viewport safe-area padding for iOS Home Indicators and Android navigation bars.
- **📊 Health Metrics & Reversible Habit Tracker**:
  - Mindful, non-judgmental BMI and health status evaluations.
  - Bidirectional habit streaks with undo capabilities.
  - Pre- and post-session mood shift reflections.
- **⚡ 10 Pure Finite State Machines**:
  - Rock-solid session lifecycles, debounced local persistence, and error recoveries under `src/machines/` verified by native unit tests.
- **🔍 Search-First SEO**:
  - Rich JSON-LD schemas (`WebApplication`, `FAQPage`, `HowTo`) and prerendered semantic fallback.

---

## 🛠️ Complete Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework & Build** | [React 19](https://react.dev/) / [Vite 6](https://vitejs.dev/) | Modern UI component rendering and sub-second HMR |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | Strict end-to-end type safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Next-generation theme engine and design tokens |
| **State Machines** | Pure TypeScript Reducers (`src/machines/`) | Explicit state graphs eliminating impossible UI states |
| **Audio Synthesis** | Web Audio API & Web Speech API | Procedural soundscapes and synthesized vocal cues |
| **Animation** | [Motion (Framer)](https://motion.dev/) | Smooth responsive breath scaling and spring transitions |
| **Local Persistence** | Web Storage API & Pure Reducers (`src/machines/`) | Fast, private, 100% offline persistence with zero sign-in required |
| **Icons & Typography** | [Lucide React](https://lucide.dev/) / Geist Variable | Clean iconography and typography |

📖 **Developer & Architecture Single Source of Truth**: See [PROJECT_GUIDE.md](file:///home/ha-re-ram/Projects/Serenity-Breathing/PROJECT_GUIDE.md) for full database schemas, state machine transition diagrams, playbooks, and change records.

---

## 🚀 Development & Verification

```bash
npm install       # Install dependencies cleanly
npm run dev       # Start Vite dev server on port 3000
npm test          # Run native TSX state machine unit test suite (10/10 pass)
npm run lint      # Run TypeScript typecheck (tsc --noEmit)
npm run build     # Compile production bundle to dist/
npm run preview   # Preview production build locally
```

---

## 👤 Developer

**Hareram Kushwaha**  
*Full-stack Developer & Mindfulness Advocate*
- 🌐 [Official Portfolio](https://hareramkushwaha.com.np)
- 🐙 [GitHub](https://github.com/ha-re-ram)
- 💼 [LinkedIn](https://www.linkedin.com/in/ha-re-ram)
- ✉️ [Contact](mailto:hareramkushwaha054@gmail.com)

---

## 📄 License

This project is open source and licensed under the **MIT License**.
