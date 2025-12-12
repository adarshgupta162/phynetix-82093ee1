import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { test_id } = await req.json();

    if (!test_id) {
      throw new Error("test_id is required");
    }

    console.log(`Recalculating scores for test: ${test_id}`);

    // Get test info
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select("exam_type")
      .eq("id", test_id)
      .single();

    if (testError) throw testError;

    // Get all questions for this test (including is_bonus)
    const { data: questions, error: questionsError } = await supabase
      .from("test_section_questions")
      .select(`
        id,
        correct_answer,
        marks,
        negative_marks,
        is_bonus,
        section:test_sections(section_type)
      `)
      .eq("test_id", test_id);

    if (questionsError) throw questionsError;

    const questionMap = new Map(questions?.map(q => [q.id, q]) || []);

    // Get all attempts for this test
    const { data: attempts, error: attemptsError } = await supabase
      .from("test_attempts")
      .select("id, answers")
      .eq("test_id", test_id)
      .not("completed_at", "is", null);

    if (attemptsError) throw attemptsError;

    console.log(`Found ${attempts?.length || 0} completed attempts to recalculate`);

    const updatedAttempts: { id: string; score: number; total_marks: number }[] = [];

    for (const attempt of attempts || []) {
      const answers = (attempt.answers as Record<string, any>) || {};
      let score = 0;
      let totalMarks = 0;
      let correct = 0;
      let incorrect = 0;

      // Process all questions (including unanswered ones)
      for (const [questionId, question] of questionMap) {
        const marks = question.marks || 4;
        const negativeMarks = question.negative_marks || 1;
        const correctAnswer = question.correct_answer;
        const sectionType = (question.section as any)?.section_type || "single_choice";
        const isBonus = question.is_bonus || false;
        const userAnswer = answers[questionId];

        totalMarks += marks;

        // Bonus question - everyone gets full marks
        if (isBonus) {
          score += marks;
          correct++;
          continue;
        }

        // Skip if no answer
        if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0) || userAnswer === '') {
          continue;
        }

        let isCorrect = false;

        if (sectionType === "integer") {
          const correctNum = parseFloat(String(correctAnswer));
          const userNum = parseFloat(String(userAnswer));
          isCorrect = !isNaN(correctNum) && !isNaN(userNum) && Math.abs(correctNum - userNum) < 0.01;
          
          if (isCorrect) {
            score += marks;
            correct++;
          } else {
            // JEE Mains integer has negative marking
            score -= negativeMarks;
            incorrect++;
          }
          continue;
        } else if (sectionType === "multiple_choice") {
          const userAnswers = Array.isArray(userAnswer) ? [...userAnswer].sort() : [userAnswer];
          const correctAnswers = Array.isArray(correctAnswer) ? [...correctAnswer].sort() : [correctAnswer];
          
          if (test?.exam_type === "jee_advanced") {
            // Partial marking for JEE Advanced
            const correctSet = new Set(correctAnswers);
            const correctCount = userAnswers.filter(a => correctSet.has(a)).length;
            const wrongCount = userAnswers.filter(a => !correctSet.has(a)).length;
            
            if (wrongCount === 0 && correctCount === correctAnswers.length) {
              score += marks;
              correct++;
            } else if (wrongCount === 0 && correctCount > 0) {
              score += Math.floor(marks * correctCount / correctAnswers.length);
              correct++;
            } else {
              score -= 2;
              incorrect++;
            }
            continue;
          } else {
            isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
          }
        } else {
          isCorrect = userAnswer === correctAnswer;
        }

        if (isCorrect) {
          score += marks;
          correct++;
        } else {
          score -= negativeMarks;
          incorrect++;
        }
      }

      updatedAttempts.push({ id: attempt.id, score, total_marks: totalMarks });
    }

    // Update all attempts
    for (const update of updatedAttempts) {
      await supabase
        .from("test_attempts")
        .update({ score: update.score, total_marks: update.total_marks })
        .eq("id", update.id);
    }

    // Recalculate ranks and percentiles
    const sortedAttempts = updatedAttempts.sort((a, b) => b.score - a.score);
    for (let i = 0; i < sortedAttempts.length; i++) {
      const rank = i + 1;
      const percentile = Math.round(((sortedAttempts.length - rank) / sortedAttempts.length) * 100);
      
      await supabase
        .from("test_attempts")
        .update({ rank, percentile })
        .eq("id", sortedAttempts[i].id);
    }

    console.log(`Successfully recalculated ${updatedAttempts.length} attempts`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Recalculated ${updatedAttempts.length} attempts`,
        attempts_updated: updatedAttempts.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error recalculating scores:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
