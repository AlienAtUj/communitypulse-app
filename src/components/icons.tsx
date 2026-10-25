import React from "react";

export interface IconProps {
  size?: number;
  className?: string;
}

export function IconPower({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.5 3h4.5l-2.5 7h5l-6 11h-3.5l2-8h-4l4.5-10Z" />
    </svg>
  );
}

export function IconWater({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2.8C9 6.8 5.5 10.6 5.5 14.5a6.5 6.5 0 0 0 13 0c0-3.9-3.5-7.7-6.5-11.7Z" />
      <path d="M8.5 15.2c1.2.8 2.6.8 3.8 0 1.1-.7 2.2-.7 3.2.1" />
    </svg>
  );
}

export function IconFood({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 12h16a8 8 0 0 1-16 0Z" />
      <path d="M8 20h8" />
      <path d="M8.5 5.5c0 1.2 1 1.8 1 3" />
      <path d="M12 4.5c0 1.2 1 1.8 1 3" />
      <path d="M15.5 5.5c0 1.2 1 1.8 1 3" />
    </svg>
  );
}

export function IconRoad({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4.5 20L8.5 4" />
      <path d="M19.5 20L15.5 4" />
      <path d="M12 5v2.5" />
      <path d="M12 10.75v2.5" />
      <path d="M12 16.5V19" />
    </svg>
  );
}

export function IconFlood({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 8.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <path d="M3 13.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <path d="M3 18.5c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
    </svg>
  );
}

export function IconReport({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <path d="M12 8.5v7" />
      <path d="M8.5 12h7" />
    </svg>
  );
}

export function IconMap({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  );
}

export function IconLocation({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 21c-4.5-4.6-7-8.1-7-11.2A7 7 0 0 1 19 9.8C19 12.9 16.5 16.4 12 21Z" />
      <circle cx="12" cy="9.8" r="2.6" />
    </svg>
  );
}

export function IconClock({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 12L9 9.5" />
      <path d="M12 12l4-3" />
    </svg>
  );
}

export function IconCheck({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12.8l4.2 4.2c2.8-4.5 6.2-8.2 9.8-10.5" />
    </svg>
  );
}

export function IconAlert({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10.4 4.4L3.3 17a1.8 1.8 0 0 0 1.6 2.7h14.2a1.8 1.8 0 0 0 1.6-2.7L13.6 4.4a1.8 1.8 0 0 0-3.2 0Z" />
      <path d="M12 9.5v5.5" />
    </svg>
  );
}

export function IconBell({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6.5 16.5h11l-1.3-2.2V10a4.2 4.2 0 0 0-8.4 0v4.3L6.5 16.5Z" />
      <path d="M10 19.5h4" />
    </svg>
  );
}

export function IconHome({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3.5 10.5L12 3.8l8.5 6.7" />
      <path d="M5.5 9.5V19.5h13V9.5" />
      <rect x="9.75" y="13.5" width="4.5" height="6" />
    </svg>
  );
}

export function IconList({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="5" cy="7" r="0.75" />
      <path d="M9 7h10" />
      <circle cx="5" cy="12" r="0.75" />
      <path d="M9 12h10" />
      <circle cx="5" cy="17" r="0.75" />
      <path d="M9 17h10" />
    </svg>
  );
}

export function IconHelp({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M9.3 9.3L6 6" />
      <path d="M14.7 9.3L18 6" />
      <path d="M14.7 14.7L18 18" />
      <path d="M9.3 14.7L6 18" />
    </svg>
  );
}

export function IconPhone({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6.8 4.2h2.6l1.3 3.6-1.8 1.6a11.5 11.5 0 0 0 5.7 5.7l1.6-1.8 3.6 1.3v2.6a1.8 1.8 0 0 1-2 1.8A15.4 15.4 0 0 1 5 6.2a1.8 1.8 0 0 1 1.8-2Z" />
    </svg>
  );
}

export function IconArrowRight({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4.5 12h14" />
      <path d="M13 6.5L19 12l-6 5.5" />
    </svg>
  );
}

export function IconClose({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6.5 6.5l11 11" />
      <path d="M17.5 6.5l-11 11" />
    </svg>
  );
}

export function IconChevronDown({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9.5l6 5.5 6-5.5" />
    </svg>
  );
}

export function IconPeople({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-2.8 2.5-4.8 5.5-4.8s5.5 2 5.5 4.8" />
      <circle cx="16" cy="9.5" r="2.4" />
      <path d="M15.5 14.5c2.4.2 4.5 1.8 4.5 4.2" />
    </svg>
  );
}

export function IconTruck({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2.5" y="9.5" width="5.5" height="6.5" rx="1" />
      <rect x="8" y="7.5" width="13.5" height="8.5" rx="4.25" />
      <circle cx="6.5" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}

export function IconFire({ size = 24, className = "" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3c2.5 3.2 5.5 6.2 5.5 10.5a5.5 5.5 0 0 1-11 0c0-2.6 1.5-5 3.2-6.8.3 1.6 1.2 2.5 2.3 2.8 0-2.2 0-4.3 0-6.5Z" />
    </svg>
  );
}

