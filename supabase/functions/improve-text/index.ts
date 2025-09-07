import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      throw new Error('Text is required');
    }

    console.log('Improving text with OpenAI:', text.substring(0, 100) + '...');

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