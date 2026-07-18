# System Updates

A running log of notable changes to the Wooden Houses Kenya system (website + admin).
When you make a change, add an entry here **and** send the team an email from
**Dashboard → Settings → Send Team Update** (branded template, goes to the team on file).

---

## 2026-07-18 — Security: sanitize logs (log-injection + PII)

Resolved all open CodeQL "Log entries created from user input" (CWE-117) and
"Exposure of private information" (CWE-359) alerts.

- New `LogSanitizer` utility: `Clean` strips CR/LF and control characters so a
  value can't forge extra log lines; `MaskEmail` redacts email addresses
  (`john.doe@gmail.com` → `jo***@gm***`) so logs never expose PII.
- Applied at every flagged log sink across EmailService, ImapService,
  AdminMailboxController, AdminAgentsController, AccountsAgentService,
  DatabaseSeeder, and ExceptionMiddleware (request method/path).
- Unit-tested (LogSanitizerTests).

---

## 2026-07-18 — Instant price estimator + grounded, reliable AI agents

**Marketing site**
- Contact page now has a **House Size** selector that shows an instant estimate:
  *from USD X · approx. KES Y · build time*, framed as a "from" estimate with the
  final price confirmed after a free site visit. The price is a deterministic
  lookup (no AI in the price path), so it can never under-price.
- Removed the inaccurate **Budget Range** and **Project Timeline** dropdowns —
  the estimate card now provides the price and build time. The selected estimate
  is still saved to the contact record (budget = price, timeline = build time).

**AI agents (admin)**
- The assistant is now **grounded**: it works strictly from the approved price
  list and is instructed never to invent a price or quote below it.
- Replies to new enquiries now **queue for approval** instead of auto-sending —
  nothing reaches a client unreviewed.
- Fixed the background error (disposed database context) that was stopping some
  replies from being drafted.

**Admin queue**
- The draft **edit screen is plain text**, not HTML markup; it's formatted into a
  clean email automatically on send.
- **Retry all failed** regenerates every failed draft with the corrected agent.
- **Regenerate** replaces a stale pending draft with a fresh, correctly-priced one.

**Pricing (single source of truth)**
- All house prices, build times, and the indicative USD→KES rate live in one
  place (`backend/WoodenHousesAPI/Pricing/HousePricing.cs`). Update there and both
  the website and the assistant stay in sync. Rate is admin-configurable via
  `Pricing:UsdToKes` (default 130).

**Prices used** (owner's averages, USD — depend on size and finishes):
| House | From (USD) | Build time |
|---|---|---|
| 1 Bedroom | 19,500 | 2 weeks |
| 2 Bedroom | 27,000 | 1 month |
| 3 Bedroom | 50,000 | 2 months |
| 4 Bedroom | 77,000 | 10 weeks |
| 5 Bedroom | 100,000 | 3 months |

---

<!-- Add new entries above this line, newest first. -->
