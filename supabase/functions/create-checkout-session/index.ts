import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Vérifier l'authentification de l'utilisateur
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }

    const { planId, eventId, successUrl, cancelUrl } = await req.json()

    // Récupérer les infos du plan dans la DB
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan non trouvé' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
    })

    // Préparer les métadonnées pour le webhook
    const metadata: any = {
      userId: user.id,
      planId: planId,
      planType: plan.type,
      interval: plan.interval
    }
    if (eventId) metadata.eventId = eventId

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Live Party Wall - ${plan.name}`,
              description: plan.interval === 'event' ? 'Paiement unique pour un événement' : 'Abonnement mensuel',
            },
            unit_amount: plan.price_cents,
            recurring: plan.interval !== 'event' ? { interval: 'month' } : undefined,
          },
          quantity: 1,
        },
      ],
      mode: plan.interval === 'event' ? 'payment' : 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/admin?success=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/admin?canceled=true`,
      customer_email: user.email,
      metadata: metadata,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

