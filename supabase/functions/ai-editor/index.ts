// Supabase Edge Function: AI Editor con Kimi K2 (NVIDIA API)
// Esta función actúa como proxy para proteger la API key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIRequest {
  text: string
  promptName: string
  issues?: string[]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar autenticación
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar suscripción del usuario
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()

    const isPro = subscription?.plan === 'pro' && subscription?.status === 'active'

    // Parsear request
    const { text, promptName, issues }: AIRequest = await req.json()

    if (!text || !promptName) {
      return new Response(
        JSON.stringify({ error: 'Texto y nombre del prompt requeridos' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Obtener el prompt de la base de datos
    const { data: prompt, error: promptError } = await supabaseClient
      .from('ai_prompts')
      .select('*')
      .eq('name', promptName)
      .eq('is_active', true)
      .single()

    if (promptError || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt no encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verificar si es prompt Pro-only
    if (prompt.is_pro_only && !isPro) {
      return new Response(
        JSON.stringify({
          error: 'Esta función requiere plan Pro',
          requiresPro: true
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Preparar el prompt de usuario
    let userPrompt = prompt.user_prompt_template || '{{text}}'
    userPrompt = userPrompt.replace('{{text}}', text)

    if (issues && issues.length > 0) {
      const issuesText = issues.map(i => `- ${i}`).join('\n')
      userPrompt = userPrompt.replace('{{issues}}', issuesText)
    }

    // Llamar a NVIDIA API con Kimi K2
    const NVIDIA_API_KEY = Deno.env.get('NVIDIA_API_KEY')

    if (!NVIDIA_API_KEY) {
      console.error('NVIDIA_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Servicio AI no configurado' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const aiResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2-instruct-0905',
        messages: [
          {
            role: 'system',
            content: prompt.system_prompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: 4096,
        stream: false
      }),
    })

    if (!aiResponse.ok) {
      const errorData = await aiResponse.text()
      console.error('NVIDIA API error:', errorData)
      return new Response(
        JSON.stringify({ error: 'Error al procesar con AI' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const aiData = await aiResponse.json()
    const improvedText = aiData.choices?.[0]?.message?.content || ''

    // Registrar uso de AI
    const inputTokens = aiData.usage?.prompt_tokens || 0
    const outputTokens = aiData.usage?.completion_tokens || 0

    await supabaseClient
      .from('ai_usage')
      .insert({
        user_id: user.id,
        prompt_id: prompt.id,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      })

    return new Response(
      JSON.stringify({
        success: true,
        originalText: text,
        improvedText: improvedText.trim(),
        promptUsed: promptName,
        tokens: {
          input: inputTokens,
          output: outputTokens,
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
