
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

import { db, auth } from "./firebase";

import {
  Incident,
  ScheduledOutage,
  Resource,
  Alert,
  IncidentType,
  IncidentStatus,
  SEED_RESOURCES,
  NgoOffer,
} from "./data";

const LOCAL_STORAGE_KEY_INCIDENTS = "cp_real_incidents";
const LOCAL_STORAGE_KEY_OUTAGES = "cp_real_outages";
const LOCAL_STORAGE_KEY_RESOURCES = "cp_real_resources";
const LOCAL_STORAGE_KEY_ALERT = "cp_real_alert";
const LOCAL_STORAGE_KEY_NGO = "cp_real_ngo_offers";

const INCIDENT_TYPES: IncidentType[] = [
  "power",
  "water",
  "food",
  "road",
  "flood",
  "fire",
];

function isIncidentType(value: unknown): value is IncidentType {
  return (
    typeof value === "string" &&
    INCIDENT_TYPES.includes(value as IncidentType)
  );
}

// Helper for local storage persistence.
function getLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : fallback;
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
 * Converts both the old object format and the new array format
 * into an array of independent NGO offers.
 */
function normalizeNgoOffers(value: unknown): NgoOffer[] {
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null
      )
      .filter((item) => isIncidentType(item.type))
      .map((item, index) => ({
        id:
          typeof item.id === "string"
            ? item.id
            : `LEGACY-OFFER-${index}`,
        type: item.type as IncidentType,
        ngoName:
          typeof item.ngoName === "string"
            ? item.ngoName
            : "Community NGO",
        provide: typeof item.provide === "string" ? item.provide : "",
        quantity: typeof item.quantity === "string" ? item.quantity : "",
        eta: typeof item.eta === "string" ? item.eta : "",
        createdAt: item.createdAt,
      }));
  }

  // Migrate the previous format:
  // { water: { provide, quantity, eta }, food: { ... } }
  if (typeof value === "object" && value !== null) {
    const legacy = value as Record<string, unknown>;
    const migrated: NgoOffer[] = [];

    for (const [type, details] of Object.entries(legacy)) {
      if (!isIncidentType(type)) continue;
      if (typeof details !== "object" || details === null) continue;

      const offer = details as Record<string, unknown>;

      migrated.push({
        id: `LEGACY-${type}`,
        type,
        ngoName: "Community NGO",
        provide:
          typeof offer.provide === "string" ? offer.provide : "",
        quantity:
          typeof offer.quantity === "string" ? offer.quantity : "",
        eta: typeof offer.eta === "string" ? offer.eta : "",
      });
    }

    return migrated;
  }

  return [];
}

let seedingPromise: Promise<void> | null = null;

/**
 * Initializes emergency resources if the Firestore collection is empty.
 */
export async function seedLiveDatabaseIfEmpty(): Promise<void> {
  if (!db) return;
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    try {
      const snap = await getDocs(collection(db, "resources"));

      if (snap.empty) {
        console.log("Initializing community emergency resources...");

        for (const res of SEED_RESOURCES) {
          await setDoc(doc(db, "resources", res.id), {
            ...res,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (error) {
      console.warn("Resource initialization check:", error);
    }
  })();

  return seedingPromise;
}

/**
 * Purges leftover legacy mock data.
 */
export async function purgeMockDataFromDb(): Promise<{
  purgedCount: number;
}> {
  let count = 0;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_INCIDENTS);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_OUTAGES);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_ALERT);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_NGO);
      window.localStorage.removeItem(LOCAL_STORAGE_KEY_RESOURCES);
    } catch {
      // Ignore local storage errors.
    }
  }

  if (!db) return { purgedCount: 0 };

  const collectionsToPurge: {
    collectionName: string;
    ids: string[];
  }[] = [
    {
      collectionName: "incidents",
      ids: [
        "INC-001",
        "INC-002",
        "INC-003",
        "INC-004",
        "INC-005",
        "INC-006",
      ],
    },
    {
      collectionName: "outages",
      ids: [
        "SCH-001",
        "SCH-002",
        "SCH-003",
        "SCH-004",
        "SCH-005",
      ],
    },
    {
      collectionName: "alerts",
      ids: ["ALERT-001"],
    },
    {
      collectionName: "resources",
      ids: [
        "RES-001",
        "RES-002",
        "RES-003",
        "RES-004",
        "RES-005",
      ],
    },
  ];

  for (const group of collectionsToPurge) {
    for (const id of group.ids) {
      try {
        await deleteDoc(doc(db, group.collectionName, id));
        count++;
      } catch {
        // Ignore missing documents or deletion errors.
      }
    }
  }

  return { purgedCount: count };
}

/**
 * Subscribe to incidents.
 */
export function subscribeToIncidents(
  callback: (incidents: Incident[]) => void
): () => void {
  if (!db) {
    callback(
      getLocalStorage<Incident[]>(LOCAL_STORAGE_KEY_INCIDENTS, [])
    );
    return () => {};
  }

  void seedLiveDatabaseIfEmpty();

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
          accuracy:
            data.accuracy != null
              ? Number(data.accuracy)
              : undefined,
        });
      });

      setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, list);
      callback(list);
    },
    (error) => {
      console.warn("Incidents listener error:", error);

      callback(
        getLocalStorage<Incident[]>(LOCAL_STORAGE_KEY_INCIDENTS, [])
      );
    }
  );
}

