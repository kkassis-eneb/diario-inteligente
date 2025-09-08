import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = 'https://kvqvixtwfymtyehwvaet.supabase.co';
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify JWT authorization
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Missing or invalid authorization header' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401 
      }
    );
  }

  try {
    // Create Supabase client with user's JWT for RLS
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
      global: { headers: { Authorization: auth } },
    });

    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid user token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      throw new Error('Text is required');
    }

    console.log('Improving text with OpenAI for user:', user.id, 'Text preview:', text.substring(0, 100) + '...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente especializado en mejorar textos extraídos por OCR de escritura manuscrita en español. Tu tarea es:

1. Corregir errores ortográficos y gramaticales
2. Mejorar la puntuación y formato
3. Mantener el significado y tono original
4. Estructurar el texto de manera clara y legible
5. Conservar todas las ideas y contenido original

Reglas importantes:
- NO agregues contenido nuevo que no esté en el texto original
- NO cambies el sentido o significado del texto
- NO elimines información importante
- Mantén el estilo personal del autor
- Si el texto contiene fechas, nombres o datos específicos, manténlos exactos
- Corrige solo errores evidentes de OCR (letras mal reconocidas, palabras cortadas, etc.)

Devuelve únicamente el texto mejorado, sin explicaciones adicionales.`
          },
          {
            role: 'user',
            content: `Por favor, mejora este texto extraído por OCR manteniéndolo fiel al original:\n\n${text}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const improvedText = data.choices[0]?.message?.content;

    if (!improvedText) {
      throw new Error('No improved text returned from OpenAI');
    }

    console.log('Text improved successfully');

    return new Response(JSON.stringify({ improvedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in improve-text function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});