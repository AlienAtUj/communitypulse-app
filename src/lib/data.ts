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
  description?: string;
  isMine?: boolean;
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

export const SEED_INCIDENTS: Incident[] = [
  { id: "INC-001", type: "power", location: "Section C, Ward 8", affected: 240, confirmations: 4,
    status: "assigned", priority: "high", facilities: ["Clinic fridge", "Traffic lights"],
    time: "17:30", eta: "19:45", isMine: true },
  { id: "INC-002", type: "water", location: "Section D, Ward 8", affected: 36, confirmations: 3,
    status: "verified", priority: "high", facilities: ["Clinic"], time: "16:00" },
  { id: "INC-003", type: "food", location: "Ward 8", affected: 18, confirmations: 5,
    status: "reported", priority: "medium", time: "14:20" },
  { id: "INC-004", type: "road", location: "Main Road", affected: 42, confirmations: 6,
    status: "verified", priority: "high", time: "13:10",
    facilities: ["Clinic access", "School route"], isMine: true },
  { id: "INC-005", type: "flood", location: "Section A, Ward 8", affected: 12, confirmations: 3,
    status: "assigned", priority: "critical",
    facilities: ["3 elderly households"], time: "12:00", eta: "13:30" },
  { id: "INC-006", type: "fire", location: "Section B, Ward 8", affected: 15, confirmations: 4,
    status: "verified", priority: "critical",
    facilities: ["Community crèche"], time: "15:45",
    description: "Informal settlement shack fire near Mzamo lane, strong winds." },
];

export const SEED_SCHEDULED_OUTAGES: ScheduledOutage[] = [
  {
    id: "SCH-001",
    type: "power",
    title: "Electricity — Load Shedding",
    day: "Today",
    timeSlot: "18:00 – 20:30",
    location: "Section C, Ward 8",
    note: "Reminder active for today: Charge devices before 18:00.",
    reminderSet: true,
  },
  {
    id: "SCH-002",
    type: "water",
    title: "Water — Pipe Maintenance",
    day: "Tomorrow",
    timeSlot: "08:00 – 14:00",
    location: "Section C & D, Ward 8",
    note: "Store 20L of drinking water tonight.",
    reminderSet: true,
  },
  {
    id: "SCH-003",
    type: "power",
    title: "Electricity — Load Shedding",
    day: "Tomorrow",
    timeSlot: "20:00 – 22:30",
    location: "Section C, Ward 8",
    note: "Evening slot scheduled by Eskom.",
    reminderSet: false,
  },
  {
    id: "SCH-004",
    type: "water",
    title: "Water — Reservoir Cleaning",
    day: "Sun, 25 Oct",
    timeSlot: "09:00 – 15:00",
    location: "Ward 8 (All Sections)",
    note: "Water tanker will be parked at Community Hall.",
    reminderSet: false,
  },
  {
    id: "SCH-005",
    type: "power",
    title: "Electricity — Substation Upgrade",
    day: "Mon, 26 Oct",
    timeSlot: "10:00 – 13:00",
    location: "Section C, Ward 8",
    note: "Planned municipal line maintenance.",
    reminderSet: false,
  },
];

export const SEED_RESOURCES: Resource[] = [
  { id: "RES-001", type: "water", name: "Water tanker — Community Hall", distance: "0.8km",
    hours: "Open until 18:00", status: "open", updated: "12 min ago" },
  { id: "RES-002", type: "charging", name: "Charging station — Library", distance: "1.2km",
    hours: "Open until 20:00", status: "open", updated: "5 min ago" },
  { id: "RES-003", type: "food", name: "Food parcels — Sizanani Centre", distance: "2.1km",
    hours: "Tomorrow 09:00", status: "open", updated: "1 hour ago" },
  { id: "RES-004", type: "clinic", name: "Clinic — Mzamo", distance: "3.4km",
    hours: "Open until 17:00", status: "open", updated: "30 min ago" },
  { id: "RES-005", type: "shelter", name: "Shelter — Mzamo Primary School", distance: "3.6km",
    hours: "Open 24 hours", status: "open", updated: "20 min ago" },
];

export const ACTIVE_ALERT: Alert = {
  id: "ALERT-001",
  variant: "warning",
  icon: "power",
  text: "Load shedding 18:00–20:30 in your area. Charge devices.",
};

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
