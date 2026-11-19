import type { Metadata } from 'next'
import React from 'react'

import { LegalPage } from '@/components/Legal/LegalPage'
import { terms } from '@/lib/legal/terms'

export const metadata: Metadata = {
  title: 'Terms and Conditions | Printribe',
  description: 'The terms that apply when you use the Printribe website or place an order.',
}

export default function TermsPage() {
  return <LegalPage doc={terms} />
}
