/**
 * Icon Component
 *
 * A centralized component for rendering icons throughout the application.
 * Uses the icon configuration from /config/icons.ts
 */

import { icons, IconName } from "../config/icons";
import { LucideProps } from "lucide-react";

interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({
  name,
  size = 24,
  className = "",
  ...props
}: IconProps) {
  const IconComponent = icons[name];

  if (!IconComponent) {
    console.warn(
      `Icon "${name}" not found in icon configuration`,
    );
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={className}
      {...props}
    />
  );
}

// Usage Example:
// <Icon name="calendar" size={20} className="text-gray-600" />
// <Icon name="mail" size={24} className="text-blue-500" />