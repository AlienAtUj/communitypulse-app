import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import {
  Incident,
  ScheduledOutage,
  Resource,
  Alert,
  IncidentType,
  IncidentStatus,
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

/**
 * Real-time subscription to Incidents collection (100% Real Data)
 */
export function subscribeToIncidents(
  callback: (incidents: Incident[]) => void
): () => void {
  if (!db) {
    const local = getLocalStorage<Incident[]>(LOCAL_STORAGE_KEY_INCIDENTS, []);
    callback(local);
    return () => {};
  }

  const q = query(collection(db, "incidents"), orderBy("createdAt", "desc"));
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
          description: data.description,
          isMine: Boolean(data.isMine),
        });
      });

      setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, list);
      callback(list);
    },
    (err) => {
      console.warn("Firestore incidents listener error (using cache):", err);
      const fallback = getLocalStorage<Incident[]>(LOCAL_STORAGE_KEY_INCIDENTS, []);
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
  },
  userId?: string
): Promise<string> {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const mins = String(now.getMinutes()).padStart(2, "0");
  const timeStr = `${hours}:${mins}`;

  const fullLocation = report.landmark?.trim()
    ? `${report.landmark.trim()}, ${report.location}`
    : report.location;

  const newId = `INC-${Date.now().toString().slice(-6)}`;

  const incidentData: Partial<Incident> & {
    createdAt: unknown;
    updatedAt: unknown;
    userId?: string;
  } = {
    id: newId,
    type: report.type,
    location: fullLocation,
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
    description:
      report.description?.trim() ||
      "Reported by resident via CommunityPulse mobile.",
    isMine: true,
    userId: userId || "anonymous",
    createdAt: db ? serverTimestamp() : new Date().toISOString(),
    updatedAt: db ? serverTimestamp() : new Date().toISOString(),
  };

  if (db) {
    await setDoc(doc(db, "incidents", newId), incidentData);
  } else {
    const list = getLocalStorage<Incident[]>(LOCAL_STORAGE_KEY_INCIDENTS, []);
    const updated = [incidentData as Incident, ...list];
    setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, updated);
  }

  return newId;
}

/**
 * Update incident status or ETA in Firestore
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
    await updateDoc(ref, updates);
  } else {
    const list = getLocalStorage<Incident[]>(LOCAL_STORAGE_KEY_INCIDENTS, []);
    const updated = list.map((item) =>
      item.id === id
        ? {
            ...item,
            status,
            eta: eta !== undefined ? eta : item.eta,
          }
        : item
    );
    setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, updated);
  }
}

/**
 * Atomically increment incident confirmation count
 */
export async function confirmIncidentInDb(id: string): Promise<void> {
  if (db) {
    const ref = doc(db, "incidents", id);
    await updateDoc(ref, {
      confirmations: increment(1),
      updatedAt: serverTimestamp(),
    });
  } else {
    const list = getLocalStorage<Incident[]>(LOCAL_STORAGE_KEY_INCIDENTS, []);
    const updated = list.map((item) =>
      item.id === id ? { ...item, confirmations: (item.confirmations || 0) + 1 } : item
    );
    setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, updated);
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
    callback(getLocalStorage<ScheduledOutage[]>(LOCAL_STORAGE_KEY_OUTAGES, []));
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
      callback(getLocalStorage<ScheduledOutage[]>(LOCAL_STORAGE_KEY_OUTAGES, []));
    }
  );
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
    const list = getLocalStorage<ScheduledOutage[]>(LOCAL_STORAGE_KEY_OUTAGES, []);
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
    callback(getLocalStorage<Resource[]>(LOCAL_STORAGE_KEY_RESOURCES, []));
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
        });
      });
      setLocalStorage(LOCAL_STORAGE_KEY_RESOURCES, list);
      callback(list);
    },
    () => {
      callback(getLocalStorage<Resource[]>(LOCAL_STORAGE_KEY_RESOURCES, []));
    }
  );
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
