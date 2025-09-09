import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FileUploadPayload {
  entrada_id: string;
  file_url: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const auth = req.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Missing or invalid token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Create authenticated Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: auth } },
    });

    // Verify user authentication
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid user' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('Authenticated user for file upload:', user.id);

    const { entrada_id, file_url }: FileUploadPayload = await req.json();

    console.log('Processing file upload automation for entrada:', entrada_id);
    console.log('File URL:', file_url);

    // Verify the entrada belongs to the authenticated user (security check)
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