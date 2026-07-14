import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import bannerImage from 'figma:asset/dd32a15478e79e5b573bfa8c15a686745136bb1f.png';
import bannerImage2 from 'figma:asset/9040a8e53dbe46ea8702c16bf377d801015b587e.png';
import bannerImage3 from 'figma:asset/1b002fb32f64d45c759463102c708f9bf2cd3da6.png';

const heroSlides = [
  {
    id: 1,
    image: bannerImage2,
  },
  {
    id: 2,
    image: bannerImage3,
  },
  {
    id: 3,
    image: bannerImage,
  },
];

export function Hero() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] pt-16">
      {/* Background Images with Transition - Full Width */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className="absolute inset-0 w-full h-full transition-opacity duration-1000"
            style={{
              opacity: activeSlide === index ? 1 : 0,
              backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.6) 100%), url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
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
            style={{ fontWeight: 500, color: '#FAF7F5', textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)' }}
          >
            Where Elegance Becomes Art
          </h1>
          
          {/* Subtext - Responsive sizing */}
          <p 
            className="mb-6 md:mb-8 drop-shadow-lg max-w-2xl mx-auto px-2" 
            style={{ fontWeight: 500, color: '#FAF7F5', textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)' }}
          >
            Exclusive nail services crafted for your most special moments
          </p>
          
          {/* CTA Button - Full width on mobile, auto on larger screens */}
          <div className="max-w-md mx-auto">
            <Button 
              size="lg" 
              className="w-full md:w-auto md:min-w-[200px] border-gray-800 text-gray-800 transition-colors h-12 md:h-11 text-base md:text-sm" 
              style={{ background: 'linear-gradient(to right, #FCEAE0, #EACAB8)', color: '#3D3935' }} 
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #D0A096, #D0A096)';
              }} 
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(to right, #FCEAE0, #EACAB8)';
              }}
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
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
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`rounded-full transition-all duration-300 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center`}
              style={{ backgroundColor: 'transparent' }}
              aria-label={`Go to slide ${index + 1}`}
            >
              <span 
                className={`block w-2.5 h-2.5 lg:w-2 lg:h-2 rounded-full`}
                style={activeSlide === index 
                  ? { backgroundColor: '#3D3935' } 
                  : { background: 'linear-gradient(to right, #FCEAE0, #EACAB8)' }
                }
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}