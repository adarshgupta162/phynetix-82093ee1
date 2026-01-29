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
  AlertCircle,
  Star,
  Users,
  CheckCircle,
  Award,
  TrendingUp,
  ShieldCheck,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// IIT/NIT colleges data for auto-scrolling section
const colleges = [
  { name: "IIT Bombay", logo: "/logos/colleges/iit-bombay.png", website: "https://www.iitb.ac.in" },
  { name: "IIT Delhi", logo: "/logos/colleges/iit-delhi.png", website: "https://www.iitd.ac.in" },
  { name: "IIT Madras", logo: "/logos/colleges/iit-madras.png", website: "https://www.iitm.ac.in" },
  { name: "IIT Kharagpur", logo: "/logos/colleges/iit-kharagpur.png", website: "https://www.iitkgp.ac.in" },
  { name: "IIT Kanpur", logo: "/logos/colleges/iit-kanpur.png", website: "https://www.iitk.ac.in" },
  { name: "IIT Roorkee", logo: "/logos/colleges/iit-roorkee.png", website: "https://www.iitr.ac.in" },
  { name: "IIT Guwahati", logo: "/logos/colleges/iit-guwahati.png", website: "https://www.iitg.ac.in" },
  { name: "IIT Hyderabad", logo: "/logos/colleges/iit-hyderabad.png", website: "https://www.iith.ac.in" },
  { name: "IIT Bhubaneswar", logo: "/logos/colleges/iit-bhubaneswar.png", website: "https://www.iitbbs.ac.in" },
  { name: "IIT Gandhinagar", logo: "/logos/colleges/iit-gandhinagar.png", website: "https://www.iitgn.ac.in" },
  { name: "IIT Jodhpur", logo: "/logos/colleges/iit-jodhpur.png", website: "https://www.iitj.ac.in" },
  { name: "IIT Patna", logo: "/logos/colleges/iit-patna.png", website: "https://www.iitp.ac.in" },
  { name: "IIT Indore", logo: "/logos/colleges/iit-indore.png", website: "https://www.iiti.ac.in" },
  { name: "IIT Mandi", logo: "/logos/colleges/iit-mandi.png", website: "https://www.iitmandi.ac.in" },
  { name: "IIT Varanasi", logo: "/logos/colleges/iit-varanasi.png", website: "https://www.iitbhu.ac.in" },
  { name: "IIT Bhilai", logo: "/logos/colleges/iit-bhilai.png", website: "https://www.iitbhilai.ac.in" },
  { name: "IIT Dharwad", logo: "/logos/colleges/iit-dharwad.png", website: "https://www.iitdh.ac.in" },
  { name: "NIT Tiruchirappalli", logo: "/logos/colleges/nit-trichy.png", website: "https://www.nitt.edu" },
  { name: "NIT Rourkela", logo: "/logos/colleges/nit-rourkela.png", website: "https://www.nitrkl.ac.in" },
  { name: "NIT Silchar", logo: "/logos/colleges/nit-silchar.png", website: "https://www.nits.ac.in" },
  { name: "VNIT Nagpur", logo: "/logos/colleges/vnit-nagpur.png", website: "https://www.vnit.ac.in" },
  { name: "NIT Warangal", logo: "/logos/colleges/nit-warangal.png", website: "https://www.nitw.ac.in" },
  { name: "NIT Surathkal", logo: "/logos/colleges/nit-surathkal.png", website: "https://www.nitk.ac.in" },
  { name: "NIT Calicut", logo: "/logos/colleges/nit-calicut.png", website: "https://www.nitc.ac.in" },
  { name: "MANIT Bhopal", logo: "/logos/colleges/manit-bhopal.png", website: "https://www.manit.ac.in" },
];

