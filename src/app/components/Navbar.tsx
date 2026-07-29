import { Menu, X, Phone } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { BookingFlow } from "./BookingFlow";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Placeholder logo
  const logoUrl =
    "data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='16' cy='16' r='14' fill='%233D3935'/%3E%3Ctext x='16' y='20' font-family='Arial' font-size='14' fill='%23FEFCFA' text-anchor='middle'%3EPW%3C/text%3E%3C/svg%3E";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  console.log("NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN");

  return (
    <nav
      className={`fixed top-0 left-0 right-0 bg-white backdrop-blur-sm border-b border-gray-200 z-50 transition-shadow duration-300 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a
              href="/"
              className="flex items-center gap-3"
              style={{ color: "#3D3935" }}
            >
              <img
                src={logoUrl}
                alt="Pearl Wishes Studio Logo"
                className="h-8 w-8"
              />
              <span>Pearl Wishes Studio</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="#about"
              className="transition-colors"
              style={{ color: "#3D3935" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1F1F1F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3D3935")}
            >
              About
            </a>
            <a
              href="#services"
              className="transition-colors"
              style={{ color: "#3D3935" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1F1F1F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3D3935")}
            >
              Services
            </a>
            <a
              href="#training"
              className="transition-colors"
              style={{ color: "#3D3935" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1F1F1F")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#3D3935")}
            >
              Workshops
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              style={{ backgroundColor: "#E9CFCA" }}
              className="border-2 border-gray-800 text-gray-800 transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#D0A096";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#E9CFCA";
              }}
              onClick={() => setWhatsappModalOpen(true)}
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              className="bg-gray-800 transition-all"
              style={{ color: "#E9CFCA" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1F1F1F";
                e.currentTarget.style.color = "#D0A096";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1F1F1F";
                e.currentTarget.style.color = "#E9CFCA";
              }}
              onClick={() => setBookingOpen(true)}
            >
              Book Appointment
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{ color: "#3D3935" }}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <a
              href="#about"
              className="block px-3 py-2 hover:bg-gray-50 rounded-md"
              style={{ color: "#3D3935" }}
              onClick={() => setIsOpen(false)}
            >
              About
            </a>
            <a
              href="#services"
              className="block px-3 py-2 hover:bg-gray-50 rounded-md"
              style={{ color: "#3D3935" }}
              onClick={() => setIsOpen(false)}
            >
              Services
            </a>
            <a
              href="#training"
              className="block px-3 py-2 hover:bg-gray-50 rounded-md"
              style={{ color: "#3D3935" }}
              onClick={() => setIsOpen(false)}
            >
              Workshops
            </a>
            <div className="pt-2">
              <Button
                className="w-full bg-gray-800 transition-all"
                style={{ color: "#E9CFCA" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1F1F1F";
                  e.currentTarget.style.color = "#D0A096";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#1F1F1F";
                  e.currentTarget.style.color = "#E9CFCA";
                }}
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

      {bookingOpen && (
        <BookingFlow open={bookingOpen} onOpenChange={setBookingOpen} />
      )}
      <Dialog open={whatsappModalOpen} onOpenChange={setWhatsappModalOpen}>
        <DialogContent className="sm:max-w-[425px] border-2 border-gray-900 rounded-none p-8">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-gray-900">
              Contact Us on WhatsApp
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              This will take you to WhatsApp where you can message us directly
              for any questions or enquiries.
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
              className="bg-gray-800 rounded-none px-6 transition-all"
              style={{ color: "#E9CFCA" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#1F1F1F";
                e.currentTarget.style.color = "#D0A096";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1F1F1F";
                e.currentTarget.style.color = "#E9CFCA";
              }}
              onClick={() => {
                setWhatsappModalOpen(false);
                window.open("https://wa.me/+447930515131", "_blank");
              }}
            >
              <Phone className="mr-2 h-4 w-4" />
              Open WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
