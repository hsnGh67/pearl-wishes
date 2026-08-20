import image_f2463330abf9ff6645b724d843fdd129e7582d73 from "figma:asset/f2463330abf9ff6645b724d843fdd129e7582d73.png";
import image_dd32a15478e79e5b573bfa8c15a686745136bb1f from "figma:asset/dd32a15478e79e5b573bfa8c15a686745136bb1f.png";
import image_a14b4868f53816194a358f878ac7a1017021ad62 from "figma:asset/a14b4868f53816194a358f878ac7a1017021ad62.png";
import image_de5bc49c6ee121f60355e8d9046ef67bcdce7701 from "figma:asset/de5bc49c6ee121f60355e8d9046ef67bcdce7701.png";
import image_75f40d3e12b6b5243875aa4fead0faded7f4d2a9 from "figma:asset/75f40d3e12b6b5243875aa4fead0faded7f4d2a9.png";
import image_a83f5cb32c2f19e665063ce30e70b3476e2a64e4 from "figma:asset/a83f5cb32c2f19e665063ce30e70b3476e2a64e4.png";
import image_679687b58ce05fc7f2594b8bf72d2d451028e99d from "figma:asset/679687b58ce05fc7f2594b8bf72d2d451028e99d.png";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { useState, useEffect } from "react";
import { BookingFlow } from "../../../components/BookingFlow";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Service } from "../../schema/service.schema";
import { getAllServices } from "../../lib/db/services";

export function Features() {
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | undefined>(
    undefined,
  );

  const handleBook = (service: Service) => {
    setSelectedService(service);
    setOpen(true);
  };

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const services = await getAllServices();
      setServices(services);
      setIsLoading(false);
    } catch (e) {}
  };

  useEffect(() => {
    loadServices();
  }, []);

  const showableServices = services.filter(
    (service) => service.is_active && !service.is_add_on,
  );
  const servicesToShow = showAll
    ? showableServices
    : showableServices.slice(0, 6);
  return (
    <section
      id="features"
      className="py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-8"
      style={{ backgroundColor: "#FAF7F5" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-left md:text-center mb-8 md:mb-12 lg:mb-16">
          <h2
            className="mb-3 md:mb-4 font-semibold"
            style={{ color: "#3D3935" }}
          >
            Our Treatments
          </h2>
          <p className="max-w-2xl mx-auto px-4" style={{ color: "#3D3935" }}>
            Discover our range of premium nail care services designed to make
            you look and feel your best
          </p>
        </div>

        {/* Mobile: Horizontal Scroll | Tablet: 2 Columns | Desktop: 3 Columns */}
        <div className="flex md:grid overflow-x-auto md:overflow-x-visible gap-4 md:gap-6 lg:gap-8 md:grid-cols-2 lg:grid-cols-3 snap-x snap-mandatory md:snap-none px-4 md:px-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <span className="text-sm text-gray-500">Loading...</span>
            </div>
          ) : (
            servicesToShow.map((service, index) => (
              <Card
                key={index}
                className="overflow-hidden flex flex-col shrink-0 w-[calc(100vw-5rem)] md:w-auto shadow-sm snap-start"
                style={{
                  backgroundColor: "#FEFCFA",
                  border: "1px solid #DCD4CD",
                }}
              >
                {/* Image - 4:3 aspect ratio for consistent card heights */}
                <div className="w-full aspect-[4/3] overflow-hidden">
                  <ImageWithFallback
                    src={service.image_url}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Card Content */}
                <CardContent className="p-5 md:p-6 flex flex-col flex-1">
                  {/* Title */}
                  <h3
                    className="mb-3 text-lg md:text-xl"
                    style={{ color: "#3D3935" }}
                  >
                    {service.name}
                  </h3>

                  {/* Description */}
                  <p
                    className="mb-5 flex-grow text-sm md:text-base leading-relaxed"
                    style={{ color: "#3D3935" }}
                  >
                    {service.description}
                  </p>

                  {/* CTA Button - Full width on mobile, maintain on all screens */}
                  <Button
                    className="w-full transition-colors min-h-[48px] md:min-h-[44px] text-base md:text-sm"
                    style={{
                      background: "linear-gradient(to right, #FCEAE0, #EACAB8)",
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
                    onClick={() => handleBook(service as Service)}
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {showableServices.length > 6 && (
          <div className="flex justify-center items-center w-full mt-4">
            <Button
              onClick={() => setShowAll(!showAll)}
              className="w-full max-w-sm transition-colors min-h-[48px] md:min-h-[44px] text-base md:text-sm"
              style={{
                background: "transparent",
                color: "#3D3935",
                cursor: "pointer",
              }}
            >
              {showAll ? "Show Less" : "View All"}
            </Button>
          </div>
        )}
      </div>

      {/* Booking Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle>Book Your Treatment</DialogTitle>
            <DialogDescription>
              Please fill in the details to book your treatment.
            </DialogDescription>
          </DialogHeader>
          <BookingFlow
            open={open}
            initialService={selectedService}
            onOpenChange={(open) => {
              setOpen(open);
              if (!open) {
                setSelectedService(undefined);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
