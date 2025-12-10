import { motion } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  FileQuestion, 
  ClipboardList,
  TrendingUp,
  ArrowRight,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const stats = [
  { icon: Users, label: "Total Students", value: "1,234", change: "+12%", positive: true },
  { icon: BookOpen, label: "Courses", value: "8", change: "+2", positive: true },
  { icon: FileQuestion, label: "Questions", value: "2,456", change: "+156", positive: true },
  { icon: ClipboardList, label: "Tests", value: "45", change: "+8", positive: true },
];

const activityData = [
  { name: "Mon", attempts: 120 },
  { name: "Tue", attempts: 145 },
  { name: "Wed", attempts: 98 },
  { name: "Thu", attempts: 167 },
  { name: "Fri", attempts: 189 },
  { name: "Sat", attempts: 234 },
  { name: "Sun", attempts: 156 },
];

const performanceData = [
  { subject: "Physics", avgScore: 72 },
  { subject: "Chemistry", avgScore: 68 },
  { subject: "Math", avgScore: 75 },
  { subject: "Biology", avgScore: 70 },
];

const recentActivity = [
  { type: "test", message: "New test 'JEE Mock 7' was created", time: "2 min ago" },
  { type: "user", message: "15 new students signed up today", time: "1 hour ago" },
  { type: "question", message: "50 questions added to Physics bank", time: "3 hours ago" },
  { type: "attempt", message: "342 test attempts completed today", time: "5 hours ago" },
];

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Overview of your quiz platform
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/questions">
              <Button variant="glass">
                <FileQuestion className="w-5 h-5" />
                Add Questions
              </Button>
            </Link>
            <Link to="/admin/tests">
              <Button variant="gradient">
                <ClipboardList className="w-5 h-5" />
                Create Test
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="stat-card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <span className={`text-sm font-medium flex items-center gap-1 ${stat.positive ? "text-[hsl(142,76%,36%)]" : "text-destructive"}`}>
                  <TrendingUp className="w-4 h-4" />
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold font-display mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Test Attempts Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold font-display">Test Attempts</h2>
                <p className="text-sm text-muted-foreground">Daily test attempts this week</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(222, 47%, 11%)', 
                      border: '1px solid hsl(217, 33%, 20%)',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="attempts" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAttempts)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subject Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold font-display">Average Scores</h2>
                <p className="text-sm text-muted-foreground">By subject across all students</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="subject" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(222, 47%, 11%)', 
                      border: '1px solid hsl(217, 33%, 20%)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="avgScore" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold font-display">Recent Activity</h2>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.message}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
