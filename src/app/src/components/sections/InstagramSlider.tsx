import Slider from 'react-slick';
import { Instagram } from 'lucide-react';
import { AspectRatio } from '../../../components/ui/aspect-ratio';

const instagramPosts = [
  { id: 1, alt: 'Instagram post 1' },
  { id: 2, alt: 'Instagram post 2' },
  { id: 3, alt: 'Instagram post 3' },
  { id: 4, alt: 'Instagram post 4' },
  { id: 5, alt: 'Instagram post 5' },
  { id: 6, alt: 'Instagram post 6' }
];

export function InstagramSlider() {
  const instagramUrl = 'https://www.instagram.com/pearl_wishes_studio?igsh=MXkyemIyZDFqdGo1&utm_source=qr';
  
  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: false,
    responsive: [
      {
        breakpoint: 1280,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1.5,
          slidesToScroll: 1,
        }
      }
    ]
  };

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF7F5' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-gray-900 mb-4">Follow Our Journey</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get inspired by our latest work. Follow us on Instagram @namehere for daily nail inspiration and exclusive behind-the-scenes content.
          </p>
        </div>

        <div className="instagram-slider">
          <Slider {...settings}>
            {instagramPosts.map((post) => (
              <div key={post.id} className="px-2">
                <AspectRatio ratio={1}>
                  <a 
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-full h-full overflow-hidden group cursor-pointer block" 
                    style={{ backgroundColor: '#DCD4CD' }}
                  />
                </AspectRatio>
              </div>
            ))}
          </Slider>
        </div>

        <div className="text-center mt-12">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 transition-colors border-2"
            style={{ 
              backgroundColor: '#3D3935',
              borderColor: '#3D3935',
              color: '#E9CFCA'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#D0A096';
              e.currentTarget.style.borderColor = '#D0A096';
              e.currentTarget.style.color = '#3D3935';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3D3935';
              e.currentTarget.style.borderColor = '#3D3935';
              e.currentTarget.style.color = '#E9CFCA';
            }}
          >
            <Instagram className="w-5 h-5" />
            <span>Follow Us on Instagram</span>
          </a>
        </div>
      </div>

      <style>{`
        .instagram-slider .slick-slider {
          position: relative;
          display: block;
          box-sizing: border-box;
          user-select: none;
          touch-action: pan-y;
        }
        
        .instagram-slider .slick-list {
          position: relative;
          display: block;
          overflow: hidden;
          margin: 0;
          padding: 0;
        }
        
        .instagram-slider .slick-track {
          position: relative;
          top: 0;
          left: 0;
          display: flex;
          margin-left: auto;
          margin-right: auto;
        }
        
        .instagram-slider .slick-slide {
          display: none;
          float: left;
          height: 100%;
          min-height: 1px;
        }
        
        .instagram-slider .slick-slide.slick-active {
          display: block;
        }
        
        .instagram-slider .slick-slide > div {
          height: 100%;
        }
        
        .instagram-slider .slick-initialized .slick-slide {
          display: block;
        }
      `}</style>
    </section>
  );
}