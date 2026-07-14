/**
 * Application Constants
 * 
 * Centralized constants and configuration values
 */

import type { ContactInfo, SocialLinks } from '../types';

export const SITE_NAME = 'Name Here';

export const CONTACT_INFO: ContactInfo = {
  phone: '020 7946 0958',
  email: 'hello@luxenails.co.uk',
  address: '123 King\'s Road',
  postcode: 'SW3 4PA',
  city: 'London',
};

export const SOCIAL_LINKS: SocialLinks = {
  facebook: 'https://facebook.com',
  instagram: 'https://instagram.com',
  twitter: 'https://twitter.com',
};

export const BUSINESS_HOURS = {
  weekdays: 'Monday - Friday: 9:00 AM - 8:00 PM',
  saturday: 'Saturday: 10:00 AM - 6:00 PM',
  sunday: 'Sunday: Closed',
};

// Services are fetched from Supabase - no mock data needed
// The public site in /src/components/sections/Features.tsx is the source of truth

export const TIME_SLOTS = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
];

export const VOUCHER_CODES = {
  WELCOME10: { discount: 10, type: 'percentage' as const },
  FIRST20: { discount: 20, type: 'percentage' as const },
  SAVE5: { discount: 5, type: 'fixed' as const },
};

export const SERVICE_AREAS = [
  'Chelsea',
  'Kensington',
  'Knightsbridge',
  'Belgravia',
  'Mayfair',
  'Westminster',
  'South Kensington',
  'Fulham',
];

export const NAVIGATION_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'Lookbook', href: '#lookbook' },
  { label: 'Training', href: '#training' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];