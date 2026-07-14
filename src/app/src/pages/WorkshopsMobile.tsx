import { useState } from 'react';
import { MobileWorkshopsNav } from '../components/workshops/mobile/MobileWorkshopsNav';
import { MobileWorkshopHero } from '../components/workshops/mobile/MobileWorkshopHero';
import { MobileFilterBar } from '../components/workshops/mobile/MobileFilterBar';
import { MobileFeaturedWorkshops } from '../components/workshops/mobile/MobileFeaturedWorkshops';
import { MobileCategories } from '../components/workshops/mobile/MobileCategories';
import { MobileWorkshopList } from '../components/workshops/mobile/MobileWorkshopList';
import { MobileCalendarView } from '../components/workshops/mobile/MobileCalendarView';
import { MobileHowItWorks } from '../components/workshops/mobile/MobileHowItWorks';
import { MobileWorkshopInfo } from '../components/workshops/mobile/MobileWorkshopInfo';
import { WorkshopFAQ } from '../components/workshops/WorkshopFAQ';
import { Footer } from '../components/layout/Footer';

export default function WorkshopsMobile() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Mobile Navigation */}
      <MobileWorkshopsNav 
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
      />
      
      {/* Hero Section */}
      <MobileWorkshopHero />
      
      {/* Filter Bar with View Toggle */}
      <MobileFilterBar view={view} onViewChange={setView} />
      
      {/* Featured Workshops */}
      <MobileFeaturedWorkshops />
      
      {/* Categories */}
      <MobileCategories />
      
      {/* Workshop List or Calendar View */}
      {view === 'list' ? (
        <MobileWorkshopList />
      ) : (
        <MobileCalendarView />
      )}
      
      {/* How It Works */}
      <MobileHowItWorks />
      
      {/* Logistics, Pricing, Policies */}
      <MobileWorkshopInfo />
      
      {/* FAQ */}
      <div className="px-5 py-12">
        <WorkshopFAQ />
      </div>
      
      {/* Footer */}
      <Footer />
      
      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <a
          href="/booking"
          className="block w-full h-12 bg-gradient-to-r from-[#FFD4C3] to-[#E8D5C4] text-gray-900 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          Book Appointment
        </a>
      </div>
    </div>
  );
}
