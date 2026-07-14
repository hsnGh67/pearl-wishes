import { useState, useEffect } from "react";
import { Card, CardContent } from "../../../components/ui/card";
import {
  Avatar,
  AvatarFallback,
} from "../../../components/ui/avatar";
import { getAllTestimonials } from "../../lib/db/testimonials";

export function Testimonials() {
  const [isPending, setIsPending] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const testimonialsPerPage = 3;
  const totalPages = Math.ceil(
    testimonials.length / testimonialsPerPage,
  );

  const startIndex = currentPage * testimonialsPerPage;
  const currentTestimonials = testimonials.slice(
    startIndex,
    startIndex + testimonialsPerPage,
  );

  const getTestimonials = async () => {
    try {
      setIsPending(true);
      const res = await getAllTestimonials();
      setTestimonials(res);
      setIsPending(false);
    } catch (error) {
      setIsPending(false);
    }
  };

  useEffect(() => {
    getTestimonials();
  }, []);

  return (
    <section
      id="testimonials"
      className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-gray-800 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it - hear from our
            satisfied clients about their experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {isPending
            ? // Loading cards
              Array.from({ length: testimonialsPerPage }).map(
                (_, index) => (
                  <Card
                    key={index}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent
                      className="p-6"
                      style={{
                        backgroundColor: "#DCD4CD",
                        height: "280px",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div className="mb-4">
                        <div className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
                        <div className="h-3 w-16 bg-gray-300 rounded animate-pulse mt-2"></div>
                      </div>
                      <div className="flex-1">
                        <div className="h-3 bg-gray-300 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded animate-pulse mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ),
              )
            : // Actual testimonials
              currentTestimonials.map((testimonial, index) => (
                <Card
                  key={startIndex + index}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent
                    className="p-6"
                    style={{
                      backgroundColor: "#DCD4CD",
                      height: "280px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div className="mb-4">
                      <div style={{ color: "#3D3935" }}>
                        {testimonial.client_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {testimonial.service_type}
                      </div>
                    </div>

                    <p
                      className="text-gray-600 italic text-justify"
                      style={{ flex: 1, overflow: "auto" }}
                    >
                      "{testimonial.comment}"
                    </p>
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Bullet Navigation */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: totalPages }).map(
            (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className="w-3 h-3 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    currentPage === index
                      ? "#E9CFCA"
                      : "#D0A096",
                }}
                aria-label={`View testimonials page ${index + 1}`}
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}