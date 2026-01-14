import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Target,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface QuestionData {
  questionNumber: number;
  timeSpent: number;
  subject: string;
  status: "correct" | "incorrect" | "skipped";
}

interface TimeAnalysisProps {
  questions: QuestionData[];
  totalTimeSeconds: number;
  hasTimeData: boolean;
}

const IDEAL_TIME_THRESHOLD = 90; // seconds per question
const EXCELLENT_EFFICIENCY = 80;
const AVERAGE_EFFICIENCY = 60;

export function TimeAnalysis({ questions, totalTimeSeconds, hasTimeData }: TimeAnalysisProps) {
  // Check if we have actual time data
  const hasActualTimeData = hasTimeData && questions.some(q => q.timeSpent > 0);

  // Calculate time efficiency
  const timeStats = useMemo(() => {
    const correctQuestions = questions.filter(q => q.status === "correct");
    const timeOnCorrect = correctQuestions.reduce((sum, q) => sum + q.timeSpent, 0);
    const totalTimeUsed = questions.reduce((sum, q) => sum + q.timeSpent, 0);
    
    const efficiency = totalTimeUsed > 0 ? (timeOnCorrect / totalTimeUsed) * 100 : 0;
    
    let verdict = "Poor";
    let verdictColor = "text-destructive";
    if (efficiency >= EXCELLENT_EFFICIENCY) {
      verdict = "Excellent";
      verdictColor = "text-success";
    } else if (efficiency >= AVERAGE_EFFICIENCY) {
      verdict = "Average";
      verdictColor = "text-warning";
    }
    
    return {
      efficiency: Math.round(efficiency),
      timeOnCorrect,
      totalTimeUsed,
      verdict,
      verdictColor,
    };
  }, [questions]);

  // Calculate time buckets
  const timeBuckets = useMemo(() => {
    const bucketSize = 30 * 60; // 30 minutes in seconds
    const numBuckets = Math.ceil(totalTimeSeconds / bucketSize);
    const buckets: { 
      range: string; 
      accuracy: number; 
      correct: number; 
      incorrect: number;
      total: number;
    }[] = [];
    
    let cumulativeTime = 0;
    let currentBucket = 0;
    const bucketData: Record<number, { correct: number; incorrect: number; total: number }> = {};
    
    // Initialize buckets
    for (let i = 0; i < numBuckets; i++) {
      bucketData[i] = { correct: 0, incorrect: 0, total: 0 };
    }
    
    // Assign questions to buckets based on cumulative time
    questions.forEach((q) => {
      if (q.status === "skipped") return;
      
      const questionEndTime = cumulativeTime + q.timeSpent;
      currentBucket = Math.floor(questionEndTime / bucketSize);
      
      if (currentBucket >= numBuckets) currentBucket = numBuckets - 1;
      
      if (bucketData[currentBucket]) {
        bucketData[currentBucket].total++;
        if (q.status === "correct") {
          bucketData[currentBucket].correct++;
        } else {
          bucketData[currentBucket].incorrect++;
        }
      }
      
      cumulativeTime = questionEndTime;
    });
    
    // Create bucket array
    for (let i = 0; i < numBuckets; i++) {
      const startMin = i * 30;
      const endMin = (i + 1) * 30;
      const data = bucketData[i];
      const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      
      buckets.push({
        range: `${startMin}–${endMin}`,
        accuracy,
        correct: data.correct,
        incorrect: data.incorrect,
        total: data.total,
      });
    }
    
    return buckets;
  }, [questions, totalTimeSeconds]);

  // Find worst performing bucket
  const worstBucket = useMemo(() => {
    const filtered = timeBuckets.filter(b => b.total > 0);
    if (filtered.length === 0) return null;
    
    return filtered.reduce((worst, current) => 
      current.accuracy < worst.accuracy ? current : worst
    );
  }, [timeBuckets]);

  // Subject-wise time allocation
  const subjectStats = useMemo(() => {
    const stats: Record<string, {
      timeSpent: number;
      correct: number;
      total: number;
      accuracy: number;
      idealTime: number;
      difference: number;
    }> = {};
    
    questions.forEach((q) => {
      if (!stats[q.subject]) {
        stats[q.subject] = {
          timeSpent: 0,
          correct: 0,
          total: 0,
          accuracy: 0,
          idealTime: 0,
        } as any;
      }
      
      stats[q.subject].timeSpent += q.timeSpent;
      stats[q.subject].total++;
      if (q.status === "correct") {
        stats[q.subject].correct++;
      }
    });
    
    // Calculate ideal time (proportional to questions) and accuracy
    const totalQuestions = questions.length;
    Object.keys(stats).forEach((subject) => {
      const s = stats[subject];
      s.accuracy = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
      s.idealTime = (s.total / totalQuestions) * totalTimeSeconds;
      s.difference = s.timeSpent - s.idealTime;
    });
    
    return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
  }, [questions, totalTimeSeconds]);

  // Speed trap detection
  const speedTraps = useMemo(() => {
    const slowQuestions = questions.filter(q => q.timeSpent > IDEAL_TIME_THRESHOLD);
    const fastQuestions = questions.filter(q => q.timeSpent <= IDEAL_TIME_THRESHOLD && q.timeSpent > 0);
    
    const slowCorrect = slowQuestions.filter(q => q.status === "correct").length;
    const slowAccuracy = slowQuestions.length > 0 ? Math.round((slowCorrect / slowQuestions.length) * 100) : 0;
    
    const fastCorrect = fastQuestions.filter(q => q.status === "correct").length;
    const fastAccuracy = fastQuestions.length > 0 ? Math.round((fastCorrect / fastQuestions.length) * 100) : 0;
    
    return {
      slowCount: slowQuestions.length,
      slowAccuracy,
      fastAccuracy,
      impactSignificant: slowAccuracy < fastAccuracy - 15,
    };
  }, [questions]);

  // Generate actionable strategy
  const strategy = useMemo(() => {
    const rules: string[] = [];
    
    // Rule 1: Time per question based on speed traps
    if (speedTraps.impactSignificant) {
      rules.push(`Limit time per question to ${IDEAL_TIME_THRESHOLD} seconds. Questions taking longer reduce accuracy.`);
    } else {
      const avgTimePerQ = Math.round(totalTimeSeconds / questions.length);
      rules.push(`Aim for ${avgTimePerQ} seconds per question on average.`);
    }
    
    // Rule 2: When to skip
    if (speedTraps.slowCount > questions.length * 0.2) {
      rules.push(`Skip questions that take more than 2 minutes. You spent too long on ${speedTraps.slowCount} questions.`);
    } else {
      rules.push("Mark questions for review if you can't solve them in 90 seconds.");
    }
    
    // Rule 3: Subject time management
    const overInvested = subjectStats.filter(s => s.difference > s.idealTime * 0.2);
    const underInvested = subjectStats.filter(s => s.difference < -s.idealTime * 0.2);
    
    if (overInvested.length > 0) {
      const subject = overInvested[0];
      const reduceBy = Math.round(subject.difference / 60);
      rules.push(`Reduce ${subject.name} time by ${reduceBy} min. You're over-investing with ${subject.accuracy}% accuracy.`);
    } else if (underInvested.length > 0) {
      const subject = underInvested[0];
      if (subject.accuracy < 70) {
        const increaseBy = Math.round(Math.abs(subject.difference) / 60);
        rules.push(`Increase ${subject.name} time by ${increaseBy} min to improve accuracy (currently ${subject.accuracy}%).`);
      }
    }
    
    // Rule 4: Time bucket insight
    if (worstBucket && worstBucket.accuracy < 60) {
      rules.push(`Stay alert during ${worstBucket.range} min mark. Your accuracy dropped to ${worstBucket.accuracy}% in this period.`);
    }
    
    // Rule 5: Efficiency boost
    if (timeStats.efficiency < AVERAGE_EFFICIENCY) {
      rules.push("Focus on questions you can solve quickly. You're spending too much time on wrong answers.");
    } else if (timeStats.efficiency >= EXCELLENT_EFFICIENCY) {
      rules.push("Your time efficiency is excellent. Maintain this balance between speed and accuracy.");
    }
    
    return rules.slice(0, 5); // Max 5 rules
  }, [speedTraps, subjectStats, worstBucket, timeStats, totalTimeSeconds, questions]);

  if (!hasActualTimeData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-12 text-center"
      >
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Time Tracking Not Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Time tracking data is not available for this attempt. This feature was added after your attempt.
          Future attempts will show detailed time analysis.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Time Efficiency Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-bold font-display mb-6">Time Efficiency Summary</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mb-2">
              <Clock className="w-8 h-8 mx-auto text-primary" />
            </div>
            <div className="text-4xl font-bold mb-1">{timeStats.efficiency}%</div>
            <div className="text-sm text-muted-foreground">Overall Time Efficiency</div>
            <div className="text-xs text-muted-foreground mt-2">
              Time on correct ÷ Total time
            </div>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <Target className="w-8 h-8 mx-auto text-muted-foreground" />
            </div>
            <div className={cn("text-4xl font-bold mb-1", timeStats.verdictColor)}>
              {timeStats.verdict}
            </div>
            <div className="text-sm text-muted-foreground">Performance Verdict</div>
            <div className="text-xs text-muted-foreground mt-2">
              Benchmark: ≥80% = Excellent
            </div>
          </div>
          
          <div className="text-center">
            <div className="mb-2">
              <Zap className="w-8 h-8 mx-auto text-warning" />
            </div>
            <div className="text-4xl font-bold mb-1">
              {Math.round(timeStats.timeOnCorrect / 60)}m
            </div>
            <div className="text-sm text-muted-foreground">Time on Correct</div>
            <div className="text-xs text-muted-foreground mt-2">
              Out of {Math.round(timeStats.totalTimeUsed / 60)}m total
            </div>
          </div>
        </div>
      </motion.div>

      {/* Section 2: Time Buckets vs Accuracy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-bold font-display mb-2">Time Buckets vs Accuracy</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Your performance across different time intervals during the test
        </p>
        
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 50%, 18%)" opacity={0.5} />
              <XAxis
                dataKey="range"
                tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(224, 50%, 18%)" }}
              />
              <YAxis
                tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(224, 50%, 18%)" }}
                label={{ value: "Accuracy %", angle: -90, position: "insideLeft", fill: "hsl(215, 20%, 65%)" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(224, 71%, 4%)",
                  border: "1px solid hsl(224, 50%, 18%)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(213, 31%, 91%)" }}
              />
              <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                {timeBuckets.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry === worstBucket ? "hsl(0, 84%, 60%)" : "hsl(217, 91%, 60%)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {worstBucket && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <div className="font-semibold text-destructive mb-1">Worst Performance Block</div>
                <div className="text-sm text-muted-foreground">
                  Your accuracy dropped to <span className="font-semibold text-foreground">{worstBucket.accuracy}%</span> during the{" "}
                  <span className="font-semibold text-foreground">{worstBucket.range} minute</span> period.
                  You got {worstBucket.correct} correct and {worstBucket.incorrect} incorrect in this time block.
                  {worstBucket.accuracy < 50 && " This significantly impacted your overall score."}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Section 3: Subject-wise Time Misallocation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-bold font-display mb-2">Subject-wise Time Allocation</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Compare your time investment vs ideal time distribution
        </p>
        
        <div className="space-y-4">
          {subjectStats.map((subject) => {
            const isOverInvested = subject.difference > subject.idealTime * 0.2;
            const isUnderInvested = subject.difference < -subject.idealTime * 0.2;
            const minutesSpent = Math.round(subject.timeSpent / 60);
            const idealMinutes = Math.round(subject.idealTime / 60);
            
            return (
              <div key={subject.name} className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{subject.name}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      {subject.total} questions • {subject.accuracy}% accuracy
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{minutesSpent}m</div>
                    <div className="text-xs text-muted-foreground">vs {idealMinutes}m ideal</div>
                  </div>
                </div>
                
                {/* Time bar comparison */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-20 text-muted-foreground">Your time:</div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, (subject.timeSpent / totalTimeSeconds) * 100)}%` }}
                      />
                    </div>
                    <div className="w-16 text-right">{minutesSpent}m</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-20 text-muted-foreground">Ideal time:</div>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-success/50 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (subject.idealTime / totalTimeSeconds) * 100)}%` }}
                      />
                    </div>
                    <div className="w-16 text-right">{idealMinutes}m</div>
                  </div>
                </div>
                
                {/* Recommendation */}
                {isOverInvested && (
                  <div className="mt-3 flex items-start gap-2 text-sm bg-warning/10 border border-warning/20 rounded p-2">
                    <TrendingDown className="w-4 h-4 text-warning mt-0.5" />
                    <div>
                      <span className="font-medium text-warning">Over-invested:</span>{" "}
                      <span className="text-muted-foreground">
                        Reduce time by {Math.round(Math.abs(subject.difference) / 60)}m. 
                        You're spending too much for {subject.accuracy}% accuracy.
                      </span>
                    </div>
                  </div>
                )}
                {isUnderInvested && subject.accuracy < 70 && (
                  <div className="mt-3 flex items-start gap-2 text-sm bg-success/10 border border-success/20 rounded p-2">
                    <TrendingUp className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <span className="font-medium text-success">Under-invested:</span>{" "}
                      <span className="text-muted-foreground">
                        Increase time by {Math.round(Math.abs(subject.difference) / 60)}m to improve accuracy.
                      </span>
                    </div>
                  </div>
                )}
                {!isOverInvested && !isUnderInvested && (
                  <div className="mt-3 flex items-start gap-2 text-sm bg-success/10 border border-success/20 rounded p-2">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5" />
                    <div className="text-muted-foreground">
                      <span className="font-medium text-success">Optimal allocation:</span> Time investment matches question distribution.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Section 4: Speed Trap Detection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-bold font-display mb-2">Speed Trap Detection</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Analysis of questions where you spent more than {IDEAL_TIME_THRESHOLD} seconds
        </p>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="text-3xl font-bold mb-2">{speedTraps.slowCount}</div>
            <div className="text-sm text-muted-foreground">Slow Questions</div>
            <div className="text-xs text-muted-foreground mt-1">
              (&gt; {IDEAL_TIME_THRESHOLD}s each)
            </div>
          </div>
          
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="text-3xl font-bold mb-2">{speedTraps.slowAccuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy on Slow</div>
            <div className="text-xs text-muted-foreground mt-1">
              {speedTraps.slowCount} questions
            </div>
          </div>
          
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="text-3xl font-bold mb-2">{speedTraps.fastAccuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy on Fast</div>
            <div className="text-xs text-muted-foreground mt-1">
              Quick attempts
            </div>
          </div>
        </div>
        
        {speedTraps.impactSignificant && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <div className="font-semibold text-destructive mb-1">Significant Impact Detected</div>
                <div className="text-sm text-muted-foreground">
                  Your accuracy on slow attempts ({speedTraps.slowAccuracy}%) is significantly lower than fast attempts ({speedTraps.fastAccuracy}%).
                  Spending too much time on difficult questions is reducing your overall score.{" "}
                  <span className="font-semibold text-foreground">
                    Skip questions that take more than 2 minutes and come back later if time permits.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {!speedTraps.impactSignificant && speedTraps.slowCount > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm text-muted-foreground">
                Your accuracy on slow attempts is comparable to fast attempts. You're managing time well,
                but consider if you can reduce time on difficult questions to attempt more questions overall.
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Section 5: Actionable Strategy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-6"
      >
        <h2 className="text-2xl font-bold font-display mb-2">Actionable Strategy for Next Test</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Clear rules to improve your time management
        </p>
        
        <div className="space-y-3">
          {strategy.map((rule, index) => (
            <div key={index} className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{index + 1}</span>
              </div>
              <div className="text-sm leading-relaxed">{rule}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
