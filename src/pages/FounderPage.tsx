import { motion } from "framer-motion";
import { Github, Linkedin, Instagram, ExternalLink, Mail, MapPin, Briefcase, GraduationCap, Code } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function FounderPage() {
  const socialLinks = [
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/adarshgupta1317/",
      icon: Linkedin,
      color: "hover:text-blue-600"
    },
    {
      name: "GitHub",
      url: "https://github.com/adarshgupta162",
      icon: Github,
      color: "hover:text-gray-900 dark:hover:text-gray-100"
    },
    {
      name: "Instagram",
      url: "https://www.instagram.com/_adarsh.in_/",
      icon: Instagram,
      color: "hover:text-pink-600"
    }
  ];

  const skills = [
    "React", "TypeScript", "Node.js", "Full Stack Development",
    "UI/UX Design", "EdTech", "Cloud Architecture", "Database Design"
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-primary/20 top-20 -left-48" />
        <div className="floating-orb w-80 h-80 bg-accent/20 top-1/2 -right-40" style={{ animationDelay: '2s' }} />
        <div className="floating-orb w-72 h-72 bg-primary/10 bottom-20 left-1/3" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="relative inline-block mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl mx-auto bg-gradient-to-br from-primary/20 to-accent/20"
            >
              {/* Placeholder for profile image - will be replaced with actual image */}
              <div className="w-full h-full flex items-center justify-center text-6xl font-bold gradient-text">
                AG
              </div>
            </motion.div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <Code className="w-6 h-6 text-primary-foreground" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold font-display mb-4 gradient-text"
          >
            Adarsh Gupta
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-muted-foreground mb-6"
          >
            Founder & Full Stack Developer
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex justify-center gap-4 mb-8"
          >
            {socialLinks.map((link, index) => (
              <motion.a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1, type: "spring" }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`p-4 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50 transition-all duration-300 ${link.color}`}
              >
                <link.icon className="w-6 h-6" />
              </motion.a>
            ))}
          </motion.div>
        </motion.div>

        {/* About Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mb-12"
        >
          <Card className="backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                About Me
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                I'm a passionate full-stack developer and entrepreneur dedicated to revolutionizing 
                education technology. With a strong background in software development and a deep 
                understanding of the educational landscape, I founded PhyNetix to provide students 
                with the best tools for exam preparation.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                My mission is to make quality education accessible to everyone through innovative 
                technology solutions. I believe in the power of data-driven insights and personalized 
                learning experiences to help students achieve their full potential.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-12"
        >
          <Card className="backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Skills & Expertise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + index * 0.05, type: "spring" }}
                  >
                    <Badge variant="secondary" className="px-4 py-2 text-sm">
                      {skill}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold font-display mb-6 gradient-text">Featured Project</h2>
          
          <Card className="backdrop-blur-sm bg-card/50 border-border/50 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-2xl md:text-3xl">PhyNetix</CardTitle>
                  <CardDescription className="text-base">
                    Comprehensive Test Series Platform for Competitive Exams
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-primary text-primary-foreground">Live</Badge>
              </div>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  PhyNetix is a cutting-edge educational platform designed to help students prepare 
                  for competitive exams like JEE, NEET, and BITSAT. The platform offers:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-primary">Key Features:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• AI-powered test analytics</li>
                      <li>• Comprehensive question bank</li>
                      <li>• Real-time performance tracking</li>
                      <li>• Detailed solutions & explanations</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-primary">Technology Stack:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• React & TypeScript</li>
                      <li>• Supabase Backend</li>
                      <li>• Tailwind CSS</li>
                      <li>• Advanced Analytics</li>
                    </ul>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  <Badge variant="outline">React</Badge>
                  <Badge variant="outline">TypeScript</Badge>
                  <Badge variant="outline">Supabase</Badge>
                  <Badge variant="outline">Tailwind CSS</Badge>
                  <Badge variant="outline">Vite</Badge>
                  <Badge variant="outline">shadcn/ui</Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href="https://phynetix.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[200px]"
                >
                  <Button className="w-full group/btn">
                    Visit Website
                    <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </a>
                <a
                  href="https://github.com/adarshgupta162"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[200px]"
                >
                  <Button variant="outline" className="w-full group/btn">
                    View on GitHub
                    <Github className="w-4 h-4 ml-2 group-hover/btn:scale-110 transition-transform" />
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <Card className="backdrop-blur-sm bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Get In Touch
              </CardTitle>
              <CardDescription>
                Feel free to reach out for collaborations or just a friendly chat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full group/btn">
                      <link.icon className="w-4 h-4 mr-2" />
                      {link.name}
                      <ExternalLink className="w-3 h-3 ml-auto group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="text-center mt-12"
        >
          <a href="/">
            <Button variant="ghost" className="group">
              ← Back to PhyNetix Home
            </Button>
          </a>
        </motion.div>
      </div>
    </div>
  );
}