/**
 * Create an incident.
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
  const activeUser = auth?.currentUser;
  const effectiveUserId = activeUser?.uid || userId;

  if (!effectiveUserId || activeUser?.isAnonymous) {
    throw new Error(
      "A verified registered account is required to report incidents."
    );
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  const fullLocation = report.landmark?.trim()
    ? `${report.landmark.trim()}, ${report.location}`
    : report.location;

  const safeLocation = (fullLocation.trim() || "Ward 8").slice(0, 190);

  const safeDescription = (
    report.description?.trim() ||
    "Reported by resident via CommunityPulse mobile."
  ).slice(0, 800);

  const newId = `INC-${Date.now().toString().slice(-6)}`;

  const incidentData = {
    id: newId,
    type: report.type,
    location: safeLocation,
    affected: 1,
    confirmations: 1,
    status: "reported" as IncidentStatus,
    priority:
      report.type === "flood" || report.type === "fire"
        ? "critical"
        : "high",
    facilities:
      report.description?.toLowerCase().includes("clinic")
        ? ["Clinic fridge"]
        : ["Local area"],
    time: timeStr,
    description: safeDescription,
    isMine: true,
    coordinates: report.coordinates,
    accuracy: report.accuracy,
    userId: effectiveUserId,
    createdAt: db ? serverTimestamp() : now.toISOString(),
    updatedAt: db ? serverTimestamp() : now.toISOString(),
  };

  if (db) {
    await setDoc(doc(db, "incidents", newId), incidentData);
  } else {
    const list = getLocalStorage<Incident[]>(
      LOCAL_STORAGE_KEY_INCIDENTS,
      []
    );

    setLocalStorage(LOCAL_STORAGE_KEY_INCIDENTS, [
      incidentData as Incident,
      ...list,
    ]);
  }

  return newId;
}

/**
 * Update incident status and ETA.
 */
export async function updateIncidentInDb(
  id: string,
  status: IncidentStatus,
  eta?: string
): Promise<void> {
  if (db) {
    const updates: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (eta !== undefined) updates.eta = eta;

    if (status === "resolved") {
      updates.resolvedAt = new Date().toISOString();
    }

    await updateDoc(doc(db, "incidents", id), updates);
  } else {
    const list = getLocalStorage<Incident[]>(
      LOCAL_STORAGE_KEY_INCIDENTS,
      []
    );

    setLocalStorage(
      LOCAL_STORAGE_KEY_INCIDENTS,
      list.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              eta: eta !== undefined ? eta : item.eta,
              resolvedAt:
                status === "resolved"
                  ? new Date().toISOString()
                  : undefined,
            }
          : item
      )
    );
  }
}

/**
 * Increment incident confirmations.
 */
export async function confirmIncidentInDb(
  id: string
): Promise<void> {
  if (db) {
    await updateDoc(doc(db, "incidents", id), {
      confirmations: increment(1),
      updatedAt: serverTimestamp(),
    });
  } else {
    const list = getLocalStorage<Incident[]>(
      LOCAL_STORAGE_KEY_INCIDENTS,
      []
    );

    setLocalStorage(
      LOCAL_STORAGE_KEY_INCIDENTS,
      list.map((item) =>
        item.id === id
          ? {
              ...item,
              confirmations: (item.confirmations || 0) + 1,
            }
          : item
      )
    );
  }
}

/**
 * Add an official responder update.
 */
