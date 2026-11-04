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

import { ApiError } from "@/lib/api/client";
import {
  organizationApi,
  type Organization,
} from "@/lib/api/organizations";

const SELECTED_ORGANIZATION_KEY = "sabicheck:selected-organization";

const LOAD_ERROR_MESSAGE =
  "We could not load your organizations. Please try again.";

type OrganizationStatus = "loading" | "ready" | "error";

type OrganizationContextValue = {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  selectedOrganizationId: string | null;
  status: OrganizationStatus;
  error: string | null;
  selectOrganization: (organizationId: string) => void;
  refresh: () => Promise<void>;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null,
);

function readStoredSelection(): string | null {
  try {
    return window.localStorage.getItem(SELECTED_ORGANIZATION_KEY);
  } catch {
    return null;
  }
}

function storeSelection(organizationId: string) {
  try {
    window.localStorage.setItem(SELECTED_ORGANIZATION_KEY, organizationId);
  } catch {
    // Selection persistence is best-effort.
  }
}

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : LOAD_ERROR_MESSAGE;
}

/**
 * Loads the signed-in user's organizations once and shares the selected
 * workspace with the dashboard shell.
 */
export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null
  >(null);
  const [status, setStatus] = useState<OrganizationStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const nextOrganizations = await organizationApi.list();
        if (cancelled) return;

        const storedId = readStoredSelection();
        const nextSelectedId =
          nextOrganizations.find(
            (organization) => organization.id === storedId,
          )?.id ??
          nextOrganizations[0]?.id ??
          null;

        setOrganizations(nextOrganizations);
        setSelectedOrganizationId(nextSelectedId);
        setStatus("ready");
      } catch (cause) {
        if (cancelled) return;

        setError(errorMessage(cause));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "ready" && selectedOrganizationId) {
      storeSelection(selectedOrganizationId);
    }
  }, [selectedOrganizationId, status]);

  const refresh = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const nextOrganizations = await organizationApi.list();
      const storedId = readStoredSelection();
      const currentStillExists = nextOrganizations.some(
        (organization) => organization.id === selectedOrganizationId,
      );
      const nextSelectedId = currentStillExists
        ? selectedOrganizationId
        : nextOrganizations.find(
              (organization) => organization.id === storedId,
            )?.id ??
          nextOrganizations[0]?.id ??
          null;

      setOrganizations(nextOrganizations);
      setSelectedOrganizationId(nextSelectedId);
      setStatus("ready");
    } catch (cause) {
      setError(errorMessage(cause));
      setStatus("error");
    }
  }, [selectedOrganizationId]);

  const selectOrganization = useCallback((organizationId: string) => {
    setSelectedOrganizationId(organizationId);
  }, []);

  const selectedOrganization = useMemo(
    () =>
      organizations.find(
        (organization) => organization.id === selectedOrganizationId,
      ) ?? null,
    [organizations, selectedOrganizationId],
  );

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organizations,
      selectedOrganization,
      selectedOrganizationId,
      status,
      error,
      selectOrganization,
      refresh,
    }),
    [
      organizations,
      selectedOrganization,
      selectedOrganizationId,
      status,
      error,
      selectOrganization,
      refresh,
    ],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizations(): OrganizationContextValue {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error(
      "useOrganizations must be used inside an OrganizationProvider",
    );
  }

  return context;
}
