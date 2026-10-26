# Printribe website and admin

The public Printribe website and its admin, built with **Next.js** and **Payload CMS**.

- Website: `http://localhost:3001`
- Admin: `http://localhost:3001/admin` (the first person to open it creates the first account)

## Run it on your computer

```bash
npm install          # once
npm run seed         # once: fills a fresh database with the homepage, menu, footer and sample posts
npm run dev -- -p 3001
```

Settings live in `.env` (copy `.env.example`; never commit `.env`). Locally the site uses a single-file
database (`printribe-dev.db`). Production will use a new Supabase Postgres database and a Cloudflare R2 bucket.

## Where things are

| What | Where |
|---|---|
| Homepage sections (admin definitions) | `src/blocks/Printribe/configs.ts` |
| Homepage sections (what visitors see) | `src/blocks/Printribe/Sections.tsx` |
| Colours and fonts | `src/app/(frontend)/globals.css` |
| Header and footer | `src/Header/`, `src/Footer/` |
| Newsletter and Design Studio sign-ups | `src/app/(frontend)/api/subscribe/route.ts`, `src/collections/Subscribers.ts` |
| Starter content | `src/seed/printribe.ts` |
| "Coming soon" pages for links not built yet | `src/app/(frontend)/[slug]/page.tsx` (`COMING_SOON`) |

## Brand

Headings are **General Sans** (semi-bold), body text is **Inter**. The brand colour is **Sky Blue**
(`#0369A1`, bright `#0EA5E9`, tint `#E0F2FE`), with near-black `#1D1D1F` and soft greys.

## Build order

1. Project and admin (done)  2. Homepage and blog (homepage done)  3. Apparel catalogue  4. Quotes
5. Orders, payments, invoices  6. Emails and alerts  7. CRM link  8. Design Studio
