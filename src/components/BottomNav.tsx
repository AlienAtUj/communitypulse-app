import React from "react";
import { IconHome, IconList, IconClock, IconHelp } from "./icons";
import { useData, usePathname } from "../context/DataContext";

export function BottomNav() {
  const pathname = usePathname();
  const { navigate } = useData();

  const items = [
    { label: "Home", href: "/", icon: IconHome },
    { label: "Updates", href: "/updates", icon: IconList },
    { label: "Schedules", href: "/schedules", icon: IconClock },
    { label: "Help", href: "/help", icon: IconHelp },
  ];

  return (
    <nav
      aria-label="Primary Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] border-t border-[#E5E7EB]"
    >
      <div className="mx-auto w-full max-w-[420px] h-[64px] pb-[env(safe-area-inset-bottom)] flex items-center justify-around px-3">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const IconComp = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              onClick={() => navigate(item.href)}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5] focus-visible:outline-offset-2 rounded-[12px]",
                isActive ? "text-[#003DA5]" : "text-[#6B7280]",
              ].join(" ")}
            >
              <IconComp size={24} />
              <span className="text-[12px] font-medium leading-[1.4]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
