
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Incident } from "../lib/data";

interface IncidentMapProps {
  incidents: Incident[];
}

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

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [-26.2041, 28.0473],
      11
    );

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    const markerLayer = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersRef.current = markerLayer;

    // Allow Leaflet to calculate the correct size after rendering.
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Plot real incident coordinates and refresh when incidents change.
  useEffect(() => {
    const map = mapRef.current;
    const markerLayer = markersRef.current;

    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    const plottedPoints: L.LatLngExpression[] = [];

    incidents.forEach((incident) => {
      const coordinates = incident.coordinates;

      // Never invent a location for an incident without GPS coordinates.
      if (!coordinates) return;

      const latitude = Number(coordinates.lat);
      const longitude = Number(coordinates.lng);

      // Ignore invalid GPS coordinates.
      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180 ||
        (latitude === 0 && longitude === 0)
      ) {
        return;
      }

      const point: L.LatLngExpression = [latitude, longitude];

      plottedPoints.push(point);

      
const isCritical = incident.priority === "critical";
const isHigh = incident.priority === "high";
const color = getPriorityColor(incident.priority);

// Illustrative radii, not verified danger boundaries.
const radiusMeters = isCritical ? 500 : isHigh ? 300 : 150;

const affectedArea = L.circle(point, {
  radius: radiusMeters,
  color,
  weight: 2,
  opacity: 0.65,
  fillColor: color,
  fillOpacity: incident.status === "resolved" ? 0.04 : 0.12,
  dashArray: "6 6",
});

affectedArea.bindPopup(
  `<strong>${escapeHtml(incident.type)}</strong><br />` +
  `${escapeHtml(incident.location)}<br />` +
  `Estimated display radius: ${radiusMeters} m`
);

affectedArea.addTo(markerLayer);

 const popup = `
        <div style="min-width:180px">
          <strong>${escapeHtml(incident.id)}</strong><br />
          <strong>Type:</strong> ${escapeHtml(String(incident.type))}<br />
          <strong>Location:</strong> ${escapeHtml(incident.location || "Unknown")}<br />
          <strong>Description:</strong> ${escapeHtml(incident.description || "No description")}<br />
          <strong>Priority:</strong> ${escapeHtml(String(incident.priority))}<br />
          <strong>Status:</strong> ${escapeHtml(String(incident.status))}<br />
          <strong>GPS:</strong> ${latitude.toFixed(5)}, ${longitude.toFixed(5)}
        </div>
      `;

const marker = L.circleMarker(point, {
  radius: isCritical ? 12 : isHigh ? 10 : 9,
  color: "#FFFFFF",
  weight: 3,
  fillColor: color,
  fillOpacity: incident.status === "resolved" ? 0.5 : 1,
});

marker.bindPopup(popup);
marker.addTo(markerLayer);


     

      marker.bindPopup(popup);
      marker.addTo(markerLayer);
    });

    // Zoom to all actual incident locations.
    if (plottedPoints.length > 0) {
      const bounds = L.latLngBounds(plottedPoints);

      map.fitBounds(bounds, {
        padding: [30, 30],
        maxZoom: 15,
      });
    } else {
      // Keep Johannesburg visible if no incidents have GPS coordinates.
      map.setView([-26.2041, 28.0473], 11);
    }
  }, [incidents]);

  return (
    <div
      ref={containerRef}
      className="h-[360px] w-full rounded-[12px] border border-[#E5E7EB] overflow-hidden"
      aria-label="Interactive map showing incidents at their reported GPS coordinates"
    />
  );
}
