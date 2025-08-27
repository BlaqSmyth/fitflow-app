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
    // Handle email confirmation tokens from URL
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');

    if (accessToken && refreshToken && type === 'signup') {
      // Set the session using the tokens from email confirmation
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ data: { session } }) => {
        setSession(session);
        setIsLoading(false);
        // Clean up URL params
        window.history.replaceState({}, document.title, '/');
      });
    } else {
      // Get initial session normally
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setIsLoading(false);
      });
    }

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
      supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth/confirm'
        }
      }),
    signOut: () => supabase.auth.signOut(),
  };
}
