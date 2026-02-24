"use client";

import { Calendar, Timer } from "lucide-react";

interface FixedElectoralBannerProps {
  processName: string;
  electionDate: string;
  daysRemaining: number;
  navbarHeight?: string;
}

const FixedElectoralBanner = ({
  processName,
  electionDate,
  daysRemaining,
}: FixedElectoralBannerProps) => {
  const firstTwo = processName.split(" ").slice(0, 2).join(" ");
  return (
    <div className="sticky lg:top-14 left-0 right-0 z-30 bg-gradient-to-r from-primary via-primary/95 to-primary/90 text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center justify-center gap-3 md:gap-4 text-xs md:text-sm">
          <span className="font-semibold inline truncate">{firstTwo}</span>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 md:size-4" />
              <span>{electionDate}</span>
            </div>

            {daysRemaining > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-warning/90 rounded-md px-2.5 py-1">
                <Timer className="size-3.5 md:size-4" />
                <span className="font-bold">
                  {daysRemaining}{" "}
                  <span className="inline">
                    {daysRemaining === 1 ? "día" : "días"}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedElectoralBanner;
