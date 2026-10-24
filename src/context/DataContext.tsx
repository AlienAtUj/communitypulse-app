import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Incident,
  Resource,
  Alert,
  IncidentType,
  IncidentStatus,
  ScheduledOutage,
  SEED_INCIDENTS,
  SEED_RESOURCES,
  SEED_SCHEDULED_OUTAGES,
  ACTIVE_ALERT,
} from "../lib/data";
import {
  subscribeToIncidents,
  createIncidentInDb,
  updateIncidentInDb,
  confirmIncidentInDb,
  subscribeToAlerts,
  dismissAlertInDb,
  subscribeToOutages,
  toggleOutageReminderInDb,
  subscribeToResources,
  subscribeToNgoOffers,
  submitNgoOfferInDb,
} from "../lib/firestoreService";
import {
  UserProfile,
  subscribeToAuth,
  signUpUser,
  signInUser,
  signInGuestUser,
  signOutCurrentUser,
} from "../lib/authService";
import { isFirebaseConfigured } from "../lib/firebase";

export interface ToastMessage {
  id: string;
  variant: "success" | "error" | "info";
  message: string;
}

interface DataContextValue {
  // Live Firestore collections
  incidents: Incident[];
  scheduledOutages: ScheduledOutage[];
  resources: Resource[];
  activeAlert: Alert | null;
  ngoOffers: Record<string, { provide: string; quantity: string; eta: string }>;
  isLiveDatabase: boolean;

