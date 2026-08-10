import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../config/supabase";
import { syncProfile } from "../lib/auth/profile-sync";
import { signOut as authSignOut } from "../lib/auth/phone-auth";
import { User, UserRole } from "../schema/user.schema";

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setProfile(null);
      return;
    }

    const syncedProfile = await syncProfile(nextSession.user);
    setProfile(syncedProfile);
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await loadProfile(data.session);
  }, [loadProfile]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) {
          return;
        }
        setSession(data.session);
        await loadProfile(data.session);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await loadProfile(nextSession);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      role: profile?.role ?? null,
      isAuthenticated: Boolean(session),
      isAdmin: profile?.role === UserRole.ADMIN,
      isLoading,
      refreshProfile,
      signOut,
    }),
    [session, profile, isLoading, refreshProfile, signOut],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}
