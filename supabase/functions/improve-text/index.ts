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
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          {
            role: 'system',
            content: `Eres un experto en corrección y mejora de textos extraídos mediante OCR de documentos manuscritos y mecanografiados en español. 

Tu tarea es procesar y mejorar el texto proporcionado siguiendo estas instrucciones específicas:

CORRECCIÓN DE ERRORES OCR:
1. Identifica y corrige caracteres mal reconocidos (l/I/1, O/0, rn/m, etc.)
2. Une palabras que fueron fragmentadas incorrectamente
3. Separa palabras que fueron unidas por error
4. Corrige símbolos y caracteres especiales mal interpretados

MEJORA DE GRAMÁTICA Y ESTILO:
5. Corrige errores ortográficos y de acentuación
6. Mejora la puntuación para que el texto sea más legible
7. Ajusta espaciado entre palabras y párrafos
8. Normaliza el uso de mayúsculas y minúsculas

PRESERVACIÓN DEL CONTENIDO ORIGINAL:
9. Mantén EXACTAMENTE el significado y tono original
10. Conserva la estructura de párrafos y formato general
11. No agregues ni quites información, solo mejora la legibilidad
12. Respeta el estilo personal del autor (formal/informal)

FORMATO DE FECHAS Y DATOS:
13. Estandariza fechas al formato DD/MM/AAAA o "DD de Mes de AAAA"
14. Corrige números y datos importantes que puedan estar mal formateados

Devuelve únicamente el texto corregido y mejorado, sin explicaciones adicionales ni comentarios.`
          },
          {
            role: 'user',
            content: `Por favor, mejora este texto extraído por OCR manteniéndolo fiel al original:\n\n${text}`
          }
        ],
        max_completion_tokens: 2000
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