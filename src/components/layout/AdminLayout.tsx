import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  FileQuestion,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  MessageSquare,
  History,
  Send,
  Bell,
  Library,
  IndianRupee,
  CreditCard,
  GraduationCap,
  UserPlus,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useStaffRoles } from "@/hooks/useStaffRoles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { AtomIcon } from "@/components/icons/AtomIcon";
import RoleSwitcher from "@/components/admin/RoleSwitcher";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database['public']['Enums']['app_role'];

const allNavSections = {
  admin: [
    {
      title: "Overview",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
      ]
    },
    {
      title: "Departments",
      items: [
        { icon: GraduationCap, label: "Academic", path: "/admin/academic" },
        { icon: Users, label: "Operations", path: "/admin/operations" },
        { icon: IndianRupee, label: "Finance", path: "/admin/finance" },
      ]
    },
    {
      title: "Content",
      items: [
        { icon: FileText, label: "PDF Tests", path: "/admin/pdf-tests" },
        { icon: ClipboardList, label: "Tests", path: "/admin/tests" },
        { icon: BookOpen, label: "Question Bank", path: "/admin/question-bank" },
        { icon: Library, label: "PhyNetix Library", path: "/admin/phynetix-library" },
        { icon: BookOpen, label: "DPP Manager", path: "/admin/dpps" },
        { icon: Bell, label: "Batches", path: "/admin/batches" },
      ]
    },
    {
      title: "Management",
      items: [
        { icon: Users, label: "Users", path: "/admin/users" },
        { icon: MessageSquare, label: "Community", path: "/admin/community" },
        { icon: Send, label: "Requests", path: "/admin/requests" },
        { icon: History, label: "Audit Logs", path: "/admin/audit-logs" },
        { icon: Settings, label: "Settings", path: "/admin/settings" },
      ]
    }
  ],
  academic_admin: [
    {
      title: "Academic",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/academic" },
      ]
    },
    {
      title: "Content",
      items: [
        { icon: FileText, label: "PDF Tests", path: "/admin/pdf-tests" },
        { icon: ClipboardList, label: "Tests", path: "/admin/tests" },
        { icon: BookOpen, label: "Question Bank", path: "/admin/question-bank" },
        { icon: Library, label: "PhyNetix Library", path: "/admin/phynetix-library" },
      ]
    },
    {
      title: "Batches",
      items: [
        { icon: Bell, label: "Manage Batches", path: "/admin/batches" },
      ]
    }
  ],
  operations_admin: [
    {
      title: "Operations",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/operations" },
      ]
    },
    {
      title: "Students",
      items: [
        { icon: Users, label: "Users", path: "/admin/users" },
        { icon: UserPlus, label: "Enrollments", path: "/admin/operations" },
      ]
    },
    {
      title: "Batches",
      items: [
        { icon: Bell, label: "Manage Batches", path: "/admin/batches" },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: MessageSquare, label: "Community", path: "/admin/community" },
        { icon: Send, label: "Requests", path: "/admin/requests" },
      ]
    }
  ],
  finance_admin: [
    {
      title: "Finance",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin/finance" },
      ]
    },
    {
      title: "Transactions",
      items: [
        { icon: CreditCard, label: "Payments", path: "/admin/finance" },
        { icon: IndianRupee, label: "Revenue", path: "/admin/finance" },
      ]
    },
    {
      title: "Batches",
      items: [
        { icon: Bell, label: "Manage Batches", path: "/admin/batches" },
      ]
    }
  ],
};

const defaultNavSections = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    ]
  }
];

function getNavSections(role: AppRole | null) {
  if (!role) return defaultNavSections;
  return allNavSections[role as keyof typeof allNavSections] || defaultNavSections;
}

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadRequests, setUnreadRequests] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut, setViewMode } = useAuth();
  const { activeRole, userRoles } = useStaffRoles();
  const { settings: platformSettings } = usePlatformSettings();

  const navSections = useMemo(() => {
    const sections = getNavSections(activeRole);
    if (!platformSettings.show_pdf_tests) {
      return sections.map(section => ({
        ...section,
        items: section.items.filter(item => item.path !== '/admin/pdf-tests'),
      }));
    }
    return sections;
  }, [activeRole, platformSettings.show_pdf_tests]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    } else if (!isLoading && user && !isAdmin) {
      navigate("/dashboard");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUnreadRequests();
      const channel = supabase
        .channel('staff-requests-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_requests' }, () => {
          fetchUnreadRequests();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const fetchUnreadRequests = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('staff_requests')
      .select('id')
      .eq('to_user_id', user.id)
      .eq('status', 'pending');
    if (!error && data) setUnreadRequests(data.length);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link to="/admin" className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <AtomIcon className="w-5 h-5 text-primary-foreground" />
        </div>
        <AnimatePresence mode="wait">
          {(!collapsed || mobileOpen) && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <span className="text-lg font-bold tracking-wider uppercase text-primary whitespace-nowrap">
                PhyNetix
              </span>
              <span className="block text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                Admin Panel
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Role Switcher */}
      {userRoles.length > 1 && (
        <div className="px-3 py-3 border-b border-border">
          <RoleSwitcher collapsed={collapsed && !mobileOpen} />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <AnimatePresence mode="wait">
              {(!collapsed || mobileOpen) && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2"
                >
                  {section.title}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                const hasNotification = item.path === "/admin/requests" && unreadRequests > 0;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 relative group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <div className="relative">
                      <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                      {hasNotification && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </div>
                    <AnimatePresence mode="wait">
                      {(!collapsed || mobileOpen) && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-sm font-medium flex-1"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {(!collapsed || mobileOpen) && hasNotification && (
                      <span className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                        {unreadRequests}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-border px-3 py-3 space-y-1">
        <button
          onClick={() => {
            setViewMode('student');
            navigate("/dashboard");
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
        >
          <Shield className="w-[18px] h-[18px] flex-shrink-0" />
          <AnimatePresence mode="wait">
            {(!collapsed || mobileOpen) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Student View
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <div className="flex items-center justify-between px-3 py-1">
          <ThemeToggle />
          {!mobileOpen && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden lg:block"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          <AnimatePresence mode="wait">
            {(!collapsed || mobileOpen) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex admin-layout">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-secondary">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <AtomIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm uppercase tracking-wider text-primary">PhyNetix Admin</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[280px] bg-card border-r border-border z-[60]"
            >
              <div className="absolute top-3 right-3">
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden lg:block fixed left-0 top-0 h-screen bg-card border-r border-border z-50"
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 pt-14 lg:pt-0",
          collapsed ? "lg:ml-[64px]" : "lg:ml-[240px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}
