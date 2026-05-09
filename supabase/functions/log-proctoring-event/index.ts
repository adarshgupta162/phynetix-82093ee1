import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { session_id, event_type, payload } = await req.json();
    if (!session_id || !event_type) {
      throw new Error("session_id and event_type are required");
    }

    const { data, error } = await supabaseClient
      .from("proctoring_events")
      .insert({
        session_id,
        user_id: user.id,
        event_type,
        payload: payload || {},
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error("Failed to log event");
    }

    await supabaseClient
      .from("proctoring_sessions")
      .update({ last_event_at: new Date().toISOString() })
      .eq("id", session_id);

    return new Response(
      JSON.stringify({ event: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in log-proctoring-event:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
