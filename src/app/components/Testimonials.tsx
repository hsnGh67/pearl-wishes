import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';

const testimonials = [
  {
    name: 'Sarah Johnson',
    initials: 'SJ',
    rating: 5,
    text: 'Booking was so easy and they arrived exactly on time! The technician was incredibly skilled and brought all sterilized equipment to my home. Everything was spotlessly clean.',
    service: 'Classic Manicure',
  },
  {
    name: 'Emily Chen',
    initials: 'EC',
    rating: 5,
    text: 'The gel extensions look absolutely stunning! They were perfectly punctual and the technician was so talented and attentive to detail. Highly professional service!',
    service: 'Gel Extensions',
  },
  {
    name: 'Jessica Martinez',
    initials: 'JM',
    rating: 5,
    text: 'The nail art design was absolutely stunning! The technician is incredibly creative and skillful. The attention to detail in every design element was remarkable. True artistry!',
    service: 'Nail Art Design',
  },
  {
    name: 'Amanda Lee',
    initials: 'AL',
    rating: 5,
    text: 'Love the convenience of booking from my phone! They are always on time, the service at my home is so relaxing, and their hygiene standards are outstanding. The team is consistently skilled and professional. Perfect every time!',
    service: 'Gel Extensions',
  },
  {
    name: 'Rachel Brown',
    initials: 'RB',
    rating: 5,
    text: 'Impressed by their punctuality and professionalism! The booking was effortless, they brought immaculately clean equipment to my home, and the technician was exceptionally skilled. My gel extensions are perfect and long-lasting!',
    service: 'Gel Extensions',
  },
  {
    name: 'Lisa Wilson',
    initials: 'LW',
    rating: 5,
    text: 'The easy booking system is fantastic! Always on time, incredibly talented technicians, and the cleanliness is hospital-grade. Having professional manicures at home is such a treat. My nails always look flawless!',
    service: 'Classic Manicure',
  },
];

export function Testimonials() {
  const [currentPage, setCurrentPage] = useState(0);
  const testimonialsPerPage = 3;
  const totalPages = Math.ceil(testimonials.length / testimonialsPerPage);

  const startIndex = currentPage * testimonialsPerPage;
  const currentTestimonials = testimonials.slice(startIndex, startIndex + testimonialsPerPage);

  return (
    <section id="testimonials" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-gray-800 mb-4">What Our Clients Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it - hear from our satisfied clients about their experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {currentTestimonials.map((testimonial, index) => (
            <Card key={startIndex + index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6" style={{ backgroundColor: '#DCD4CD' }}>
                <div className="mb-4">
                  <div style={{ color: '#3D3935' }}>{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.service}</div>
                </div>

                <p className="text-gray-600 italic text-justify">
                  "{testimonial.text}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bullet Navigation */}
        <div className="flex justify-center gap-3">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className="w-3 h-3 rounded-full transition-colors"
              style={{ backgroundColor: currentPage === index ? '#E9CFCA' : '#D0A096' }}
              aria-label={`View testimonials page ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}