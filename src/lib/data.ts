export type IncidentType = "power" | "water" | "food" | "road" | "flood" | "fire";
export type IncidentStatus = "reported" | "verified" | "assigned" | "resolved";
export type Priority = "critical" | "high" | "medium";

export type HazardCategory =
  | "all"
  | "infrastructure"
  | "flood"
  | "fire";

export interface Incident {
  id: string;
  type: IncidentType;
  location: string;
  affected: number;
  confirmations: number;
  status: IncidentStatus;
  priority: Priority;
  facilities?: string[];
  time: string;        // e.g. "17:30"
  eta?: string;        // e.g. "19:45"
  resolvedAt?: string;
  description?: string;
  latestUpdate?: string;
  latestUpdateBy?: string;
  isMine?: boolean;
  coordinates?: { lat: number; lng: number };
  accuracy?: number;   // Accuracy in meters
}

export interface ScheduledOutage {
  id: string;
  type: "power" | "water";
  title: string;       // e.g. "Electricity — Stage 2 Load Shedding"
  day: string;         // e.g. "Today", "Tomorrow", "Sun, 25 Oct"
  timeSlot: string;    // e.g. "18:00 – 20:30"
  location: string;    // e.g. "Section C, Ward 8"
  note: string;        // e.g. "Charge phones and lamps before 18:00."
  reminderSet: boolean;
}

export interface Resource {
  id: string;
  type: "water" | "food" | "charging" | "clinic" | "shelter";
  name: string;
  distance: string;    // e.g. "0.8km"
  hours: string;       // e.g. "Open until 18:00"
  status: "open" | "closed";
  updated: string;     // e.g. "12 min ago"
  address?: string;    // Searchable real street location for Google Maps navigation
  phone?: string;      // Direct helpline or facility phone
  coordinates?: { lat: number; lng: number };
}

export interface Alert {
  id: string;
  variant: "info" | "warning" | "danger";
  icon: "power" | "water" | "flood" | "alert";
  text: string;
}

export interface NgoNeed {
  type: IncidentType;
  label: string;
  households: number;
  incidentsCount: number;
  priority: Priority;
  offerSent?: boolean;
  offerDetails?: {
    provide: string;
    quantity: string;
    eta: string;
  };
}

export interface LocationIncidentGroup {
  location: string;
  totalReporters: number;
  totalHouseholds: number;
  incidentsCount: number;
  highestPriority: Priority;
  summaryText: string;
  incidents: Incident[];
}

export const SEED_INCIDENTS: Incident[] = [];

export const SEED_SCHEDULED_OUTAGES: ScheduledOutage[] = [];

export const SEED_RESOURCES: Resource[] = [
  {
    id: "RES-EMS",
    type: "clinic",
    name: "National Emergency Medical Services (EMS Ambulance)",
    distance: "Emergency Dispatch",
    hours: "Open 24/7",
    status: "open",
    updated: "Live service",
    address: "Emergency Medical Services South Africa",
    phone: "10177",
  },
  {
    id: "RES-POLICE",
    type: "shelter",
    name: "SAPS Emergency & Community Safety Center",
    distance: "Police Services",
    hours: "Open 24/7",
    status: "open",
    updated: "Live service",
    address: "South African Police Service Emergency",
    phone: "10111",
  },
  {
    id: "RES-DISASTER",
    type: "shelter",
    name: "National Disaster Management Helpline",
    distance: "Disaster Operations",
    hours: "Open 24/7",
    status: "open",
    updated: "Live service",
    address: "National Disaster Management Centre, South Africa",
    phone: "112",
  },
  {
    id: "RES-RED-CROSS",
    type: "food",
    name: "Red Cross Disaster Relief South Africa",
    distance: "Emergency Aid Hub",
    hours: "Response Ready",
    status: "open",
    updated: "Live service",
    address: "South African Red Cross Society",
    phone: "0800000000",
  },
  {
    id: "RES-ESKOM",
    type: "charging",
    name: "Eskom Customer Care & Power Grid Dispatch",
    distance: "National Power Grid",
    hours: "Open 24/7",
    status: "open",
    updated: "Live service",
    address: "Eskom Megawatt Park, Sunninghill, Sandton",
    phone: "0860037566",
  },
  {
    id: "RES-WATER-BOARD",
    type: "water",
    name: "Municipal Water & Sanitation Emergency Dispatch",
    distance: "Municipal Water Operations",
    hours: "Open 24/7",
    status: "open",
    updated: "Live service",
    address: "Municipal Water and Sanitation Department",
    phone: "0800222700",
  },
];

