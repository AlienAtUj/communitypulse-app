
import { useEffect, useRef } from "react";
import L from "leaflet";

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onSelect: (latitude: number, longitude: number) => void;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onSelect,
}: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView(
      [-26.266, 27.861],
      12
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      onSelectRef.current(event.latlng.lat, event.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || latitude === null || longitude === null) return;

    const point: L.LatLngExpression = [latitude, longitude];

    if (!markerRef.current) {
      markerRef.current = L.circleMarker(point, {
        radius: 9,
        color: "#FFFFFF",
        weight: 2,
        fillColor: "#003DA5",
        fillOpacity: 1,
      }).addTo(map);
    } else {
      markerRef.current.setLatLng(point);
    }

    map.panTo(point);
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="h-[260px] w-full overflow-hidden rounded-xl"
      aria-label="Choose the incident location by clicking the map"
    />
  );
}
