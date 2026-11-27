# Security Policy 🔒

## Supported Versions

| Version | Supported |
|---|---|
| `1.3.x` | ✅ Yes |
| `< 1.3.0` | ❌ Unsupported |

---

## Privacy & Security Architecture

**Serenity Breathing** is engineered with a **zero-trust, privacy-first client-side model**:
* **No Remote Database**: User session history, habit streaks, and profile details are stored entirely inside the client's browser `localStorage`.
* **No Authentication Backdoors**: There are no passwords, user credentials, or session tokens stored on any server.
* **Strict Content Security Policy (CSP)**: Outlined in `public/_headers` to restrict unauthorized script execution, frame embedding, and data exfiltration.

---

## Reporting a Vulnerability

If you discover a security vulnerability or potential privacy flaw, please report it privately:
* **Contact**: [hareramkushwaha054@gmail.com](mailto:hareramkushwaha054@gmail.com)
* Please include a clear description of the potential vulnerability, affected components, and steps or proof of concept.
* We take security reports seriously and will acknowledge receipt within 48 hours.

Thank you for keeping Serenity safe and private! 🌿
