/**
 * Icon Usage Examples
 * 
 * This file demonstrates different ways to use icons in the application
 * with the new centralized icon system.
 */

// Method 1: Using the centralized Icon component (RECOMMENDED)
import { Icon } from '../components/Icon';

export function IconComponentExample() {
  return (
    <div className="space-y-4">
      {/* Basic usage */}
      <Icon name="calendar" size={24} />
      
      {/* With custom styling */}
      <Icon name="mail" size={20} className="text-blue-500" />
      
      {/* In a button */}
      <button className="flex items-center gap-2">
        <Icon name="send" size={18} />
        <span>Send Message</span>
      </button>
      
      {/* Navigation icons */}
      <Icon name="chevronRight" size={16} className="text-gray-600" />
    </div>
  );
}

// Method 2: Using the icons config object
import { icons } from '../config/icons';

export function IconConfigExample() {
  const CalendarIcon = icons.calendar;
  const MailIcon = icons.mail;
  
  return (
    <div className="space-y-4">
      <CalendarIcon size={24} />
      <MailIcon size={20} className="text-blue-500" />
    </div>
  );
}

// Method 3: Direct import from lucide-react (for specific cases)
import { Calendar, Mail, Phone } from 'lucide-react';

export function DirectImportExample() {
  return (
    <div className="space-y-4">
      <Calendar size={24} />
      <Mail size={20} className="text-blue-500" />
      <Phone size={18} />
    </div>
  );
}

// Real-world example: Contact Section
export function ContactSectionExample() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon name="phone" size={20} className="text-gray-600" />
        <span>020 7946 0958</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Icon name="mail" size={20} className="text-gray-600" />
        <span>hello@example.com</span>
      </div>
      
      <div className="flex items-center gap-3">
        <Icon name="mapPin" size={20} className="text-gray-600" />
        <span>123 King's Road, London</span>
      </div>
    </div>
  );
}

// Social Media Icons Example
export function SocialMediaExample() {
  return (
    <div className="flex gap-4">
      <a href="#" className="hover:text-blue-600">
        <Icon name="facebook" size={24} />
      </a>
      <a href="#" className="hover:text-pink-600">
        <Icon name="instagram" size={24} />
      </a>
      <a href="#" className="hover:text-blue-400">
        <Icon name="twitter" size={24} />
      </a>
    </div>
  );
}

// Service Icons Example
export function ServiceIconsExample() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="text-center">
        <Icon name="sparkles" size={32} className="mx-auto mb-2" />
        <p>Premium Quality</p>
      </div>
      
      <div className="text-center">
        <Icon name="shield" size={32} className="mx-auto mb-2" />
        <p>Safe & Secure</p>
      </div>
      
      <div className="text-center">
        <Icon name="award" size={32} className="mx-auto mb-2" />
        <p>Award Winning</p>
      </div>
      
      <div className="text-center">
        <Icon name="heart" size={32} className="mx-auto mb-2" />
        <p>Customer Love</p>
      </div>
    </div>
  );
}
