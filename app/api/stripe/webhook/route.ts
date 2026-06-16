import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const supabase = await createServiceClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('stripe_customer_id', sub.customer)
        .single()

      if (org) {
        const plan = sub.items.data[0]?.price?.nickname?.toLowerCase() ?? 'starter'
        const subAny = sub as unknown as { current_period_end: number }
        await supabase.from('subscriptions').upsert({
          org_id: org.id,
          stripe_subscription_id: sub.id,
          plan,
          status: sub.status,
          current_period_end: new Date(subAny.current_period_end * 1000).toISOString(),
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled', plan: 'starter' })
        .eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
