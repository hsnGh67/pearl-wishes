import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  const profileLoadRef = useRef<Promise<void> | null>(null);
  const profileLoadAuthIdRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setProfile(null);
      profileLoadRef.current = null;
      profileLoadAuthIdRef.current = null;
      return;
    }

    const authId = nextSession.user.id;

    // Reuse in-flight sync for the same auth user (getSession + onAuthStateChange race)
    if (
      profileLoadRef.current &&
      profileLoadAuthIdRef.current === authId
    ) {
      await profileLoadRef.current;
      return;
    }

    const loadPromise = (async () => {
      const syncedProfile = await syncProfile(nextSession.user);
      setProfile(syncedProfile);
    })();

    profileLoadAuthIdRef.current = authId;
    profileLoadRef.current = loadPromise;

    try {
      await loadPromise;
    } finally {
      if (profileLoadRef.current === loadPromise) {
        profileLoadRef.current = null;
        profileLoadAuthIdRef.current = null;
      }
    }
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
      try {
        if (nextSession?.user) {
          setIsLoading(true);
          await loadProfile(nextSession);
        } else {
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
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
