import React, { useState, useEffect } from "react";
import { WorkshopDisplay } from "../schema/workshop.schema";
import { WorkshopBookingFlow } from "../../components/WorkshopBookingFlow";
import { ChevronDown } from "lucide-react";

type Props = {
  workshopDetails: WorkshopDisplay;
};
export default function WorkshopsDetails({
  workshopDetails,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const learningPoints = workshopDetails.highlights;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedWorkshopId = params.get("workshopId");
    if (
      selectedWorkshopId &&
      selectedWorkshopId === workshopDetails.id
    ) {
      window.scrollTo({
        top:
          document.getElementById(
            `workshop-${workshopDetails.id}`,
          )?.offsetTop || 0,
        behavior: "smooth",
      });
    }
  }, []);

  return (
    <section
      id={`workshop-${workshopDetails.id}`}
      className="py-16 px-5 lg:px-20"
      style={{ backgroundColor: "#FCEAE0" }}
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="border-2 shadow-lg p-8 lg:p-12"
          style={{
            borderColor: "#DCD4CD",
            backgroundColor: "#FEFCFA",
          }}
        >
          {/* Course Title */}
          <div
            className="mb-8 pb-6 border-b-2"
            style={{ borderColor: "#E9CFCA" }}
          >
            <div
              className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: "#E9CFCA",
                color: "#3D3935",
              }}
            >
              {workshopDetails.level}
            </div>
            <h2
              className="text-3xl lg:text-4xl mb-3"
              style={{ color: "#3D3935" }}
            >
              {workshopDetails.title}
            </h2>
            <p
              className="text-lg"
              style={{ color: "#3D3935", opacity: 0.8 }}
            >
              {workshopDetails.description}
            </p>
          </div>

          {/* What You'll Learn */}
          <div className="mb-10">
            <h3
              className="text-xl mb-6"
              style={{ color: "#3D3935" }}
            >
              What You'll Learn
            </h3>
            <div className="relative">
              <ol className="space-y-3">
                {(isExpanded
                  ? learningPoints
                  : learningPoints.slice(0, 3)
                ).map((point, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3"
                    style={{ color: "#3D3935" }}
                  >
                    <span className="font-medium flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span style={{ opacity: 0.85 }}>
                      {point}
                    </span>
                  </li>
                ))}
              </ol>
              {!isExpanded && learningPoints.length > 3 && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, #FEFCFA)",
                  }}
                />
              )}
            </div>
            {learningPoints.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-6 flex items-center gap-2 transition-all border-2 px-6 py-3 text-sm font-medium"
                style={{
                  borderColor: "#DCD4CD",
                  color: "#3D3935",
                  background: isExpanded
                    ? "transparent"
                    : "#E9CFCA",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isExpanded
                    ? "#E9CFCA"
                    : "#D0A096";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isExpanded
                    ? "transparent"
                    : "#E9CFCA";
                }}
              >
                <span>
                  {isExpanded
                    ? "View Less"
                    : `View Full Curriculum (${learningPoints.length - 3} more)`}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                />
              </button>
            )}
          </div>

          {/* Duration + What's Included */}
          <div className="grid lg:grid-cols-2 gap-8 mb-10">
            <div>
              <h3
                className="text-xl mb-4"
                style={{ color: "#3D3935" }}
              >
                Course Duration
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  {
                    label: "Sessions",
                    value: `${workshopDetails.sessionCount}`,
                  },
                  {
                    label: "Per session",
                    value: `${workshopDetails.sessionDurationHours} hrs`,
                  },
                  {
                    label: "Total",
                    value: `${workshopDetails.sessionCount * workshopDetails.sessionDurationHours} hrs`,
                  },
                ].map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-md px-3 py-2 text-center"
                    style={{
                      backgroundColor: "#FAF7F5",
                      border: "1px solid #DCD4CD",
                    }}
                  >
                    <p
                      className="text-xs mb-0.5"
                      style={{ color: "#9ca3af" }}
                    >
                      {fact.label}
                    </p>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "#3D3935" }}
                    >
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
              {/* <p style={{ color: "#3D3935", opacity: 0.85 }}>
                {workshopDetails.durationNote}
              </p> */}
            </div>
            {/* <div>
              <h3 className="text-xl mb-4" style={{ color: "#3D3935" }}>
                What's Included
              </h3>
              <ul className="space-y-3">
                {included.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3"
                    style={{ color: "#3D3935" }}
                  >
                    <span
                      className="flex-shrink-0 mt-1"
                      style={{ opacity: 0.5 }}
                    >
                      •
                    </span>
                    <span style={{ opacity: 0.85 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div> */}
          </div>

          {/* Important Information */}
          {/* <div className="mb-10">
            <h3 className="text-xl mb-4" style={{ color: "#3D3935" }}>
              Important Information
            </h3>
            <ul className="space-y-3">
              {importantInfo.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3"
                  style={{ color: "#3D3935" }}
                >
                  <span className="flex-shrink-0 mt-1" style={{ opacity: 0.5 }}>
                    •
                  </span>
                  <span style={{ opacity: 0.85 }}>{item}</span>
                </li>
              ))}
            </ul>
          </div> */}

          {/* Footer Row */}
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-8 border-t-2"
            style={{ borderColor: "#E9CFCA" }}
          >
            <div
              className="font-semibold text-[20px]"
              style={{ color: "#3D3935" }}
            >
              Starting from £{workshopDetails.price}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => setBookingOpen(true)}
                className="w-full sm:w-auto h-12 px-8 py-3 border-2 transition-all"
                style={{
                  borderColor: "#3D3935",
                  backgroundColor: "#3D3935",
                  color: "#FEFCFA",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "#1F1F1F";
                  e.currentTarget.style.borderColor = "#1F1F1F";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "#3D3935";
                  e.currentTarget.style.borderColor = "#3D3935";
                }}
              >
                Book Your Place
              </button>
              <button
                className="h-12 px-8 py-3 border-2 transition-all"
                style={{
                  borderColor: "#DCD4CD",
                  backgroundColor: "transparent",
                  color: "#3D3935",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "#E9CFCA";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "transparent";
                }}
                onClick={() => {
                  window.open(
                    `https://wa.me/+447930515131?text=${workshopDetails.title}`,
                    "_blank",
                  );
                }}
              >
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </div>
      <WorkshopBookingFlow
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        workshop={workshopDetails}
      />
    </section>
  );
}