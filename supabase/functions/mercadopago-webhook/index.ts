// Supabase Edge Function: MercadoPago Webhook
// Recibe notificaciones de pago y actualiza la suscripción del usuario

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // MercadoPago envía notificaciones como query params o body
    const url = new URL(req.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    // También puede venir en el body
    let body = null
    try {
      body = await req.json()
    } catch {
      // No JSON body
    }

    console.log('MercadoPago webhook received:', { topic, id, body })

    // Tipos de notificación que nos interesan
    // - preapproval: suscripción creada/actualizada
    // - authorized_payment: pago autorizado
    // - payment: pago realizado

    const notificationType = topic || body?.type
    const resourceId = id || body?.data?.id

    if (!notificationType || !resourceId) {
      console.log('Notification without type or id, acknowledging anyway')
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Obtener detalles de MercadoPago
    const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')

    if (!MP_ACCESS_TOKEN) {
      console.error('MERCADOPAGO_ACCESS_TOKEN not configured')
      return new Response(JSON.stringify({ error: 'Configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    let endpoint = ''
    if (notificationType === 'preapproval' || notificationType === 'subscription_preapproval') {
      endpoint = `https://api.mercadopago.com/preapproval/${resourceId}`
    } else if (notificationType === 'payment') {
      endpoint = `https://api.mercadopago.com/v1/payments/${resourceId}`
    } else if (notificationType === 'authorized_payment') {
      endpoint = `https://api.mercadopago.com/authorized_payments/${resourceId}`
    } else {
      console.log('Unknown notification type:', notificationType)
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Consultar a MercadoPago los detalles
    const mpResponse = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      }
    })

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text()
      console.error('MercadoPago API error:', errorText)
      return new Response(JSON.stringify({ error: 'MercadoPago API error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const mpData = await mpResponse.json()
    console.log('MercadoPago data:', mpData)

    // Extraer email del pagador
    const payerEmail = mpData.payer_email || mpData.payer?.email

    if (!payerEmail) {
      console.log('No payer email found in notification')
      return new Response(JSON.stringify({ received: true, no_email: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar usuario por email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', payerEmail)
      .single()

    if (profileError || !profile) {
      console.log('User not found for email:', payerEmail)
      // Guardamos la notificación para procesarla cuando el usuario se registre
      return new Response(JSON.stringify({ received: true, user_not_found: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Determinar el estado de la suscripción
    let subscriptionStatus = 'active'
    let plan = 'pro'

    if (notificationType === 'preapproval' || notificationType === 'subscription_preapproval') {
      // Estados de preapproval: authorized, paused, cancelled, pending
      if (mpData.status === 'authorized' || mpData.status === 'active') {
        subscriptionStatus = 'active'
      } else if (mpData.status === 'paused') {
        subscriptionStatus = 'past_due'
      } else if (mpData.status === 'cancelled') {
        subscriptionStatus = 'cancelled'
        plan = 'free'
      } else {
        subscriptionStatus = 'pending'
      }
    }

    // Actualizar suscripción del usuario
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: profile.id,
        plan: plan,
        status: subscriptionStatus,
        mp_subscription_id: resourceId,
        mp_payer_id: mpData.payer_id || mpData.payer?.id,
        current_period_start: mpData.date_created ? new Date(mpData.date_created) : new Date(),
        current_period_end: mpData.next_payment_date ? new Date(mpData.next_payment_date) : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Subscription updated for user:', profile.id, 'plan:', plan, 'status:', subscriptionStatus)

    return new Response(
      JSON.stringify({
        success: true,
        user_id: profile.id,
        plan: plan,
        status: subscriptionStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
