import { Menu, X, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { BookingFlow } from '../../../components/BookingFlow';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Logo as inline SVG or data URL for testing
  const logoUrl = "data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='14' fill='%233D3935'/%3E%3Ctext x='16' y='20' font-family='Arial' font-size='14' fill='%23FEFCFA' text-anchor='middle'%3EPW%3C/text%3E%3C/svg%3E";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 backdrop-blur-sm border-b border-gray-200 z-50 transition-shadow duration-300 ${
      isScrolled ? 'shadow-md' : ''
    }`} style={{ backgroundColor: '#EADDD5' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center gap-3" style={{ color: '#3D3935' }}>
              <img src={logoUrl} alt="Pearl Wishes Studio Logo" className="h-8 w-8" />
              <span>Pearl Wishes Studio</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-gray-700 hover:text-gray-900 transition-colors">
              About
            </a>
            <a href="#services" className="text-gray-700 hover:text-gray-900 transition-colors">
              Treatments
            </a>
            <a href="/workshops" className="text-gray-700 hover:text-gray-900 transition-colors">
              Workshops
            </a>
            <a href="#contact" className="text-gray-700 hover:text-gray-900 transition-colors">
              Contact
            </a>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-3">
            <a 
              href="/admin"
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Admin Panel"
            >
              <Settings size={20} style={{ color: '#3D3935' }} />
            </a>
            <Button 
              className="bg-gray-800 hover:bg-gray-900"
              onClick={() => setBookingOpen(true)}
            >
              Book Appointment
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-gray-900"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200" style={{ backgroundColor: '#EADDD5' }}>
          <div className="px-4 pt-2 pb-4 space-y-2">
            <a
              href="#about"
              className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              About
            </a>
            <a
              href="#services"
              className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Treatments
            </a>
            <a
              href="/workshops"
              className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Workshops
            </a>
            <a
              href="#contact"
              className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Contact
            </a>
            <a
              href="/admin"
              className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Admin Panel
            </a>
            <div className="pt-2">
              <Button 
                className="w-full bg-gray-800 hover:bg-gray-900"
                onClick={() => {
                  setBookingOpen(true);
                  setIsOpen(false);
                }}
              >
                Book Appointment
              </Button>
            </div>
          </div>
        </div>
      )}

      <BookingFlow open={bookingOpen} onOpenChange={setBookingOpen} />
    </nav>
  );
}