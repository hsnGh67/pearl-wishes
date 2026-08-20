import logo from "figma:asset/de725b32570940ed7773a5a87deed14a098ee089.png";
import {
  Menu,
  X,
  Phone,
  Settings,
  LogOut,
  LogIn,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../../components/ui/button";
import { BookingFlow } from "../../../components/BookingFlow";
import { useAuth } from "../../hooks/useAuth";
import { isPlaceholderFullName } from "../../lib/auth/profile-sync";
import { PhoneAuthDialog } from "../auth/PhoneAuthDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";

export function WorkshopsNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] =
    useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, profile, signOut } =
    useAuth();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 backdrop-blur-sm border-b border-gray-200 z-50 transition-shadow duration-300 ${
        isScrolled ? "shadow-md" : ""
      }`}
      style={{
        background:
          "linear-gradient(to left, #FCEAE0, #EACAB8)",
      }}
    >
      <div
        className="mx-auto px-4 sm:px-6 lg:px-8 m-[0px]"
        style={{ maxWidth: "1920px" }}
      >
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a
              href="/"
              className="flex items-center gap-3"
              style={{ color: "#3D3935" }}
            >
              <img
                src={logo}
                alt="Pearl Wishes Studio Logo"
                className="h-40 w-auto"
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href="/about"
              className="text-gray-700 hover:text-[#3D3935] transition-colors"
            >
              About
            </a>

            <a
              href="/workshops"
              className="text-gray-700 hover:text-[#3D3935] transition-colors"
            >
              Workshops
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              style={{
                background:
                  "linear-gradient(to right, #FCEAE0, #EACAB8)",
                borderColor: "#3D3935",
                color: "#3D3935",
              }}
              className="border-2 transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(to right, #EACAB8, #D0A096)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(to right, #FCEAE0, #EACAB8)";
              }}
              onClick={() => setWhatsappModalOpen(true)}
            >
              <Phone className="h-5 w-5" />
            </Button>
            {isAuthenticated && (
              <Button
                variant="outline"
                style={{
                  background:
                    "linear-gradient(to right, #FCEAE0, #EACAB8)",
                  borderColor: "#3D3935",
                  color: "#3D3935",
                }}
                className="border-2 transition-all"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(to right, #EACAB8, #D0A096)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(to right, #FCEAE0, #EACAB8)";
                }}
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            )}
            {(!isAuthenticated || isAdmin) && (
              <Button
                variant="outline"
                size="icon"
                style={{
                  background:
                    "linear-gradient(to right, #FCEAE0, #EACAB8)",
                  borderColor: "#3D3935",
                  color: "#3D3935",
                }}
                className="border-2 transition-all"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(to right, #EACAB8, #D0A096)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(to right, #FCEAE0, #EACAB8)";
                }}
                onClick={() =>
                  isAdmin
                    ? navigate("/admin")
                    : setLoginOpen(true)
                }
                title={isAdmin ? "Admin Panel" : "Sign In"}
              >
                {isAdmin ? (
                  <Settings className="h-5 w-5" />
                ) : (
                  <LogIn className="h-5 w-5" />
                )}
              </Button>
            )}
            <Button
              className="transition-all"
              style={{
                backgroundColor: "#3D3935",
                background: "#3D3935",
                color: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "#1F1F1F";
                e.currentTarget.style.background = "#1F1F1F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "#3D3935";
                e.currentTarget.style.background = "#3D3935";
              }}
              onClick={() => setBookingOpen(true)}
            >
              <span
                style={{
                  background:
                    "linear-gradient(to right, #FCEAE0, #EACAB8)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                Book Appointment
              </span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-[#3D3935]"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="md:hidden border-t border-gray-200"
          style={{ backgroundColor: "#EADDD5" }}
        >
          <div className="px-4 pt-2 pb-4 space-y-2">
            <a
              href="/about"
              className="block px-3 py-2 text-gray-700 hover:text-[#3D3935] hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              About
            </a>
            
            <a
              href="/workshops"
              className="block px-3 py-2 text-gray-700 hover:text-[#3D3935] hover:bg-gray-50 rounded-md"
              onClick={() => setIsOpen(false)}
            >
              Workshops
            </a>
            {isAdmin && (
              <a
                href="/admin"
                className="block px-3 py-2 text-gray-700 hover:text-[#3D3935] hover:bg-gray-50 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                Admin Panel
              </a>
            )}
            {!isAuthenticated && (
              <button
                type="button"
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-[#3D3935] hover:bg-gray-50 rounded-md"
                onClick={() => {
                  setLoginOpen(true);
                  setIsOpen(false);
                }}
              >
                Sign In
              </button>
            )}
            {isAuthenticated && (
              <button
                type="button"
                className="block w-full text-left px-3 py-2 text-gray-700 hover:text-[#3D3935] hover:bg-gray-50 rounded-md"
                onClick={async () => {
                  await signOut();
                  setIsOpen(false);
                }}
              >
                Sign Out
                {profile?.full_name &&
                !isPlaceholderFullName(
                  profile.full_name,
                  profile.phone,
                )
                  ? ` (${profile.full_name})`
                  : ""}
              </button>
            )}
            <div className="pt-2">
              <Button
                className="w-full transition-all"
                style={{
                  backgroundColor: "#3D3935",
                  color: "#E9CFCA",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "#1F1F1F";
                  e.currentTarget.style.color = "#D0A096";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "#3D3935";
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

      <BookingFlow
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
      <PhoneAuthDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
      />

      <Dialog
        open={whatsappModalOpen}
        onOpenChange={setWhatsappModalOpen}
      >
        <DialogContent
          className="sm:max-w-[425px] border-2 rounded-none p-8 bg-[#f9efef]"
          style={{ borderColor: "#3D3935" }}
        >
          <DialogHeader className="space-y-4">
            <DialogTitle style={{ color: "#3D3935" }}>
              Contact Us on WhatsApp
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              This will take you to WhatsApp where you can
              message us directly for any questions or
              enquiries.
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
              style={{
                backgroundColor: "#3D3935",
                background: "#3D3935",
                color: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "#1F1F1F";
                e.currentTarget.style.background = "#1F1F1F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "#3D3935";
                e.currentTarget.style.background = "#3D3935";
              }}
              onClick={() => {
                setWhatsappModalOpen(false);
                window.open(
                  "https://wa.me/447123456789",
                  "_blank",
                );
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(to right, #FCEAE0, #EACAB8)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Phone
                  className="mr-2 h-4 w-4"
                  style={{
                    stroke: "url(#whatsapp-gradient)",
                    fill: "none",
                  }}
                />
                Open WhatsApp
              </span>
              <svg
                width="0"
                height="0"
                style={{ position: "absolute" }}
              >
                <defs>
                  <linearGradient
                    id="whatsapp-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop
                      offset="0%"
                      style={{
                        stopColor: "#FCEAE0",
                        stopOpacity: 1,
                      }}
                    />
                    <stop
                      offset="100%"
                      style={{
                        stopColor: "#EACAB8",
                        stopOpacity: 1,
                      }}
                    />
                  </linearGradient>
                </defs>
              </svg>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </nav>
  );
}