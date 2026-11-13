import type { CollectionConfig } from 'payload'
import path from 'path'

import { authenticated } from '../access/authenticated'

/**
 * Payment screenshots uploaded by customers. PRIVATE: only signed-in admins can open them.
 * (In production these move to a private Cloudflare R2 bucket.)
 */
export const PaymentProofs: CollectionConfig = {
  slug: 'payment-proofs',
  labels: { singular: 'Payment screenshot', plural: 'Payment screenshots' },
  access: {
    create: () => false, // only the server creates these, after checking the order
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: { group: 'Shop' },
  upload: {
    staticDir: path.resolve(process.cwd(), 'private-uploads/payment-proofs'),
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
    // Do not expose a public file URL
    disableLocalStorage: false,
  },
  fields: [],
}