  // User & Auth
  currentUser: UserProfile | null;
  signUp: (email: string, pass: string, name: string, ward?: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;

  // Actions
  toggleOutageReminder: (id: string) => void;
  dismissAlert: () => void;
  toast: ToastMessage | null;
  showToast: (message: string, variant?: "success" | "error" | "info") => void;
  dismissToast: () => void;
  submitReport: (report: {
    type: IncidentType;
    location: string;
    landmark?: string;
    description?: string;
  }) => string;
  updateIncidentStatus: (id: string, status: IncidentStatus, eta?: string) => void;
  confirmIncident: (id: string) => void;
  submitNgoOffer: (type: IncidentType, details: { provide: string; quantity: string; eta: string }) => void;

  // Navigation & UI state
  selectedIncidentId: string | null;
  setSelectedIncidentId: (id: string | null) => void;
  isReportOpen: boolean;
  setIsReportOpen: (open: boolean) => void;
  pathname: string;
  navigate: (to: string) => void;
  visitedScreens: Record<string, boolean>;
  markScreenVisited: (screen: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [scheduledOutages, setScheduledOutages] = useState<ScheduledOutage[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [ngoOffers, setNgoOffers] = useState<
    Record<string, { provide: string; quantity: string; eta: string }>
  >({});
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLiveDatabase] = useState<boolean>(isFirebaseConfigured);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(() => {
    return typeof window !== "undefined" && window.location.pathname === "/report";
  });
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window === "undefined") return "/";
    return window.location.pathname === "/report" ? "/" : window.location.pathname || "/";
  });
  const [visitedScreens, setVisitedScreens] = useState<Record<string, boolean>>({});

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, variant: "success" | "error" | "info" = "success") => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      const id = `TOAST-${Date.now()}`;
      setToast({ id, variant, message });
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, 3500);
    },
    []
  );

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToast(null);
  }, []);

  // Subscribe to real-time collections
  useEffect(() => {
    const unsubIncidents = subscribeToIncidents((liveIncidents) => {
      setIncidents(liveIncidents);
    });

    const unsubAlerts = subscribeToAlerts((liveAlert) => {
      setActiveAlert(liveAlert);
    });

    const unsubOutages = subscribeToOutages((liveOutages) => {
      setScheduledOutages(liveOutages);
    });

    const unsubResources = subscribeToResources((liveResources) => {
      setResources(liveResources);
    });

    const unsubNgo = subscribeToNgoOffers((liveNgo) => {
      setNgoOffers(liveNgo);
    });

    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubIncidents();
      unsubAlerts();
      unsubOutages();
      unsubResources();
      unsubNgo();
      unsubAuth();
    };
  }, []);

  // Auth actions
  const signUp = useCallback(
    async (email: string, pass: string, name: string, ward?: string) => {
      const user = await signUpUser(email, pass, name, ward);
      setCurrentUser(user);
      showToast(`Welcome to CommunityPulse, ${user.displayName || "Neighbor"}!`, "success");
    },
    [showToast]
  );

  const signIn = useCallback(
    async (email: string, pass: string) => {
      const user = await signInUser(email, pass);
      setCurrentUser(user);
      showToast("Signed in successfully!", "success");
    },
    [showToast]
  );

  const signInGuest = useCallback(async () => {
    const user = await signInGuestUser();
    setCurrentUser(user);
    showToast("Signed in as Guest Resident", "info");
  }, [showToast]);

  const signOut = useCallback(async () => {
    await signOutCurrentUser();
    setCurrentUser(null);
    showToast("Signed out", "info");
  }, [showToast]);

  const dismissAlert = useCallback(() => {
    if (activeAlert) {
      dismissAlertInDb(activeAlert.id);
    }
    setActiveAlert(null);
  }, [activeAlert]);

  const toggleOutageReminder = useCallback(
    (id: string) => {
      const target = scheduledOutages.find((o) => o.id === id);
      const nextState = target ? !target.reminderSet : true;
      toggleOutageReminderInDb(id, nextState);
      setScheduledOutages((prev) =>
        prev.map((item) => (item.id === id ? { ...item, reminderSet: nextState } : item))
      );
      if (target) {
        showToast(
          nextState
            ? `Reminder set for ${target.day} (${target.timeSlot}). We'll alert you on the day.`
            : `Reminder removed for ${target.title}.`,
          nextState ? "success" : "info"
        );
      }
    },
    [scheduledOutages, showToast]
  );

  const navigate = useCallback((to: string) => {
    if (to === "/report") {
      setIsReportOpen(true);
      window.history.pushState({}, "", "/report");
      return;
    }
    setIsReportOpen(false);
    setPathname(to);
    window.history.pushState({}, "", to);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const current = window.location.pathname || "/";
      if (current === "/report") {
        setIsReportOpen(true);
      } else {
        setIsReportOpen(false);
        setPathname(current);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSetReportOpen = useCallback(
    (open: boolean) => {
      setIsReportOpen(open);
      if (open) {
        window.history.pushState({}, "", "/report");
      } else if (window.location.pathname === "/report") {
        window.history.pushState({}, "", pathname || "/");
      }
    },
    [pathname]
  );

  const submitReport = useCallback(
    (report: {
      type: IncidentType;
      location: string;
      landmark?: string;
      description?: string;
    }) => {
      const newId = `INC-${Date.now().toString().slice(-5)}`;
      createIncidentInDb(report, currentUser?.uid);
      showToast("Incident reported. Connecting with responders...", "success");
      return newId;
    },
    [currentUser?.uid, showToast]
  );

  const updateIncidentStatus = useCallback(
  (id: string, status: IncidentStatus, eta?: string) => {
    updateIncidentInDb(id, status, eta);

    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === id
          ? {
              ...inc,
              status,
              eta: eta !== undefined ? eta : inc.eta,
              resolvedAt:
                status === "resolved"
                  ? new Date().toISOString()
                  : undefined,
            }
          : inc
      )
    );
  },
  []
);

  const confirmIncident = useCallback((id: string) => {
    confirmIncidentInDb(id);
  }, []);

  const submitNgoOffer = useCallback(
    (type: IncidentType, details: { provide: string; quantity: string; eta: string }) => {
      submitNgoOfferInDb(type, details);
      setNgoOffers((prev) => ({
        ...prev,
        [type]: details,
      }));
    },
    []
  );

  const markScreenVisited = useCallback((screen: string) => {
    setVisitedScreens((prev) => (prev[screen] ? prev : { ...prev, [screen]: true }));
  }, []);

  return (
    <DataContext.Provider
      value={{
        incidents,
        scheduledOutages,
        toggleOutageReminder,
        resources,
        activeAlert,
        dismissAlert,
        toast,
        showToast,
        dismissToast,
        submitReport,
        updateIncidentStatus,
        confirmIncident,
        ngoOffers,
        submitNgoOffer,
        selectedIncidentId,
        setSelectedIncidentId,
        isReportOpen,
        setIsReportOpen: handleSetReportOpen,
        pathname,
        navigate,
        visitedScreens,
        markScreenVisited,
        currentUser,
        isLiveDatabase,
        signUp,
        signIn,
        signInGuest,
        signOut,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider");
  }
  return ctx;
}

export function usePathname(): string {
  const { pathname } = useData();
  return pathname;
}
