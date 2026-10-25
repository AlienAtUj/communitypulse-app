import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db, auth, isFirebaseConfigured } from "./firebase";
import {
  Incident,
  ScheduledOutage,
  Resource,
  Alert,
  IncidentType,
  IncidentStatus,
  SEED_RESOURCES,
} from "./data";

const LOCAL_STORAGE_KEY_INCIDENTS = "cp_real_incidents";
const LOCAL_STORAGE_KEY_OUTAGES = "cp_real_outages";
const LOCAL_STORAGE_KEY_RESOURCES = "cp_real_resources";
const LOCAL_STORAGE_KEY_ALERT = "cp_real_alert";
const LOCAL_STORAGE_KEY_NGO = "cp_real_ngo_offers";

// Helper for local storage persistence when Firestore is offline or unconfigured
function getLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn("Local storage write failed:", err);
  }
}

let seedingPromise: Promise<void> | null = null;

/**
 * Initializes verified South African emergency relief services into Firestore if empty.
 * NOTE: Mock dummy incidents, mock outages, and fake alerts are NEVER auto-seeded.
 */
export async function seedLiveDatabaseIfEmpty(): Promise<void> {
  if (!db) return;
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    try {
      const snap = await getDocs(collection(db, "resources"));
      if (snap.empty) {
        console.log("Initializing verified community emergency resources...");
        for (const res of SEED_RESOURCES) {
          await setDoc(doc(db, "resources", res.id), {
            ...res,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (e) {
      console.warn("Notice: Resource init check:", e);
    }
  })();

  return seedingPromise;
}

/**
 * Purges any leftover legacy mock data (INC-001..006, SCH-001..005, ALERT-001, RES-001..005)
 * from both Firestore and local browser storage so only real community data exists.
 */
export async function purgeMockDataFromDb(): Promise<{ purgedCount: number }> {
  let count = 0;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_INCIDENTS);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_OUTAGES);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_ALERT);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_NGO);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_RESOURCES);
    } catch {
      // ignore
    }
  }

  if (!db) return { purgedCount: 0 };

  const mockIncidentIds = ["INC-001", "INC-002", "INC-003", "INC-004", "INC-005", "INC-006"];
  const mockOutageIds = ["SCH-001", "SCH-002", "SCH-003", "SCH-004", "SCH-005"];
  const mockAlertIds = ["ALERT-001"];
  const mockResourceIds = ["RES-001", "RES-002", "RES-003", "RES-004", "RES-005"];

  for (const id of mockIncidentIds) {
    try {
      await deleteDoc(doc(db, "incidents", id));
      count++;
    } catch {
      // document may not exist
    }
  }

  for (const id of mockOutageIds) {
    try {
      await deleteDoc(doc(db, "outages", id));
      count++;
    } catch {
      // document may not exist
    }
  }

  for (const id of mockAlertIds) {
    try {
      await deleteDoc(doc(db, "alerts", id));
      count++;
    } catch {
      // document may not exist
    }
  }

  for (const id of mockResourceIds) {
    try {
      await deleteDoc(doc(db, "resources", id));
      count++;
    } catch {
      // document may not exist
    }
  }

  return { purgedCount: count };
}

/**
 * Real-time subscription to Incidents collection
 */
export function subscribeToIncidents(
  callback: (incidents: Incident[]) => void
): () => void {
  if (!db) {
    const local = getLocalStorage<Incident[]>(
      LOCAL_STORAGE_KEY_INCIDENTS,
      []
    );
    callback(local);
    return () => {};
  }

  // Trigger resource verification if brand new database
  seedLiveDatabaseIfEmpty();

  const q = query(
    collection(db, "incidents"),
    orderBy("createdAt", "desc"),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Incident[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          type: data.type as IncidentType,
          location: data.location || "",
          affected: Number(data.affected || 0),
          confirmations: Number(data.confirmations || 0),
          status: (data.status as IncidentStatus) || "reported",
          priority: data.priority || "high",
          facilities: data.facilities || [],
          time: data.time || "Just now",
          eta: data.eta,
          resolvedAt: data.resolvedAt,
          description: data.description,
          latestUpdate: data.latestUpdate,
          latestUpdateBy: data.latestUpdateBy,
          isMine: Boolean(data.isMine),
          coordinates: data.coordinates,
          accuracy: data.accuracy ? Number(data.accuracy) : undefined,
        });
      });

      setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, list);
      callback(list);
    },
    (err) => {
      console.warn("Firestore incidents listener error (using cache):", err);
      const fallback = getLocalStorage<Incident[]>(
        LOCAL_STORAGE_KEY_INCIDENTS,
        []
      );
      callback(fallback);
    }
  );
}

