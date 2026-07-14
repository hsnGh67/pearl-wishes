/**
 * Type Definitions
 * 
 * Centralized type definitions for the application
 */

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category: 'manicure' | 'extensions' | 'add_on';
}

export interface BookingData {
  service: string;
  servicePrice: number;
  date: Date | undefined;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  specialRequests: string;
  voucherCode: string;
  discount: number;
  finalPrice: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio?: string;
  image?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  rating: number;
  comment: string;
  service?: string;
  date?: string;
  image?: string;
}

export interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  postcode: string;
  city: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export interface VoucherCode {
  code: string;
  discount: number; // percentage or fixed amount
  type: 'percentage' | 'fixed';
  validUntil?: Date;
  minPurchase?: number;
}

export type BookingStep = 
  | 'service' 
  | 'datetime' 
  | 'details' 
  | 'address' 
  | 'review' 
  | 'voucher' 
  | 'confirmation' 
  | 'payment' 
  | 'success';