import React from "react";
import { Logo } from "./Logo";
import { useData } from "../context/DataContext";

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  isDisplay?: boolean;
  rightSlot?: React.ReactNode;
  showLogo?: boolean;
  onLogoClick?: () => void;
  onDbStatusClick?: () => void;
}

export function ScreenHeader({
  title,
  subtitle,
  isDisplay = false,
  rightSlot,
  showLogo = false,
  onLogoClick,
  onDbStatusClick,
}: ScreenHeaderProps) {
  const { currentUser, isLiveDatabase } = useData();

  return (
    <header className="sticky top-0 z-10 bg-[#FFFFFF] px-5 pt-3.5 pb-3 border-b border-[#E5E7EB]">
      {showLogo && (
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#F3F4F6]">
          <div className="flex items-center gap-2">
            <Logo
              size="sm"
              variant="horizontal"
              showTagline
              onClick={onLogoClick}
            />
            {onDbStatusClick && (
              <button
                type="button"
                onClick={onDbStatusClick}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#F7F8FA] border border-[#E5E7EB] hover:bg-[#EEF0F4] transition-colors cursor-pointer"
                title="Click to view database connection status and run a live test"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLiveDatabase ? "bg-[#00A651] animate-pulse" : "bg-[#FF9500]"
                  }`}
                />
                <span className={isLiveDatabase ? "text-[#00A651]" : "text-[#B45309]"}>
                  {isLiveDatabase ? "Live DB" : "Setup DB"}
                </span>
              </button>
            )}
          </div>
          {onLogoClick && (
            <button
              type="button"
              onClick={onLogoClick}
              className="text-[12px] font-bold text-[#003DA5] hover:text-[#002D7A] bg-[#003DA5]/5 hover:bg-[#003DA5]/10 px-2.5 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {currentUser ? (
                <>
                  <span className="w-4 h-4 rounded-full bg-[#003DA5] text-[#FFFFFF] text-[10px] inline-flex items-center justify-center font-bold">
                    {(currentUser.displayName || "U").charAt(0).toUpperCase()}
                  </span>
                  <span>{currentUser.displayName?.split(" ")[0] || "Account"}</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>
          )}
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1
            className={
              isDisplay
                ? "text-[28px] sm:text-[32px] font-black tracking-[-0.02em] leading-[1.15] text-[#111827] break-words"
                : "text-[22px] sm:text-[24px] font-bold tracking-[-0.01em] leading-[1.2] text-[#111827] break-words"
            }
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] font-normal leading-[1.4] text-[#6B7280] mt-1 break-words">
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </header>
  );
}
