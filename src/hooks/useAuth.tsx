import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  viewMode: 'admin' | 'student';
  setViewMode: (mode: 'admin' | 'student') => void;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; isAdmin?: boolean }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'admin' | 'student'>('student');

  const checkAdminRole = useCallback(async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    const adminStatus = !!data && !error;
    setIsAdmin(adminStatus);
    // Set view mode based on role
    if (adminStatus) {
      const savedMode = localStorage.getItem('viewMode') as 'admin' | 'student' | null;
      setViewMode(savedMode || 'admin');
    } else {
      setViewMode('student');
    }
    return adminStatus;
  }, []);

  const handleSetViewMode = useCallback((mode: 'admin' | 'student') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  }, []);

  const refreshRole = useCallback(async (): Promise<boolean> => {
    if (user) {
      return await checkAdminRole(user.id);
    }
    return false;
  }, [user, checkAdminRole]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Only set loading false after initial check
        if (event === 'INITIAL_SESSION') {
          setIsLoading(false);
        }

        // Check admin role after auth state change
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setViewMode('student');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!error && data.user) {
      // Check admin status immediately after sign in
      const adminStatus = await checkAdminRole(data.user.id);
      return { error: null, isAdmin: adminStatus };
    }
    
    return { error };
  };

  const signOut = async () => {
    setIsAdmin(false);
    setViewMode('student');
    localStorage.removeItem('viewMode');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      isAdmin,
      viewMode,
      setViewMode: handleSetViewMode,
      signUp, 
      signIn, 
      signOut,
      refreshRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
