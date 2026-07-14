/**
 * Example Integration: Workshop Booking Flow
 *
 * This file demonstrates how to integrate the WorkshopBookingFlow component
 * into your workshop detail pages (CompleteNailCourse, AdvancedNailCourse, etc.)
 */

import { useState } from 'react';
import { WorkshopBookingFlow } from '../../components/WorkshopBookingFlow';

// Example 1: Integration in CompleteNailCourse component
export function CompleteNailCourseWithBooking() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const workshopDetails = {
    title: 'Complete Nail Training Course',
    duration: 'Flexible schedule (typically 4-6 weeks)',
    basePrice: 450,
  };

  return (
    <>
      {/* Existing course content */}
      <section className="px-5 lg:px-20 py-16 max-w-[1440px] mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* ... existing course content ... */}

          {/* Footer Row - Update the Book Your Place button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-gray-200">
            <div className="text-gray-900 text-lg">Starting from £{workshopDetails.basePrice}</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setBookingOpen(true)}
                className="h-10 px-6 bg-gray-800 text-white hover:bg-gray-900 transition-colors rounded-md text-sm"
              >
                Book Your Place
              </button>
              <button className="h-10 px-6 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-md text-sm">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Booking Flow */}
      <WorkshopBookingFlow
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        workshop={workshopDetails}
      />
    </>
  );
}

// Example 2: Integration in AdvancedNailCourse component
export function AdvancedNailCourseWithBooking() {
  const [bookingOpen, setBookingOpen] = useState(false);

  const workshopDetails = {
    title: 'Advanced Nail Update Course',
    duration: 'Flexible (based on student level)',
    basePrice: 350,
  };

  return (
    <>
      {/* Existing course content */}
      <section className="px-5 lg:px-20 py-16 max-w-[1440px] mx-auto">
        <div className="max-w-4xl mx-auto">
          {/* ... existing course content ... */}

          {/* Footer Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-gray-200">
            <div className="text-gray-900 text-lg">Starting from £{workshopDetails.basePrice}</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setBookingOpen(true)}
                className="h-10 px-6 bg-gray-800 text-white hover:bg-gray-900 transition-colors rounded-md text-sm"
              >
                Book Your Place
              </button>
              <button className="h-10 px-6 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-md text-sm">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Booking Flow */}
      <WorkshopBookingFlow
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        workshop={workshopDetails}
      />
    </>
  );
}

// Example 3: Integration with custom workshop cards
export function WorkshopCardWithBooking({ workshop }: { workshop: any }) {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <div className="border rounded-lg p-6" style={{ borderColor: '#DCD4CD' }}>
        <h3 className="text-lg mb-2" style={{ color: '#3D3935' }}>
          {workshop.title}
        </h3>
        <p className="text-sm mb-4" style={{ color: '#3D3935', opacity: 0.7 }}>
          {workshop.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: '#3D3935' }}>
            From £{workshop.basePrice}
          </span>
          <button
            onClick={() => setBookingOpen(true)}
            className="px-4 py-2 text-sm transition-colors"
            style={{
              backgroundColor: '#3D3935',
              color: '#FCEAE0',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1F1F1F';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3D3935';
            }}
          >
            Reserve Spot
          </button>
        </div>
      </div>

      {/* Workshop Booking Flow */}
      <WorkshopBookingFlow
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        workshop={{
          title: workshop.title,
          duration: workshop.duration,
          basePrice: workshop.basePrice,
        }}
      />
    </>
  );
}

/**
 * IMPLEMENTATION STEPS:
 *
 * 1. Import the WorkshopBookingFlow component:
 *    import { WorkshopBookingFlow } from '../../components/WorkshopBookingFlow';
 *
 * 2. Add state to manage the booking dialog:
 *    const [bookingOpen, setBookingOpen] = useState(false);
 *
 * 3. Define your workshop details:
 *    const workshopDetails = {
 *      title: 'Your Workshop Name',
 *      duration: 'Workshop duration description',
 *      basePrice: 450, // in GBP
 *    };
 *
 * 4. Add the onClick handler to your "Book" button:
 *    onClick={() => setBookingOpen(true)}
 *
 * 5. Add the WorkshopBookingFlow component at the end of your component:
 *    <WorkshopBookingFlow
 *      open={bookingOpen}
 *      onOpenChange={setBookingOpen}
 *      workshop={workshopDetails}
 *    />
 *
 * CUSTOMIZATION:
 *
 * - Update workshopDetails.title to match your workshop name
 * - Update workshopDetails.duration to describe the workshop length
 * - Update workshopDetails.basePrice to set the reservation fee
 * - Adjust available months in WorkshopBookingFlow.tsx if needed
 * - Connect to your Stripe account for real payment processing
 */
