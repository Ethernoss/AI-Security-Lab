# AI Security Lab

[Español](README.md) | **English**

A personal security engineering lab by **Jorge · Ethernoss**, built to learn through implementation, controlled testing, remediation, and evidence review.

The question behind the project was: **how can I build an infrastructure and security control foundation, test its behavior, and apply those lessons to AI agents that read findings or request tools?**

This repository contains only modules with available code, configuration, or evidence. It is a selection of completed practices, **not a delivery of every sprint in the original plan**. Results describe the recorded lab runs; they are neither a security certification nor an up-to-date scan.

## What I wanted to achieve

I wanted to connect several stages of security engineering: creating reproducible infrastructure, identifying problems in code and applications, applying controls, measuring again, and documenting what was resolved and what remained open. Building on that foundation, I explored how risk changes when a language model interprets external information and can request actions on a system.

My approach was: **build → test → observe → fix → retest → document**. The main environment was an Apple Silicon Mac, Docker containers, Terraform, Node.js, OWASP ZAP, Snyk, and a local model served through Ollama.

## Work performed and supporting evidence

| Module | What I implemented or tested | Supported result | Evidence |
| --- | --- | --- | --- |
| Infrastructure as code | Terraform-managed Docker network, Nginx image and container; changes and drift recovery | The saved final plan reports that infrastructure matches the configuration | [Lab notes](docs/evidence/terraform-lab.md) · [Final plan](evidence/terraform/final-plan.txt) |
| SAST and SCA | Snyk Code analysis of an Express application and dependency scanning | Initial SAST: 5 findings; SCA: no known vulnerable paths in the saved runs | [Initial SAST](appsec/sast/evidence/snyk-sast-before.txt) · [Initial SCA](appsec/sast/evidence/snyk-sca-before.txt) · [Later SCA](appsec/sast/evidence/snyk-sca-after.txt) |
| DAST and hardening | ZAP scans and improvements to headers, input validation, and request limits | Baseline JSON decreases from 10 to 2 alert entries, including informational entries; one medium-risk CSP alert remains | [Initial](appsec/dast/reports/zap-baseline-before.json) · [Final](appsec/dast/reports/zap-baseline-final.json) · [Notes](appsec/dast/notes/dast-results.md) |
| AI security | Vulnerable agents and an agent with controls; indirect injection, secret requests, and tool authorization | Evidence shows policy blocks and required human approval; model responses still have limitations | [Results](ai-security/evidence/secure/security-controls-results.txt) · [Final run](ai-security/evidence/secure/security-controls-final.txt) |
| Local WAF and tunnel | Nginx behind ModSecurity + OWASP CRS; architecture incorporating Cloudflare Quick Tunnel | Local test: HTTP 200 for normal traffic and HTTP 403 for four attack patterns | [WAF results](cloudflare-waf/evidence/local-waf-test.txt) · [Architecture](cloudflare-waf/docs/architecture.md) |
| Vulnerability management — partial | Juice Shop target, ZAP reports, and an SCA export prepared for centralization | Juice Shop report contains 16 alert entries; the complete DefectDojo lifecycle is not demonstrated | [Module scope](vulnerability-management/README.en.md) · [Report](vulnerability-management/scans/juice-shop/juice-shop-baseline.json) |

## 1. Reproducible infrastructure with Terraform

I provisioned a Docker network, an Nginx image, and a web container. The lab notes record initialization, validation, planning, application, and state inspection, plus a test involving manual container modification or removal to observe drift and recover from it.

The repository preserves the [configuration](terraform/docker-lab/main.tf), [resource list](evidence/terraform/state-list.txt), [running container](evidence/terraform/docker-running.txt), and final plan showing no changes. The service uses port **8081**. State files and sensitive variable files are excluded from the repository.

## 2. Finding and remediating web application issues

I worked on a Node.js/Express application with a `/ping` endpoint. The initial SAST analysis reported command injection and missing request limits in application code, alongside findings in dependencies included in the analysis.

The [saved code version](appsec/sast/vulnerable-app/app.js) already contains the fixes: `execFile` with separate arguments, IP address validation, an execution timeout, rate limiting, and security headers through Helmet. The directory retains its historical name, `vulnerable-app`, although it contains this hardened version.

Snyk SCA reported 67 dependencies in the initial run and 68 in the later run, with no known vulnerable paths in either. No valid follow-up SAST report is preserved that would support claiming all five initial findings were closed.

I saved initial, intermediate, and final ZAP baseline reports, along with an active scan. The JSON files contain **10 → 4 → 2 alert entries** across the three baselines. These include informational alerts and are not equivalent to the number of checks or warning categories in console output. The historical notes record 8 → 2 warning categories and 59 → 65 passing checks; those are different metrics.

The [active scan report](appsec/dast/reports/zap-full-before.json) contains three entries: one medium-risk CSP alert and two informational entries. The notes record 140 passing checks, no failed checks, and one remaining warning. The `full-before` name is historical: its timestamp is later than the final baseline. The CSP warning affects 404 responses for `/robots.txt` and `/sitemap.xml`. It was documented for assessment, without claiming the entire system was vulnerability-free.

## 3. AI agent security

I built local agents using **Ollama and `llama3.2:3b`**, with synthetic findings as input. One finding contains a malicious instruction in its description, attempting to change the task and request endpoint isolation.

I implemented a version with explicit separation of untrusted data, JSON output, action validation, a tool allowlist, secret-request blocking, data minimization, and audit logging. Isolation or deletion requests require a `HITL_REQUIRED` decision. High-impact tools are simulations; the protected agent neither executes those actions nor implements a subsequent approval workflow.

The saved tests show:

