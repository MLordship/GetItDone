import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/gtd/inbox'

  // In produzione dietro un proxy (Netlify/Vercel) l'origin dalla request
  // può essere localhost — usiamo x-forwarded-host se disponibile
  const forwardedHost = request.headers.get('x-forwarded-host')
  const baseUrl = forwardedHost
    ? `https://${forwardedHost}`
    : origin

  const successResponse = NextResponse.redirect(`${baseUrl}${next}`)
  const errorResponse = NextResponse.redirect(`${baseUrl}/login?error=auth_failed`)

  // Il client scrive i cookie di sessione direttamente sulla successResponse
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            successResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // PKCE flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return successResponse
  }

  // Magic link / OTP flow
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error) return successResponse
  }

  return errorResponse
}
