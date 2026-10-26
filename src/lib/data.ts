
export type IncidentType =
  | "power"
  | "water"
  | "food"
  | "road"
  | "flood"
  | "fire";

export type IncidentStatus =
  | "reported"
  | "verified"
  | "assigned"
  | "resolved";

  export interface NgoNeed {
  type: IncidentType;
  label: string;
  households: number;
  incidentsCount: number;
  priority: Priority;
  offerSent?: boolean;
  offerDetails?: NgoOffer;
  offers: NgoOffer[];
  locations: string[];
  incidents: Incident[];
}

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
  time: string;
  eta?: string;
  resolvedAt?: string;
  description?: string;
  latestUpdate?: string;
  latestUpdateBy?: string;
  isMine?: boolean;
  coordinates?: { lat: number; lng: number };
  accuracy?: number;
}

export interface ScheduledOutage {
  id: string;
  type: "power" | "water";
  title: string;
  day: string;
  timeSlot: string;
  location: string;
  note: string;
  reminderSet: boolean;
}

export interface Resource {
  id: string;
  type: "water" | "food" | "charging" | "clinic" | "shelter";
  name: string;
  distance: string;
  hours: string;
  status: "open" | "closed";
  updated: string;
  address?: string;
  phone?: string;
  coordinates?: { lat: number; lng: number };
}

export interface Alert {
  id: string;
  variant: "info" | "warning" | "danger";
  icon: "power" | "water" | "flood" | "alert";
  text: string;
}

/**
 * One NGO offer.
 * Multiple offers can exist for the same incident type.
 */
export interface NgoOffer {
  id: string;
  type: IncidentType;
  ngoName: string;
  provide: string;
  quantity: string;
  eta: string;
  createdAt?: unknown;
}

/**
 * An aggregated community need, with all offers
 * received for that incident type.
 */
export interface NgoNeed {
  type: IncidentType;
  label: string;
  households: number;
  incidentsCount: number;
  priority: Priority;
  offerSent?: boolean;
  offerDetails?: NgoOffer;
  offers: NgoOffer[];
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

export const HAZARD_FILTER_OPTIONS: {
  id: HazardCategory;
  label: string;
}[] = [
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
  return incidents.filter((inc) =>
    matchesHazardCategory(inc, category)
  );
}

/**
 * Calculates distance in kilometers between two GPS coordinates
 * using the Haversine formula.
 */
export function calculateDistanceKm(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371;

  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 10) / 10;
}

/**
 * Checks whether an incident location is in or near
 * the user's ward or area.
 */
export function isLocationNearby(
  incidentLocation: string,
  userLocation?: string
): boolean {
  if (!userLocation || !incidentLocation) return false;

  const normUser = userLocation.toLowerCase();
  const normInc = incidentLocation.toLowerCase();

  // Direct containment
  if (
    normUser.includes(normInc) ||
    normInc.includes(normUser)
  ) {
    return true;
  }

  // Ward number match
  const userWardMatch = normUser.match(/ward\s*(\d+)/i);
  const incWardMatch = normInc.match(/ward\s*(\d+)/i);

  if (
    userWardMatch &&
    incWardMatch &&
    userWardMatch[1] === incWardMatch[1]
  ) {
    return true;
  }

  // Section / suburb token overlap
  const stopWords = new Set([
    "south",
    "africa",
    "city",
    "road",
    "street",
    "avenue",
    "near",
  ]);

  const userTokens = normUser
    .split(/[\s,.-]+/)
    .map((t) => t.trim())
    .filter(
      (t) => t.length >= 3 && !stopWords.has(t)
    );

  const incTokens = normInc
    .split(/[\s,.-]+/)
    .map((t) => t.trim())
    .filter(
      (t) => t.length >= 3 && !stopWords.has(t)
    );

  return userTokens.some((token) =>
    incTokens.includes(token)
  );
}

/**
 * Filters incidents so residents see disruptions near them
 * or incidents reported by them.
 */
