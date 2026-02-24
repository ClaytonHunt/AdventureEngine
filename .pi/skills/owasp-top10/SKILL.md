---
name: owasp-top10
description: OWASP Top 10 2021 reference guide for security auditing. Load this skill when reviewing code for security vulnerabilities, performing threat modeling, or writing security recommendations.
---

# OWASP Top 10 (2021) — Security Audit Reference

## A01 — Broken Access Control
**What to look for:**
- Missing authorization checks before sensitive operations
- Insecure direct object references (IDOR): `/api/users/123` accessible by user 456
- Missing function-level access control (admin endpoints without admin check)
- CORS misconfiguration allowing unauthorized origins
- JWT with `alg: none` or weak secret

**Code patterns to flag:**
```javascript
// BAD — no ownership check
app.get('/api/documents/:id', async (req, res) => {
  const doc = await db.documents.findById(req.params.id); // ← any user can access any doc
  res.json(doc);
});

// GOOD
app.get('/api/documents/:id', requireAuth, async (req, res) => {
  const doc = await db.documents.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!doc) return res.status(403).json({ error: 'Forbidden' });
  res.json(doc);
});
```

---

## A02 — Cryptographic Failures
**What to look for:**
- Plaintext passwords or secrets in code, logs, or database
- Weak hashing algorithms: MD5, SHA1 for passwords (use bcrypt/argon2)
- HTTP instead of HTTPS for sensitive data
- Weak random number generation (`Math.random()` for tokens)
- Hard-coded cryptographic keys
- Unencrypted sensitive data at rest

**Code patterns to flag:**
```javascript
// BAD
const passwordHash = md5(password);
const token = Math.random().toString(36);

// GOOD
const passwordHash = await bcrypt.hash(password, 12);
const token = crypto.randomBytes(32).toString('hex');
```

---

## A03 — Injection
**What to look for:**
- SQL injection: string concatenation in queries
- NoSQL injection: unsanitized user input in `$where`, `$regex`
- Command injection: `exec()`, `spawn()` with user input
- LDAP injection, XPath injection
- Template injection

**Code patterns to flag:**
```javascript
// BAD — SQL injection
const user = await db.query(`SELECT * FROM users WHERE email = '${req.body.email}'`);

// BAD — Command injection
exec(`convert ${req.body.filename} output.pdf`);

// GOOD — parameterized query
const user = await db.query('SELECT * FROM users WHERE email = $1', [req.body.email]);

// GOOD — validate and sanitize before shell commands
const safe = path.basename(req.body.filename).replace(/[^a-zA-Z0-9._-]/g, '');
```

---

## A04 — Insecure Design
**What to look for:**
- Missing rate limiting on authentication endpoints
- No account lockout after failed attempts
- Password reset with predictable tokens
- Lack of CAPTCHA on public-facing forms
- Business logic flaws (e.g., negative quantities in e-commerce)
- Missing threat modeling for sensitive workflows

---

## A05 — Security Misconfiguration
**What to look for:**
- Default credentials not changed
- Verbose error messages exposing stack traces in production
- Unnecessary HTTP headers (expose server info)
- Missing security headers
- Debug mode enabled in production
- Overly permissive file permissions

**Required security headers:**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=()
```

---

## A06 — Vulnerable and Outdated Components
**What to look for:**
- Dependencies with known CVEs (`npm audit`, `snyk`)
- Dependencies not updated in 6+ months
- No process for monitoring security advisories
- Using abandoned packages
- Client-side libraries loaded from untrusted CDNs

---

## A07 — Identification and Authentication Failures
**What to look for:**
- Passwords stored without hashing
- Weak password requirements (min length < 8)
- No multi-factor authentication for sensitive operations
- Session IDs exposed in URLs
- Sessions not invalidated on logout
- Insecure "remember me" implementation
- Predictable session tokens

**Session security checklist:**
- [ ] Regenerate session ID after login
- [ ] `Secure; HttpOnly; SameSite=Strict` on session cookies
- [ ] Session timeout (idle + absolute)
- [ ] Invalidate all sessions on password change
- [ ] Invalidate session on logout (server-side)

---

## A08 — Software and Data Integrity Failures
**What to look for:**
- No integrity verification on downloaded content (checksums, SRI)
- Auto-update without signature verification
- Untrusted deserializations
- CI/CD pipeline with untrusted plugins or actions
- Missing Subresource Integrity (SRI) on CDN-loaded scripts

---

## A09 — Security Logging and Monitoring Failures
**What to look for:**
- Authentication events not logged (success AND failure)
- High-value transactions not audited
- Logs stored only locally (no centralized logging)
- Logs containing sensitive data (passwords, tokens, PII)
- No alerting on suspicious patterns (brute force, scraping)

**Minimum logging requirements:**
- Authentication: login, logout, failed attempts, lockouts
- Authorization failures: access denied events
- Input validation failures
- High-value operations: admin actions, data exports, payment events

---

## A10 — Server-Side Request Forgery (SSRF)
**What to look for:**
- User-controlled URLs in server-side HTTP requests
- Fetch/request to user-supplied endpoints without allow-listing
- URL redirects that can be chained to internal resources
- PDF/image generators that fetch URLs

**Code patterns to flag:**
```javascript
// BAD — SSRF
app.post('/fetch', async (req, res) => {
  const data = await fetch(req.body.url); // ← attacker can hit internal services
  res.json(await data.json());
});

// GOOD — allowlist validation
const ALLOWED_HOSTS = ['api.trusted.com', 'cdn.trusted.com'];
const url = new URL(req.body.url);
if (!ALLOWED_HOSTS.includes(url.hostname)) {
  return res.status(400).json({ error: 'URL not allowed' });
}
```

---

## Severity Classification

| Severity | CVSS Score | Response Time |
|---|---|---|
| Critical | 9.0–10.0 | Fix immediately, before next deploy |
| High | 7.0–8.9 | Fix within 1 sprint |
| Medium | 4.0–6.9 | Fix within 2 sprints |
| Low | 0.1–3.9 | Fix in next scheduled maintenance |
| Info | N/A | Document and review |
