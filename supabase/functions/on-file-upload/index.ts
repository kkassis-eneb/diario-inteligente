import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = 'https://kvqvixtwfymtyehwvaet.supabase.co'
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

interface FileUploadPayload {
  entrada_id: string;
  file_url: string;
}

Deno.serve(async (req) => {
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

    const { entrada_id, file_url }: FileUploadPayload = await req.json();

    // Validate input
    if (!entrada_id || !file_url) {
      return new Response(
        JSON.stringify({ error: 'Invalid input - entrada_id and file_url are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Processing file upload automation for entrada:', entrada_id);
    console.log('File URL:', file_url);
    console.log('User ID:', user.id);

    // Verify that the entrada belongs to the authenticated user
    const { data: entrada, error: entradaError } = await supabaseClient
      .from('entradas')
      .select('id, user_id')
      .eq('id', entrada_id)
      .eq('user_id', user.id)
      .single();

    if (entradaError || !entrada) {
      return new Response(
        JSON.stringify({ error: 'Entrada not found or access denied' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      );
    }

    // For now, just log the automation trigger
    // Future implementations will include:
    // - OCR text extraction
    // - Emotion analysis 
    // - Location extraction
    // - Update entrada record with analysis results

    console.log('File upload automation triggered successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'File upload automation triggered',
        entrada_id,
        file_url 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in file upload automation:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});