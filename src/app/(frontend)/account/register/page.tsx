import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { AuthShell } from '@/components/Account/AuthShell'
import { RegisterForm } from '@/components/Account/AuthForms'
import { safeNext } from '@/lib/account/next'
import { getCustomer } from '@/lib/account/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Create account | Printribe', robots: { index: false } }

type Args = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function RegisterPage({ searchParams }: Args) {
  const sp = await searchParams
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next)
  if (await getCustomer()) redirect(next)

  return (
    <AuthShell
      title="Create your account"
      intro="Keep track of your orders and saved designs in one place. You can still order without an account."
      footer={
        <>
          Already have an account?{' '}
          <Link href={`/account/login?next=${encodeURIComponent(next)}`} className="text-sky underline underline-offset-2">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthShell>
  )
}
