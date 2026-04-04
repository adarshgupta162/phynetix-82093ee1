import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const indexToLetter = (index: any): string => {
  const num = parseInt(String(index));
  if (!isNaN(num) && num >= 0 && num <= 25) {
    return String.fromCharCode(65 + num);
  }
  return String(index).toUpperCase();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Find all uncompleted attempts where time has expired
    // Join with tests to get duration_minutes, then check if started_at + duration has passed
    const { data: expiredAttempts, error: fetchError } = await supabaseAdmin
      .from("test_attempts")
      .select("id, test_id, user_id, started_at, answers, time_per_question")
      .is("completed_at", null)
      .eq("awaiting_result", false);

    if (fetchError) {
      console.error("[auto-submit] Failed to fetch attempts:", fetchError);
      throw new Error("Failed to fetch attempts");
    }

    if (!expiredAttempts || expiredAttempts.length === 0) {
      console.log("[auto-submit] No uncompleted attempts found");
      return new Response(JSON.stringify({ submitted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique test IDs
    const testIds = [...new Set(expiredAttempts.map((a) => a.test_id))];
    const { data: tests } = await supabaseAdmin
      .from("tests")
      .select("id, duration_minutes, test_type, exam_type")
      .in("id", testIds);

    const testMap = new Map((tests || []).map((t) => [t.id, t]));

    let submittedCount = 0;

    for (const attempt of expiredAttempts) {
      const test = testMap.get(attempt.test_id);
      if (!test) continue;

      const startedAt = new Date(attempt.started_at).getTime();
      const expiresAt = startedAt + test.duration_minutes * 60 * 1000;
      const now = Date.now();

      // Add 30s grace period
      if (now < expiresAt + 30000) continue;

      console.log(`[auto-submit] Auto-submitting attempt=${attempt.id} test=${attempt.test_id} user=${attempt.user_id}`);

      const answers = (attempt.answers as Record<string, any>) || {};
      const timeTakenSeconds = test.duration_minutes * 60;

      // Grade the test
      let score = 0;
      let totalMarks = 0;

      // Try section-based grading first
      const { data: sectionQuestions } = await supabaseAdmin
        .from("test_section_questions")
        .select(`
          id, question_number, correct_answer, marks, negative_marks, is_bonus,
          test_sections!inner (
            section_type, name,
            test_subjects!inner (name)
          )
        `)
        .eq("test_id", attempt.test_id)
        .order("question_number");

      if (sectionQuestions && sectionQuestions.length > 0) {
        for (const q of sectionQuestions) {
          const qId = q.id as string;
          const correctAnswer = (q as any).correct_answer;
          const marks = (q as any).marks ?? 4;
          const negativeMarks = (q as any).negative_marks ?? 1;
          const isBonus = (q as any).is_bonus ?? false;
          const userAnswer = answers[qId];
          const sectionType = (q as any).test_sections?.section_type || "single_choice";

          totalMarks += marks;

          if (isBonus) {
            score += marks;
            continue;
          }

          if (userAnswer === undefined || userAnswer === null || userAnswer === "") {
            continue; // skipped, 0 marks
          }

          if (sectionType === "multiple_choice") {
            const correctArr = (Array.isArray(correctAnswer) ? [...correctAnswer] : [correctAnswer])
              .map((a: any) => String(a).toUpperCase()).sort();
            const userArr = (Array.isArray(userAnswer) ? [...userAnswer] : [userAnswer])
              .map((a: any) => indexToLetter(a)).sort();

            const correctSet = new Set(correctArr);
            const userSet = new Set(userArr);
            const correctCount = [...userSet].filter((a) => correctSet.has(a)).length;
            const wrongCount = [...userSet].filter((a) => !correctSet.has(a)).length;
            const totalCorrect = correctArr.length;

            if (wrongCount > 0) {
              score -= 2;
            } else if (correctCount === totalCorrect) {
              score += marks;
            } else if (correctCount === totalCorrect - 1 && totalCorrect >= 4) {
              score += 3;
            } else if (correctCount === 2 && totalCorrect >= 3) {
              score += 2;
            } else if (correctCount === 1 && totalCorrect >= 2) {
              score += 1;
            } else {
              score -= 2;
            }
          } else if (sectionType === "integer") {
            const correctNum = parseFloat(String(correctAnswer));
            const userNum = parseFloat(String(userAnswer));
            if (!isNaN(correctNum) && !isNaN(userNum) && Math.abs(correctNum - userNum) < 0.01) {
              score += marks;
            } else {
              score -= negativeMarks;
            }
          } else {
            // single choice
            const userLetter = indexToLetter(userAnswer);
            const correctLetter = String(correctAnswer).toUpperCase();
            if (userLetter === correctLetter) {
              score += marks;
            } else {
              score -= negativeMarks;
            }
          }
        }
      } else {
        // Regular test_questions grading
        const { data: testQuestions } = await supabaseAdmin
          .from("test_questions")
          .select("questions(id, correct_answer, marks, negative_marks)")
          .eq("test_id", attempt.test_id);

        for (const tq of testQuestions || []) {
          const q = (tq as any).questions;
          if (!q) continue;
          const marks = q.marks ?? 4;
          const negativeMarks = q.negative_marks ?? 1;
          totalMarks += marks;
          const userAnswer = answers[q.id];
          if (userAnswer === undefined || userAnswer === null || userAnswer === "") continue;
          if (String(userAnswer) === String(q.correct_answer)) {
            score += marks;
          } else {
            score -= negativeMarks;
          }
        }
      }

      // Calculate rank
      const { data: allAttempts } = await supabaseAdmin
        .from("test_attempts")
        .select("id, score")
        .eq("test_id", attempt.test_id)
        .not("completed_at", "is", null)
        .order("score", { ascending: false });

      const scoresWithCurrent = [...(allAttempts || []).map((a) => a.score ?? 0), score].sort((a, b) => b - a);
      const rank = scoresWithCurrent.indexOf(score) + 1;
      const scoresBelow = scoresWithCurrent.filter((s) => s < score).length;
      const percentile = scoresWithCurrent.length > 0
        ? Math.round((scoresBelow / scoresWithCurrent.length) * 100 * 10) / 10
        : 100;

      // Update the attempt
      const { error: updateError } = await supabaseAdmin
        .from("test_attempts")
        .update({
          score,
          total_marks: totalMarks,
          time_taken_seconds: timeTakenSeconds,
          completed_at: new Date().toISOString(),
          rank,
          percentile,
        })
        .eq("id", attempt.id);

      if (updateError) {
        console.error(`[auto-submit] Failed to update attempt ${attempt.id}:`, updateError);
        continue;
      }

      // Update ranks for all attempts of this test
      if (allAttempts && allAttempts.length > 0) {
        const updatedAttempts = [...allAttempts, { id: attempt.id, score }]
          .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        for (let i = 0; i < updatedAttempts.length; i++) {
          const newRank = i + 1;
          const newPercentile = Math.round(((updatedAttempts.length - newRank) / updatedAttempts.length) * 100 * 10) / 10;
          await supabaseAdmin
            .from("test_attempts")
            .update({ rank: newRank, percentile: newPercentile })
            .eq("id", updatedAttempts[i].id);
        }
      }

      submittedCount++;
      console.log(`[auto-submit] Successfully submitted attempt=${attempt.id} score=${score}/${totalMarks}`);
    }

    console.log(`[auto-submit] Total auto-submitted: ${submittedCount}`);

    return new Response(JSON.stringify({ submitted: submittedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[auto-submit] Error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
