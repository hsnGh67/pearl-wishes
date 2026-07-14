/**
 * Image Usage Examples
 * 
 * This file demonstrates different ways to use images in the application
 * with the new centralized asset system.
 */

import { IMAGES } from '../config/assets';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Method 1: Using the centralized IMAGES config (RECOMMENDED)
export function ImageConfigExample() {
  return (
    <div className="space-y-4">
      {/* Hero image */}
      <img 
        src={IMAGES.hero.banner} 
        alt="Hero banner" 
        className="w-full h-auto"
      />
      
      {/* Service images */}
      <div className="grid grid-cols-2 gap-4">
        <img 
          src={IMAGES.services.manicure} 
          alt="Manicure service" 
        />
        <img 
          src={IMAGES.services.pedicure} 
          alt="Pedicure service" 
        />
      </div>
    </div>
  );
}

// Method 2: Using ImageWithFallback component (for dynamic images)
export function ImageWithFallbackExample() {
  return (
    <div className="space-y-4">
      <ImageWithFallback
        src={IMAGES.hero.banner}
        alt="Hero banner"
        className="w-full h-auto"
      />
      
      {/* With fallback for missing images */}
      <ImageWithFallback
        src="/images/services/custom-service.jpg"
        alt="Custom service"
        className="w-64 h-64 object-cover"
      />
    </div>
  );
}

// Method 3: Direct path (for simple cases)
export function DirectPathExample() {
  return (
    <img 
      src="/images/hero/banner.jpg" 
      alt="Hero banner" 
      className="w-full h-auto"
    />
  );
}

// Real-world example: Lookbook Gallery
export function LookbookGalleryExample() {
  const galleryImages = [
    { src: IMAGES.lookbook.gallery1, alt: 'Nail art design 1' },
    { src: IMAGES.lookbook.gallery2, alt: 'Nail art design 2' },
    { src: IMAGES.lookbook.gallery3, alt: 'Nail art design 3' },
    { src: IMAGES.lookbook.gallery4, alt: 'Nail art design 4' },
    { src: IMAGES.lookbook.gallery5, alt: 'Nail art design 5' },
    { src: IMAGES.lookbook.gallery6, alt: 'Nail art design 6' },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {galleryImages.map((image, index) => (
        <ImageWithFallback
          key={index}
          src={image.src}
          alt={image.alt}
          className="w-full h-64 object-cover rounded-lg"
        />
      ))}
    </div>
  );
}

// Real-world example: Service Cards
export function ServiceCardsExample() {
  const services = [
    {
      title: 'Manicure',
      image: IMAGES.services.manicure,
      description: 'Professional manicure service',
    },
    {
      title: 'Pedicure',
      image: IMAGES.services.pedicure,
      description: 'Relaxing pedicure treatment',
    },
    {
      title: 'Gel Nails',
      image: IMAGES.services.gelNails,
      description: 'Long-lasting gel nail application',
    },
    {
      title: 'Nail Art',
      image: IMAGES.services.nailArt,
      description: 'Creative nail art designs',
    },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {services.map((service, index) => (
        <div key={index} className="border rounded-lg overflow-hidden">
          <ImageWithFallback
            src={service.image}
            alt={service.title}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="mb-2">{service.title}</h3>
            <p className="text-gray-600">{service.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Real-world example: Team Members
export function TeamMembersExample() {
  const team = [
    { name: 'Sarah Johnson', role: 'Senior Nail Technician', image: IMAGES.team.member1 },
    { name: 'Emma Wilson', role: 'Nail Artist', image: IMAGES.team.member2 },
    { name: 'Lisa Brown', role: 'Beauty Specialist', image: IMAGES.team.member3 },
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {team.map((member, index) => (
        <div key={index} className="text-center">
          <ImageWithFallback
            src={member.image}
            alt={member.name}
            className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
          />
          <h4 className="mb-1">{member.name}</h4>
          <p className="text-gray-600">{member.role}</p>
        </div>
      ))}
    </div>
  );
}
