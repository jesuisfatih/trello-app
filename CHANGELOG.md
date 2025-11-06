# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-06

### Added
- Initial release of ShopiTrello
- Shopify embedded app with App Bridge 4.x integration
- Trello OAuth 1.0a authentication
- Complete Trello API integration (boards, lists, cards, comments)
- GraphQL Admin API 2025-10 support
- Session token validation and token exchange
- Webhook handlers for Shopify and Trello
- GDPR compliance (data request, customer redact, shop redact)
- Rate limiting with exponential backoff
- PostgreSQL database with Prisma ORM
- Docker Compose production deployment
- Caddy reverse proxy with automatic HTTPS
- Modern UI with Tailwind CSS
- Dashboard with connection status
- Board/List/Card management interface
- Event logging system
- Settings and API status page

### Security
- HMAC verification for Shopify webhooks
- Session token validation (HS256 JWT)
- Token exchange for short-lived access tokens
- HTTPS enforcement with HSTS
- Security headers (CSP, X-Frame-Options, etc.)

### Infrastructure
- Node.js 22 LTS
- Next.js 16 with App Router
- React 19
- PostgreSQL 16
- Prisma 6.19
- Docker multi-stage builds
- Caddy 2 with ACME TLS

## [Unreleased]

### Planned
- Shopify to Trello mapping automation
- Bulk card operations
- Advanced filtering and search
- Trello Power-Up integration
- Real-time sync with webhooks
- Analytics and reporting
- Multi-language support
- Dark mode theme

