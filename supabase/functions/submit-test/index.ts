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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { attempt_id, answers, time_taken_seconds } = await req.json();
    if (!attempt_id) {
      throw new Error("attempt_id is required");
    }

    console.log(`Submitting test attempt ${attempt_id} for user ${user.id}`);

    const { data: attempt, error: attemptError } = await supabaseClient
      .from("test_attempts")
      .select("id, test_id, user_id")
      .eq("id", attempt_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (attemptError || !attempt) {
      console.error("Attempt not found:", attemptError);
      throw new Error("Test attempt not found");
    }

    const { data: testQuestions, error: questionsError } = await supabaseAdmin
      .from("test_questions")
      .select(`question_id, questions(id, correct_answer, marks, negative_marks, chapters(name, courses(name)))`)
      .eq("test_id", attempt.test_id);

    if (questionsError) {
      console.error("Failed to fetch questions:", questionsError);
      throw new Error("Failed to calculate score");
    }

    let score = 0;
    let totalMarks = 0;
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;

    const questionResults: Record<string, any> = {};
    const subjectScores: Record<string, { correct: number; incorrect: number; skipped: number; total: number }> = {};

    for (const tq of testQuestions || []) {
      const q = tq.questions as any;
      if (!q) continue;

      const questionId = q.id;
      const correctAnswer = q.correct_answer;
      const marks = q.marks ?? 4;
      const negativeMarks = q.negative_marks ?? 1;
      const userAnswer = answers?.[questionId];
      const chapter = q.chapters as any;
      const course = chapter?.courses as any;
      const subject = course?.name ?? "General";
      const chapterName = chapter?.name ?? "General";

      totalMarks += marks;

      if (!subjectScores[subject]) {
        subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0 };
      }
      subjectScores[subject].total++;

      let isCorrect = false;
      let marksObtained = 0;

      if (userAnswer === undefined || userAnswer === null) {
        skipped++;
        subjectScores[subject].skipped++;
      } else if (String(userAnswer) === String(correctAnswer)) {
        correct++;
        score += marks;
        marksObtained = marks;
        isCorrect = true;
        subjectScores[subject].correct++;
      } else {
        incorrect++;
        score -= negativeMarks;
        marksObtained = -negativeMarks;
        subjectScores[subject].incorrect++;
      }

      questionResults[questionId] = {
        correct_answer: correctAnswer,
        user_answer: userAnswer ?? null,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
        subject,
        chapter: chapterName,
      };
    }

    const { error: updateError } = await supabaseClient
      .from("test_attempts")
      .update({
        answers,
        score,
        total_marks: totalMarks,
        time_taken_seconds,
        completed_at: new Date().toISOString(),
      })
      .eq("id", attempt_id);

    if (updateError) {
      console.error("Failed to update attempt:", updateError);
      throw new Error("Failed to save results");
    }

    const { data: allAttempts } = await supabaseAdmin
      .from("test_attempts")
      .select("score")
      .eq("test_id", attempt.test_id)
      .not("completed_at", "is", null);

    let percentile = 100;
    if (allAttempts && allAttempts.length > 1) {
      const scoresBelow = allAttempts.filter(a => (a.score ?? 0) < score).length;
      percentile = Math.round((scoresBelow / allAttempts.length) * 100 * 10) / 10;
    }

    console.log(`Test ${attempt_id} submitted. Score: ${score}/${totalMarks}, Percentile: ${percentile}`);

    return new Response(
      JSON.stringify({
        score,
        total_marks: totalMarks,
        correct,
        incorrect,
        skipped,
        percentile,
        question_results: questionResults,
        subject_scores: subjectScores,
        time_taken_seconds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in submit-test:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
