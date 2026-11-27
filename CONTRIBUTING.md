# Contributing to Serenity Breathing 🌿

Thank you for your interest in contributing to **Serenity Breathing**! We welcome community contributions aimed at enhancing accessibility, performance, and scientifically-grounded mindfulness tools.

---

## Code of Conduct

We are dedicated to providing a supportive, welcoming, and harassment-free environment for all contributors and community members. Please treat others with respect and empathy.

---

## Core Development Principles

1. **Zero External Surveillance**: Serenity collects zero personal user information. We do not accept PRs introducing third-party tracking, advertising SDKs, or remote analytics that compromise user privacy.
2. **Deterministic Finite State Machines**: Any new feature with dynamic lifecycles must be modeled as a pure reducer in `src/machines/` and verified with unit tests in `src/machines/machines.test.ts`.
3. **Accessibility (WCAG AAA)**: Maintain high-contrast ratios (12.8:1+), accessible ARIA labels, semantic markup, and keyboard focus states.
4. **Offline First**: All core breathwork functionality must continue working seamlessly without an internet connection.

---

## Local Development Workflow

```bash
# 1. Clone the repository
git clone https://github.com/ha-re-ram/Serenity-Breathing.git
cd Serenity-Breathing

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Run tests and typecheck before submitting a PR
npm test
npm run lint
npm run build
```

---

## Git Commit Guidelines

We follow Conventional Commits:
* `feat:` A new user-facing capability or improvement.
* `fix:` A bug fix or recovery improvement.
* `docs:` Documentation updates.
* `refactor:` Code improvements without behavioral changes.
* `test:` Adding or updating automated tests.

---

## Reporting Issues & Feature Requests

Please open an issue on GitHub describing:
1. The behavior or feature request.
2. The device and browser environment (e.g. Chrome on Android, Safari on iOS).
3. Steps to reproduce if reporting a bug.

Thank you for helping make mindfulness free and accessible to everyone! 🌿