export async function addIncidentUpdateInDb(
  incidentId: string,
  message: string,
  responder: string = "Municipal Dispatch"
): Promise<void> {
  if (!db) return;

  await updateDoc(doc(db, "incidents", incidentId), {
    latestUpdate: message,
    latestUpdateBy: responder,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Subscribe to active alerts.
 */
export function subscribeToAlerts(
  callback: (alert: Alert | null) => void
): () => void {
  if (!db) {
    callback(
      getLocalStorage<Alert | null>(LOCAL_STORAGE_KEY_ALERT, null)
    );
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
      callback(
        getLocalStorage<Alert | null>(LOCAL_STORAGE_KEY_ALERT, null)
      );
    }
  );
}

/**
 * Broadcast an alert.
 */
export async function broadcastAlertInDb(
  alert: Omit<Alert, "id">
): Promise<string> {
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
 * Dismiss an alert.
 */
export async function dismissAlertInDb(id: string): Promise<void> {
  if (db) {
    try {
      await updateDoc(doc(db, "alerts", id), {
        active: false,
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Ignore errors.
    }
  }

  setLocalStorage(LOCAL_STORAGE_KEY_ALERT, null);
}

/**
 * Subscribe to outage schedules.
 */
export function subscribeToOutages(
  callback: (outages: ScheduledOutage[]) => void
): () => void {
  if (!db) {
    callback(
      getLocalStorage<ScheduledOutage[]>(LOCAL_STORAGE_KEY_OUTAGES, [])
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
        getLocalStorage<ScheduledOutage[]>(LOCAL_STORAGE_KEY_OUTAGES, [])
      );
    }
  );
}

/**
 * Create an outage schedule.
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

    setLocalStorage(LOCAL_STORAGE_KEY_OUTAGES, [
      data as ScheduledOutage,
      ...list,
    ]);
  }

  return newId;
}

/**
 * Toggle an outage reminder.
 */
export async function toggleOutageReminderInDb(
  id: string,
  reminderSet: boolean
): Promise<void> {
  if (db) {
    try {
      await updateDoc(doc(db, "outages", id), { reminderSet });
    } catch (error) {
      console.warn("Outage reminder update error:", error);
    }
  } else {
    const list = getLocalStorage<ScheduledOutage[]>(
      LOCAL_STORAGE_KEY_OUTAGES,
      []
    );

    setLocalStorage(
      LOCAL_STORAGE_KEY_OUTAGES,
      list.map((item) =>
        item.id === id ? { ...item, reminderSet } : item
      )
    );
  }
}

/**
 * Subscribe to resources.
 */
export function subscribeToResources(
  callback: (resources: Resource[]) => void
): () => void {
  if (!db) {
    callback(
      getLocalStorage<Resource[]>(
        LOCAL_STORAGE_KEY_RESOURCES,
        SEED_RESOURCES
      )
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
        getLocalStorage<Resource[]>(
          LOCAL_STORAGE_KEY_RESOURCES,
          SEED_RESOURCES
        )
      );
    }
  );
}

/**
 * Create a resource.
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

    setLocalStorage(LOCAL_STORAGE_KEY_RESOURCES, [
      data as Resource,
      ...list,
    ]);
  }

  return newId;
}

/**
 * Subscribe to all NGO offers.
 *
 * Each offer is a separate document. Older Firestore documents that use
 * an incident type as their document ID are still readable.
 */
export function subscribeToNgoOffers(
  callback: (offers: NgoOffer[]) => void
): () => void {
  if (!db) {
    const stored = getLocalStorage<unknown>(
      LOCAL_STORAGE_KEY_NGO,
      []
    );

    const offers = normalizeNgoOffers(stored);

    // Save the migrated format for future reads.
    setLocalStorage(LOCAL_STORAGE_KEY_NGO, offers);
    callback(offers);

    return () => {};
  }

  return onSnapshot(
    collection(db, "ngo_offers"),
    (snapshot) => {
      const offers: NgoOffer[] = [];

      snapshot.forEach((d) => {
        const data = d.data();

        // Support legacy documents whose ID was the incident type.
        const type = isIncidentType(data.type)
          ? data.type
          : isIncidentType(d.id)
            ? d.id
            : null;

        if (!type) return;

        offers.push({
          id: d.id,
          type,
          ngoName:
            typeof data.ngoName === "string" && data.ngoName.trim()
              ? data.ngoName
              : "Community NGO",
          provide:
            typeof data.provide === "string" ? data.provide : "",
          quantity:
            typeof data.quantity === "string" ? data.quantity : "",
          eta: typeof data.eta === "string" ? data.eta : "",
          createdAt: data.createdAt,
        });
      });

      setLocalStorage(LOCAL_STORAGE_KEY_NGO, offers);
      callback(offers);
    },
    (error) => {
      console.warn("NGO offers listener error:", error);

      const stored = getLocalStorage<unknown>(
        LOCAL_STORAGE_KEY_NGO,
        []
      );

      callback(normalizeNgoOffers(stored));
    }
  );
}

/**
 * Submit a new NGO offer.
 *
 * A unique document ID is generated for each offer, so one NGO's
 * offer will not overwrite another offer for the same incident type.
 */
export async function submitNgoOfferInDb(
  type: IncidentType,
  details: {
    provide: string;
    quantity: string;
    eta: string;
    ngoName?: string;
  }
): Promise<string> {
  if (!details.provide.trim()) {
    throw new Error("Please specify what support you can provide.");
  }

  if (!details.quantity.trim()) {
    throw new Error("Please enter a quantity.");
  }

  const activeUser = auth?.currentUser;

  const ngoName =
    details.ngoName?.trim() ||
    activeUser?.displayName ||
    activeUser?.email ||
    "Community NGO";

  const offerId = db
    ? doc(collection(db, "ngo_offers")).id
    : `OFFER-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const offer: NgoOffer = {
    id: offerId,
    type,
    ngoName,
    provide: details.provide.trim(),
    quantity: details.quantity.trim(),
    eta: details.eta.trim(),
  };

  if (db) {
    await setDoc(doc(db, "ngo_offers", offerId), {
      ...offer,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: activeUser?.uid || null,
    });
  } else {
    const existing = normalizeNgoOffers(
      getLocalStorage<unknown>(LOCAL_STORAGE_KEY_NGO, [])
    );

    setLocalStorage<NgoOffer[]>(
      LOCAL_STORAGE_KEY_NGO,
      [offer, ...existing]
    );
  }

  return offerId;
}
