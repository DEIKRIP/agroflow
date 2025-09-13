import React, { createContext, useContext, useEffect, useState } from "react";
import authService from "../utils/authService";
import { supabase } from "../lib/supabase";

// Role normalization function
export const normalizeRole = (r) => {
  const role = (r || '').toLowerCase().trim();
  if (['admin', 'administrator'].includes(role)) return 'admin';
  if (['operator', 'operador'].includes(role)) return 'operator';
  if (['farmer', 'agricultor', 'productor', 'producer'].includes(role)) return 'farmer';
  return 'farmer'; // Default role
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setAuthError(null);

        const sessionResult = await authService.getSession();

        if (
          sessionResult?.success &&
          sessionResult?.data?.session?.user &&
          isMounted
        ) {
          const authUser = sessionResult.data.session.user;
          setUser(authUser);

          // Fetch user profile
          const profileResult = await authService.getUserProfile(authUser.id);

          if (profileResult?.success && isMounted) {
            try {
              const { supabase: client } = await import('../lib/supabase');
              const { data: farmerRow } = await client
                .from('farmers')
                .select('id')
                .eq('user_id', authUser.id)
                .maybeSingle();

              // Debug log
              console.log('User profile from DB:', profileResult.data);
              
              // Check for admin email
              const email = String(authUser?.email || '').toLowerCase();
              const isAdminEmail = email === 'manzanillamadriddeiker@gmail.com';
              
              // Create profile with normalized role
              const userProfileData = {
                ...profileResult.data,
                role: isAdminEmail ? 'admin' : normalizeRole(profileResult.data.role || 'farmer'),
                farmer_id: farmerRow?.id || null
              };
              
              console.log('Final user profile with role:', userProfileData);
              setUserProfile(userProfileData);
            } catch (error) {
              console.error('Error processing user profile:', error);
              setUserProfile({
                ...profileResult.data,
                role: 'farmer' // Safe default
              });
            }
          } else if (isMounted) {
            // Demo mode admin fallback
            const DEMO = String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";
            const adminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase().trim();
            const adminList = String(import.meta.env.VITE_ADMIN_LIST || "").toLowerCase();
            const email = String(authUser?.email || "").toLowerCase();
            const isAdminEmail = !!email && (
              (adminEmail && email === adminEmail) ||
              (adminList && adminList.split(",").map(s => s.trim()).includes(email))
            );

            if (DEMO && isAdminEmail) {
              // Minimal in-memory profile to unlock the app in demo mode
              setUserProfile({
                id: authUser.id,
                email,
                full_name: authUser.user_metadata?.full_name || "Demo Admin",
                role: "admin",
              });
            } else {
              setAuthError(profileResult?.error || "Failed to load user profile");
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          setAuthError("Failed to initialize authentication");
          console.log("Auth initialization error:", error);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = authService.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      setAuthError(null);

      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);

        // Fetch user profile for signed in user
        authService.getUserProfile(session.user.id).then(async (profileResult) => {
          if (profileResult?.success && isMounted) {
            try {
              const { supabase: client } = await import('../lib/supabase');
              const { data: farmerRow } = await client
                .from('farmers')
                .select('id')
                .eq('user_id', session.user.id)
                .maybeSingle();
              setUserProfile({ ...profileResult.data, farmer_id: farmerRow?.id || null });
            } catch (_) {
              setUserProfile(profileResult.data);
            }
          } else if (isMounted) {
            // Demo mode admin fallback on auth change as well
            const DEMO = String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";
            const adminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || "").toLowerCase().trim();
            const adminList = String(import.meta.env.VITE_ADMIN_LIST || "").toLowerCase();
            const email = String(session?.user?.email || "").toLowerCase();
            const isAdminEmail = !!email && (
              (adminEmail && email === adminEmail) ||
              (adminList && adminList.split(",").map(s => s.trim()).includes(email))
            );

            if (DEMO && isAdminEmail) {
              setUserProfile({
                id: session.user.id,
                email,
                full_name: session.user.user_metadata?.full_name || "Demo Admin",
                role: "admin",
              });
            } else {
              setAuthError(profileResult?.error || "Failed to load user profile");
            }
          }
        });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserProfile(null);
      } else if (event === "TOKEN_REFRESHED" && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
    };
  }, []);

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setAuthError(null);
      const result = await authService.signIn(email, password);

      if (!result?.success) {
        setAuthError(result?.error || "Login failed");
        return { success: false, error: result?.error };
      }

      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = "Something went wrong during login. Please try again.";
      setAuthError(errorMsg);
      console.log("Sign in error:", error);
      return { success: false, error: errorMsg };
    }
  };

  // Sign up function
  const signUp = async (email, password, userData = {}) => {
    try {
      setAuthError(null);
      const result = await authService.signUp(email, password, userData);

      if (!result?.success) {
        setAuthError(result?.error || "Signup failed");
        return { success: false, error: result?.error };
      }

      // Finalize signup as productor when signup comes from the public signup page.
      // We don't block the flow if this fails; we log and let UI proceed.
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const newUserId = userRes?.user?.id;
        if (newUserId) {
          await supabase.rpc("finalize_signup_as_productor", { p_user_id: newUserId });
        }
      } catch (e) {
        console.log("finalize_signup_as_productor failed (non-blocking):", e?.message || e);
      }

      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg = "Something went wrong during signup. Please try again.";
      setAuthError(errorMsg);
      console.log("Sign up error:", error);
      return { success: false, error: errorMsg };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setAuthError(null);
      const result = await authService.signOut();

      if (!result?.success) {
        setAuthError(result?.error || "Logout failed");
        return { success: false, error: result?.error };
      }

      return { success: true };
    } catch (error) {
      const errorMsg = "Something went wrong during logout. Please try again.";
      setAuthError(errorMsg);
      console.log("Sign out error:", error);
      return { success: false, error: errorMsg };
    }
  };

  // Update profile function
  const updateProfile = async (updates) => {
    try {
      setAuthError(null);

      if (!user?.id) {
        const errorMsg = "User not authenticated";
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }

      const result = await authService.updateUserProfile(user.id, updates);

      if (!result?.success) {
        setAuthError(result?.error || "Profile update failed");
        return { success: false, error: result?.error };
      }

      setUserProfile(result.data);
      return { success: true, data: result.data };
    } catch (error) {
      const errorMsg =
        "Something went wrong updating profile. Please try again.";
      setAuthError(errorMsg);
      console.log("Update profile error:", error);
      return { success: false, error: errorMsg };
    }
  };

  // Reset password function
  const resetPassword = async (email) => {
    try {
      setAuthError(null);
      const result = await authService.resetPassword(email);

      if (!result?.success) {
        setAuthError(result?.error || "Password reset failed");
        return { success: false, error: result?.error };
      }

      return { success: true };
    } catch (error) {
      const errorMsg =
        "Something went wrong sending reset email. Please try again.";
      setAuthError(errorMsg);
      console.log("Reset password error:", error);
      return { success: false, error: errorMsg };
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    clearError: () => setAuthError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;