// Test Series data
const testSeriesCards = [
  {
    title: "JEE Main 2026 Test Series",
    logo: "/logos/test-series/jee-main.png",
    features: ["30 Full Tests (Video & Textual Solutions)", "15 RPYQs", "12 Part Tests", "Chapter-wise Tests"],
    bgGradient: "from-blue-600/20 to-blue-800/20",
  },
  {
    title: "JEE Advanced 2026 Test Series",
    logo: "/logos/test-series/jee-advanced.png",
    features: ["20 Full Tests", "10 Topic-wise Tests", "Detailed Analysis", "Expert Solutions"],
    bgGradient: "from-purple-600/20 to-purple-800/20",
  },
  {
    title: "BITSAT 2026 Test Series",
    logo: "/logos/test-series/bitsat.png",
    features: ["25 Full Tests", "8 Part Tests", "English Proficiency", "Speed Tests"],
    bgGradient: "from-orange-600/20 to-orange-800/20",
  },
  {
    title: "MHT-CET 2026 Test Series",
    logo: "/logos/test-series/mht-cet.png",
    features: ["20 Full Tests", "15 Chapter Tests", "State Board Focus", "Quick Revision"],
    bgGradient: "from-green-600/20 to-green-800/20",
  },
  {
    title: "NEET 2026 Test Series",
    logo: "/logos/test-series/neet.png",
    features: ["35 Full Tests", "Biology Focus Tests", "Medical MCQs", "AIIMS Pattern"],
    bgGradient: "from-red-600/20 to-red-800/20",
  },
];

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

const courses = [
  {
    title: "JEE Mains Complete",
    description: "Full syllabus coverage with 30+ tests",
    price: "₹2,999",
    duration: "6 months access",
    examType: "JEE Mains",
    features: ["30+ Full Tests", "Subject-wise Tests", "Part Tests", "Detailed Analytics"],
    popular: true,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30"
  },
  {
    title: "JEE Advanced Pro",
    description: "Advanced level preparation with expert-curated tests",
    price: "₹3,999",
    duration: "6 months access",
    examType: "JEE Advanced",
    features: ["25+ Advanced Tests", "Topic-wise Tests", "Previous Year Papers", "Live Rankings"],
    popular: false,
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30"
  },
  {
    title: "NEET Mastery",
    description: "Comprehensive NEET preparation package",
    price: "₹2,499",
    duration: "6 months access",
    examType: "NEET",
    features: ["35+ Mock Tests", "Biology Focus Tests", "Physics & Chemistry", "Performance Tracking"],
    popular: false,
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30"
  }
];

const testimonials = [
  {
    name: "Arjun Sharma",
    role: "JEE Advanced AIR 234",
    image: "👨‍🎓",
    rating: 5,
    text: "PhyNetix's PDF-based tests gave me the exact exam feel. The detailed analytics helped me identify my weak areas and improve systematically.",
    exam: "JEE Advanced 2024"
  },
  {
    name: "Priya Patel",
    role: "NEET AIR 456",
    image: "👩‍🎓",
    rating: 5,
    text: "The test interface is incredibly realistic. I felt so prepared on exam day because I had practiced in similar conditions hundreds of times.",
    exam: "NEET 2024"
  },
  {
    name: "Rohit Kumar",
    role: "JEE Mains 99.8%ile",
    image: "👨‍💻",
    rating: 5,
    text: "Best test series I've used. The question quality is top-notch and the performance tracking features are amazing. Highly recommend!",
    exam: "JEE Mains 2024"
  }
];

