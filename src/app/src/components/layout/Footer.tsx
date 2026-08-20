import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Facebook,
  Instagram,
} from "lucide-react";
import { useStudioContact } from "../../hooks/useStudioContact";

export function Footer() {
  const { contact, hours } = useStudioContact();

  return (
    <footer
      id="contact"
      className="text-white"
      style={{ backgroundColor: "#3D3935" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* About */}
          <div>
            <h3 className="mb-4" style={{ color: "#FEFCFA" }}>
              Pearl Wishes Studio
            </h3>
            <p
              style={{
                background:
                  "linear-gradient(to right, #FCEAE0, #EACAB8)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              Experience luxury and perfection with every visit.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-4">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "#DCD4CD" }}
                />
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
                  {contact.phone}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail
                  className="w-5 h-5 flex-shrink-0"
                  style={{ color: "#DCD4CD" }}
                />
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
                  {contact.email}
                </span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h3 className="mb-4">Business Hours</h3>
            <div
              className="space-y-2"
              style={{ color: "#DCD4CD" }}
            >
              <div className="flex items-start gap-3">
                <Clock
                  className="w-5 h-5 flex-shrink-0 mt-1"
                  style={{ color: "#DCD4CD" }}
                />
                <div>
                  {hours.map((hour) => (
                    <div
                      key={hour.id}
                      style={{
                        background:
                          "linear-gradient(to right, #FCEAE0, #EACAB8)",
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        color: "transparent",
                      }}
                    >
                      {hour.day}: {hour.time}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social & Copyright */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span style={{ color: "#DCD4CD" }}>Follow Us</span>
            <div className="flex gap-4">
              <a href="#" className="transition-colors">
                <Facebook
                  className="w-6 h-6"
                  style={{
                    stroke: "url(#footerSocialGradient)",
                  }}
                />
              </a>
              <a
                href="https://www.instagram.com/pearl_wishes_studio?igsh=MXkyemIyZDFqdGo1&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
              >
                <Instagram
                  className="w-6 h-6"
                  style={{
                    stroke: "url(#footerSocialGradient)",
                  }}
                />
              </a>
              <svg
                width="0"
                height="0"
                style={{ position: "absolute" }}
              >
                <defs>
                  <linearGradient
                    id="footerSocialGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#FCEAE0" />
                    <stop offset="100%" stopColor="#EACAB8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <p
            style={{
              background:
                "linear-gradient(to right, #FCEAE0, #EACAB8)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}
          >
            &copy; 2025 Pearl Wishes Studio. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}