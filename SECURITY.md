# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ShopiTrello, please report it responsibly:

1. **DO NOT** open a public issue
2. Email security details to: [your-security-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Measures

### Authentication & Authorization
- Session tokens validated using HS256 JWT
- Token exchange for short-lived access tokens (1 minute for online tokens)
- HMAC verification for all Shopify webhooks
- OAuth 1.0a for Trello integration

### Data Protection
- All sensitive data encrypted in transit (HTTPS/TLS 1.2+)
- Database credentials stored in environment variables
- No sensitive data logged
- GDPR compliance with redaction endpoints

### API Security
- Rate limiting on Trello API calls
- Exponential backoff for retry logic
- Input validation using Zod schemas
- SQL injection prevention via Prisma ORM

### Infrastructure
- Docker containers run as non-root user
- Minimal base images (Alpine Linux)
- Security headers (HSTS, CSP, X-Frame-Options, etc.)
- Automatic HTTPS via Caddy with ACME
- Regular dependency updates

### Best Practices
- No hardcoded secrets
- Environment-based configuration
- Strict TypeScript mode
- Webhook signature verification
- Idempotent webhook handlers

## Security Checklist for Deployment

- [ ] Change all default credentials
- [ ] Generate strong encryption keys (32+ bytes)
- [ ] Use environment-specific secrets
- [ ] Enable firewall rules (only ports 80/443 exposed)
- [ ] Configure ACME email for Let's Encrypt
- [ ] Set up database backups
- [ ] Monitor logs for suspicious activity
- [ ] Keep dependencies updated
- [ ] Use strong PostgreSQL password
- [ ] Restrict database access to app only

## Disclosure Policy

- Confirmed vulnerabilities will be patched ASAP
- Security advisories will be published after fix
- Credit given to reporters (unless anonymity requested)

## Contact

For security concerns: [your-security-email@example.com]

