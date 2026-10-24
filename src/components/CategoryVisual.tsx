import React, { useState } from "react";
import { IncidentType, Resource } from "../lib/data";

export type VisualCategory =
  | IncidentType
  | Resource["type"]
  | "action-report"
  | "action-schedules"
  | "action-help";

export type VisualVariant = "thumbnail" | "avatar" | "banner" | "hero";

export interface CategoryVisualProps {
  category: VisualCategory;
  alt?: string;
  variant?: VisualVariant;
  className?: string;
}

const CATEGORY_IMAGE_MAP: Record<VisualCategory, { local: string; remote: string; title: string }> = {
  power: {
    local: "/images/power.jpg",
    remote: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=500&q=80",
    title: "Electricity & Power Grid",
  },
  water: {
    local: "/images/water.jpg",
    remote: "https://images.unsplash.com/photo-1559827291-72ee739d0d9a?auto=format&fit=crop&w=500&q=80",
    title: "Water Supply & Outages",
  },
  food: {
    local: "/images/food.jpg",
    remote: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=500&q=80",
    title: "Food Relief & Shortages",
  },
  road: {
    local: "/images/road.jpg",
    remote: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=500&q=80",
    title: "Road Hazards & Blocks",
  },
  flood: {
    local: "/images/flood.jpg",
    remote: "https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=500&q=80",
    title: "Flooding & Stormwater",
  },
  fire: {
    local: "/images/fire.jpg",
    remote: "https://images.unsplash.com/photo-1527489377706-5bf97e608852?auto=format&fit=crop&w=500&q=80",
    title: "Fire Hazard",
  },
  charging: {
    local: "/images/charging.jpg",
    remote: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=500&q=80",
    title: "Charging Stations",
  },
  clinic: {
    local: "/images/clinic.jpg",
    remote: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=500&q=80",
    title: "Health Clinics & Emergency Care",
  },
  shelter: {
    local: "/images/shelter.jpg",
    remote: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80",
    title: "Community Safe Shelters",
  },
  "action-report": {
    local: "/images/action-report.jpg",
    remote: "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=500&q=80",
    title: "Report a Community Issue",
  },
  "action-schedules": {
    local: "/images/action-schedules.jpg",
    remote: "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=500&q=80",
    title: "Outage Timetables & Live Updates",
  },
  "action-help": {
    local: "/images/action-help.jpg",
    remote: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=500&q=80",
    title: "Community Relief Aid",
  },
};

export function CategoryVisual({
  category,
  alt,
  variant = "thumbnail",
  className = "",
}: CategoryVisualProps) {
  const config = CATEGORY_IMAGE_MAP[category] || CATEGORY_IMAGE_MAP.power;
  const [src, setSrc] = useState(config.local);
  const [triedRemote, setTriedRemote] = useState(false);

  const handleError = () => {
    if (!triedRemote) {
      setTriedRemote(true);
      setSrc(config.remote);
    }
  };

  if (variant === "avatar") {
    return (
      <div
        className={`relative w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-sm border border-[#E5E7EB] bg-[#F3F4F6] ${className}`}
      >
        <img
          src={src}
          alt={alt || config.title}
          onError={handleError}
          className="w-full h-full object-cover select-none transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      </div>
    );
  }

  if (variant === "thumbnail") {
    return (
      <div
        className={`relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-[#E5E7EB] bg-[#F3F4F6] ${className}`}
      >
        <img
          src={src}
          alt={alt || config.title}
          onError={handleError}
          className="w-full h-full object-cover select-none transition-transform duration-200 hover:scale-105"
          loading="eager"
        />
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div
        className={`relative w-full h-36 rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB] bg-[#F3F4F6] ${className}`}
      >
        <img
          src={src}
          alt={alt || config.title}
          onError={handleError}
          className="w-full h-full object-cover select-none"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>
    );
  }

  // Variant: "banner" (Used in Report selection cards and quick action cards)
  return (
    <div
      className={`relative w-full h-24 rounded-2xl overflow-hidden shadow-sm border border-[#E5E7EB] bg-[#F3F4F6] ${className}`}
    >
      <img
        src={src}
        alt={alt || config.title}
        onError={handleError}
        className="w-full h-full object-cover select-none transition-transform duration-300 hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
    </div>
  );
}
