/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to GBP
 */
export function formatPrice(price: number): string {
  return `£${price.toFixed(2)}`;
}

/**
 * Format date to UK format
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date and time to UK format
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Normalize a UK postcode: trim whitespace and convert to uppercase.
 */
export function normalizePostalCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Validate a UK postcode after normalization.
 * Accepts formats such as SW1A 1AA, EC1A 1BB, W1A 0AX, M1 1AE, B1 1BB.
 */
export function isValidPostalCode(raw: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/.test(normalizePostalCode(raw));
}

/**
 * Validate UK phone number
 */
export function isValidUKPhone(phone: string): boolean {
  const phoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  price: number,
  discount: number,
  type: 'percentage' | 'fixed'
): number {
  if (type === 'percentage') {
    return (price * discount) / 100;
  }
  return discount;
}

/**
 * Scroll to element smoothly
 */
export function scrollToElement(elementId: string): void {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
