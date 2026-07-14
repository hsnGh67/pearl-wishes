import { Card } from './ui/card';
import { Calendar } from 'lucide-react';

export function AboutUs() {
  return (
    <section id="about" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Image Block */}
          <div className="order-2 lg:order-1">
            <div className="w-full h-96 bg-gray-300"></div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <h2 className="text-gray-800 mb-6">About Us</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Welcome to London's premier mobile nail care service. We're dedicated to providing exceptional service and creating beautiful nails that make our clients feel confident and pampered.
              </p>
              <p>
                Our team of skilled nail technicians brings years of experience and maintains the highest standards of hygiene and safety.
              </p>
              <p>
                Experience professional nail care without leaving your home. Our mobile service brings the salon experience directly to your doorstep across London. Whether you're at home, at work, or hosting a special event, we deliver luxury nail treatments in the comfort of your chosen location.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-black">
                  <Calendar className="w-5 h-5" style={{ 
                    stroke: 'url(#calendarGradient)'
                  }} />
                  <svg width="0" height="0">
                    <defs>
                      <linearGradient id="calendarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#FCEAE0' }} />
                        <stop offset="100%" style={{ stopColor: '#EACAB8' }} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span style={{ 
                    background: 'linear-gradient(to right, #FCEAE0, #EACAB8)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent'
                  }}>Serving London Since 2020</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card className="text-center p-6 h-full flex flex-col">
            <h3 className="mb-2">Time Efficient</h3>
            <p className="text-gray-600 text-sm text-justify flex-grow">
              Book appointments online and enjoy punctual service that respects your schedule
            </p>
          </Card>

          <Card className="text-center p-6 h-full flex flex-col">
            <h3 className="mb-2">At Your Doorstep</h3>
            <p className="text-gray-600 text-sm text-justify flex-grow">
              Professional nail care services delivered to the comfort of your own home
            </p>
          </Card>

          <Card className="text-center p-6 h-full flex flex-col">
            <h3 className="mb-2">Premium Products</h3>
            <p className="text-gray-600 text-sm text-justify flex-grow">
              We use only top-quality, professional-grade products and maintain strict hygiene standards
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}