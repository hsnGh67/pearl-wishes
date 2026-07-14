/**
 * Validation Functions
 * 
 * Form and data validation utilities
 */

import { isValidEmail, isValidUKPhone, isValidUKPostcode } from './utils';

export interface ValidationError {
  field: string;
  message: string;
}

export interface BookingFormData {
  service: string;
  date?: Date;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  specialRequests?: string;
}

/**
 * Validate booking form data
 */
export function validateBookingForm(data: Partial<BookingFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  // Service validation
  if (!data.service) {
    errors.push({ field: 'service', message: 'Please select a service' });
  }

  // Date validation
  if (!data.date) {
    errors.push({ field: 'date', message: 'Please select a date' });
  } else if (data.date < new Date()) {
    errors.push({ field: 'date', message: 'Please select a future date' });
  }

  // Time validation
  if (!data.time) {
    errors.push({ field: 'time', message: 'Please select a time' });
  }

  // Name validation
  if (!data.firstName?.trim()) {
    errors.push({ field: 'firstName', message: 'First name is required' });
  }

  if (!data.lastName?.trim()) {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  }

  // Email validation
  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  // Phone validation
  if (!data.phone?.trim()) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  } else if (!isValidUKPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid UK phone number' });
  }

  // Address validation
  if (!data.address?.trim()) {
    errors.push({ field: 'address', message: 'Address is required' });
  }

  // Postcode validation
  if (!data.postcode?.trim()) {
    errors.push({ field: 'postcode', message: 'Postcode is required' });
  } else if (!isValidUKPostcode(data.postcode)) {
    errors.push({ field: 'postcode', message: 'Please enter a valid UK postcode' });
  }

  return errors;
}

/**
 * Validate email subscription
 */
export function validateEmail(email: string): string | null {
  if (!email.trim()) {
    return 'Email is required';
  }
  
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
}

/**
 * Validate contact form
 */
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export function validateContactForm(data: Partial<ContactFormData>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address' });
  }

  if (data.phone && !isValidUKPhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid UK phone number' });
  }

  if (!data.message?.trim()) {
    errors.push({ field: 'message', message: 'Message is required' });
  } else if (data.message.length < 10) {
    errors.push({ field: 'message', message: 'Message must be at least 10 characters' });
  }

  return errors;
}
