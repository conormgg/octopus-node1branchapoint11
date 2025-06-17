
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = 'https://igzgxtjkaaabziccoofe.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { participantId, studentName, reason = 'page_unload' } = await req.json();
    
    console.log(`[BeaconInactive] Marking participant ${participantId} (${studentName}) as inactive - reason: ${reason}`);

    if (!participantId) {
      return new Response(
        JSON.stringify({ error: 'Missing participantId' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client for reliable database updates
    const supabase = createClient(supabaseUrl, supabaseServiceKey!);

    const { data, error } = await supabase
      .from('session_participants')
      .update({ 
        joined_at: null,
        last_ping_at: null 
      })
      .eq('id', participantId)
      .select();

    if (error) {
      console.error(`[BeaconInactive] Error marking participant ${participantId} inactive:`, error);
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[BeaconInactive] Successfully marked participant ${participantId} as inactive:`, data);
    
    return new Response(
      JSON.stringify({ success: true, participantId, reason }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BeaconInactive] Exception:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
