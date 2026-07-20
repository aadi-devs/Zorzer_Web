import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

async function fetchProfile(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, is_admin, plan_id, plan:plans(id, name, methods, access_layers, max_duration, max_daily_runs, features, tagline, price, highlight)')
    .eq('id', userId)
    .single();
  return data || null;
}

export const AuthProvider = ({ children }) => {
  const [user,            setUser]            = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [isAdmin,         setIsAdmin]         = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth,   setIsLoadingAuth]   = useState(true);

  const applySession = async (supabaseUser) => {
    if (supabaseUser) {
      setUser(supabaseUser);
      setIsAuthenticated(true);
      const prof = await fetchProfile(supabaseUser.id);
      setProfile(prof);
      setIsAdmin(!!prof?.is_admin);
    } else {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      await applySession(session?.user ?? null);
      setIsLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  };

  const register = async (email, password, fullName = "") => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || null },
      },
    });
    if (error) throw new Error(error.message);

    // The DB trigger (handle_new_user) creates the profile row automatically.
    // We follow up with an update to save full_name and ensure plan_id is null.
    // Using upsert (no ignoreDuplicates) handles the rare case where the trigger
    // hasn't fired yet.
    if (data.user) {
      await supabase.from("profiles").upsert(
        {
          id:        data.user.id,
          email:     data.user.email,
          full_name: fullName || null,
          plan_id:   null,
          is_admin:  false,
        },
        { onConflict: "id" }
      );
    }

    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const navigateToLogin = () => { window.location.href = '/login'; };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAdmin,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      authChecked: true,
      login,
      register,
      logout,
      navigateToLogin,
      checkUserAuth: () => {},
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