- The vulnerable agent stopped summarizing the finding in response to its injected content. That evidence does not show a destructive tool being executed.
- One protected-agent run requested `isolate_endpoint`, and the application required human approval.
- Explicit requests for secrets and all findings were blocked by policy.
- Model responses varied: some repeated or incorporated instructions from the malicious finding. In the final run, the case named “unknown tool” produced an allowed `get_finding` request, so that case alone does not demonstrate rejection of `shell`.
- A saved [tool-control test](ai-security/evidence/secure/tool-control-tests.txt) shows an allowed read, a blocked high-impact action, and a denied unknown tool.

The central lesson was that **model instructions need application-level authorization controls**. This lab's keyword filters, partial validation, and simulated tools are not a complete prompt injection defense or a deployed MCP integration.

## 4. Local WAF and Cloudflare Tunnel

I placed an Nginx origin behind a local WAF using ModSecurity and OWASP Core Rule Set. The documented architecture is:

```text
Internet → Cloudflare Edge → Quick Tunnel → Local WAF → Nginx
```

The [test script](cloudflare-waf/tests/waf-tests.sh) sends normal traffic and SQL injection, XSS, path traversal, and command injection patterns. Local evidence records **200 for the normal request and 403 for all four patterns**.

Cloudflare provides the tunnel and access through its edge. The demonstrated filtering is performed by **local ModSecurity + OWASP CRS**. No custom Cloudflare WAF rules were configured, and no equivalent end-to-end test report through the tunnel is preserved.

## 5. Vulnerability management: preserved progress

I prepared OWASP Juice Shop as a target, ran ZAP, and generated HTML, JSON, and XML reports. The report contains 16 entries for `http://juice-shop:3000`: **1 high, 4 medium, 7 low, and 4 informational**. These are scanner alerts awaiting validation, not 16 confirmed vulnerabilities. The same report includes external hosts discovered during browsing; their presence does not establish authorized or complete testing of those third parties.

The saved SCA export contains 69 dependencies and no reported vulnerabilities. Centralization in DefectDojo was part of the objective, but there is insufficient evidence of import, deduplication, prioritization, remediation, and closure. No Trivy results are preserved either. See the [module README](vulnerability-management/README.en.md) for details and limitations.

## Repository layout

```text
ai-security/                  Agents, synthetic data, tests, and evidence
appsec/sast/                  Hardened application and Snyk results
appsec/dast/                  ZAP reports and remediation notes
cloudflare-waf/               WAF, Nginx origin, tests, and architecture
terraform/docker-lab/         Docker infrastructure defined with Terraform
evidence/terraform/           Resource evidence and final status
docs/evidence/                Terraform notes and initial Snyk attempts
vulnerability-management/     Juice Shop, SCA export, and ZAP reports
```

Snyk attempts run from `docs/` are preserved as evidence of incorrect directory selection; they are not successful analyses. The empty SAST export, installed dependencies, local models, secrets, Terraform state and binary plans (including `out-plan.txt`), and the copy of the separate `archify` project were excluded.

## Reviewing and repeating the practices

Start with the evidence links in the table to review the work. HTML reports can be downloaded and opened in a browser. New runs require each module's tools; there is no single deployment for the entire lab. Vulnerable applications and scans must be used only in environments you own or are authorized to test.

### Tool authorization without a model

From the repository root, with Node.js:

```bash
node ai-security/secure-agent/secure-tool-router.js '{"tool":"get_finding","target":"VULN-001"}'
node ai-security/secure-agent/secure-tool-router.js '{"tool":"isolate_endpoint","target":"PC-LAB-001"}'
node ai-security/secure-agent/secure-tool-router.js '{"tool":"shell","target":"whoami"}'
```

Expected decisions are `ALLOW`, `HITL_REQUIRED`, and `DENY`, respectively.

### Testing with the local model

With a Node.js version that supports `fetch` and Ollama installed, start the server in one terminal:

```bash
bash ai-security/scripts/start-ollama.sh
```

In another terminal:

```bash
ollama pull llama3.2:3b
bash ai-security/tests/run-security-controls.sh
```

The script prints responses for manual review; it is not a suite with automated assertions. Responses may vary between runs. The generated `audit.log` is excluded from Git.

### Local WAF

With Docker running:

```bash
docker compose -f cloudflare-waf/compose.yml up -d
bash cloudflare-waf/tests/waf-tests.sh
docker compose -f cloudflare-waf/compose.yml down
```

The WAF listens on `127.0.0.1:8088`. This procedure checks the local component; Compose does not start the tunnel.

### Terraform

```bash
cd terraform/docker-lab
terraform init
terraform validate
terraform plan
terraform apply
# When the practice is finished:
terraform destroy
```

Review the plan before applying or destroying resources. Port 8081 must be available; do not simultaneously run the experimental ZAP variant that uses the same port. For Juice Shop, follow the [module instructions](vulnerability-management/README.en.md).

## Scope and lessons learned

This work gave me practice in reproducible infrastructure, critical reading of scanner results, application hardening, before-and-after comparisons, HTTP filtering, and separating model decisions from tool authorization.

The evidence also showed why documenting limitations matters: a scan without findings does not demonstrate absence of risk; a model response does not prove a tool was executed; and having a platform or test plan does not mean its validation lifecycle is complete.

Endpoint Security, Detection Engineering, Incident Response, and MCP Security were part of the initial vision, but they are not presented as completed sprints because this selection lacks sufficient deliverables.

The published version preserves historical reports and adapts AI script paths so they do not depend on the author's drive. It also corrects Terraform's output URL to reflect the configured port, 8081. These publishing changes are not attributed to the historical runs.
