import logo from 'figma:asset/de725b32570940ed7773a5a87deed14a098ee089.png';
import { Menu, X, Phone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { BookingFlow } from '../components/BookingFlow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

export function NavbarComparisonPage() {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  return (
    <div style={{ backgroundColor: '#FAF7F5', minHeight: '100vh', margin: 0, padding: 0, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Page Title */}
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px', 
        backgroundColor: '#3D3935',
        color: '#FEFCFA',
        width: '100%'
      }}>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '10px' }}>
          Navbar Design Comparison
        </h1>
        <p style={{ fontSize: '18px' }}>
          View both options side by side
        </p>
      </div>

      {/* Side by Side Container */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0',
        width: '100%',
        maxWidth: '1920px',
        margin: '0 auto',
        padding: 0
      }}>
        {/* ========== OPTION A ========== */}
        <div style={{ backgroundColor: '#FFFFFF', border: '3px solid #3D3935' }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#3D3935',
            color: '#FEFCFA'
          }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>OPTION A</h2>
            <p style={{ fontSize: '16px', marginTop: '8px' }}>Solid Old Rose (#EADDD5)</p>
          </div>
          
          {/* Navbar A */}
          <nav className="border-b border-gray-200 w-full" style={{ backgroundColor: '#EADDD5' }}>
            <div className="px-4 w-full">
              <div className="flex justify-between items-center h-16">
                <div className="flex-shrink-0">
                  <a href="/" className="flex items-center">
                    <img 
                      src={logo} 
                      alt="Pearl Wishes Studio Logo" 
                      className="h-32 w-auto" 
                    />
                  </a>
                </div>

                <div className="hidden lg:flex items-center space-x-4">
                  <a href="/about" className="text-gray-700 hover:text-gray-900 text-sm">
                    About
                  </a>
                  <a href="/#services" className="text-gray-700 hover:text-gray-900 text-sm">
                    Treatments
                  </a>
                  <a href="/workshops" className="text-gray-700 hover:text-gray-900 text-sm">
                    Workshops
                  </a>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="icon"
                    style={{ backgroundColor: '#E9CFCA', borderColor: '#3D3935', color: '#3D3935' }}
                    className="border-2"
                    onClick={() => setWhatsappModalOpen(true)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm"
                    style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
                    onClick={() => setBookingOpen(true)}
                  >
                    Book Appointment
                  </Button>
                </div>

                <div className="lg:hidden">
                  <button onClick={() => setIsOpen1(!isOpen1)}>
                    {isOpen1 ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {isOpen1 && (
              <div className="lg:hidden border-t" style={{ backgroundColor: '#EADDD5' }}>
                <div className="px-4 py-3 space-y-2">
                  <a href="/about" className="block py-2 text-sm">About</a>
                  <a href="/#services" className="block py-2 text-sm">Treatments</a>
                  <a href="/workshops" className="block py-2 text-sm">Workshops</a>
                  <Button 
                    size="sm"
                    className="w-full mt-2"
                    style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
                    onClick={() => setBookingOpen(true)}
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            )}
          </nav>

          {/* Sample Hero/Banner for Option A */}
          <div style={{ 
            backgroundColor: '#EADDD5',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#3D3935',
              marginBottom: '16px'
            }}>
              Welcome to Pearl Wishes Studio
            </h2>
            <p style={{ 
              fontSize: '18px', 
              color: '#3D3935',
              marginBottom: '24px'
            }}>
              Luxury nail care in the comfort of your home
            </p>
            <Button 
              style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
              onClick={() => setBookingOpen(true)}
            >
              Book Your Appointment
            </Button>
          </div>
        </div>

        {/* ========== OPTION B ========== */}
        <div style={{ backgroundColor: '#FFFFFF', border: '3px solid #D0A096' }}>
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            backgroundColor: '#D0A096',
            color: '#3D3935'
          }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold' }}>OPTION B</h2>
            <p style={{ fontSize: '16px', marginTop: '8px' }}>Gradient Peach to Beige</p>
          </div>
          
          {/* Navbar B */}
          <nav className="border-b border-gray-200 w-full" style={{ background: 'linear-gradient(to bottom, #FCEAE0, #EACAB8)' }}>
            <div className="px-4 w-full">
              <div className="flex justify-between items-center h-16">
                <div className="flex-shrink-0">
                  <a href="/" className="flex items-center">
                    <img 
                      src={logo} 
                      alt="Pearl Wishes Studio Logo" 
                      className="h-32 w-auto" 
                    />
                  </a>
                </div>

                <div className="hidden lg:flex items-center space-x-4">
                  <a href="/about" className="text-gray-700 hover:text-gray-900 text-sm">
                    About
                  </a>
                  <a href="/#services" className="text-gray-700 hover:text-gray-900 text-sm">
                    Treatments
                  </a>
                  <a href="/workshops" className="text-gray-700 hover:text-gray-900 text-sm">
                    Workshops
                  </a>
                </div>

                <div className="hidden lg:flex items-center gap-2">
                  <Button 
                    variant="outline"
                    size="icon"
                    style={{ 
                      background: 'linear-gradient(to right, #FCEAE0, #EACAB8)', 
                      borderColor: '#3D3935', 
                      color: '#3D3935' 
                    }}
                    className="border-2 transition-all"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #EACAB8, #D0A096)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(to right, #FCEAE0, #EACAB8)';
                    }}
                    onClick={() => setWhatsappModalOpen(true)}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm"
                    className="transition-all"
                    style={{ 
                      backgroundColor: '#3D3935',
                      background: '#3D3935',
                      color: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1F1F1F';
                      e.currentTarget.style.background = '#1F1F1F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3D3935';
                      e.currentTarget.style.background = '#3D3935';
                    }}
                    onClick={() => setBookingOpen(true)}
                  >
                    <span style={{
                      background: 'linear-gradient(to right, #FCEAE0, #EACAB8)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent'
                    }}>
                      Book Appointment
                    </span>
                  </Button>
                </div>

                <div className="lg:hidden">
                  <button onClick={() => setIsOpen2(!isOpen2)}>
                    {isOpen2 ? <X size={20} /> : <Menu size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {isOpen2 && (
              <div className="lg:hidden border-t" style={{ background: 'linear-gradient(to bottom, #FCEAE0, #EACAB8)' }}>
                <div className="px-4 py-3 space-y-2">
                  <a href="/about" className="block py-2 text-sm">About</a>
                  <a href="/#services" className="block py-2 text-sm">Treatments</a>
                  <a href="/workshops" className="block py-2 text-sm">Workshops</a>
                  <Button 
                    size="sm"
                    className="w-full mt-2"
                    style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
                    onClick={() => setBookingOpen(true)}
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            )}
          </nav>

          {/* Sample Hero/Banner for Option B */}
          <div style={{ 
            background: 'linear-gradient(to bottom, #FCEAE0, #EACAB8)',
            padding: '60px 20px',
            textAlign: 'center'
          }}>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              color: '#3D3935',
              marginBottom: '16px'
            }}>
              Welcome to Pearl Wishes Studio
            </h2>
            <p style={{ 
              fontSize: '18px', 
              color: '#3D3935',
              marginBottom: '24px'
            }}>
              Luxury nail care in the comfort of your home
            </p>
            <Button 
              style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }}
              onClick={() => setBookingOpen(true)}
            >
              Book Your Appointment
            </Button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px',
        backgroundColor: '#FEFCFA',
        margin: '40px 20px',
        border: '2px solid #3D3935'
      }}>
        <h3 style={{ fontSize: '24px', color: '#3D3935', marginBottom: '16px' }}>
          Which option do you prefer?
        </h3>
        <p style={{ fontSize: '16px', color: '#3D3935', marginBottom: '8px' }}>
          Option A has a solid old rose background
        </p>
        <p style={{ fontSize: '16px', color: '#3D3935' }}>
          Option B has a gradient background from peach to warm beige
        </p>
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