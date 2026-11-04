"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useOrganizations } from "@/components/organizations/organization-provider";
import { ApiError } from "@/lib/api/client";
import {
  overviewApi,
  type OrganizationOverview,
} from "@/lib/api/overview";

type OverviewStatus = "loading" | "ready" | "error";

type OverviewStatsContextValue = {
  stats: OrganizationOverview | null;
  status: OverviewStatus;
  error: string | null;
  refresh: () => void;
};

const OverviewStatsContext =
  createContext<OverviewStatsContextValue | null>(null);

export function OverviewStatsProvider({ children }: { children: ReactNode }) {
  const { selectedOrganizationId } = useOrganizations();
  const [stats, setStats] = useState<OrganizationOverview | null>(null);
  const [status, setStatus] = useState<OverviewStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!selectedOrganizationId) {
      return;
    }

    let cancelled = false;

    (async () => {
      setStatus("loading");
      setError(null);
      setStats(null);

      try {
        const result = await overviewApi.get(selectedOrganizationId);
        if (cancelled) return;

        setStats(result);
        setStatus("ready");
      } catch (cause) {
        if (cancelled) return;

        setError(
          cause instanceof ApiError
            ? cause.message
            : "We could not load your overview. Please try again.",
        );
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedOrganizationId, reloadKey]);

  const refresh = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  const value = useMemo(
    () => ({ stats, status, error, refresh }),
    [stats, status, error, refresh],
  );

  return (
    <OverviewStatsContext.Provider value={value}>
      {children}
    </OverviewStatsContext.Provider>
  );
}

export function useOverviewStats() {
  const context = useContext(OverviewStatsContext);

  if (!context) {
    throw new Error(
      "useOverviewStats must be used inside an OverviewStatsProvider",
    );
  }

  return context;
}
