# Shopify App Store Review Prep

## Listing Assets

- App name: **SEO DROME TEAM**
- Pricing: **Single plan – $9.99 USD / month** (no free tier)
- Short description: “Connect Shopify workflows to Trello boards with Kanban automation.”
- Screenshots: capture dashboard, integrations page, board kanban, settings.
- Support email: `support@seodrometeam.com`
- Privacy policy URL: `https://seodrometeam.com/privacy`
- Terms of service URL: `https://seodrometeam.com/terms`

## Mandatory Review Notes

Include in Partner Dashboard review submission:

1. Test store credentials (collaborator access or development store link).
2. Step-by-step install instructions:
   - Install app via provided link.
   - Navigate to **Integrations → Trello**.
   - Use “Continue with Trello OAuth 1.0” to connect (test Power-Up credentials).
   - Open **Boards** list, choose a board, drag cards/lists, create card.
3. Mention manual token fallback remains under same page for QA.
4. Note CORS requirements fulfilled (App Bridge script inline loader).

## Functional Checklist

- [ ] Shopify OAuth completes without errors.
- [ ] App Bridge host/shop cookies available immediately after redirect.
- [ ] Trello OAuth 1.0a completes and returns to `/app/integrations/trello?success=true`.
- [ ] Manual token connection path succeeds with provided test token.
- [ ] Boards page loads lists, supports card CRUD + drag/drop.
- [ ] Lists reorder via drag handle.
- [ ] Disconnect Trello button clears connection and status indicator updates.
- [ ] `/api/health` returns `200`.
- [ ] GDPR webhooks respond `200` (verify via `curl -I`).

## Support & Contact

- Email: `support@seodrometeam.com`
- Response time target: 1 business day (declare in listing).
- Escalation: `ops@seodrometeam.com` (internal, optional).

## Submission Tips

- Provide Trello sandbox account credentials (Power-Up admin) in review notes.
- Attach short Loom video demonstrating OAuth + Kanban drag/drop.
- Re-run production deployment (`docker compose up -d --build`) before inviting Shopify QA.

Keep this document updated per Shopify’s latest review guidelines.

