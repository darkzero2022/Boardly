# Security Policy

## Supported Versions

Security fixes are applied to the latest release only.

| Version | Supported |
|---------|-----------|
| 5.x     | ✅ Yes    |
| < 5.0   | ❌ No     |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

To report a vulnerability, open a [GitHub Security Advisory](https://github.com/darkzero2022/Boardly/security/advisories/new) (private, visible only to maintainers).

Include as much of the following as you can:

- Type of issue (e.g. SSRF, XSS, SQL injection, auth bypass)
- File paths and line numbers of the affected source code
- Step-by-step reproduction instructions
- Proof-of-concept or exploit code (if available)
- Potential impact and attack scenario

We aim to acknowledge reports within **48 hours** and provide a fix or mitigation timeline within **7 days** for critical issues.

## Scope

The following are in scope:

- SSRF / request forgery via webhook or integration URLs
- Authentication bypass (local accounts, LDAP, SSO, TOTP)
- Authorization issues — accessing boards, tasks, or settings without permission
- Injection vulnerabilities (LDAP filter injection, XSS in rendered content)
- Webhook HMAC signature bypass
- Insecure deserialization or prototype pollution

The following are **out of scope**:

- Self-XSS (requires the attacker to already have account access)
- Denial of service via resource exhaustion (no rate-limiting SLA is claimed)
- Issues in third-party dependencies that are already publicly known (open a PR to bump the dependency instead)
- Findings from automated scanners with no demonstrated impact

## Security Design Notes

Boardly is designed to run on a private network, not as a public SaaS. That said, the following hardening is in place:

- **SSRF protection** — `isSafeWebhookUrl` blocks all RFC 1918 private ranges, loopback (IPv4 + IPv6, including NAT64 `64:ff9b::/96`), IPv4-mapped IPv6, and link-local addresses before any outbound webhook or Teams notification is fired.
- **LDAP injection prevention** — usernames are sanitized (RFC 4515 special characters stripped) before being inserted into LDAP search filters.
- **HMAC webhook signatures** — outbound webhook payloads are optionally signed with HMAC-SHA256 using a per-webhook secret.
- **VIEWER role enforcement** — the `VIEWER` role is blocked at the Next.js middleware layer; all `POST`, `PUT`, `PATCH`, and `DELETE` requests return `403` regardless of the UI state.
- **2FA (TOTP)** — per-user TOTP second factor enforced before session creation.