export function filterNearbyIncidents(
  incidents: Incident[],
  user?: {
    ward?: string;
    coordinates?: { lat: number; lng: number };
    uid?: string;
  } | null,
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
    // If the user reported the incident, always show it.
    const isOwner =
      incident.isMine ||
      (user?.uid &&
        (incident as unknown as { userId?: string }).userId ===
          user.uid);

    if (scope === "mine") {
      return Boolean(isOwner);
    }

    if (isOwner) {
      return true;
    }

    // GPS distance check
    if (user?.coordinates && incident.coordinates) {
      const dist = calculateDistanceKm(
        user.coordinates,
        incident.coordinates
      );

      return dist <= maxDistanceKm;
    }

    // Ward / suburb text match
    if (
      user?.ward &&
      isLocationNearby(incident.location, user.ward)
    ) {
      return true;
    }

    // Show incidents when the user has not set a location.
    if (!user?.ward && !user?.coordinates) {
      return true;
    }

    return false;
  });
}

export function sortIncidents(
  incidents: Incident[]
): Incident[] {
  return [...incidents].sort((a, b) => {
    const pDiff =
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];

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
      tab === "active"
        ? inc.status !== "resolved"
        : inc.status === "resolved";

    return (
      matchesTab &&
      matchesHazardCategory(inc, hazardCategory)
    );
  });

  return sortIncidents(filtered);
}

export function groupIncidentsByLocation(
  incidents: Incident[]
): LocationIncidentGroup[] {
  const active = sortIncidents(
    incidents.filter((i) => i.status !== "resolved")
  );

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

    const totalHouseholds = list.reduce(
      (sum, item) => sum + item.affected,
      0
    );

    const highestPriority = list.reduce<Priority>(
      (best, item) =>
        PRIORITY_ORDER[item.priority] <
        PRIORITY_ORDER[best]
          ? item.priority
          : best,
      "medium"
    );

    const hazardDescriptions = list
      .map((item) =>
        INCIDENT_TYPE_LABELS[item.type].toLowerCase()
      )
      .filter(
        (val, idx, arr) => arr.indexOf(val) === idx
      );

    const hazardJoined = hazardDescriptions.join(" and ");
    const peopleWord =
      totalReporters === 1 ? "person" : "people";

    const summaryText =
      `${totalReporters} ${peopleWord} from ${location} reported ${hazardJoined}`;

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
      PRIORITY_ORDER[a.highestPriority] -
        PRIORITY_ORDER[b.highestPriority] ||
      b.totalReporters - a.totalReporters
  );
}

export function filterResourcesByCategory(
  resources: Resource[],
  category:
    | "all"
    | "water"
    | "food"
    | "charging"
    | "clinic"
    | "shelter"
): Resource[] {
  if (category === "all") return resources;

  return resources.filter((res) => res.type === category);
}

/**
 * Aggregates active incidents into community needs.
 * Every offer matching an incident type is retained.
 */
export function getAggregatedNeeds(
  incidents: Incident[],
  offers: NgoOffer[]
): NgoNeed[] {
  const active = incidents.filter(
    (incident) => incident.status !== "resolved"
  );

  const types: IncidentType[] = [
    "water",
    "food",
    "power",
    "flood",
    "fire",
    "road",
  ];

  const needs: NgoNeed[] = [];

  for (const type of types) {
    const matching = active.filter(
      (incident) => incident.type === type
    );

    if (matching.length === 0) continue;

    const households = matching.reduce(
      (sum, incident) => sum + incident.affected,
      0
    );

    const highestPriority = matching.reduce<Priority>(
      (best, incident) =>
        PRIORITY_ORDER[incident.priority] <
        PRIORITY_ORDER[best]
          ? incident.priority
          : best,
      "medium"
    );

    const matchingOffers = offers.filter(
      (offer) => offer.type === type
    );

   needs.push({
  type,
  label: INCIDENT_CATEGORY_NAMES[type],
  households,
  incidentsCount: matching.length,
  priority: highestPriority,
  offerSent: matchingOffers.length > 0,
  offerDetails: matchingOffers[0],
  offers: matchingOffers,
  locations: [
    ...new Set(
      matching
        .map((incident) => incident.location.trim())
        .filter(Boolean)
    ),
  ],
  incidents: matching,
});
  }

  return needs;
}
