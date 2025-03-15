import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  role_id: string;
  full_name: string;
  role?: {
    name: string;
  };
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  
  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;

    // Get user role after successful sign in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        role_id,
        full_name,
        role:roles (
          name
        )
      `)
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) throw new Error('No profile found');

    // Return the appropriate redirect path based on role
    if (profile.role?.name === 'user') {
      return '/';
    } else if (profile.role?.name === 'admin' || profile.role?.name === 'super_admin') {
      return '/dashboard';
    } else {
      return '/';
    }
  },
  
  signUp: async (email: string, password: string, fullName: string) => {
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (signUpError) throw signUpError;
      if (!user) throw new Error('No user returned after signup');
      
      // Get default user role
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'user')
        .single();
        
      if (roleError) throw roleError;
      if (!roleData) throw new Error('Default role not found');
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          role_id: roleData.id,
          full_name: fullName,
        });
        
      if (profileError) throw profileError;
    } catch (error) {
      console.error('Error during signup:', error);
      throw error;
    }
  },
  
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, profile: null });
    } catch (error) {
      console.error('Error during signout:', error);
      throw error;
    }
  },
  
  loadProfile: async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        set({ user: null, profile: null, loading: false });
        return;
      }
      
      if (!session) {
        set({ user: null, profile: null, loading: false });
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('User error:', userError);
        set({ user: null, profile: null, loading: false });
        return;
      }
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id,
            role_id,
            full_name,
            role:roles (
              name
            )
          `)
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError);
          set({ user: null, profile: null, loading: false });
          return;
        }
        
        set({ 
          user, 
          profile: profile || null,
          loading: false 
        });
      } else {
        set({ user: null, profile: null, loading: false });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      set({ user: null, profile: null, loading: false });
    }
  },
}));

// Initialize auth state
supabase.auth.onAuthStateChange((_event, session) => {
  if (session?.user) {
    useAuthStore.getState().loadProfile();
  } else {
    useAuthStore.setState({ user: null, profile: null, loading: false });
  }
});