/**
 * Add a new real Incident to Firestore
 */
export async function createIncidentInDb(
  report: {
    type: IncidentType;
    location: string;
    landmark?: string;
    description?: string;
    coordinates?: { lat: number; lng: number };
    accuracy?: number;
  },
  userId?: string
): Promise<string> {
  // Verified account check: guest reporting is disabled to prevent false updates
  const activeUser = auth?.currentUser;
  const effectiveUserId = activeUser?.uid || userId;
  if (!effectiveUserId || activeUser?.isAnonymous) {
    throw new Error(
      "A verified registered account is required to report incidents. Guest reporting is disabled to prevent false updates."
    );
  }

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${mins}`;

  const fullLocation = report.landmark?.trim()
    ? `${report.landmark.trim()}, ${report.location}`
    : report.location;

  const safeLocation = (fullLocation.trim() || "Ward 8").slice(0, 190);
  const safeDescription = (
    report.description?.trim() ||
    "Reported by resident via CommunityPulse mobile."
  ).slice(0, 800);

  const newId = `INC-${Date.now().toString().slice(-6)}`;

  const incidentData: Partial<Incident> & {
    createdAt: unknown;
    updatedAt: unknown;
    userId?: string;
  } = {
    id: newId,
    type: report.type,
    location: safeLocation,
    affected: 1,
    confirmations: 1,
    status: "reported",
    priority:
      report.type === "flood" || report.type === "fire" ? "critical" : "high",
    facilities:
      report.description && report.description.toLowerCase().includes("clinic")
        ? ["Clinic fridge"]
        : ["Local area"],
    time: timeStr,
    description: safeDescription,
    isMine: true,
    coordinates: report.coordinates,
    accuracy: report.accuracy,
    userId: effectiveUserId || "anonymous",
    createdAt: db ? serverTimestamp() : new Date().toISOString(),
    updatedAt: db ? serverTimestamp() : new Date().toISOString(),
  };

  if (db) {
    await setDoc(doc(db, "incidents", newId), incidentData);
  } else {
    const list = getLocalStorage<Incident[]>(
      LOCAL_STORAGE_KEY_INCIDENTS,
      []
    );
    const updated = [incidentData as Incident, ...list];
    setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, updated);
  }

  return newId;
}

/**
 * Update incident status, ETA, and resolution in Firestore
 */
export async function updateIncidentInDb(
  id: string,
  status: IncidentStatus,
  eta?: string
): Promise<void> {
  if (db) {
    const ref = doc(db, "incidents", id);
    const updates: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (eta !== undefined) {
      updates.eta = eta;
    }
    if (status === "resolved") {
      updates.resolvedAt = new Date().toISOString();
    }
    await updateDoc(ref, updates);
  } else {
    const list = getLocalStorage<Incident[]>(
      LOCAL_STORAGE_KEY_INCIDENTS,
      []
    );
    const updated = list.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            eta: eta !== undefined ? eta : item.eta,
            resolvedAt: status === "resolved" ? new Date().toISOString() : undefined,
          }
        : item
    );
    setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, updated);
  }
}

/**
 * Atomically increment incident confirmation count in Firestore
 */
export async function confirmIncidentInDb(id: string): Promise<void> {
  if (db) {
    const ref = doc(db, "incidents", id);
    await updateDoc(ref, {
      confirmations: increment(1),
      updatedAt: serverTimestamp(),
    });
  } else {
    const list = getLocalStorage<Incident[]>(
      LOCAL_STORAGE_KEY_INCIDENTS,
      []
    );
    const updated = list.map((item) =>
      item.id === id ? { ...item, confirmations: (item.confirmations || 0) + 1 } : item
    );
    setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, updated);
  }
}

/**
 * Add official responder update to incident in Firestore
 */
export async function addIncidentUpdateInDb(
  incidentId: string,
  message: string,
  responder: string = "Municipal Dispatch"
): Promise<void> {
  if (db) {
    const ref = doc(db, "incidents", incidentId);
    await updateDoc(ref, {
      latestUpdate: message,
      latestUpdateBy: responder,
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Real-time subscription to Active Alerts collection
 */
export function subscribeToAlerts(
  callback: (alert: Alert | null) => void
): () => void {
  if (!db) {
    callback(getLocalStorage<Alert | null>(LOCAL_STORAGE_KEY_ALERT, null));
    return () => {};
  }

  return onSnapshot(
    collection(db, "alerts"),
    (snapshot) => {
      let found: Alert | null = null;
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.active !== false && !found) {
          found = {
            id: d.id,
            variant: data.variant || "warning",
            icon: data.icon || "alert",
            text: data.text || "",
          };
        }
      });
      callback(found);
    },
    () => {
      callback(getLocalStorage<Alert | null>(LOCAL_STORAGE_KEY_ALERT, null));
    }
  );
}

/**
 * Broadcast a new emergency alert to all residents in Firestore
 */
export async function broadcastAlertInDb(alert: Omit<Alert, "id">): Promise<string> {
  const newId = `ALERT-${Date.now().toString().slice(-5)}`;
  const data = {
    ...alert,
    id: newId,
    active: true,
    createdAt: db ? serverTimestamp() : new Date().toISOString(),
  };

  if (db) {
    await setDoc(doc(db, "alerts", newId), data);
  } else {
    setLocalStorage(LOCAL_STORAGE_KEY_ALERT, data as Alert);
  }
  return newId;
}

/**
 * Dismiss active alert in Firestore
 */
export async function dismissAlertInDb(id: string): Promise<void> {
  if (db) {
    try {
      await updateDoc(doc(db, "alerts", id), {
        active: false,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Ignored
    }
  }
  setLocalStorage(LOCAL_STORAGE_KEY_ALERT, null);
}

/**
 * Real-time subscription to Outage Schedules collection
 */
export function subscribeToOutages(
  callback: (outages: ScheduledOutage[]) => void
): () => void {
  if (!db) {
    callback(
      getLocalStorage<ScheduledOutage[]>(
        LOCAL_STORAGE_KEY_OUTAGES,
        []
      )
    );
    return () => {};
  }

  return onSnapshot(
    collection(db, "outages"),
    (snapshot) => {
      const list: ScheduledOutage[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          type: data.type || "power",
          title: data.title || "",
          day: data.day || "",
          timeSlot: data.timeSlot || "",
          location: data.location || "",
          note: data.note || "",
          reminderSet: Boolean(data.reminderSet),
        });
      });
      setLocalStorage(LOCAL_STORAGE_KEY_OUTAGES, list);
      callback(list);
    },
    () => {
      callback(
        getLocalStorage<ScheduledOutage[]>(
          LOCAL_STORAGE_KEY_OUTAGES,
          []
        )
      );
    }
  );
}

/**
 * Create a new planned outage in Firestore
 */
export async function createOutageInDb(
  outage: Omit<ScheduledOutage, "id">
): Promise<string> {
  const newId = `SCH-${Date.now().toString().slice(-5)}`;
  const data = {
    ...outage,
    id: newId,
    createdAt: db ? serverTimestamp() : new Date().toISOString(),
  };

  if (db) {
    await setDoc(doc(db, "outages", newId), data);
  } else {
    const list = getLocalStorage<ScheduledOutage[]>(
      LOCAL_STORAGE_KEY_OUTAGES,
      []
    );
    setLocalStorage(LOCAL_STORAGE_KEY_OUTAGES, [data as ScheduledOutage, ...list]);
  }
  return newId;
}

/**
 * Toggle outage reminder in DB
 */
export async function toggleOutageReminderInDb(
  id: string,
  reminderSet: boolean
): Promise<void> {
  if (db) {
    try {
      await updateDoc(doc(db, "outages", id), { reminderSet });
    } catch (err) {
      console.warn("Outage reminder update error:", err);
    }
  } else {
    const list = getLocalStorage<ScheduledOutage[]>(
      LOCAL_STORAGE_KEY_OUTAGES,
      []
    );
    const updated = list.map((item) =>
      item.id === id ? { ...item, reminderSet } : item
    );
    setLocalStorage(LOCAL_STORAGE_KEY_OUTAGES, updated);
  }
}

/**
 * Real-time subscription to Resources collection
 */
export function subscribeToResources(
  callback: (resources: Resource[]) => void
): () => void {
  if (!db) {
    callback(
      getLocalStorage<Resource[]>(LOCAL_STORAGE_KEY_RESOURCES, SEED_RESOURCES)
    );
    return () => {};
  }

  return onSnapshot(
    collection(db, "resources"),
    (snapshot) => {
      const list: Resource[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          type: data.type || "water",
          name: data.name || "",
          distance: data.distance || "",
          hours: data.hours || "",
          status: data.status || "open",
          updated: data.updated || "Just now",
          address: data.address || undefined,
          phone: data.phone || undefined,
          coordinates: data.coordinates || undefined,
        });
      });
      setLocalStorage(LOCAL_STORAGE_KEY_RESOURCES, list);
      callback(list);
    },
    () => {
      callback(
        getLocalStorage<Resource[]>(LOCAL_STORAGE_KEY_RESOURCES, SEED_RESOURCES)
      );
    }
  );
}

/**
 * Add a new relief resource in Firestore
 */
export async function createResourceInDb(
  resource: Omit<Resource, "id">
): Promise<string> {
  const newId = `RES-${Date.now().toString().slice(-5)}`;
  const data = {
    ...resource,
    id: newId,
    createdAt: db ? serverTimestamp() : new Date().toISOString(),
  };

  if (db) {
    await setDoc(doc(db, "resources", newId), data);
  } else {
    const list = getLocalStorage<Resource[]>(
      LOCAL_STORAGE_KEY_RESOURCES,
      SEED_RESOURCES
    );
    setLocalStorage(LOCAL_STORAGE_KEY_RESOURCES, [data as Resource, ...list]);
  }
  return newId;
}

/**
 * Real-time subscription to NGO offers
 */
export function subscribeToNgoOffers(
  callback: (offers: Record<string, { provide: string; quantity: string; eta: string }>) => void
): () => void {
  if (!db) {
    callback(getLocalStorage(LOCAL_STORAGE_KEY_NGO, {}));
    return () => {};
  }

  return onSnapshot(
    collection(db, "ngo_offers"),
    (snapshot) => {
      const result: Record<string, { provide: string; quantity: string; eta: string }> = {};
      snapshot.forEach((d) => {
        const data = d.data();
        result[d.id] = {
          provide: data.provide || "",
          quantity: data.quantity || "",
          eta: data.eta || "",
        };
      });
      setLocalStorage(LOCAL_STORAGE_KEY_NGO, result);
      callback(result);
    },
    () => {
      callback(getLocalStorage(LOCAL_STORAGE_KEY_NGO, {}));
    }
  );
}

/**
 * Submit NGO offer to Firestore
 */
export async function submitNgoOfferInDb(
  type: IncidentType,
  details: { provide: string; quantity: string; eta: string }
): Promise<void> {
  if (db) {
    await setDoc(doc(db, "ngo_offers", type), {
      ...details,
      type,
      updatedAt: serverTimestamp(),
    });
  } else {
    const offers = getLocalStorage<Record<string, typeof details>>(
      LOCAL_STORAGE_KEY_NGO,
      {}
    );
    offers[type] = details;
    setLocalStorage(LOCAL_STORAGE_KEY_NGO, offers);
  }
}
