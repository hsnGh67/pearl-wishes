/**
 * Asset Configuration
 * 
 * Centralized configuration for all static assets including images.
 * This provides type-safe access to public folder assets.
 */

export const IMAGES = {
  hero: {
    banner: '/images/hero/banner.jpg',
    background: '/images/hero/background.jpg',
  },
  
  services: {
    manicure: '/images/services/manicure.jpg',
    pedicure: '/images/services/pedicure.jpg',
    gelNails: '/images/services/gel-nails.jpg',
    nailArt: '/images/services/nail-art.jpg',
  },
  
  lookbook: {
    gallery1: '/images/lookbook/gallery-1.jpg',
    gallery2: '/images/lookbook/gallery-2.jpg',
    gallery3: '/images/lookbook/gallery-3.jpg',
    gallery4: '/images/lookbook/gallery-4.jpg',
    gallery5: '/images/lookbook/gallery-5.jpg',
    gallery6: '/images/lookbook/gallery-6.jpg',
  },
  
  team: {
    member1: '/images/team/member-1.jpg',
    member2: '/images/team/member-2.jpg',
    member3: '/images/team/member-3.jpg',
  },
  
  testimonials: {
    client1: '/images/testimonials/client-1.jpg',
    client2: '/images/testimonials/client-2.jpg',
    client3: '/images/testimonials/client-3.jpg',
  },
  
  placeholder: {
    grey: '/images/placeholder-grey.jpg',
  },
} as const;

export type ImagePath = typeof IMAGES;

// Usage Example:
// import { IMAGES } from './assets';
// <img src={IMAGES.hero.banner} alt="Hero banner" />
