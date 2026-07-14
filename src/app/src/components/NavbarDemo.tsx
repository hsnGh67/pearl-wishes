import logo from 'figma:asset/de725b32570940ed7773a5a87deed14a098ee089.png';
import { Menu, X, Phone } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { BookingFlow } from '../../components/BookingFlow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';

export function NavbarDemo() {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FEFCFA' }}>
      {/* Variation 1 - Original */}
      <div className="mb-8">
        <div className="text-center py-4" style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}>
          <h2 className="text-xl font-semibold">Variation 1 - Original Background (#EADDD5)</h2>
        </div>
        <nav className="backdrop-blur-sm border-b border-gray-200" style={{ backgroundColor: '#EADDD5' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <a href="/" className="flex items-center gap-3" style={{ color: '#3D3935' }}>
                  <img 
                    src={logo} 
                    alt="Pearl Wishes Studio Logo" 
                    className="h-40 w-auto" 
                  />
                </a>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="/about" className="text-gray-700 hover:text-gray-900 transition-colors">
                  About
                </a>
                <a href="/#services" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Treatments
                </a>
                <a href="/workshops" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Workshops
                </a>
              </div>

              {/* CTA Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="icon"
                  style={{ backgroundColor: '#E9CFCA', borderColor: '#3D3935', color: '#3D3935' }}
                  className="border-2 transition-all"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#D0A096';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#E9CFCA';
                  }}
                  onClick={() => setWhatsappModalOpen(true)}
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button 
                  className="transition-all"
                  style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1F1F1F';
                    e.currentTarget.style.color = '#D0A096';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3D3935';
                    e.currentTarget.style.color = '#E9CFCA';
                  }}
                  onClick={() => setBookingOpen(true)}
                >
                  Book Appointment
                </Button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsOpen1(!isOpen1)}
                  className="text-gray-700 hover:text-gray-900"
                >
                  {isOpen1 ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isOpen1 && (
            <div className="md:hidden border-t border-gray-200" style={{ backgroundColor: '#EADDD5' }}>
              <div className="px-4 pt-2 pb-4 space-y-2">
                <a
                  href="/about"
                  className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsOpen1(false)}
                >
                  About
                </a>
                <a
                  href="/#services"
                  className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsOpen1(false)}
                >
                  Treatments
                </a>
                <a
                  href="/workshops"
                  className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsOpen1(false)}
                >
                  Workshops
                </a>
                <div className="pt-2">
                  <Button 
                    className="w-full transition-all"
                    style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1F1F1F';
                      e.currentTarget.style.color = '#D0A096';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3D3935';
                      e.currentTarget.style.color = '#E9CFCA';
                    }}
                    onClick={() => {
                      setBookingOpen(true);
                      setIsOpen1(false);
                    }}
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Variation 2 - Gradient */}
      <div className="mb-8">
        <div className="text-center py-4" style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}>
          <h2 className="text-xl font-semibold">Variation 2 - Gradient Background (#FCEAE0 to #EACAB8)</h2>
        </div>
        <nav className="backdrop-blur-sm border-b border-gray-200" style={{ background: 'linear-gradient(to bottom, #FCEAE0, #EACAB8)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <div className="flex-shrink-0">
                <a href="/" className="flex items-center gap-3" style={{ color: '#3D3935' }}>
                  <img 
                    src={logo} 
                    alt="Pearl Wishes Studio Logo" 
                    className="h-40 w-auto" 
                  />
                </a>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <a href="/about" className="text-gray-700 hover:text-gray-900 transition-colors">
                  About
                </a>
                <a href="/#services" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Treatments
                </a>
                <a href="/workshops" className="text-gray-700 hover:text-gray-900 transition-colors">
                  Workshops
                </a>
              </div>

              {/* CTA Buttons */}
              <div className="hidden md:flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="icon"
                  style={{ backgroundColor: '#E9CFCA', borderColor: '#3D3935', color: '#3D3935' }}
                  className="border-2 transition-all"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#D0A096';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#E9CFCA';
                  }}
                  onClick={() => setWhatsappModalOpen(true)}
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button 
                  className="transition-all"
                  style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1F1F1F';
                    e.currentTarget.style.color = '#D0A096';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3D3935';
                    e.currentTarget.style.color = '#E9CFCA';
                  }}
                  onClick={() => setBookingOpen(true)}
                >
                  Book Appointment
                </Button>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsOpen2(!isOpen2)}
                  className="text-gray-700 hover:text-gray-900"
                >
                  {isOpen2 ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {isOpen2 && (
            <div className="md:hidden border-t border-gray-200" style={{ background: 'linear-gradient(to bottom, #FCEAE0, #EACAB8)' }}>
              <div className="px-4 pt-2 pb-4 space-y-2">
                <a
                  href="/about"
                  className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsOpen2(false)}
                >
                  About
                </a>
                <a
                  href="/#services"
                  className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsOpen2(false)}
                >
                  Treatments
                </a>
                <a
                  href="/workshops"
                  className="block px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsOpen2(false)}
                >
                  Workshops
                </a>
                <div className="pt-2">
                  <Button 
                    className="w-full transition-all"
                    style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1F1F1F';
                      e.currentTarget.style.color = '#D0A096';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3D3935';
                      e.currentTarget.style.color = '#E9CFCA';
                    }}
                    onClick={() => {
                      setBookingOpen(true);
                      setIsOpen2(false);
                    }}
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Sample content to show the navbars in context */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#3D3935' }}>
            Choose Your Preferred Navbar Design
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Compare both variations above to select the best fit for Pearl Wishes Studio
          </p>
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <div className="p-6 border-2" style={{ borderColor: '#EADDD5', backgroundColor: '#FAF7F5' }}>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#3D3935' }}>Variation 1</h3>
              <p className="text-gray-600">Solid old rose background - classic and consistent</p>
            </div>
            <div className="p-6 border-2" style={{ borderColor: '#EACAB8', backgroundColor: '#FAF7F5' }}>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#3D3935' }}>Variation 2</h3>
              <p className="text-gray-600">Gradient peach to warm beige - soft and elegant</p>
            </div>
          </div>
        </div>
      </div>

      <BookingFlow open={bookingOpen} onOpenChange={setBookingOpen} />

      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-2 rounded-none p-8" style={{ borderColor: '#3D3935' }}>
          <DialogHeader className="space-y-4">
            <DialogTitle style={{ color: '#3D3935' }}>Contact Us on WhatsApp</DialogTitle>
            <DialogDescription className="text-gray-600">
              This will take you to WhatsApp where you can message us directly for any questions or enquiries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-8 gap-4 sm:justify-center">
            <Button
              variant="outline"
              className="border-2 border-gray-300 rounded-none px-6"
              onClick={() => setWhatsappModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-none px-6 transition-all"
              style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1F1F1F';
                e.currentTarget.style.color = '#D0A096';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3D3935';
                e.currentTarget.style.color = '#E9CFCA';
              }}
              onClick={() => {
                setWhatsappModalOpen(false);
                window.open('https://wa.me/447123456789', '_blank');
              }}
            >
              <Phone className="mr-2 h-4 w-4" />
              Open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}