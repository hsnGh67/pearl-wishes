import { ImageWithFallback } from './figma/ImageWithFallback';
import lookbookImage1 from 'figma:asset/10eea5a181dc347b3a57359c4bd82c3082c55f3b.png';

export function Lookbook() {
  return (
    <div className="relative">
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#EADDD5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-gray-800 mb-4">Lookbook</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our collection of nail designs and treatments
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Large Block - Spans 2 columns */}
            <div className="col-span-2 aspect-square bg-gray-200">
              <ImageWithFallback
                src={lookbookImage1}
                alt="Elegant nail art with burgundy and white design"
                loading="lazy"
                className="w-full h-full object-cover object-center"
              />
            </div>

            {/* Regular Blocks */}
            <div className="aspect-square bg-gray-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1737214475365-e4f06281dcf3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWlsJTIwYXJ0JTIwZGVzaWdufGVufDF8fHx8MTc2NzQ1NjE2OHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Elegant nail art design"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square bg-gray-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1684459567928-d50c76f5d8a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVuY2glMjBtYW5pY3VyZSUyMGhhbmRzfGVufDF8fHx8MTc2NzQ2NzgyN3ww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="French manicure hands"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square bg-gray-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1659391542239-9648f307c0b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnZWwlMjBwb2xpc2glMjBuYWlsc3xlbnwxfHx8fDE3Njc0Mzc2OTJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Gel nails polish"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square bg-gray-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1655450934654-c0f8bebcaced?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxudWRlJTIwbWFuaWN1cmV8ZW58MXx8fHwxNzY3NDY5MzU2fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Nude nails manicure"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Medium Block - Spans 2 columns */}
            <div className="col-span-2 bg-gray-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1648241815778-fdc8daf0d6ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWlsJTIwYmVhdXR5JTIwdHJlYXRtZW50fGVufDF8fHx8MTc2NzQ2OTM1N3ww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Nail design beauty"
                loading="lazy"
                className="w-full h-full object-cover aspect-[2/1]"
              />
            </div>

            {/* Regular Blocks */}
            <div className="aspect-square bg-gray-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1720086196723-a1e0656a90a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBuYWlsJTIwc2Fsb258ZW58MXx8fHwxNzY3NDUzNDUyfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Luxury nail treatment"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square bg-gray-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1733171934596-6fad5221f396?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYW5pY3VyZXxlbnwxfHx8fDE3Njc0Njc4Mjl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Professional manicure"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square bg-gray-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1638668518908-7014917e4507?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWludGVkJTIwbmFpbHMlMjBoYW5kc3xlbnwxfHx8fDE3Njc0NjkzNTl8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Nail salon hands"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square bg-gray-200">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1672815554809-37e355eddd24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYWlsJTIwYXJ0JTIwYnJpZ2h0JTIwbGlnaHQlMjBjbG9zZXVwfGVufDF8fHx8MTc2NzU0MDYyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Painted nails"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}