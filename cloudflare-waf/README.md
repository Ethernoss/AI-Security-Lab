# Cloudflare + WAF Lab

This sprint demonstrates a layered web security architecture using:

- Cloudflare Quick Tunnel
- ModSecurity
- OWASP Core Rule Set
- Nginx

## Objective

Understand how Cloudflare Tunnel exposes a local service through
Cloudflare's edge while a Web Application Firewall inspects HTTP
requests before they reach the application origin.

## Test Cases

- Normal HTTP request
- SQL injection pattern
- Cross-Site Scripting pattern
- Path traversal pattern
- Command injection pattern

## Security Architecture

Internet -> Cloudflare -> Tunnel -> WAF -> Origin
