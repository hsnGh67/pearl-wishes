import * as React from "react";
import { cn } from "./utils";

interface LoadingCardProps {
  className?: string;
  lines?: number;
  height?: string;
}

function LoadingCard({
  className,
  lines = 3,
  height = "h-4",
}: LoadingCardProps) {
  return (
    <div
      className={cn(
        "bg-[#FAF7F5] border border-[#EACAB8] rounded-lg flex flex-col gap-4 p-6",
        className,
      )}
    >
      {/* Skeleton Header */}
      <div className="space-y-3">
        <div
          className={`${height} bg-[#FCEAE0] rounded animate-pulse`}
          style={{ width: "60%" }}
        />
        <div
          className={`${height} bg-[#FCEAE0] rounded animate-pulse`}
          style={{ width: "80%" }}
        />
      </div>

      {/* Skeleton Content */}
      <div className="space-y-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${height} bg-[#FCEAE0] rounded animate-pulse`}
            style={{
              width:
                i === 0
                  ? "100%"
                  : i === lines - 1
                    ? "70%"
                    : "90%",
            }}
          />
        ))}
      </div>

      {/* Skeleton Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-[#EACAB8]">
        <div
          className={`${height} bg-[#FCEAE0] rounded animate-pulse`}
          style={{ width: "40%" }}
        />
        <div
          className={`${height} bg-[#FCEAE0] rounded animate-pulse`}
          style={{ width: "80px" }}
        />
      </div>
    </div>
  );
}

function LoadingCardGrid({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

export { LoadingCard, LoadingCardGrid };