const trustStats = [
  {
    icon: Users,
    value: "10,000+",
    label: "Active Students"
  },
  {
    icon: FileText,
    value: "50,000+",
    label: "Tests Attempted"
  },
  {
    icon: Trophy,
    value: "95%",
    label: "Success Rate"
  },
  {
    icon: Award,
    value: "500+",
    label: "Top AIR Selections"
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
            <a href="#courses" className="text-muted-foreground hover:text-foreground transition-colors">Courses</a>
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

      {/* Hero Section - Quizrr Style */}
      <section className="relative z-10 py-16 md:py-24 bg-gradient-to-br from-purple-900/50 via-indigo-900/30 to-blue-900/20 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
        
        <div className="container mx-auto px-4">
          {/* Tabs for Test Series Years */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center gap-3 mb-12"
          >
            <button className="px-6 py-2.5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold text-sm hover:shadow-lg transition-shadow">
              Our 2026 Test Series
            </button>
            <button className="px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors">
              Our 2027 Test Series
            </button>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-left"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-6 leading-tight text-white">
                India's{" "}
                <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 bg-clip-text text-transparent">
                  Most Relevant
                </span>
                <br />
                Test Series
              </h1>

              <p className="text-lg text-gray-200 mb-6 leading-relaxed">
                1 in every 5 99%iler used this test series in JEE Main 2025
              </p>

              <Link to="/auth">
                <Button 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-base px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Join Test Series
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mt-10" role="list" aria-label="Platform statistics">
                <div className="text-left" role="listitem">
                  <div className="text-3xl font-bold text-white">50K+</div>
                  <div className="text-sm text-gray-300">Students</div>
                </div>
                <div className="text-left" role="listitem">
                  <div className="text-3xl font-bold text-white">1L+</div>
                  <div className="text-sm text-gray-300">Tests Taken</div>
                </div>
                <div className="text-left" role="listitem">
                  <div className="text-3xl font-bold text-white">99%</div>
                  <div className="text-sm text-gray-300">Success Rate</div>
                </div>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hidden md:flex justify-center items-center"
            >
              <div className="relative">
                <div className="w-80 h-80 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-xl flex items-center justify-center">
                  <div className="text-8xl">🎓</div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl animate-bounce">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-xl animate-pulse">
                  <Target className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* IIT/NIT Auto-Scrolling Section */}
      <section className="relative z-10 py-20 border-t border-border/50 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">
              Get Into India's Top <span className="gradient-text">IITs & NITs</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Our students are across Top Colleges of India
            </p>
          </div>

          {/* Auto-scrolling college carousel */}
          <div className="relative">
            <div className="overflow-hidden">
              <motion.div
                className="flex gap-6"
                animate={{
                  x: [0, -(colleges.length * (192 + 24))], // 192px card width + 24px gap
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 40,
                    ease: "linear",
                  },
                }}
                aria-label="Auto-scrolling college showcase"
              >
                {/* Render colleges twice for seamless loop */}
                {[...colleges, ...colleges].map((college, index) => (
                  <div
                    key={`${college.name}-${index}`}
                    className="flex-shrink-0 w-48 glass-card p-6 border border-border/50 rounded-2xl flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform"
                  >
                    <div className="w-20 h-20 flex items-center justify-center">
                      <img 
                        src={college.logo} 
                        alt={`${college.name} logo`}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          // Fallback to placeholder if image fails to load
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiMyMjI4MzgiIHJ4PSI4Ii8+PHBhdGggZD0iTTQwIDIwQzI4Ljk1NDMgMjAgMjAgMjguOTU0MyAyMCA0MEMyMCA1MS4wNDU3IDI4Ljk1NDMgNjAgNDAgNjBDNTEuMDQ1NyA2MCA2MCA1MS4wNDU3IDYwIDQwQzYwIDI4Ljk1NDMgNTEuMDQ1NyAyMCA0MCAyMFpNNDAgMjZDNDcuNzMyIDI2IDU0IDMyLjI2OCA1NCA0MEM1NCA0Ny43MzIgNDcuNzMyIDU0IDQwIDU0QzMyLjI2OCA1NCAyNiA0Ny43MzIgMjYgNDBDMjYgMzIuMjY4IDMyLjI2OCAyNiA0MCAyNloiIGZpbGw9IiMzQjgyRjYiLz48L3N2Zz4=';
                        }}
                      />
                    </div>
                    <div className="text-sm font-semibold text-center">{college.name}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Test Series Cards Section */}
      <section id="test-series" className="relative z-10 py-20 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Join India's <span className="gradient-text">Most Relevant Test Series</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive test series designed for JEE, NEET, BITSAT, and other competitive exams
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testSeriesCards.map((testSeries, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden border border-border/50 hover:scale-105 transition-transform duration-300 group"
              >
                {/* Background with Logo */}
                <div className={`relative h-48 bg-gradient-to-br ${testSeries.bgGradient} flex items-center justify-center`}>
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="relative z-10 w-24 h-24 flex items-center justify-center">
                    <img 
                      src={testSeries.logo} 
                      alt={`${testSeries.title} logo`}
                      className="max-w-full max-h-full object-contain drop-shadow-lg"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHJ4PSIxMiIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PHBhdGggZD0iTTQ4IDI0QzM1LjI5NzUgMjQgMjUgMzQuMjk3NSAyNSA0N0MyNSA1OS43MDI1IDM1LjI5NzUgNzAgNDggNzBDNjAuNzAyNSA3MCA3MSA1OS43MDI1IDcxIDQ3QzcxIDM0LjI5NzUgNjAuNzAyNSAyNCA0OCAyNFpNNDggMzBDNTcuMzg5OCAzMCA2NSAzNy42MTAyIDY1IDQ3QzY1IDU2LjM4OTggNTcuMzg5OCA2NCA0OCA2NEMzOC42MTAyIDY0IDMxIDU2LjM4OTggMzEgNDdDMzEgMzcuNjEwMiAzOC42MTAyIDMwIDQ4IDMwWiIgZmlsbD0id2hpdGUiLz48L3N2Zz4=';
                      }}
                    />
                  </div>
                  {/* Indian Flag Icon */}
                  <div className="absolute top-4 right-4 w-10 h-7 rounded border border-white/30 overflow-hidden" role="img" aria-label="Indian flag">
                    <div className="h-1/3 bg-orange-500" />
                    <div className="h-1/3 bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full border-2 border-blue-600" />
                    </div>
                    <div className="h-1/3 bg-green-600" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold font-display mb-4">{testSeries.title}</h3>
                  
                  <ul className="space-y-2 mb-6">
                    {testSeries.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to="/auth">
                    <Button 
                      variant="outline" 
                      className="w-full bg-navy text-white border-navy-border hover:bg-navy-light group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
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
              Our intuitive interface displays questions with LaTeX rendering, multiple choice options, and a comprehensive question palette.
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
              <div className="flex flex-col gap-3 p-2">
                {/* Section Tabs */}
                <div className="bg-muted/30 rounded-lg p-2 flex items-center gap-2 overflow-x-auto">
                  {['Physics', 'Chemistry', 'Mathematics'].map((subject, i) => (
                    <div
                      key={subject}
                      className={`px-4 py-1.5 rounded text-xs font-medium whitespace-nowrap border ${
                        i === 0 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'bg-background/60 text-muted-foreground border-border/50'
                      }`}
                    >
                      {subject} (25)
                    </div>
                  ))}
                </div>

                {/* Main Content Area */}
                <div className="grid md:grid-cols-[1fr_300px] gap-3">
                  {/* Question Display Area */}
                  <div className="bg-muted/30 rounded-xl p-4 min-h-[300px] md:min-h-[450px] flex flex-col">
                    {/* Section Instructions */}
                    <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs space-y-1">
                      <div className="text-muted-foreground">• This section contains <strong>25</strong> questions.</div>
                      <div className="text-muted-foreground">• Each question has FOUR options. ONLY ONE is correct.</div>
                      <div className="text-muted-foreground">• Full Marks: <strong>+4</strong> | Zero Marks: <strong>0</strong> | Negative Marks: <strong>-1</strong></div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 bg-background/40 rounded-lg p-4 space-y-4">
                      {/* Question Badge */}
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">
                          Q.1
                        </span>
                        <span className="text-xs text-muted-foreground">Single Choice</span>
                      </div>

                      {/* Question Text with LaTeX */}
                      <div className="text-sm text-foreground leading-relaxed">
                        A particle of mass <span className="font-mono text-xs">m</span> moves in a circular path of radius <span className="font-mono text-xs">r</span> with velocity <span className="font-mono text-xs">v</span>. What is the centripetal acceleration?
                      </div>

                      {/* Answer Options */}
                      <div className="space-y-2">
                        {[
                          { label: 'A', text: 'v²/r', selected: true },
                          { label: 'B', text: 'v/r²', selected: false },
                          { label: 'C', text: 'mr/v', selected: false },
                          { label: 'D', text: 'mv²/r', selected: false }
                        ].map((option) => (
                          <div 
                            key={option.label}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                              option.selected
                                ? 'border-primary/50 bg-primary/10' 
                                : 'border-border/50 bg-background/60'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-muted text-muted-foreground flex-shrink-0">
                              {option.label}
                            </div>
                            <span className="text-xs font-mono">{option.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50">
                      <div className="flex gap-2">
                        <div className="px-3 py-1.5 rounded-lg bg-background/60 border border-border/50 text-xs font-medium text-muted-foreground">
                          Mark for Review
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-background/60 border border-border/50 text-xs font-medium text-muted-foreground">
                          Clear Response
                        </div>
                      </div>
                      <div className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">
                        Save & Next
                      </div>
                    </div>
                  </div>

                  {/* Question Palette Sidebar */}
                  <div className="bg-muted/30 rounded-xl p-4 flex flex-col min-h-[300px] md:min-h-[450px]">
                    {/* Student Info */}
                    <div className="mb-3 text-center pb-3 border-b border-border/50">
                      <div className="w-12 h-12 mx-auto bg-muted rounded-lg mb-2 flex items-center justify-center text-xl">
                        👤
                      </div>
                      <div className="text-xs font-medium text-muted-foreground">Student Name</div>
                    </div>

                    {/* Timer */}
                    <div className="mb-3 pb-3 border-b border-border/50">
                      <div className="px-3 py-2 rounded-lg bg-primary/20 text-primary text-center">
                        <div className="text-xs font-medium">Time Left</div>
                        <div className="text-sm font-bold">02:45:30</div>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="mb-3 pb-3 border-b border-border/50 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-success text-white flex items-center justify-center text-xs font-medium">4</div>
                        <span className="text-muted-foreground">Answered</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-destructive text-white flex items-center justify-center text-xs font-medium">2</div>
                        <span className="text-muted-foreground">Not Answered</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-medium">17</div>
                        <span className="text-muted-foreground">Not Visited</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-purple-500 text-white flex items-center justify-center text-xs font-medium">1</div>
                        <span className="text-muted-foreground">Marked for Review</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-purple-500 text-white flex items-center justify-center text-xs font-medium relative">
                          1
                          <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-success rounded-full"></span>
                        </div>
                        <span className="text-muted-foreground">Answered & Marked</span>
                      </div>
                    </div>

                    {/* Section Title */}
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-primary">Physics</div>
                      <div className="text-xs text-muted-foreground">Choose a Question</div>
                    </div>

                    {/* Question Grid */}
                    <div className="flex-1 bg-background/40 rounded-lg p-2 overflow-y-auto">
                      <div className="grid grid-cols-5 gap-1.5">
                        {[...Array(25)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium ${
                              i === 0 ? 'bg-primary text-primary-foreground ring-2 ring-primary' :
                              i < 5 ? 'bg-success text-white' :
                              i === 5 || i === 6 ? 'bg-destructive text-white' :
                              i === 7 ? 'bg-purple-500 text-white relative' :
                              'bg-muted text-muted-foreground'
                            }`}
                          >
                            {i + 1}
                            {i === 7 && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-success rounded-full"></span>
                            )}
                          </div>
                        ))}
                      </div>
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

      {/* Courses & Pricing Section */}
      <section id="courses" className="relative z-10 py-16 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Choose Your <span className="gradient-text">Course</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Affordable, comprehensive test series packages designed for your success.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {courses.map((course, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`glass-card p-6 border ${course.borderColor} relative overflow-hidden group hover:scale-105 transition-transform duration-300 ${
                  course.popular ? 'ring-2 ring-primary' : ''
                }`}
              >
                {course.popular && (
                  <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    Popular
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-50`} />
                <div className="relative z-10">
                  <div className="mb-4">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                      {course.examType}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold font-display mb-2">{course.title}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
                  
                  <div className="mb-4 pb-4 border-b border-border/50">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-3xl font-bold gradient-text">{course.price}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{course.duration}</span>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {course.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2">
                    <Link to="/auth" className="block">
                      <Button variant="gradient" className="w-full">
                        Buy Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                    <Link to="/tests" className="block">
                      <Button variant="outline" className="w-full">
                        Free Preview
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Quality Indicators */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Trusted by <span className="gradient-text">Thousands</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join our growing community of successful students preparing for top competitive exams.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
            {trustStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl md:text-3xl font-bold font-display gradient-text mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-sm">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-sm">Expert Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm">Proven Results</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm">10K+ Community</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Student Testimonials */}
      <section className="relative z-10 py-16 border-t border-border/50 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              What Our <span className="gradient-text">Students Say</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Success stories from students who achieved their goals with quality test preparation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 relative"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl" role="img" aria-label="Student avatar">
                    {testimonial.image}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold font-display">{testimonial.name}</h4>
                    <p className="text-sm text-primary font-medium">{testimonial.role}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.exam}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 mb-3" role="img" aria-label={`${testimonial.rating} out of 5 stars`}>
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" aria-hidden="true" />
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  "{testimonial.text}"
                </p>
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
                      <li>Any disputes will be subject to the exclusive jurisdiction of courts in New Delhi, India</li>
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
      <footer className="relative z-10 border-t border-border/50 py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold font-display gradient-text">PhyNetix</span>
              </Link>
              <p className="text-sm text-muted-foreground mb-4">
                Your trusted partner for JEE & NEET test preparation. Practice tests that feel real.
              </p>
              <div className="flex gap-3">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Visit our Facebook page" className="w-9 h-9 rounded-lg bg-background/60 border border-border/50 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Visit our Twitter page" className="w-9 h-9 rounded-lg bg-background/60 border border-border/50 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <Twitter className="w-4 h-4" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Visit our Instagram page" className="w-9 h-9 rounded-lg bg-background/60 border border-border/50 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="Visit our LinkedIn page" className="w-9 h-9 rounded-lg bg-background/60 border border-border/50 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <Linkedin className="w-4 h-4" />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="Visit our YouTube channel" className="w-9 h-9 rounded-lg bg-background/60 border border-border/50 flex items-center justify-center hover:border-primary hover:text-primary transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Courses Column */}
            <div>
              <h3 className="font-semibold font-display mb-4">Courses</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/auth" className="hover:text-primary transition-colors">JEE Mains Complete</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">JEE Advanced Pro</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">NEET Mastery</Link></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Free Sample Tests</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="font-semibold font-display mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#courses" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">About Us</Link></li>
              </ul>
            </div>

            {/* Legal & Support Column */}
            <div>
              <h3 className="font-semibold font-display mb-4">Legal & Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="mailto:support@phynetix.me" className="hover:text-primary transition-colors">Contact Support</a></li>
                <li><a href="mailto:contact@phynetix.me" className="hover:text-primary transition-colors">General Inquiries</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 PhyNetix. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#privacy" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-primary transition-colors">Terms</a>
              <a href="mailto:contact@phynetix.me" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
