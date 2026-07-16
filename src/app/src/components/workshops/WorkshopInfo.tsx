import { MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";

export function WorkshopInfo() {
  const [openPolicy, setOpenPolicy] = useState<number | null>(null);

  const togglePolicy = (index: number) => {
    setOpenPolicy(openPolicy === index ? null : index);
  };

  const pricingTiers = [
    {
      name: "Standard",
      price: "£75",
      includes: [
        "Workshop access",
        "Basic materials kit",
        "Digital certificate",
        "Tea & refreshments",
      ],
    },
    {
      name: "Pro Kit",
      price: "£125",
      includes: [
        "Workshop access",
        "Premium materials kit",
        "Digital certificate",
        "Tea & refreshments",
        "Take-home practice set",
        "Exclusive workbook",
      ],
      highlighted: true,
    },
    {
      name: "1:1 Add-on",
      price: "£45",
      includes: [
        "30-min private session",
        "Personalized feedback",
        "Custom technique review",
      ],
    },
  ];

  const policies = [
    {
      title: "Cancellation",
      content:
        "Full refund available up to 7 days before the workshop. Cancellations within 7 days will receive a 25% refund.",
    },
    {
      title: "Reschedule",
      content:
        "You may transfer to another available monthly workshop up to 7 days before the first session begins. During the workshop, individual sessions may only be rescheduled if requested at least 72 hours before the scheduled session time, subject to availability.",
    },
    {
      title: "Seat transfer",
      content:
        "Seats are transferable to another person. Please notify us at least 24 hours before the workshop with the new attendee's name and contact information.",
    },
  ];

  const whatToBring = [
    "Comfortable clothing",
    "Note-taking materials (optional)",
  ];

  const whatsProvided = [
    "All workshop materials",
    "Practice tools & equipment",
    "Tea, coffee & snacks",
    "Workstation setup",
  ];

  return (
    <section className="px-5 lg:px-20 py-16 max-w-[1440px] mx-auto">
      {/* Location & Logistics - Full Width */}
      <div
        className="bg-white border p-6 mb-8"
        style={{ borderColor: "#DCD4CD" }}
      >
        <h3 className="mb-6" style={{ color: "#3D3935" }}>
          Location & Logistics
        </h3>

        {/* Address */}
        <div className="mb-6">
          <div className="flex items-start gap-2 mb-3">
            <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
            <div>
              <p style={{ color: "#3D3935" }}>Pearl Wishes Studio</p>
              <p className="text-gray-600 text-sm">North London</p>
            </div>
          </div>
        </div>

        {/* What to Bring */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="text-sm mb-3" style={{ color: "#3D3935" }}>
            What to bring
          </h4>
          <ul className="space-y-2">
            {whatToBring.map((item, index) => (
              <li
                key={index}
                className="text-gray-600 text-sm flex items-start gap-2"
              >
                <span className="text-gray-400 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What's Provided */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="text-sm mb-3" style={{ color: "#3D3935" }}>
            What's provided
          </h4>
          <ul className="space-y-2">
            {whatsProvided.map((item, index) => (
              <li
                key={index}
                className="text-gray-600 text-sm flex items-start gap-2"
              >
                <span className="text-gray-400 mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Arrival Note */}
        <div
          className="border p-3"
          style={{
            borderColor: "#DCD4CD",
            background: "linear-gradient(to right, #FCEAE0, #EACAB8)",
          }}
        >
          <p className="text-gray-700 text-sm">
            <span style={{ color: "#3D3935" }}>
              Please arrive 10 minutes early
            </span>{" "}
            for check-in and workstation setup.
          </p>
        </div>
      </div>

      {/* Policies - Full Width */}
      <div
        className="bg-white border p-6 bg-[#3d3935]"
        style={{ borderColor: "#DCD4CD" }}
      >
        <h3 className="mb-6 text-[#232121]">Policies</h3>

        <div className="space-y-2">
          {policies.map((policy, index) => (
            <div
              key={index}
              className="border overflow-hidden"
              style={{ borderColor: "#DCD4CD" }}
            >
              {/* Accordion Header */}
              <button
                onClick={() => togglePolicy(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm" style={{ color: "#3D3935" }}>
                  {policy.title}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                    openPolicy === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Accordion Content */}
              {openPolicy === index && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {policy.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
