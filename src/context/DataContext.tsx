
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
  NgoOffer,
} from "../lib/data";

import {
  subscribeToIncidents,
  createIncidentInDb,
  updateIncidentInDb,
  confirmIncidentInDb,
  subscribeToAlerts,
  dismissAlertInDb,
  broadcastAlertInDb,
  subscribeToOutages,
  createOutageInDb,
  toggleOutageReminderInDb,
  subscribeToResources,
  createResourceInDb,
  subscribeToNgoOffers,
  submitNgoOfferInDb,
  addIncidentUpdateInDb,
} from "../lib/firestoreService";

import {
  UserProfile,
  subscribeToAuth,
  signUpUser,
  signInUser,
  signOutCurrentUser,
  updateUserLocationInDb,
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
  ngoOffers: NgoOffer[];
  isLiveDatabase: boolean;

  // User & Auth
  currentUser: UserProfile | null;

  signUp: (
    email: string,
    pass: string,
    name: string,
    ward?: string,
    coordinates?: { lat: number; lng: number }
  ) => Promise<void>;

  updateUserLocation: (
    ward: string,
    coordinates?: { lat: number; lng: number }
  ) => Promise<void>;

  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Actions
  toggleOutageReminder: (id: string) => void;
  dismissAlert: () => void;
  toast: ToastMessage | null;
  showToast: (
    message: string,
    variant?: "success" | "error" | "info"
  ) => void;
  dismissToast: () => void;

  submitReport: (report: {
    type: IncidentType;
    location: string;
    landmark?: string;
    description?: string;
    coordinates?: { lat: number; lng: number };
    accuracy?: number;
  }) => Promise<string>;

  updateIncidentStatus: (
    id: string,
    status: IncidentStatus,
    eta?: string
  ) => void;

  confirmIncident: (id: string) => void;

  submitNgoOffer: (
    type: IncidentType,
    details: {
      provide: string;
      quantity: string;
      eta: string;
      ngoName?: string;
    }
  ) => Promise<void>;

  createScheduledOutage: (
    outage: Omit<ScheduledOutage, "id">
  ) => Promise<string>;

  createResource: (
    res: Omit<Resource, "id">
  ) => Promise<string>;

  broadcastAlert: (
    alert: Omit<Alert, "id">
  ) => Promise<string>;

  addIncidentUpdate: (
    incidentId: string,
    message: string,
    responder?: string
  ) => Promise<void>;

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

export function DataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [scheduledOutages, setScheduledOutages] = useState<
    ScheduledOutage[]
  >([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);

  const [ngoOffers, setNgoOffers] = useState<NgoOffer[]>([]);

  const [currentUser, setCurrentUser] =
    useState<UserProfile | null>(null);

  const [isLiveDatabase] = useState<boolean>(isFirebaseConfigured);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] =
    useState<string | null>(null);

  const [isReportOpen, setIsReportOpen] = useState<boolean>(() => {
    return (
      typeof window !== "undefined" &&
      window.location.pathname === "/report"
    );
  });

  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window === "undefined") return "/";

    return window.location.pathname === "/report"
      ? "/"
      : window.location.pathname || "/";
  });

  const [visitedScreens, setVisitedScreens] = useState<
    Record<string, boolean>
  >({});

  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback(
    (
      message: string,
      variant: "success" | "error" | "info" = "success"
    ) => {
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

    const unsubNgo = subscribeToNgoOffers((liveNgoOffers) => {
      setNgoOffers(liveNgoOffers);
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
    async (
      email: string,
      pass: string,
      name: string,
      ward?: string,
      coordinates?: { lat: number; lng: number }
    ) => {
      const user = await signUpUser(
        email,
        pass,
        name,
        ward,
        coordinates
      );

      setCurrentUser(user);

      showToast(
        `Welcome to CommunityPulse, ${
          user.displayName || "Resident"
        }!`,
        "success"
      );
    },
    [showToast]
  );

  const updateUserLocation = useCallback(
    async (
      ward: string,
      coordinates?: { lat: number; lng: number }
    ) => {
      if (!currentUser) return;

      await updateUserLocationInDb(
        currentUser.uid,
        ward,
        coordinates
      );

      setCurrentUser((prev) =>
        prev ? { ...prev, ward, coordinates } : null
      );

      showToast(`Location updated to ${ward}`, "success");
    },
    [currentUser, showToast]
  );

  const signIn = useCallback(
    async (email: string, pass: string) => {
      const user = await signInUser(email, pass);

      setCurrentUser(user);
      showToast("Signed in successfully!", "success");
    },
    [showToast]
  );

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
        prev.map((item) =>
          item.id === id
            ? { ...item, reminderSet: nextState }
            : item
        )
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
    window.scrollTo({
      top: 0,
      behavior: "instant" as ScrollBehavior,
    });
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

    return () =>
      window.removeEventListener("popstate", handlePopState);
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
    async (report: {
      type: IncidentType;
      location: string;
      landmark?: string;
      description?: string;
      coordinates?: { lat: number; lng: number };
      accuracy?: number;
    }): Promise<string> => {
      if (!currentUser || currentUser.isAnonymous) {
        showToast(
          "Verified account required. Please sign in before reporting.",
          "error"
        );

        throw new Error(
          "Verified account required to submit report."
        );
      }

      try {
        const newId = await createIncidentInDb(
          report,
          currentUser.uid
        );

        showToast(
          "Incident reported successfully. Connecting with responders...",
          "success"
        );

        return newId;
      } catch (error) {
        console.error(
          "Failed to submit incident report:",
          error
        );

        showToast(
          "Your report could not be saved. Please try again.",
          "error"
        );

        throw error;
      }
    },
    [currentUser, showToast]
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

  const confirmIncident = useCallback(
    (id: string) => {
      confirmIncidentInDb(id);

      showToast(
        "Confirmed! Your report strengthens community priority.",
        "success"
      );
    },
    [showToast]
  );

  // Every submission is stored as a separate offer.
  const submitNgoOffer = useCallback(
    async (
      type: IncidentType,
      details: {
        provide: string;
        quantity: string;
        eta: string;
        ngoName?: string;
      }
    ) => {
      try {
        await submitNgoOfferInDb(type, {
          ...details,
          ngoName:
            details.ngoName?.trim() ||
            currentUser?.displayName ||
            currentUser?.email ||
            "Community NGO",
        });

        showToast(
          "Offer registered successfully.",
          "success"
        );
      } catch (error) {
        console.error("Failed to submit NGO offer:", error);

        showToast(
          "Your offer could not be saved. Please try again.",
          "error"
        );

        throw error;
      }
    },
    [currentUser, showToast]
  );

  const createScheduledOutage = useCallback(
    async (outage: Omit<ScheduledOutage, "id">) => {
      const id = await createOutageInDb(outage);

      showToast(
        "Outage schedule published to live database.",
        "success"
      );

      return id;
    },
    [showToast]
  );

  const createResource = useCallback(
    async (res: Omit<Resource, "id">) => {
      const id = await createResourceInDb(res);

      showToast(
        "Relief resource added to live database.",
        "success"
      );

      return id;
    },
    [showToast]
  );

  const broadcastAlert = useCallback(
    async (alert: Omit<Alert, "id">) => {
      const id = await broadcastAlertInDb(alert);

      showToast(
        "Emergency alert broadcasted live to all residents.",
        "success"
      );

      return id;
    },
    [showToast]
  );

  const addIncidentUpdate = useCallback(
    async (
      incidentId: string,
      message: string,
      responder?: string
    ) => {
      await addIncidentUpdateInDb(
        incidentId,
        message,
        responder
      );

      showToast(
        "Official update saved and broadcasted.",
        "success"
      );
    },
    [showToast]
  );

  const markScreenVisited = useCallback((screen: string) => {
    setVisitedScreens((prev) =>
      prev[screen] ? prev : { ...prev, [screen]: true }
    );
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
        createScheduledOutage,
        createResource,
        broadcastAlert,
        addIncidentUpdate,
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
        updateUserLocation,
        signIn,
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
