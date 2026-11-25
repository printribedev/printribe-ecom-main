import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { AuthShell } from '@/components/Account/AuthShell'
import { ResetForm } from '@/components/Account/AuthForms'

export const metadata: Metadata = { title: 'Choose a new password | Printribe', robots: { index: false } }

type Args = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function ResetPasswordPage({ searchParams }: Args) {
  const sp = await searchParams
  const token = (Array.isArray(sp.token) ? sp.token[0] : sp.token) || ''

  if (!token) {
    return (
      <AuthShell title="This link is not valid" intro="Please ask for a new password reset email.">
        <Link href="/account/forgot-password" className="inline-flex rounded-full bg-ink px-6 py-3 text-[17px] font-medium text-white">
          Reset my password
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Choose a new password" intro="You will be signed in as soon as it is saved.">
      <ResetForm token={token} />
    </AuthShell>
  )
}
