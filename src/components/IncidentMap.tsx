
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Incident } from "../lib/data";

interface IncidentMapProps {
  incidents: Incident[];
}

// Representative demo coordinates only.
// Replace these with verified coordinates when your backend provides them.
const DEMO_LOCATIONS: Record<string, [number, number]> = {
  "Section A, Ward 8": [-26.2670, 27.8580],
  "Section B, Ward 8": [-26.2690, 27.8620],
  "Section C, Ward 8": [-26.2650, 27.8650],
  "Section D, Ward 8": [-26.2630, 27.8600],
  "Ward 8": [-26.2660, 27.8610],
  "Main Road": [-26.2680, 27.8560],
};

function getPriorityColor(priority: Incident["priority"]): string {
  switch (priority) {
    case "critical":
      return "#E4002B";
    case "high":
      return "#FF9500";
    default:
      return "#003DA5";
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function IncidentMap({ incidents }: IncidentMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  // Create the map once and remove it when this component unmounts.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [-26.2660, 27.8610],
      14
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersRef.current = markerLayer;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Refresh markers whenever the incident data changes.
  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markersRef.current;

    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    const plottedPoints: L.LatLngExpression[] = [];

    incidents.forEach((incident) => {
      const coordinates = DEMO_LOCATIONS[incident.location];

      // Do not place an incident at a made-up default location.
      if (!coordinates) return;

      const [latitude, longitude] = coordinates;
      plottedPoints.push(coordinates);

      const marker = L.circleMarker(coordinates, {
        radius: incident.priority === "critical" ? 9 : 7,
        color: "#FFFFFF",
        weight: 2,
        fillColor: getPriorityColor(incident.priority),
        fillOpacity: incident.status === "resolved" ? 0.45 : 0.95,
      });

      marker.bindPopup(`
        <div>
          <strong>${escapeHtml(incident.id)}</strong><br />
          ${escapeHtml(incident.location)}<br />
          ${escapeHtml(incident.description || incident.type)}<br />
          <strong>Priority:</strong> ${escapeHtml(incident.priority)}<br />
          <strong>Status:</strong> ${escapeHtml(incident.status)}
        </div>
      `);

      marker.addTo(markerLayer);
    });

    if (plottedPoints.length > 0) {
      map.fitBounds(L.latLngBounds(plottedPoints), {
        padding: [25, 25],
        maxZoom: 15,
      });
    }
  }, [incidents]);

  return (
    <div
      ref={containerRef}
      className="h-[300px] w-full rounded-[12px] border border-[#E5E7EB] overflow-hidden"
      aria-label="Interactive map of reported incidents"
    />
  );
}
