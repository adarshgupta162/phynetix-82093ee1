import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  Lock,
  ScrollText,
  Mail,
  Eye,
  Database,
  Cookie,
  UserCheck,
  FileCheck,
  Scale,
  AlertCircle
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
            <a href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
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

      {/* Privacy Policy Section */}
      <section id="privacy" className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <Lock className="w-4 h-4" />
              Your Privacy Matters
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Privacy <span className="gradient-text">Policy</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Effective Date: January 14, 2026
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem 
                value="info-collection"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-primary" />
                    <span>Information Collection and Usage</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    PhyNetix collects and processes personal information to provide you with the best test preparation experience for JEE Mains, JEE Advanced, and NEET examinations.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Information we collect:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Account information (name, email address, password)</li>
                      <li>Test performance data (scores, time taken, answer patterns)</li>
                      <li>Study analytics and progress tracking information</li>
                      <li>Device information and IP address for security purposes</li>
                      <li>Usage patterns and interaction data with our platform</li>
                    </ul>
                  </div>
                  <p>
                    We use this information to personalize your learning experience, provide detailed analytics, calculate rankings, and improve our services.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="data-security"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>Data Security Practices</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    We implement industry-standard security measures to protect your personal information and test data:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>End-to-end encryption for data transmission</li>
                    <li>Secure authentication with hashed passwords</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Secure cloud infrastructure with automated backups</li>
                    <li>Limited access controls for sensitive data</li>
                    <li>Monitoring systems to detect unauthorized access attempts</li>
                  </ul>
                  <p>
                    Your test responses and performance data are stored securely and are accessible only to you and authorized PhyNetix administrators for support purposes.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="cookie-usage"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Cookie className="w-5 h-5 text-primary" />
                    <span>Cookie Usage</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    PhyNetix uses cookies and similar technologies to enhance your experience:
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Essential Cookies:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Authentication tokens to keep you logged in</li>
                      <li>Session cookies to maintain test progress</li>
                      <li>Security cookies to prevent fraud and abuse</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Analytics Cookies:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Usage analytics to understand feature adoption</li>
                      <li>Performance monitoring to improve platform speed</li>
                      <li>User preference storage for personalization</li>
                    </ul>
                  </div>
                  <p>
                    You can control cookie preferences through your browser settings, though disabling certain cookies may affect platform functionality.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="user-rights"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <span>Your Rights Regarding Your Data</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    You have comprehensive rights over your personal data:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
                    <li><strong>Rectification:</strong> Update or correct inaccurate information</li>
                    <li><strong>Erasure:</strong> Request deletion of your account and associated data</li>
                    <li><strong>Portability:</strong> Export your test data and performance history</li>
                    <li><strong>Objection:</strong> Opt-out of certain data processing activities</li>
                    <li><strong>Restriction:</strong> Limit how we process your information</li>
                  </ul>
                  <p>
                    To exercise any of these rights, please contact us at <a href="mailto:privacy@phynetix.me" className="text-primary hover:underline">privacy@phynetix.me</a>. We will respond to your request within 30 days.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="compliance"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-primary" />
                    <span>Compliance and Data Protection</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    PhyNetix is committed to complying with applicable data protection regulations:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>GDPR Compliance:</strong> We adhere to EU General Data Protection Regulation standards for all users</li>
                    <li><strong>Data Minimization:</strong> We collect only necessary information for service delivery</li>
                    <li><strong>Purpose Limitation:</strong> Data is used solely for stated purposes</li>
                    <li><strong>Storage Limitation:</strong> We retain data only as long as necessary</li>
                    <li><strong>Third-party Sharing:</strong> We do not sell or share your personal information with third parties for marketing purposes</li>
                  </ul>
                  <p>
                    We may share anonymized, aggregated data for research and platform improvement purposes without identifying individual users.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="contact-privacy"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>Contact Information for Privacy Concerns</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    If you have any questions, concerns, or requests regarding your privacy or this Privacy Policy, please contact us:
                  </p>
                  <div className="space-y-2 ml-2">
                    <p><strong>Email:</strong> <a href="mailto:privacy@phynetix.me" className="text-primary hover:underline">privacy@phynetix.me</a></p>
                    <p><strong>Support:</strong> <a href="mailto:contact@phynetix.me" className="text-primary hover:underline">contact@phynetix.me</a></p>
                  </div>
                  <p>
                    We will make every effort to address your concerns promptly and transparently. This Privacy Policy may be updated periodically, and we will notify users of significant changes via email or platform notifications.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Terms & Conditions Section */}
      <section id="terms" className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <ScrollText className="w-4 h-4" />
              Legal Agreement
            </motion.div>
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Terms & <span className="gradient-text">Conditions</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Effective Date: January 14, 2026
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem 
                value="user-agreement"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-primary" />
                    <span>User Agreement and Acceptance</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    By accessing or using PhyNetix, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>These terms constitute a legally binding agreement between you and PhyNetix</li>
                    <li>You must be at least 13 years old to use our services, or have parental consent</li>
                    <li>You agree to provide accurate and complete information during registration</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You agree to notify us immediately of any unauthorized access to your account</li>
                  </ul>
                  <p>
                    PhyNetix reserves the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="service-description"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span>Service Description and Usage Rules</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    PhyNetix provides an online test preparation platform for JEE Mains, JEE Advanced, and NEET examinations with the following features:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>PDF-based test papers with realistic exam simulation</li>
                    <li>OMR-style answer panel for authentic practice experience</li>
                    <li>Timed tests with automatic submission and progress saving</li>
                    <li>Detailed performance analytics and subject-wise breakdown</li>
                    <li>Live rankings and peer comparison features</li>
                    <li>AI-powered insights and improvement suggestions</li>
                  </ul>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Usage Rules:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Use the platform only for personal educational purposes</li>
                      <li>Do not share your account credentials with others</li>
                      <li>Do not attempt to circumvent security measures or test integrity features</li>
                      <li>Do not use automated tools or scripts to access the platform</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="user-responsibilities"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <span>User Responsibilities</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    As a user of PhyNetix, you agree to the following responsibilities:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Academic Integrity:</strong> Maintain honesty in all test attempts and do not engage in cheating or unfair practices</li>
                    <li><strong>Content Usage:</strong> Do not copy, distribute, or share test content, questions, or materials</li>
                    <li><strong>Respectful Conduct:</strong> Treat other users and PhyNetix staff with respect</li>
                    <li><strong>System Resources:</strong> Use the platform responsibly without overloading or disrupting services</li>
                    <li><strong>Accurate Information:</strong> Provide truthful information for your profile and account</li>
                    <li><strong>Compliance:</strong> Follow all applicable laws and regulations while using our services</li>
                  </ul>
                  <p>
                    Violation of these responsibilities may result in account suspension or termination without refund.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="account-terms"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-primary" />
                    <span>Account Terms</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    Your PhyNetix account is subject to the following terms:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Each account is for individual use only and cannot be shared</li>
                    <li>You are responsible for all activities that occur under your account</li>
                    <li>Account credentials must be kept confidential and secure</li>
                    <li>Multiple accounts for the same individual are not permitted</li>
                    <li>We reserve the right to suspend or terminate accounts that violate our terms</li>
                    <li>Account deletion requests will be processed within 30 days</li>
                    <li>Upon account termination, access to test history and analytics will be lost</li>
                  </ul>
                  <p>
                    You may close your account at any time through account settings or by contacting support.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="test-policies"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    <span>Test Attempt and Scoring Policies</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    PhyNetix test attempts and scoring are governed by the following policies:
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Test Attempts:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Tests auto-save progress every 10 seconds to prevent data loss</li>
                      <li>Tests can be resumed if interrupted, but the timer continues on the server</li>
                      <li>Exiting fullscreen mode during secure tests triggers warnings (maximum 7 exits)</li>
                      <li>Tests auto-submit when time expires or exit limit is reached</li>
                      <li>Once submitted, test answers cannot be changed</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Scoring and Rankings:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Scores are calculated based on the official marking scheme (e.g., +4 for correct, -1 for incorrect)</li>
                      <li>Rankings are determined by score first, then by completion time for ties</li>
                      <li>Rankings update in real-time as more students complete tests</li>
                      <li>Score recalculation may occur if errors in answer keys are discovered</li>
                      <li>Analytics and performance data are available immediately after submission</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="intellectual-property"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>Intellectual Property Rights</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    All content, features, and functionality on PhyNetix are protected by intellectual property rights:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Platform Content:</strong> All test questions, PDFs, analytics algorithms, and educational materials are owned by PhyNetix or licensed to us</li>
                    <li><strong>Trademarks:</strong> PhyNetix name, logo, and branding are protected trademarks</li>
                    <li><strong>User-Generated Content:</strong> You retain ownership of any content you submit, but grant us a license to use it for platform operations</li>
                    <li><strong>Prohibited Actions:</strong> You may not copy, modify, distribute, sell, or reverse engineer any part of our platform</li>
                    <li><strong>Educational Use:</strong> Content is provided solely for personal test preparation purposes</li>
                  </ul>
                  <p>
                    Unauthorized use of our intellectual property may result in legal action and account termination.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="limitation-liability"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <span>Limitation of Liability</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    PhyNetix provides the platform "as is" with the following limitations:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>No Guarantees:</strong> We do not guarantee specific exam results or performance improvements</li>
                    <li><strong>Service Availability:</strong> While we strive for 99.9% uptime, we are not liable for temporary service interruptions</li>
                    <li><strong>Content Accuracy:</strong> We make reasonable efforts to ensure content accuracy but are not liable for any errors</li>
                    <li><strong>Third-party Content:</strong> We are not responsible for third-party links or external resources</li>
                    <li><strong>User Actions:</strong> We are not liable for damages resulting from your use or inability to use the platform</li>
                    <li><strong>Maximum Liability:</strong> Our total liability is limited to the amount you paid for the service in the past 12 months</li>
                  </ul>
                  <p>
                    Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="governing-law"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Scale className="w-5 h-5 text-primary" />
                    <span>Governing Law and Dispute Resolution</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    These Terms and Conditions are governed by the following provisions:
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Governing Law:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>These terms are governed by the laws of India</li>
                      <li>Any disputes will be subject to the exclusive jurisdiction of courts in [City], India</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Dispute Resolution:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Informal Resolution:</strong> Contact us first at <a href="mailto:support@phynetix.me" className="text-primary hover:underline">support@phynetix.me</a> to resolve disputes informally</li>
                      <li><strong>Mediation:</strong> If informal resolution fails, we agree to attempt mediation before litigation</li>
                      <li><strong>Arbitration:</strong> Disputes may be resolved through binding arbitration as per Indian Arbitration and Conciliation Act</li>
                      <li><strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive participation in class actions</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="contact-terms"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>Contact Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    For questions, concerns, or support regarding these Terms and Conditions, please contact us:
                  </p>
                  <div className="space-y-2 ml-2">
                    <p><strong>General Inquiries:</strong> <a href="mailto:contact@phynetix.me" className="text-primary hover:underline">contact@phynetix.me</a></p>
                    <p><strong>Technical Support:</strong> <a href="mailto:support@phynetix.me" className="text-primary hover:underline">support@phynetix.me</a></p>
                    <p><strong>Legal Questions:</strong> <a href="mailto:legal@phynetix.me" className="text-primary hover:underline">legal@phynetix.me</a></p>
                  </div>
                  <p>
                    We are committed to addressing your concerns promptly and maintaining transparent communication with our users.
                  </p>
                </AccordionContent>
              </AccordionItem>
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
