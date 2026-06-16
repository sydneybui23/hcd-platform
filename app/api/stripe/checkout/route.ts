import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await request.json() as { plan: string }
  if (plan !== 'pro') return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const planConfig = PLANS['pro']
  if (!planConfig.priceId) return NextResponse.json({ error: 'No price configured' }, { status: 400 })

  const { data: org } = await supabase
    .from('organizations')
    .select('id, stripe_customer_id')
    .eq('id', user.user_metadata.org_id)
    .single()

  const session = await stripe.checkout.sessions.create({
    customer: org?.stripe_customer_id ?? undefined,
    customer_email: org?.stripe_customer_id ? undefined : user.email,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    metadata: { org_id: org?.id, user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
