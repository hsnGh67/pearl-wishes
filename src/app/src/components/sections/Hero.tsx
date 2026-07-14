import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { getContentSectionByName } from "../../lib/db/content";
import { LoadingCard } from "../ui/loading-card";

export function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getData = async () => {
    try {
      const data = await getContentSectionByName("hero");

      if (!data) {
        console.warn("No content section found for 'hero'");
        return;
      }

      console.log("Fetched content section:", data);

      setSlides(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching content section:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!slides || slides.length === 0) return;

    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [slides]);

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      {isLoading ? (
        // Loading State
        <div className="relative w-full h-[100svh] min-h-[600px] pt-16 bg-[#FAF7F5]">
          <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto w-full">
              <LoadingCard
                className="max-w-4xl mx-auto"
                height="h-8"
                lines={2}
              />
            </div>
          </div>
        </div>
      ) : (
        // Loaded Content
        <section className="relative w-full h-[100svh] min-h-[600px] pt-16">
          {/* Background Images with Transition - Full Width */}
          <div className="absolute inset-0 z-0 w-full h-full">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className="absolute inset-0 w-full h-full transition-opacity duration-1000"
                style={{
                  opacity: activeSlide === index ? 1 : 0,
                  backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.6) 100%), url(${slide.content_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              ></div>
            ))}
          </div>

          {/* Content - Mobile First with Vertical Centering */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 px-4 sm:px-6 md:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto text-center">
              {/* Headline - Mobile optimized, scales up for tablet/desktop */}
              <h1
                className="mb-[28px] md:mb-[36px] drop-shadow-2xl leading-tight"
                style={{
                  fontWeight: 500,
                  color: "#FAF7F5",
                  textShadow: "0 2px 8px rgba(0, 0, 0, 0.8)",
                }}
              >
                {slides?.[0]?.title || "Pearl Wishes Studio"}
              </h1>

              {/* Subtext - Responsive sizing */}
              <p
                className="mb-6 md:mb-8 drop-shadow-lg max-w-2xl mx-auto px-2"
                style={{
                  fontWeight: 500,
                  color: "#FAF7F5",
                  textShadow: "0 1px 6px rgba(0, 0, 0, 0.8)",
                }}
              >
                {slides?.[0]?.subtitle ||
                  "Exclusive nail services crafted for your most special moments"}
              </p>

              {/* CTA Button - Full width on mobile, auto on larger screens */}
              <div className="max-w-md mx-auto">
                <Button
                  size="lg"
                  className="w-full md:w-auto md:min-w-[200px] border-gray-800 text-gray-800 transition-colors h-12 md:h-11 text-base md:text-sm"
                  style={{
                    background:
                      "linear-gradient(to right, #FCEAE0, #EACAB8)",
                    color: "#3D3935",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(to right, #D0A096, #D0A096)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "linear-gradient(to right, #FCEAE0, #EACAB8)";
                  }}
                  onClick={() => {
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  View Services
                </Button>
              </div>
            </div>
          </div>

          {/* Slider Dots - Responsive positioning */}
          <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-10">
            <div className="flex gap-1 lg:gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveSlide(index)}
                  className={`rounded-full transition-all duration-300 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center`}
                  style={{ backgroundColor: "transparent" }}
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <span
                    className={`block w-2.5 h-2.5 lg:w-2 lg:h-2 rounded-full`}
                    style={
                      activeSlide === index
                        ? { backgroundColor: "#3D3935" }
                        : {
                            background:
                              "linear-gradient(to right, #FCEAE0, #EACAB8)",
                          }
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}