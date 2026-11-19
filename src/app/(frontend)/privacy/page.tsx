import type { Metadata } from 'next'
import React from 'react'

import { LegalPage } from '@/components/Legal/LegalPage'
import { privacy } from '@/lib/legal/privacy'

export const metadata: Metadata = {
  title: 'Privacy Policy | Printribe',
  description: 'How Printribe collects, uses and protects your information.',
}

export default function PrivacyPage() {
  return <LegalPage doc={privacy} />
}
