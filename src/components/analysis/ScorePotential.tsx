import { motion } from "framer-motion";
import { TrendingUp, AlertCircle, Target, Zap, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
} from "recharts";

interface SubjectPotential {
  name: string;
  currentScore: number;
  incorrectMarks: number;
  unattemptedDoable: number;
  potentialGain: number;
  color: string;
}

interface ErrorTypeData {
  type: string;
  marksLost: number;
  percentage: number;
  color: string;
}

interface ScorePotentialProps {
  currentScore: number;
  totalMarks: number;
  positiveScore: number;
  marksLost: number;
  subjects: {
    name: string;
    score: number;
    total: number;
    marksObtained: number;
    negativeMarks: number;
    unattempted: number;
    totalQuestions: number;
    correct: number;
    incorrect: number;
    color: string;
  }[];
  questions: {
    questionNumber: number;
    timeSpent: number;
    subject: string;
    status: "correct" | "incorrect" | "skipped";
  }[];
}

export function ScorePotential({
  currentScore,
  totalMarks,
  positiveScore,
  marksLost,
  subjects,
  questions,
}: ScorePotentialProps) {
  // Calculate potential scores for different error reduction scenarios
  const calculateScenarios = () => {
    const incorrectQuestions = questions.filter((q) => q.status === "incorrect");
    
    // Guard against division by zero
    if (incorrectQuestions.length === 0) {
      return [
        { label: "Current Score", score: currentScore, gain: 0, realistic: false },
      ];
    }
    
    const marksPerIncorrect = marksLost / incorrectQuestions.length || 1;
    // Gain per fixed error = negative removed + positive gained (assuming 4 marks positive, 1 negative)
    const gainMultiplier = 1.33; // Approximate gain when fixing an error: 4 marks + 1 negative mark removed = 5.33 / 4 = 1.33x
    
    const calculateGain = (reductionPercent: number): number => {
      return Math.round(marksPerIncorrect * incorrectQuestions.length * reductionPercent * gainMultiplier);
    };
    
    return [
      {
        label: "Current Score",
        score: currentScore,
        gain: 0,
        realistic: false,
      },
      {
        label: "25% Fewer Errors",
        score: currentScore + calculateGain(0.25),
        gain: calculateGain(0.25),
        realistic: true,
      },
      {
        label: "50% Fewer Errors",
        score: currentScore + calculateGain(0.5),
        gain: calculateGain(0.5),
        realistic: true,
      },
      {
        label: "75% Fewer Errors",
        score: currentScore + calculateGain(0.75),
        gain: calculateGain(0.75),
        realistic: false,
      },
      {
        label: "100% Fewer Errors",
        score: currentScore + calculateGain(1.0),
        gain: calculateGain(1.0),
        realistic: false,
      },
    ];
  };

  const scenarios = calculateScenarios();
  const maxPotentialScore = scenarios[scenarios.length - 1].score;
  const maxGain = maxPotentialScore - currentScore;

  // Calculate subject-wise potential
  const calculateSubjectPotential = (): SubjectPotential[] => {
    return subjects.map((subject) => {
      // Marks lost to incorrect answers (negative marks)
      const incorrectMarks = subject.negativeMarks;
      
      // Potential marks from incorrect (if fixed): negative removed + positive gained
      const incorrectPotential = subject.incorrect * 4 + incorrectMarks;
      
      // Assuming 50% of unattempted are doable
      const doableUnattempted = Math.floor(subject.unattempted * 0.5);
      const unattemptedPotential = doableUnattempted * 4;
      
      return {
        name: subject.name,
        currentScore: subject.score,
        incorrectMarks,
        unattemptedDoable: doableUnattempted,
        potentialGain: incorrectPotential + unattemptedPotential,
        color: subject.color,
      };
    });
  };

  const subjectPotentials = calculateSubjectPotential();
  const bestSubject = subjectPotentials.reduce((max, curr) =>
    curr.potentialGain > max.potentialGain ? curr : max
  );

  // Classify errors by type (simplified heuristic)
  const calculateErrorTypes = (): ErrorTypeData[] => {
    const incorrectQuestions = questions.filter((q) => q.status === "incorrect");
    const total = incorrectQuestions.length;
    
    if (total === 0) {
      return [
        { type: "Conceptual Errors", marksLost: 0, percentage: 0, color: "hsl(217, 91%, 60%)" },
        { type: "Calculation Mistakes", marksLost: 0, percentage: 0, color: "hsl(142, 76%, 45%)" },
        { type: "Silly Mistakes", marksLost: 0, percentage: 0, color: "hsl(45, 93%, 50%)" },
      ];
    }

    // Heuristic: Questions with high time spent are likely conceptual
    // Medium time are calculation errors, low time are silly mistakes
    const avgTime = incorrectQuestions.reduce((sum, q) => sum + q.timeSpent, 0) / total;
    
    let conceptual = 0;
    let calculation = 0;
    let silly = 0;
    
    incorrectQuestions.forEach((q) => {
      if (q.timeSpent > avgTime * 1.2) {
        conceptual++;
      } else if (q.timeSpent > avgTime * 0.5) {
        calculation++;
      } else {
        silly++;
      }
    });

    const marksPerError = marksLost / total;
    
    return [
      {
        type: "Conceptual Errors",
        marksLost: Math.round(conceptual * marksPerError),
        percentage: Math.round((conceptual / total) * 100),
        color: "hsl(217, 91%, 60%)",
      },
      {
        type: "Calculation Mistakes",
        marksLost: Math.round(calculation * marksPerError),
        percentage: Math.round((calculation / total) * 100),
        color: "hsl(142, 76%, 45%)",
      },
      {
        type: "Silly Mistakes",
        marksLost: Math.round(silly * marksPerError),
        percentage: Math.round((silly / total) * 100),
        color: "hsl(45, 93%, 50%)",
      },
    ].filter((e) => e.marksLost > 0);
  };

  const errorTypes = calculateErrorTypes();
  const topErrorType = errorTypes.length > 0 
    ? errorTypes.reduce((max, curr) => (curr.marksLost > max.marksLost ? curr : max))
    : null;

  // Generate actionable strategies
  const generateStrategies = (): string[] => {
    const strategies: string[] = [];
    
    if (topErrorType && topErrorType.marksLost > 0) {
      strategies.push(
        `Focus on reducing ${topErrorType.type.toLowerCase()} first (+${Math.round(topErrorType.marksLost * 1.33)} marks potential)`
      );
    }
    
    if (bestSubject && bestSubject.potentialGain > 15) {
      strategies.push(`${bestSubject.name} offers fastest score improvement`);
    }
    
    const incorrectCount = questions.filter((q) => q.status === "incorrect").length;
    const skippedCount = questions.filter((q) => q.status === "skipped").length;
    
    if (incorrectCount > skippedCount * 1.5) {
      strategies.push("Avoid risky guesses; they reduce net score potential");
    }
    
    if (scenarios[1].gain > 20) {
      strategies.push(`Even 25% error reduction can add ${scenarios[1].gain} marks`);
    }

    return strategies.length > 0 ? strategies : ["Keep practicing to identify improvement areas"];
  };

  const strategies = generateStrategies();

  // Chart tooltip formatter
  const formatTooltip = (value: number, _name: string, props: { payload: { gain: number } }) => [
    `Score: ${value}${props.payload.gain > 0 ? ` (+${props.payload.gain})` : ""}`,
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: Current vs Potential Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 glass-card border-primary/20">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold font-display mb-2">Score Potential Analysis</h2>
              <p className="text-muted-foreground">
                Discover how much your score can improve by reducing errors
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Score</p>
              <p className="text-4xl font-bold">{currentScore}</p>
              <p className="text-xs text-muted-foreground">out of {totalMarks}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Maximum Potential</p>
              <p className="text-4xl font-bold text-primary">{maxPotentialScore}</p>
              <p className="text-xs text-muted-foreground">with 100% error reduction</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Potential Gain</p>
              <p className="text-4xl font-bold text-success">+{maxGain}</p>
              <p className="text-xs text-muted-foreground">marks available</p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm">
              <span className="font-semibold">Verdict:</span> Your score can increase by{" "}
              <span className="font-bold text-primary">{maxGain} marks</span> without studying new
              topics.
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Section 2: Error Reduction Scenarios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Error Reduction Scenarios</h3>
              <p className="text-sm text-muted-foreground">
                Realistic improvement paths (25-50% reduction emphasized)
              </p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scenarios} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  domain={[0, totalMarks]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={formatTooltip}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {scenarios.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.realistic
                          ? "hsl(var(--primary))"
                          : index === 0
                          ? "hsl(var(--muted-foreground))"
                          : "hsl(var(--primary) / 0.5)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {scenarios.slice(1, 3).map((scenario) => (
              <div key={scenario.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">
                  {scenario.label}: <span className="font-semibold">{scenario.score}</span>{" "}
                  <span className="text-success">(+{scenario.gain})</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Section 3: Subject-wise Score Potential */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Subject-wise Score Potential</h3>
              <p className="text-sm text-muted-foreground">
                Where your efforts will yield maximum returns
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {subjectPotentials.map((subject, index) => (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  subject.name === bestSubject.name
                    ? "bg-primary/10 border-primary/30"
                    : "bg-secondary/30 border-border"
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <h4 className="font-semibold">{subject.name}</h4>
                    {subject.name === bestSubject.name && (
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                        Best ROI
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">+{subject.potentialGain}</p>
                    <p className="text-xs text-muted-foreground">potential marks</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Current Score</p>
                    <p className="font-semibold">{subject.currentScore}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Lost to Errors</p>
                    <p className="font-semibold text-destructive">-{subject.incorrectMarks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Doable Unattempted</p>
                    <p className="font-semibold">{subject.unattemptedDoable} qs</p>
                  </div>
                </div>

                <Progress
                  value={(subject.potentialGain / (subject.potentialGain + subject.currentScore)) * 100}
                  className="mt-3 h-2"
                />
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Section 4: Error Type Contribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 glass-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Error Type Contribution</h3>
              <p className="text-sm text-muted-foreground">
                Which type of error is costing you the most
              </p>
            </div>
          </div>

          {errorTypes.length > 0 ? (
            <div className="space-y-4">
              {errorTypes.map((error, index) => (
                <div key={error.type} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: error.color }} />
                      <span className="font-medium">{error.type}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">{error.percentage}% of errors</span>
                      <span className="font-semibold text-destructive">-{error.marksLost} marks</span>
                    </div>
                  </div>
                  <Progress value={error.percentage} className="h-3" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No errors to analyze. Great job!
            </p>
          )}
        </Card>
      </motion.div>

      {/* Section 5: Actionable Score Strategy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="p-6 glass-card border-success/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-success/10">
              <Zap className="w-5 h-5 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Actionable Score Strategy</h3>
              <p className="text-sm text-muted-foreground">Clear next steps for improvement</p>
            </div>
          </div>

          <div className="space-y-3">
            {strategies.map((strategy, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"
              >
                <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-success">{index + 1}</span>
                </div>
                <p className="text-sm">{strategy}</p>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
