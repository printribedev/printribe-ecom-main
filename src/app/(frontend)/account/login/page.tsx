import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React from 'react'

import { AuthShell } from '@/components/Account/AuthShell'
import { LoginForm } from '@/components/Account/AuthForms'
import { safeNext } from '@/lib/account/next'
import { getCustomer } from '@/lib/account/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sign in | Printribe', robots: { index: false } }

type Args = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function LoginPage({ searchParams }: Args) {
  const sp = await searchParams
  const next = safeNext(Array.isArray(sp.next) ? sp.next[0] : sp.next)
  if (await getCustomer()) redirect(next)

  return (
    <AuthShell
      title="Sign in"
      intro="See your orders and saved designs."
      footer={
        <>
          New to Printribe?{' '}
          <Link href={`/account/register?next=${encodeURIComponent(next)}`} className="text-sky underline underline-offset-2">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  )
}
