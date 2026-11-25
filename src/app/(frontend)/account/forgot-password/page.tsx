import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { AuthShell } from '@/components/Account/AuthShell'
import { ForgotForm } from '@/components/Account/AuthForms'

export const metadata: Metadata = { title: 'Forgot password | Printribe', robots: { index: false } }

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      intro="Enter your email and we will send you a link to choose a new one."
      footer={
        <Link href="/account/login" className="text-sky underline underline-offset-2">
          Back to sign in
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  )
}
