"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { authApi } from "@/lib/api/auth";
import type {
  SessionUser,
  SignInPayload,
  SignUpPayload,
  TokenPair,
} from "@/lib/api/types";
import { SESSION_EXPIRED_EVENT } from "@/lib/auth/cookies";
import {
  clearSession,
  getRefreshToken,
  saveSession,
} from "@/lib/auth/session";

type SessionStatus = "loading" | "authenticated" | "unauthenticated";

type SessionContextValue = {
  user: SessionUser | null;
  status: SessionStatus;
  signIn: (payload: SignInPayload) => Promise<SessionUser>;
  signUp: (payload: SignUpPayload) => Promise<SessionUser>;
  signOut: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<SessionStatus>(() =>
    getRefreshToken() ? "loading" : "unauthenticated",
  );

  const loadUser = useCallback(async () => {
    const nextUser = await authApi.me();
    setUser(nextUser);
    setStatus("authenticated");
    return nextUser;
  }, []);

  const startSession = useCallback(
    async (tokens: TokenPair) => {
      saveSession(tokens);

      try {
        return await loadUser();
      } catch (error) {
        clearSession();
        throw error;
      }
    },
    [loadUser],
  );

  const signIn = useCallback(
    async (payload: SignInPayload) => startSession(await authApi.login(payload)),
    [startSession],
  );

  const signUp = useCallback(
    async (payload: SignUpPayload) =>
      startSession(await authApi.register(payload)),
    [startSession],
  );

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
    router.replace("/signin");
  }, [router]);

  // Restore the session on first load and keep it valid across tabs.
  useEffect(() => {
    if (!getRefreshToken()) return;

    let cancelled = false;

    (async () => {
      try {
        const nextUser = await authApi.me();
        if (!cancelled) {
          setUser(nextUser);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // The interceptor emits this when the refresh token is no longer accepted.
  useEffect(() => {
    function handleExpired() {
      setUser(null);
      setStatus("unauthenticated");
      router.replace("/signin");
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [router]);

  const value = useMemo<SessionContextValue>(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession must be used inside a SessionProvider");
  }

  return context;
}
