# Printribe page checklist

Built one page at a time. Tick a page only when it works in the browser on desktop and mobile.
Goal of Phase A: the first real order placed, paid and shipped.

## Phase A: needed for the first shipped order

| # | Page | Address | Status |
|---|---|---|---|
| 1 | Home | `/` | Built (placeholder logos, reviews, photos) |
| 2 | All products (category tiles, sections, filters, Quick Add, Buy now) | `/shop` | Built, with sample products (no photos yet) |
| 3 | Sub-categories (T-shirts, polos...) | pills on `/shop` | Built into page 2, no separate page |
| 4 | Product page (photos, colours, sizes, quantity, price tiers, Buy now) | `/products/[slug]` | Built (size chart table still to add) |
| 5 | Cart | `/cart` | Skipped for now: Buy now goes straight to checkout |
| 6 | Checkout: customer and delivery details | `/checkout` | Built and tested (dummy-entry checks, pincode and email checks) |
| 7 | Payment with Razorpay (Pay button, signature check, webhook) | `/checkout/payment` | Built. Needs your Razorpay test keys in `.env` to try a real payment |
| 8 | Order status | `/order/[number]` | Built and tested |
| 9 | Track my order | `/track` | To do |
| 10 | Contact | `/contact` | To do |
| 11 | Shipping and returns | `/shipping-returns` | To do |
| 12 | Terms and conditions | `/terms` | Built (text copied from the Framer site) |
| 13 | Privacy policy | `/privacy` | Built (text copied from the Framer site) |
| 14 | Page not found (404) | any wrong address | Template default, restyle |

Admin screens for Phase A (inside `/admin`): Products, Categories, Orders (status, payment proof, courier export), Media.

## Phase B: right after the first order ships

| # | Page | Address |
|---|---|---|
| 15 | Accessories (and sub-categories) | `/accessories` |
| 16 | Bulk orders | `/bulk-orders` |
| 17 | Get a quote | `/quote` |
| 18 | About Printribe | `/about` |
| 19 | FAQ | `/faq` |
| 20 | Blog list and blog post | `/blog`, `/blog/[slug]` |
| 21 | Design Studio (coming soon, notify me) | `/design-studio` |
| 22 | Customer login and My orders | `/account` |

## Phase C: later

Design Studio itself, order emails and alerts, CRM link, invoices.
