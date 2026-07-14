import { MapPin } from 'lucide-react';

const londonDistricts = [
  { name: 'Hampstead', enabled: true, position: 'md:row-start-1 md:col-start-1' },
  { name: 'East Finchley', enabled: true, position: 'md:row-start-1 md:col-start-2' },
  { name: 'West Finchley', enabled: true, position: 'md:row-start-1 md:col-start-3' },
  { name: 'Mill Hill', enabled: true, position: 'md:row-start-2 md:col-start-1' },
  { name: 'Woodside Park', enabled: true, position: 'md:row-start-2 md:col-start-2' },
  { name: 'Golders Green', enabled: false, position: 'md:row-start-2 md:col-start-3' },
  { name: 'Highgate', enabled: false, position: 'md:row-start-1 md:col-start-4' },
  { name: 'Finchley Central', enabled: false, position: 'md:row-start-2 md:col-start-4' },
];

export function ServiceAreaMap() {
  return (
    <section id="service-area" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#FAF7F5' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-gray-800 mb-4">Service Coverage Area</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We currently serve central London districts. Check if your area is covered below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Map Grid */}
          <div className="space-y-6">
            <div className="bg-white p-8 border-2 border-gray-200">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {londonDistricts.map((district) => (
                  <div
                    key={district.name}
                    className={`${district.position} p-3 md:p-2 border-2 text-sm md:text-xs flex items-center justify-center text-center transition-all`}
                    style={
                      district.enabled 
                        ? { minHeight: '80px', backgroundColor: '#3D3935', borderColor: '#3D3935', color: '#EADDD5' }
                        : { minHeight: '80px', backgroundColor: '#EADDD5', borderColor: '#EADDD5', color: '#3D3935' }
                    }
                  >
                    <span 
                      className="leading-tight"
                      style={district.enabled ? {
                        background: 'linear-gradient(to right, #FCEAE0, #EACAB8)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: 'transparent'
                      } : {}}
                    >
                      {district.name}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6 justify-start md:justify-center mt-8 pt-6 border-t-2 border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2" style={{ backgroundColor: '#3D3935', borderColor: '#3D3935' }}></div>
                  <span className="text-sm text-gray-600">Service Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2" style={{ backgroundColor: '#EADDD5', borderColor: '#EADDD5' }}></div>
                  <span className="text-sm text-gray-600">Coming Soon</span>
                </div>
              </div>
            </div>

            <div className="text-white p-8 border-2" style={{ backgroundColor: '#3D3935', borderColor: '#3D3935' }}>
              <p 
                className="text-sm text-justify"
                style={{
                  background: 'linear-gradient(to right, #FCEAE0, #EACAB8)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent'
                }}
              >
                Don't see your district? Contact us to request service expansion in your area. We're actively growing our coverage across Greater London.
              </p>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="bg-white p-8 border-2 border-gray-200">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EADDD5' }}>
                  <MapPin className="w-6 h-6" style={{ color: '#D0A096' }} />
                </div>
                <div>
                  <h3 className="text-gray-800 mb-2">North London Coverage</h3>
                  <p className="text-sm text-gray-600 text-justify">
                    Our mobile nail care service currently covers 5 North London districts with 4 more coming soon. We bring professional salon-quality treatments directly to your home, office, or preferred location within these areas.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 border-2 border-gray-200">
              <h4 className="text-gray-800 mb-4">Service Details</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 flex-shrink-0" style={{ backgroundColor: '#3D3935' }}></div>
                  <p className="text-justify">Free travel within all covered districts</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 flex-shrink-0" style={{ backgroundColor: '#3D3935' }}></div>
                  <p className="text-justify">Same-day booking available for select areas</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 flex-shrink-0" style={{ backgroundColor: '#3D3935' }}></div>
                  <p className="text-justify">We bring all professional equipment and supplies</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 flex-shrink-0" style={{ backgroundColor: '#3D3935' }}></div>
                  <p className="text-justify">Expanding to more districts soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}