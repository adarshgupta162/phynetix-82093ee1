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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .neq("role", "student")
      .maybeSingle();

    if (!roleRow) {
      throw new Error("Forbidden");
    }

    const { data: sessions, error } = await supabaseAdmin
      .from("proctoring_sessions")
      .select(`
        id,
        test_id,
        attempt_id,
        user_id,
        status,
        provider,
        camera_enabled,
        mic_enabled,
        screen_enabled,
        started_at,
        ended_at,
        last_event_at,
        tests(name),
        profiles:user_id(full_name, roll_number, avatar_url)
      `)
      .eq("status", "active")
      .order("started_at", { ascending: false });

    if (error) {
      throw new Error("Failed to fetch sessions");
    }

    return new Response(
      JSON.stringify({ sessions: sessions || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Error in list-proctoring-sessions:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
