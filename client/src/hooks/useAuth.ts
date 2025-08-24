import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get user data from our API once authenticated
  const { data: userData } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!session,
    queryFn: async () => {
      if (!session) return null;
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user: userData,
    session,
    isLoading,
    isAuthenticated: !!session,
    signIn: (email: string, password: string) => 
      supabase.auth.signInWithPassword({ email, password }),
    signUp: (email: string, password: string) => 
      supabase.auth.signUp({ email, password }),
    signOut: () => supabase.auth.signOut(),
  };
}
