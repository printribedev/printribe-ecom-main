# Printribe Design Studio: plan

Decided by the owner (2026-11-21): build a full design studio (not a workaround on the product page).
- Customers see their design on **2D product photos**: cut-out images (no background) uploaded in the admin, one per colour and per side (front, back, left, right).
- Printing is charged **extra per print area and print method**.

## What the customer does
1. On a product page, clicks **Design now** and the studio opens full screen.
2. Picks the product colour, then works side by side: Front / Back / Left / Right.
3. **Add element**: upload a logo or image, or add text. Move, resize, rotate, delete, undo and redo.
4. Each element must stay inside a **print area** (a box shown on the product). The studio shows the area limits.
5. Picks a **print method** for the design (for example screen printing, embroidery, heat transfer, DTF).
6. Sees the **price update live**: product price + extras for each print area used.
7. Chooses sizes and quantity, then goes to checkout. The design travels with the order.

## What the owner does in the admin
- **Print methods** (new): name, description, and the price per piece for a small, medium or large print area.
- **Products, Design studio tab**: switch the studio on, choose which sides exist, draw the print areas (position and size, plus small/medium/large), and upload the cut-out photo for each colour and side.
- **Orders**: see each design (preview picture per side, original files, print method, areas) and download the print-ready files.

## Look and units (decided 2026-11-23)
- The studio screen follows the Monday Merch look: full-screen dotted canvas, a floating dark toolbar, side tabs along the bottom, an Order card at the bottom right.
- Sizes are shown in **inches**. Each print area has a real width and height in inches (set in the admin), and each print method can have a maximum print size in inches. A design larger than its method allows cannot be saved.

## Pricing rule
Price per piece = product price (with quantity tiers) + the sum of the extras for every print area used.
Extra for one area = the chosen method's price for that area's size (small, medium or large).
The server always recalculates the price. The browser is never trusted.

## Technical plan
- Editor: Fabric.js canvas over the mockup image. No custom drawing engine.
- Print areas are stored as percentages of the mockup image, so they work at any screen size.
- Uploaded design files: Cloudflare R2. A design is saved as JSON (what is where) plus a preview picture per side.
- New collections: `print-methods`, `designs`. Orders get a link to the design and a price snapshot.
- Every schema change is additive, and each one needs a migration (`npm run payload -- migrate:create`).

## Build order
1. **Admin foundation** (print methods, product studio settings, mockup uploads). DONE.
2. **Editor** (canvas, upload, text, move/resize, print-area limits, colour and side switching). DONE, at `/design/<product-slug>`. Uses a built-in placeholder shirt until real photos are uploaded. Designs are not saved yet.
3. **Pricing and saving** (live price, save design and previews to R2, server-side price check).
4. **Checkout link** (design travels into the order and checkout, payment as today).
5. **Order admin** (view designs, download print files).
6. **Later**: templates, AI ideas, background removal, vectorising, mobile polish.

## Needed from the owner
- Cut-out product photos per colour and side (can be added any time in the admin).
- Print methods and their prices for small, medium and large areas.
- Print area sizes for each product (we start with sensible defaults).
