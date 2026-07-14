"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react@0.487.0";
import { DayPicker } from "react-day-picker@8.10.1";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-6", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-6",
        caption: "flex justify-center pt-1 relative items-center w-full mb-4",
        caption_label: "text-gray-900",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "size-9 bg-transparent p-0 rounded-md flex items-center justify-center text-gray-600 transition-colors",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex mb-2",
        head_cell:
          "text-gray-600 uppercase rounded-md w-10 text-xs tracking-wider",
        row: "flex w-full mt-1",
        cell: cn(
          "relative p-0 text-center focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "",
        ),
        day: cn(
          "size-10 p-0 aria-selected:opacity-100 rounded-full inline-flex items-center justify-center transition-colors",
        ),
        day_range_start:
          "day-range-start",
        day_range_end:
          "day-range-end",
        day_selected:
          "rounded-full",
        day_today: "",
        day_outside:
          "day-outside text-gray-400 opacity-50",
        day_disabled: "text-gray-300 opacity-50 cursor-not-allowed hover:bg-transparent",
        day_range_middle:
          "aria-selected:bg-blue-50 aria-selected:text-blue-600",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-5", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-5", className)} {...props} />
        ),
      }}
      {...props}
      modifiersStyles={{
        selected: {
          backgroundColor: '#3D3935',
          color: '#FEFCFA',
        },
      }}
      styles={{
        day: {
          color: '#3D3935',
        },
        day_button: {
          transition: 'all 0.2s',
        },
      }}
      onDayMouseEnter={(day, modifiers, e) => {
        if (!modifiers.disabled && !modifiers.selected) {
          (e.target as HTMLElement).style.backgroundColor = '#E9CFCA';
        }
      }}
      onDayMouseLeave={(day, modifiers, e) => {
        if (!modifiers.selected) {
          (e.target as HTMLElement).style.backgroundColor = 'transparent';
        }
      }}
    />
  );
}

export { Calendar };
