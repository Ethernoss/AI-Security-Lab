# Cloudflare + WAF Security Lab

## Architecture

Internet
  |
  v
Cloudflare Edge
  |
  v
Cloudflare Quick Tunnel
  |
  v
cloudflared
  |
  v
127.0.0.1:8088
  |
  v
ModSecurity + OWASP Core Rule Set
  |
  v
Nginx Origin

## Cloudflare Controls Demonstrated

- Cloudflare edge proxying
- HTTPS public endpoint
- Cloudflare Tunnel
- Outbound tunnel architecture
- Origin not directly exposed through router port forwarding

## WAF Controls Demonstrated

- ModSecurity
- OWASP Core Rule Set
- SQL injection detection
- XSS detection
- Path traversal detection
- Command injection pattern detection
- Request blocking
- WAF logging

## Limitation

Cloudflare WAF Custom Rules were not configured because the laboratory
does not currently use an owned domain/Cloudflare zone.

The WAF component is implemented locally using ModSecurity and OWASP CRS.
