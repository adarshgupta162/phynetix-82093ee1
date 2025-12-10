import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Users,
  Shield,
  ShieldOff,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  target_exam: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'student';
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*')
    ]);

    if (!profilesRes.error) setProfiles(profilesRes.data || []);
    if (!rolesRes.error) setUserRoles(rolesRes.data || []);
    setIsLoading(false);
  };

  const getUserRole = (userId: string): 'admin' | 'student' => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'student';
  };

  const toggleAdminRole = async (userId: string) => {
    const currentRole = getUserRole(userId);
    
    if (currentRole === 'admin') {
      // Remove admin role
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      
      if (error) {
        toast({ title: "Error updating role", variant: "destructive" });
      } else {
        toast({ title: "Admin role removed" });
        fetchData();
      }
    } else {
      // Add admin role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      
      if (error) {
        toast({ title: "Error updating role", variant: "destructive" });
      } else {
        toast({ title: "Admin role granted" });
        fetchData();
      }
    }
  };

  const filteredProfiles = profiles.filter(p =>
    (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              User <span className="gradient-text">Management</span>
            </h1>
            <p className="text-muted-foreground">
              Manage users and their roles
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No users yet</h3>
            <p className="text-muted-foreground">Users will appear here when they sign up</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Target Exam</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Joined</th>
                    <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile, index) => {
                    const role = getUserRole(profile.id);
                    return (
                      <motion.tr
                        key={profile.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-sm font-semibold text-white">
                              {profile.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-medium">{profile.full_name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">ID: {profile.id.slice(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{profile.target_exam || 'Not set'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                            role === 'admin' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-secondary text-muted-foreground'
                          }`}>
                            {role === 'admin' ? 'Admin' : 'Student'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-muted-foreground">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Button
                            variant={role === 'admin' ? 'outline' : 'glass'}
                            size="sm"
                            onClick={() => toggleAdminRole(profile.id)}
                          >
                            {role === 'admin' ? (
                              <><ShieldOff className="w-4 h-4" /> Remove Admin</>
                            ) : (
                              <><Shield className="w-4 h-4" /> Make Admin</>
                            )}
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
