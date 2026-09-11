# DAST Assessment Results

## Target

Local Dockerized Node.js application.

## Scanner

OWASP ZAP

## Environment

The target and scanner were connected through an isolated Docker network.

## Initial Baseline

- 8 warning categories
- 59 passing checks

Key findings included:

- Missing anti-clickjacking protection
- Missing X-Content-Type-Options
- X-Powered-By information disclosure
- Missing Content Security Policy
- Missing Permissions Policy
- Missing cross-origin isolation controls

## Remediation

Application hardening included:

- Helmet middleware
- Content Security Policy
- Anti-clickjacking controls
- X-Content-Type-Options
- Permissions-Policy
- Cache-Control
- Removal of X-Powered-By
- Cross-origin security headers

## Baseline Validation

After remediation:

- 2 warning categories
- 65 passing checks

## Active Scan

OWASP ZAP Full Scan:

- 5 discovered URLs
- 140 passing checks
- 0 failed checks
- 1 remaining warning

Command injection checks passed, including:

- Remote OS Command Injection
- Remote OS Command Injection (Time Based)

## Remaining Finding

The remaining CSP warning affected 404 responses for:

- /robots.txt
- /sitemap.xml

This was documented for triage rather than treated as an exploitable application vulnerability.

## Conclusion

The DAST cycle demonstrated:

Discovery -> Assessment -> Remediation -> Rescan -> Validation -> Triage
