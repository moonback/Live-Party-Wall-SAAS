import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
})

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
    )

    console.log(`Processing event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata
        
        if (!metadata) break

        if (session.mode === 'payment' && metadata.eventId) {
          // Paiement unique pour un événement
          await supabaseAdmin
            .from('event_payments')
            .insert({
              event_id: metadata.eventId,
              amount_cents: session.amount_total,
              status: 'paid',
              stripe_payment_intent_id: session.payment_intent as string,
            })

          await supabaseAdmin
            .from('events')
            .update({ 
              plan_id: metadata.planId,
              payment_status: 'paid' 
            })
            .eq('id', metadata.eventId)
            
        } else if (session.mode === 'subscription') {
          // Nouvel abonnement mensuel
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: metadata.userId,
              plan_id: metadata.planId,
              status: 'active',
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const status = subscription.status === 'active' ? 'active' : 
                       subscription.status === 'past_due' ? 'past_due' : 
                       subscription.status === 'canceled' ? 'canceled' : 'incomplete'

        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        // Optionnel : Gérer les échecs de paiement (logs, notifications)
        console.error(`Payment failed for ${paymentIntent.id}`)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    console.error(`Webhook error: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})

