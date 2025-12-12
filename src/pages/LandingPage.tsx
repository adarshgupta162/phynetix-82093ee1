import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Zap, 
  BarChart3,
  ArrowRight,
  Brain,
  Sparkles,
  FileText,
  Clock,
  Shield,
  GraduationCap,
  Atom,
  FlaskConical,
  ChevronDown,
  Users,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const features = [
  {
    icon: FileText,
    title: "PDF-Based Tests",
    description: "Real exam experience with PDF question papers and OMR-style answering"
  },
  {
    icon: Target,
    title: "JEE & NEET Pattern",
    description: "Tests designed exactly like JEE Mains, JEE Advanced & NEET exams"
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Get personalized insights and improvement suggestions"
  },
  {
    icon: Trophy,
    title: "Live Rankings",
    description: "Compare your performance with peers through leaderboards"
  },
  {
    icon: Clock,
    title: "Timed Practice",
    description: "Simulate real exam conditions with countdown timers"
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Track your progress with subject-wise performance breakdown"
  }
];

const examTypes = [
  {
    icon: Atom,
    title: "JEE Mains",
    description: "75 questions • 3 hours",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30"
  },
  {
    icon: Zap,
    title: "JEE Advanced",
    description: "54 questions • 3 hours per paper",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30"
  },
  {
    icon: FlaskConical,
    title: "NEET",
    description: "200 questions • 3 hours 20 mins",
    subjects: ["Physics", "Chemistry", "Biology"],
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30"
  }
];

const stats = [
  { value: 5000, suffix: "+", label: "Students", icon: Users },
  { value: 500, suffix: "+", label: "Tests Available", icon: FileText },
  { value: 10000, suffix: "+", label: "Questions", icon: BookOpen },
  { value: 95, suffix: "%", label: "Satisfaction", icon: Award }
];

const faqs = [
  {
    question: "What exams does PhyNetix support?",
    answer: "PhyNetix currently supports JEE Mains, JEE Advanced, and NEET exam patterns. Our tests are designed to match the exact format, timing, and marking scheme of these competitive exams."
  },
  {
    question: "How does the PDF-based test work?",
    answer: "Our unique interface displays the question paper as a PDF on the left side, just like in the actual exam. On the right, you get an OMR-style panel to mark your answers. This gives you the most realistic practice experience."
  },
  {
    question: "Can I resume a test if I leave midway?",
    answer: "Yes! Your progress is automatically saved every 10 seconds. If you need to leave, you can resume the test later from where you left off. The timer continues on the server, so manage your time wisely."
  },
  {
    question: "How is the ranking calculated?",
    answer: "Rankings are calculated based on your score and the time taken to complete the test. Students with higher scores rank above, and for tied scores, faster completion time determines the higher rank."
  },
  {
    question: "What happens if I exit fullscreen during a test?",
    answer: "For secure tests, exiting fullscreen triggers a warning. You have a limited number of exits allowed (typically 7). Exceeding this limit will auto-submit your test to maintain exam integrity."
  },
  {
    question: "Can I see my mistakes after the test?",
    answer: "Absolutely! After submission, you get a detailed analysis showing each question, your answer, the correct answer, and your marks. The PDF is displayed alongside so you can review everything in context."
  }
];

