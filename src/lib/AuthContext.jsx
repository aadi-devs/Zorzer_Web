import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

async function fetchProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, plan_id, plan:plans(id, name, methods, access_layers, max_duration, max_daily_runs, features, tagline, price, highlight)')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('[AuthContext] fetchProfile error:', error.message);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error('[AuthContext] fetchProfile exception:', err.message);
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user,            setUser]            = useState(null);
  const [profile,         setProfile]         = useState(null);
  const [isAdmin,         setIsAdmin]         = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth,   setIsLoadingAuth]   = useState(true);

  // Counter to discard results from stale concurrent applySession calls.
  const applySeqRef = useRef(0);

  const applySession = async (supabaseUser) => {
    const seq = ++applySeqRef.current;
    if (supabaseUser) {
      const prof = await fetchProfile(supabaseUser.id);
      if (seq !== applySeqRef.current) return; // superseded by a newer call
      setUser(supabaseUser);
      setIsAuthenticated(true);
      setProfile(prof);
      setIsAdmin(!!prof?.is_admin);
    } else {
      if (seq !== applySeqRef.current) return;
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
      setIsLoadingAuth(false);
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
      options: { data: { full_name: fullName || null } },
    });
    if (error) throw new Error(error.message);

    // The DB trigger (handle_new_user) creates the profile row.
    // We upsert to set full_name in case the trigger runs before or after us.
    if (data.user) {
      try {
        await supabase.from("profiles").upsert(
          { id: data.user.id, email: data.user.email, full_name: fullName || null, plan_id: null, is_admin: false },
          { onConflict: "id" }
        );
      } catch (upsertErr) {
        console.warn('[AuthContext] profile upsert warning:', upsertErr.message);
      }
    }

    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    // Full reload to flush all in-memory state
    window.location.href = '/login';
  };

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
      navigateToLogin: () => { window.location.href = '/login'; },
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
