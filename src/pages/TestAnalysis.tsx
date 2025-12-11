import { motion } from "framer-motion";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Brain,
  BookOpen,
  Target,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface SubjectScore {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
}

interface Results {
  score: number;
  total_marks: number;
  correct: number;
  incorrect: number;
  skipped: number;
  percentile: number;
  subject_scores: Record<string, SubjectScore>;
  time_taken_seconds: number;
}

export default function TestAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<Results | null>(null);
  const testName = location.state?.testName || "Test Analysis";

  useEffect(() => {
    if (location.state?.results) {
      setResults(location.state.results);
    } else {
      // If no results, redirect to tests page
      navigate("/tests");
    }
  }, [location.state, navigate]);

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const accuracy = results.total_marks > 0 
    ? Math.round((results.score / results.total_marks) * 100) 
    : 0;
  const timeTaken = Math.round(results.time_taken_seconds / 60);

  const pieData = [
    { name: "Correct", value: results.correct, color: "#22c55e" },
    { name: "Incorrect", value: results.incorrect, color: "#ef4444" },
    { name: "Skipped", value: results.skipped, color: "#6b7280" },
  ];

  const subjectData = Object.entries(results.subject_scores).map(([subject, scores]) => ({
    subject,
    correct: scores.correct,
    incorrect: scores.incorrect,
    skipped: scores.skipped,
    accuracy: scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0,
  }));

  const aiSuggestions = generateSuggestions(subjectData, accuracy);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display">Test Analysis</h1>
            <p className="text-sm text-muted-foreground">{testName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/tests">
              <Button variant="glass">
                <BookOpen className="w-5 h-5" />
                More Tests
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="gradient">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Score Overview */}
        <div className="grid lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-2 glass-card p-6 flex items-center gap-6"
          >
            <div className="relative">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-secondary"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${Math.max(0, accuracy) * 3.52} 352`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold font-display">{accuracy}%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-4xl font-bold font-display mb-2">
                <span className="gradient-text">{results.score}</span>
                <span className="text-muted-foreground text-2xl">/{results.total_marks}</span>
              </div>
              <p className="text-muted-foreground mb-4">Total Score</p>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="w-4 h-4" /> {results.correct} Correct
                </span>
                <span className="flex items-center gap-1 text-destructive">
                  <XCircle className="w-4 h-4" /> {results.incorrect} Incorrect
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  {results.skipped} Skipped
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-4">
              <Trophy className="w-8 h-8 text-warning" />
              <span className="text-xs text-success">Top {100 - results.percentile}%</span>
            </div>
            <div className="text-3xl font-bold font-display mb-1">{results.percentile}%</div>
            <div className="text-sm text-muted-foreground">Percentile</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-accent" />
            </div>
            <div className="text-3xl font-bold font-display mb-1">{timeTaken} min</div>
            <div className="text-sm text-muted-foreground">Time Taken</div>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Subject Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold font-display mb-6">Subject-wise Performance</h2>
            {subjectData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis dataKey="subject" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="correct" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="incorrect" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="skipped" stackId="a" fill="#6b7280" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No subject data available</p>
            )}
          </motion.div>

          {/* Answer Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold font-display mb-6">Answer Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* AI Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold font-display">Recommendations</h2>
              <p className="text-sm text-muted-foreground">Based on your performance</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {aiSuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                className={cn(
                  "p-4 rounded-xl border",
                  suggestion.priority === "high" && "border-destructive/30 bg-destructive/5",
                  suggestion.priority === "medium" && "border-warning/30 bg-warning/5",
                  suggestion.priority === "low" && "border-success/30 bg-success/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    suggestion.type === "focus" && "bg-destructive/20",
                    suggestion.type === "practice" && "bg-warning/20",
                    suggestion.type === "strength" && "bg-success/20"
                  )}>
                    {suggestion.type === "focus" && <Target className="w-4 h-4 text-destructive" />}
                    {suggestion.type === "practice" && <Lightbulb className="w-4 h-4 text-warning" />}
                    {suggestion.type === "strength" && <CheckCircle2 className="w-4 h-4 text-success" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{suggestion.title}</h3>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function generateSuggestions(subjectData: any[], accuracy: number) {
  const suggestions = [];

  // Find weakest subject
  const weakest = subjectData.reduce((min, s) => s.accuracy < min.accuracy ? s : min, { accuracy: 100, subject: "" });
  if (weakest.subject && weakest.accuracy < 60) {
    suggestions.push({
      type: "focus",
      title: `Focus on ${weakest.subject}`,
      description: `Your accuracy in ${weakest.subject} is ${weakest.accuracy}%. Consider revising this subject.`,
      priority: "high"
    });
  }

  // Find strongest subject
  const strongest = subjectData.reduce((max, s) => s.accuracy > max.accuracy ? s : max, { accuracy: 0, subject: "" });
  if (strongest.subject && strongest.accuracy >= 70) {
    suggestions.push({
      type: "strength",
      title: `${strongest.subject} is Strong`,
      description: `Great work! You scored ${strongest.accuracy}% in ${strongest.subject}. Keep it up!`,
      priority: "low"
    });
  }

  // General accuracy suggestion
  if (accuracy < 50) {
    suggestions.push({
      type: "practice",
      title: "More Practice Needed",
      description: "Your overall accuracy needs improvement. Try taking more focused chapter tests.",
      priority: "high"
    });
  } else if (accuracy >= 80) {
    suggestions.push({
      type: "strength",
      title: "Excellent Performance!",
      description: "You're doing great! Try challenging yourself with harder tests.",
      priority: "low"
    });
  } else {
    suggestions.push({
      type: "practice",
      title: "Keep Practicing",
      description: "You're on the right track. Regular practice will help improve your accuracy.",
      priority: "medium"
    });
  }

  return suggestions.slice(0, 3);
}
