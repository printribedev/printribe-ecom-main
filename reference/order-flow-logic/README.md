# Order-flow logic worth reusing (reference only, not compiled)

These files were saved from the old project before it was deleted. They are plain text (`.txt`) so the build
ignores them. When we build the order flow, port the ideas into the new project; do not paste them in as they are
(they were written for Prisma and a different folder layout).

| File | What it does | Use it for |
|---|---|---|
| `validation.ts.txt` | Rules that reject dummy details: fake-looking names, phone numbers (all same digit, 1234567890), emails (gibberish, disposable domains), addresses, cities, pincodes. 49 test cases passed. | Checkout form |
| `verify-email-and-pincode.ts.txt` | Server checks that the email's domain really exists and that the pincode exists and matches the chosen state (India Post lookup). Fails open if the lookup service is down. | Checkout form |
| `pricing-and-delivery-fee.ts.txt` | Quantity-tier discounts and a flat delivery fee that is free above a threshold. | Pricing at checkout |
| `order-status-and-size-table.ts.txt` | The order status list and the "pieces by size and status" table. | Admin dashboard |
| `place-order-and-payment-proof-actions.ts.txt` | Creating an order with the price recomputed on the server, and the guard that refuses to move on without a real uploaded payment screenshot. | Orders and payments |
| `payment-proof-screenshot-required.tsx.txt` | The payment step: screenshot required, optional UPI transaction ID. | Payment screen |
| `r2-signed-uploads.ts.txt`, `upload-presign-route.ts.txt` | Private file uploads to Cloudflare R2 with short-lived signed links, and a check that the file exists. | Payment screenshots, artwork |

## Courier bulk-upload file (41 columns, 14 required)

Layout used for the courier's "Bulk Order Upload" CSV. One row per order item:

| Column | Value |
|---|---|
| Sale Order Number | The order number |
| Pickup Location Name | Must match the name saved in the courier panel exactly (ask the owner) |
| Transport Mode | Surface (Air if requested) |
| Payment Mode | Prepaid (only ship orders whose payment is verified) |
| Customer Name, Customer Phone, Customer Email | From the order |
| Shipping Address Line1 / Line2 / City / State / Pincode | From the order |
| Item Sku Code | SKU plus size, e.g. `SKU-XL` |
| Item Sku Name | Product, colour, size |
| Quantity Ordered | Quantity |
| Unit Item Price | Rupees per piece, GST included |
| Billing Address same as Shipping Address | Yes |
| Everything else (dimensions, weight, discounts, tax code, e-way bill, seller details) | Blank unless needed |

The template file is `Bulk Order Upload Old Sample.csv` in the owner's Downloads folder.
