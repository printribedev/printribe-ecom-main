# Printribe site audit (26 Nov 2026)

How it was checked: the page checklist, the code, your live site (public pages and API doors), your live database (read-only counts), the build setup and a dependency scan. Not checked: your Vercel settings, Razorpay, Supabase plan and backups, accessibility and speed scores, other browsers, a real payment.

## What is solid
- Orders, studio, checkout, accounts, quote, contact and job sheet all work end to end on the live code (tested).
- No passwords or keys in the code. Orders, customers, quotes, enquiries and designs cannot be read by visitors (403).
- The database schema tool (GraphQL) is blocked for visitors. HTTPS is forced.
- Razorpay is correctly "off" (the pay step returns 503 until keys exist).

## A. Must be done before the first real sale
- [ ] **Razorpay**: test keys, then live keys, plus the webhook address and secret.
- [ ] **Real products**: 7 "[Sample]" products are PUBLISHED on the live shop with placeholder prices and no photos (0 media files). Replace or unpublish them.
- [ ] **Studio setup**: only 2 products have the studio on, 0 cut-out mockup photos, 1 print method with no maximum size. Check print areas and their inches.
- [ ] **Email (Resend + domain)**: today there are NO order confirmations, payment receipts, shipped emails, password reset emails, or enquiry and quote alerts.
- [ ] **Your own domain**, then update the site address setting, the R2 CORS list and the Razorpay webhook.
- [ ] **Delivery fee rule**: Shop settings is empty, so defaults apply (75 rupees, free from 1000). Confirm or change.
- [ ] **Contact details**: WhatsApp and phone are empty in Shop, Contact details.
- [ ] **Legal and seller details**: no Shipping and returns page, no business name, address or GSTIN shown, Terms and Privacy are still the Framer text (not checked by a lawyer), no GST invoice yet.
- [ ] **Fulfilment**: no courier CSV export, no "shipped" notice to the customer. The job sheet and admin work, but it is manual.

## B. Fix soon (technical)
- [x] `/sitemap.xml` and `/robots.txt` are missing on the live site (the step that creates them does not run on Vercel). **DONE 26 Nov (not live until pushed):** the site now builds both itself, live from the database, including every product, studio and post page.
- [x] Social share picture is the Payload "Website Template" artwork. Replace with a Printribe image. **DONE:** new Printribe share picture at /og-image.png.
- [x] Pictures uploaded in the admin (hero, blog) are stored on R2, but the site's image settings do not allow that address, so they would fail to show. **DONE:** the R2 address is now allowed.
- [x] 15 dependency warnings (2 critical): next, sharp, fabric, lexical, and tar/canvas (build-time). Update on a test branch. **PARTLY DONE:** Next.js, sharp and fabric updated. 15 warnings (2 critical) down to 9 (none critical). The rest are in the rich-text library (lexical/happy-dom) with no fix available yet; low risk because only your team writes rich text.
- [x] Only the HTTPS header is set. Add X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy and a Content-Security-Policy. **DONE:** all five added and tested on the production build, including the studio upload and the admin.
- [x] Unused form-builder plugin: `/api/form-submissions` accepts anonymous posts, and forms, redirects and search lists are public. Turn off what is not used. **DONE:** form builder, redirects and search are now staff-only.
- [ ] Some rate limits live in server memory only (order lookup). Add a stronger limit or the Vercel firewall.
- [ ] No error monitoring, analytics or uptime check. Supabase backup plan unknown. One admin account, no 2FA.
- [x] No automated tests for pricing, checkout or payment checks (only template tests). **STARTED:** 22 tests for prices, price breaks, studio extras, form checks, passwords, redirects and the studio safety check. Run with `npm test`. Still to add: checkout and payment-check tests once Razorpay keys exist.
- [ ] Cookie notice: the Privacy page mentions cookies and ads, but there is no banner. Needed once analytics or ads are added.
- [x] Clean-up: Dockerfile, docker-compose, test.env and template tests are unused. One stray draft page with no address in the live database. **DONE** (template files removed). The stray draft page (id 2, no title, created 21 Nov) is still in the live database: harmless, delete it in the admin under Pages.

## C. Placeholder content visible on the live site
- [ ] Homepage hero shows "PLACEHOLDER: ADD A VIDEO OR PHOTO..." (no hero media)
- [ ] Homepage "Client logo 1 to 5"
- [ ] Homepage reviews: "[Customer name]", "[Company]", "Placeholder review"
- [ ] 3 placeholder blog posts are published
- [ ] "Photo coming" tiles on every product
- [ ] About page says "Coming soon"

## D. Pages still to build
About, FAQ page, Shipping and returns, 404 page restyle, size chart on product pages. (Accessories is covered by the shop categories, and "Track my order" by the lookup on the Contact page.)

## E. Nice to have later
- Studio: real mockups for every colour and side, templates, shapes, autosave, side thumbnails, one-click download of artwork files, better phone editing.
- Customers: verified emails, saved addresses, reorder button, auto-link of old orders.
- Quotes: accept and pay online, quote PDF, automatic emails.
- Operations: invoices, refunds process, reports, CRM link.

## Suggested order
1. Quick technical fixes (B), which I can do now.
2. Real content, products and photos (A, C).
3. Razorpay test keys, then a real test order.
4. Domain and Resend (email).
5. Legal and seller pages, then a final check and go live.
