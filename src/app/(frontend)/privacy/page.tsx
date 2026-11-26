import type { Metadata } from 'next'
import React from 'react'

import { EditableLegal } from '@/components/Legal/EditableLegal'
import { privacy } from '@/lib/legal/privacy'

export const metadata: Metadata = {
  title: 'Privacy Policy | Printribe',
  description: 'How Printribe collects, uses and protects your information.',
}

export default function PrivacyPage() {
  return <EditableLegal slug="privacy" fallback={privacy} />
}
