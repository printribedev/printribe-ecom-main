import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'

/**
 * Shoppers who made an account. This is NOT Payload's login system (that one is only for you and your team).
 * Customers sign in through our own routes in src/app/(frontend)/api/account, so a customer login can never
 * reach the admin. Only staff can open this list; passwords are stored as one-way hashes and are never shown.
 */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Customer', plural: 'Customers' },
  access: {
    create: () => false,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'phone', 'createdAt'],
    group: 'Shop',
  },
  fields: [
    { name: 'email', type: 'email', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text' },
    { name: 'passwordHash', type: 'text', required: true, access: { read: () => false, update: () => false }, admin: { hidden: true } },
    { name: 'sessionVersion', type: 'number', defaultValue: 1, access: { read: () => false, update: () => false }, admin: { hidden: true } },
    { name: 'resetTokenHash', type: 'text', index: true, access: { read: () => false, update: () => false }, admin: { hidden: true } },
    { name: 'resetExpires', type: 'date', access: { read: () => false, update: () => false }, admin: { hidden: true } },
    { name: 'failedLogins', type: 'number', defaultValue: 0, access: { read: () => false, update: () => false }, admin: { hidden: true } },
    { name: 'lockedUntil', type: 'date', access: { read: () => false, update: () => false }, admin: { hidden: true } },
    { name: 'lastLoginAt', type: 'date', admin: { readOnly: true } },
  ],
}