export const ACTIVE_ALERT: Alert | null = null;

export const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  power: "Power outage",
  water: "Water outage",
  food: "Food shortage",
  road: "Road blocked",
  flood: "Flooding",
  fire: "Fire hazard",
};

export const INCIDENT_CATEGORY_NAMES: Record<IncidentType, string> = {
  power: "Power",
  water: "Water",
  food: "Food",
  road: "Road",
  flood: "Flood",
  fire: "Fire",
};

export const HAZARD_FILTER_OPTIONS: { id: HazardCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "flood", label: "Flood" },
  { id: "fire", label: "Fire" },
];

export function matchesHazardCategory(
  incident: Incident,
  category: HazardCategory
): boolean {
  if (category === "all") return true;
  if (category === "infrastructure") {
    return (
      incident.type === "power" ||
      incident.type === "water" ||
      incident.type === "road"
    );
  }
  return incident.type === category;
}

export function filterIncidentsByHazard(
  incidents: Incident[],
  category: HazardCategory
): Incident[] {
  return incidents.filter((inc) => matchesHazardCategory(inc, category));
}

/**
 * Calculates distance in kilometers between two GPS coordinates using the Haversine formula.
 */
export function calculateDistanceKm(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Checks if an incident's location text is in or near the user's ward/area.
 */
export function isLocationNearby(
  incidentLocation: string,
  userLocation?: string
): boolean {
  if (!userLocation || !incidentLocation) return false;
  const normUser = userLocation.toLowerCase();
  const normInc = incidentLocation.toLowerCase();

  // Direct containment
  if (normUser.includes(normInc) || normInc.includes(normUser)) return true;

  // Ward number match (e.g. "ward 8", "ward 117")
  const userWardMatch = normUser.match(/ward\s*(\d+)/i);
  const incWardMatch = normInc.match(/ward\s*(\d+)/i);
  if (userWardMatch && incWardMatch && userWardMatch[1] === incWardMatch[1]) {
    return true;
  }

  // Section / Suburb token overlap
  const stopWords = new Set(["south", "africa", "city", "road", "street", "avenue", "near"]);
  const userTokens = normUser
    .split(/[\s,.-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !stopWords.has(t));
  const incTokens = normInc
    .split(/[\s,.-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !stopWords.has(t));

  return userTokens.some((token) => incTokens.includes(token));
}

/**
 * Filters incidents so residents only see disruptions near them or reported by them.
 */
export function filterNearbyIncidents(
  incidents: Incident[],
  user?: { ward?: string; coordinates?: { lat: number; lng: number }; uid?: string } | null,
  options: {
    scope?: "nearby" | "mine" | "all";
    maxDistanceKm?: number;
  } = {}
): Incident[] {
  const { scope = "nearby", maxDistanceKm = 15 } = options;

  if (scope === "all") {
    return incidents;
  }

  return incidents.filter((incident) => {
    // 1. If user reported this incident, always show it
    const isOwner =
      incident.isMine ||
      (user?.uid && (incident as unknown as { userId?: string }).userId === user.uid);

    if (scope === "mine") {
      return Boolean(isOwner);
    }

    if (isOwner) {
      return true;
    }

    // 2. High-precision GPS distance check (within maxDistanceKm, default 15km)
    if (user?.coordinates && incident.coordinates) {
      const dist = calculateDistanceKm(user.coordinates, incident.coordinates);
      return dist <= maxDistanceKm;
    }

    // 3. Ward / Suburb text match check
    if (user?.ward && isLocationNearby(incident.location, user.ward)) {
      return true;
    }

    // 4. If user hasn't set any location yet, show incidents so app isn't blank
    if (!user?.ward && !user?.coordinates) {
      return true;
    }

    return false;
  });
}

export function sortIncidents(incidents: Incident[]): Incident[] {
  return [...incidents].sort((a, b) => {
    const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (pDiff !== 0) return pDiff;
    return b.time.localeCompare(a.time);
  });
}

export function filterIncidentsByTab(
  incidents: Incident[],
  tab: "active" | "resolved",
  hazardCategory: HazardCategory = "all"
): Incident[] {
  const filtered = incidents.filter((inc) => {
    const matchesTab =
      tab === "active" ? inc.status !== "resolved" : inc.status === "resolved";
    return matchesTab && matchesHazardCategory(inc, hazardCategory);
  });
  return sortIncidents(filtered);
}

export function groupIncidentsByLocation(
  incidents: Incident[]
): LocationIncidentGroup[] {
  const active = sortIncidents(incidents.filter((i) => i.status !== "resolved"));
  const map = new Map<string, Incident[]>();

  for (const inc of active) {
    const existing = map.get(inc.location) || [];
    existing.push(inc);
    map.set(inc.location, existing);
  }

  const groups: LocationIncidentGroup[] = [];

  for (const [location, list] of map.entries()) {
    const totalReporters = list.reduce(
      (sum, item) => sum + Math.max(1, item.confirmations),
      0
    );
    const totalHouseholds = list.reduce((sum, item) => sum + item.affected, 0);
    const highestPriority = list.reduce<Priority>((best, item) => {
      return PRIORITY_ORDER[item.priority] < PRIORITY_ORDER[best]
        ? item.priority
        : best;
    }, "medium");

    const hazardDescriptions = list
      .map((item) => INCIDENT_TYPE_LABELS[item.type].toLowerCase())
      .filter((val, idx, arr) => arr.indexOf(val) === idx);

    const hazardJoined = hazardDescriptions.join(" and ");
    const peopleWord = totalReporters === 1 ? "person" : "people";
    const summaryText = `${totalReporters} ${peopleWord} from ${location} reported ${hazardJoined}`;

    groups.push({
      location,
      totalReporters,
      totalHouseholds,
      incidentsCount: list.length,
      highestPriority,
      summaryText,
      incidents: list,
    });
  }

  return groups.sort(
    (a, b) =>
      PRIORITY_ORDER[a.highestPriority] - PRIORITY_ORDER[b.highestPriority] ||
      b.totalReporters - a.totalReporters
  );
}

export function filterResourcesByCategory(
  resources: Resource[],
  category: "all" | "water" | "food" | "charging" | "clinic" | "shelter"
): Resource[] {
  if (category === "all") return resources;
  return resources.filter((res) => res.type === category);
}

export function getAggregatedNeeds(
  incidents: Incident[],
  offers: Record<string, { provide: string; quantity: string; eta: string }>
): NgoNeed[] {
  const active = incidents.filter((i) => i.status !== "resolved");
  const types: IncidentType[] = ["water", "food", "power", "flood", "fire", "road"];
  const needs: NgoNeed[] = [];

  for (const t of types) {
    const matching = active.filter((i) => i.type === t);
    if (matching.length > 0) {
      const households = matching.reduce((sum, item) => sum + item.affected, 0);
      const highestPriority = matching.reduce<Priority>((best, item) => {
        return PRIORITY_ORDER[item.priority] < PRIORITY_ORDER[best] ? item.priority : best;
      }, "medium");
      needs.push({
        type: t,
        label: INCIDENT_CATEGORY_NAMES[t],
        households,
        incidentsCount: matching.length,
        priority: highestPriority,
        offerSent: Boolean(offers[t]),
        offerDetails: offers[t],
      });
    }
  }
  return needs;
}
