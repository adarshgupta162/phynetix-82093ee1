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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { test_id } = await req.json();
    if (!test_id) {
      throw new Error("test_id is required");
    }

    console.log(`Starting test ${test_id} for user ${user.id}`);

    // Check if user has already attempted this test
    const { data: existingAttempt, error: existingError } = await supabaseClient
      .from("test_attempts")
      .select("id, completed_at")
      .eq("test_id", test_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingAttempt) {
      console.log(`User ${user.id} already attempted test ${test_id}`);
      throw new Error("You have already attempted this test. Each test can only be attempted once.");
    }

    const { data: test, error: testError } = await supabaseClient
      .from("tests")
      .select("id, name, duration_minutes, is_published")
      .eq("id", test_id)
      .eq("is_published", true)
      .maybeSingle();

    if (testError || !test) {
      console.error("Test not found:", testError);
      throw new Error("Test not found or not published");
    }

    const { data: attempt, error: attemptError } = await supabaseClient
      .from("test_attempts")
      .insert({
        test_id: test_id,
        user_id: user.id,
        started_at: new Date().toISOString(),
        answers: {},
      })
      .select()
      .single();

    if (attemptError) {
      console.error("Failed to create attempt:", attemptError);
      throw new Error("Failed to start test");
    }

    console.log(`Created attempt ${attempt.id} for test ${test_id}`);

    return new Response(
      JSON.stringify({
        attempt_id: attempt.id,
        test_name: test.name,
        duration_minutes: test.duration_minutes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in start-test:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
