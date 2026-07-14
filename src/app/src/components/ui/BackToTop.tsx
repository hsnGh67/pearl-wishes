import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 transition-all border-2 shadow-lg flex items-center justify-center"
          style={{ backgroundColor: '#3D3935', borderColor: '#3D3935', color: '#E9CFCA' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1F1F1F';
            e.currentTarget.style.color = '#D0A096';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3D3935';
            e.currentTarget.style.color = '#E9CFCA';
          }}
          aria-label="Back to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </>
  );
}