// Animated Counter Component
function AnimatedCounter({ value, suffix = "", duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-primary/30 top-20 -left-48" />
        <div className="floating-orb w-80 h-80 bg-accent/30 top-1/2 -right-40" style={{ animationDelay: '2s' }} />
        <div className="floating-orb w-72 h-72 bg-primary/20 bottom-20 left-1/3" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display gradient-text">PhyNetix</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#exams" className="text-muted-foreground hover:text-foreground transition-colors">Exams</a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/auth">
              <Button variant="gradient">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                JEE & NEET Test Platform
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold font-display mb-6 leading-tight"
            >
              Practice Tests That{" "}
              <span className="gradient-text">Feel Real</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            >
              Experience authentic exam conditions with PDF-based tests, 
              OMR-style answering, and detailed performance analytics.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/auth">
                <Button variant="gradient" size="xl" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </motion.div>

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-muted-foreground"
            >
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                JEE Mains Pattern
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                JEE Advanced Pattern
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Secure Test Environment
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="relative z-10 py-12 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 text-center group hover:scale-105 transition-transform duration-300"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl md:text-4xl font-bold font-display gradient-text mb-1">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Types Section */}
      <section id="exams" className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Prepare for <span className="gradient-text">Top Exams</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Practice tests designed to match the exact pattern of major competitive exams.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {examTypes.map((exam, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`glass-card p-6 border ${exam.borderColor} relative overflow-hidden group hover:scale-105 transition-transform duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${exam.color} opacity-50`} />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <exam.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold font-display mb-2">{exam.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{exam.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {exam.subjects.map((subject, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-background/60 text-xs font-medium">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interface Preview Section */}
      <section id="preview" className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Experience the <span className="gradient-text">Test Interface</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our split-view interface shows the PDF question paper alongside an OMR-style answer panel.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto"
          >
            <div className="glass-card p-2 md:p-4 rounded-2xl border border-border/50 shadow-2xl">
              {/* Mock Browser Header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 mb-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    phynetix.com/test
                  </div>
                </div>
              </div>

              {/* Mock Interface */}
              <div className="grid md:grid-cols-[1fr_340px] gap-4 p-2">
                {/* PDF Preview Area */}
                <div className="bg-muted/30 rounded-xl p-4 min-h-[300px] md:min-h-[400px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">PDF Question Paper</span>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-background/60 flex items-center justify-center">
                        <span className="text-xs">−</span>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-background/60 flex items-center justify-center">
                        <span className="text-xs">+</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 bg-background/40 rounded-lg p-4 space-y-3">
                    <div className="text-center text-sm font-semibold text-muted-foreground mb-4">JEE Main 2024 - Paper 1</div>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted/40 rounded w-full" />
                      <div className="h-3 bg-muted/40 rounded w-5/6" />
                      <div className="h-3 bg-muted/40 rounded w-4/5" />
                    </div>
                    <div className="pt-4 space-y-2">
                      <div className="text-xs text-muted-foreground font-medium">Q1. A particle moves in a straight line...</div>
                      <div className="pl-4 space-y-1 text-xs text-muted-foreground">
                        <div>(A) 2 m/s²</div>
                        <div>(B) 4 m/s²</div>
                        <div>(C) 6 m/s²</div>
                        <div>(D) 8 m/s²</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OMR Panel Preview */}
                <div className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">OMR Panel</span>
                    <div className="px-3 py-1 rounded-lg bg-primary/20 text-primary text-xs font-medium">
                      02:45:30
                    </div>
                  </div>
                  
                  {/* Question Status */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded bg-success/60" />
                      <span className="text-muted-foreground">Answered</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded bg-muted/60" />
                      <span className="text-muted-foreground">Unseen</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded bg-warning/60" />
                      <span className="text-muted-foreground">Skipped</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded bg-purple-500/60" />
                      <span className="text-muted-foreground">Review</span>
                    </div>
                  </div>

                  {/* Question Grid */}
                  <div className="bg-background/40 rounded-lg p-3 mb-4">
                    <div className="text-xs text-muted-foreground mb-2">Question 1 of 75</div>
                    <div className="grid grid-cols-2 gap-2">
                      {['A', 'B', 'C', 'D'].map((opt, i) => (
                        <div 
                          key={opt} 
                          className={`px-4 py-2 rounded-lg text-center text-sm font-medium transition-colors cursor-pointer ${
                            i === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Question Palette */}
                  <div className="bg-background/40 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-2">Question Palette</div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[...Array(15)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                            i === 0 ? 'bg-success/60 text-success-foreground' :
                            i < 3 ? 'bg-success/40' :
                            i === 3 ? 'bg-primary text-primary-foreground ring-2 ring-primary' :
                            i === 5 ? 'bg-purple-500/60' :
                            'bg-muted/40'
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Why Choose <span className="gradient-text">PhyNetix</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built specifically for JEE and NEET aspirants who want authentic exam practice.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="stat-card group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-display mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about PhyNetix.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative z-10">
              <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Start Your Preparation Today
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join PhyNetix and experience test preparation the way it should be — 
                realistic, insightful, and focused on your success.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="gradient" size="xl">
                    Create Account
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="glass" size="xl">
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold font-display">PhyNetix</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 PhyNetix. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
