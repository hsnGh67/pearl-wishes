/**
 * WORKSHOPS DESIGN SYSTEM REFERENCE
 * Visual guide to the design specifications
 */

export function DesignSystem() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl mb-2 text-gray-900">Workshops Design System</h1>
        <p className="text-xl text-gray-600 mb-12">
          Pearl Wishes Studio • Minimal Grayscale Wireframe
        </p>

        {/* Frame Specifications */}
        <section className="mb-16">
          <h2 className="text-3xl mb-6 text-gray-900 pb-2 border-b-2 border-gray-300">
            Frame Specifications
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desktop */}
            <div className="border-2 border-gray-900 bg-white p-8">
              <div className="mb-4 pb-4 border-b border-gray-300">
                <h3 className="text-xl text-gray-900">Desktop Frame</h3>
                <p className="text-sm text-gray-500 uppercase tracking-wider mt-1">
                  Workshops — Desktop
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Width:</span>
                  <span className="text-gray-900">1440px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Height:</span>
                  <span className="text-gray-900">~4200px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Columns:</span>
                  <span className="text-gray-900">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Margins:</span>
                  <span className="text-gray-900">80px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Gutter:</span>
                  <span className="text-gray-900">24px</span>
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="border-2 border-gray-900 bg-white p-8">
              <div className="mb-4 pb-4 border-b border-gray-300">
                <h3 className="text-xl text-gray-900">Mobile Frame</h3>
                <p className="text-sm text-gray-500 uppercase tracking-wider mt-1">
                  Workshops — Mobile
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Width:</span>
                  <span className="text-gray-900">390px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Height:</span>
                  <span className="text-gray-900">~5200px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Columns:</span>
                  <span className="text-gray-900">4</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Margins:</span>
                  <span className="text-gray-900">20px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Gutter:</span>
                  <span className="text-gray-900">16px</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing System */}
        <section className="mb-16">
          <h2 className="text-3xl mb-6 text-gray-900 pb-2 border-b-2 border-gray-300">
            Spacing System (8px)
          </h2>
          
          <div className="bg-white border border-gray-300 p-8">
            <div className="space-y-4">
              {[1, 2, 4, 6, 8, 10, 12, 16, 20, 24].map((size) => (
                <div key={size} className="flex items-center gap-4">
                  <span className="w-20 text-sm text-gray-600">
                    {size * 4}px
                  </span>
                  <div 
                    className="h-8 bg-gray-900" 
                    style={{ width: `${size * 4}px` }}
                  />
                  <span className="text-sm text-gray-500">
                    (space-{size} / p-{size} / gap-{size})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-16">
          <h2 className="text-3xl mb-6 text-gray-900 pb-2 border-b-2 border-gray-300">
            Typography (Montserrat)
          </h2>
          
          <div className="bg-white border border-gray-300 p-8 space-y-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Eyebrow Text
              </p>
              <p className="text-sm text-gray-500 uppercase tracking-wider">
                Professional Training
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Heading 1
              </p>
              <h1 className="text-5xl text-gray-900">
                Nail Art Workshops
              </h1>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Heading 2
              </p>
              <h2 className="text-4xl text-gray-900">
                Meet Your Instructors
              </h2>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Heading 3
              </p>
              <h3 className="text-2xl text-gray-900">
                Gel Manicure Fundamentals
              </h3>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Body Text
              </p>
              <p className="text-base text-gray-600">
                Master advanced nail techniques with our expert-led workshops.
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Small Text
              </p>
              <p className="text-sm text-gray-600">
                Additional information and metadata
              </p>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="mb-16">
          <h2 className="text-3xl mb-6 text-gray-900 pb-2 border-b-2 border-gray-300">
            Color Palette (Grayscale)
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: 'White', class: 'bg-white', border: true, text: '#FFFFFF' },
              { name: 'Gray 50', class: 'bg-gray-50', border: true, text: '#F9FAFB' },
              { name: 'Gray 100', class: 'bg-gray-100', border: true, text: '#F3F4F6' },
              { name: 'Gray 200', class: 'bg-gray-200', border: true, text: '#E5E7EB' },
              { name: 'Gray 300', class: 'bg-gray-300', border: false, text: '#D1D5DB' },
              { name: 'Gray 400', class: 'bg-gray-400', border: false, text: '#9CA3AF' },
              { name: 'Gray 500', class: 'bg-gray-500', border: false, text: '#6B7280' },
              { name: 'Gray 600', class: 'bg-gray-600', border: false, text: '#4B5563' },
              { name: 'Gray 700', class: 'bg-gray-700', border: false, text: '#374151' },
              { name: 'Gray 800', class: 'bg-gray-800', border: false, text: '#1F2937' },
              { name: 'Gray 900', class: 'bg-gray-900', border: false, text: '#111827' },
            ].map((color) => (
              <div key={color.name} className={`${color.border ? 'border border-gray-300' : ''}`}>
                <div className={`${color.class} h-24`} />
                <div className="p-3 bg-white border border-gray-300 border-t-0">
                  <p className="text-sm text-gray-900">{color.name}</p>
                  <p className="text-xs text-gray-500">{color.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Component Sizes */}
        <section className="mb-16">
          <h2 className="text-3xl mb-6 text-gray-900 pb-2 border-b-2 border-gray-300">
            Component Dimensions
          </h2>
          
          <div className="bg-white border border-gray-300 p-8 space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-2">Button Height</p>
              <div className="h-11 w-48 bg-gray-800 text-white flex items-center justify-center">
                44px (h-11)
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Input Height</p>
              <div className="h-11 w-full max-w-md border border-gray-300 flex items-center px-4 text-gray-600">
                44px (h-11)
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Filter Chip Height</p>
              <div className="h-8 w-32 border border-gray-300 flex items-center justify-center text-sm">
                32px (h-8)
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">Navbar Height</p>
              <div className="h-16 w-full border border-gray-300 flex items-center justify-center">
                64px (h-16)
              </div>
            </div>
          </div>
        </section>

        {/* Design Principles */}
        <section className="mb-16">
          <h2 className="text-3xl mb-6 text-gray-900 pb-2 border-b-2 border-gray-300">
            Design Principles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-300 p-6">
              <h3 className="text-xl mb-4 text-gray-900">✓ DO</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Use 8px spacing increments</li>
                <li>• Keep corners sharp (0px radius)</li>
                <li>• Use grayscale colors only</li>
                <li>• Follow grid system (12 col / 4 col)</li>
                <li>• Maintain consistent typography</li>
                <li>• Add subtle hover states</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-300 p-6">
              <h3 className="text-xl mb-4 text-gray-900">✗ DON'T</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Use rounded corners</li>
                <li>• Add color beyond grayscale</li>
                <li>• Break the 8px spacing system</li>
                <li>• Use arbitrary sizes</li>
                <li>• Mix font families</li>
                <li>• Over-complicate layouts</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="bg-gray-900 text-white p-8 border-2 border-gray-900">
          <h2 className="text-3xl mb-4">Design System Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="text-gray-400 uppercase tracking-wider mb-2">Style</p>
              <p>Minimal Grayscale Wireframe</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider mb-2">Font</p>
              <p>Montserrat</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider mb-2">Spacing</p>
              <p>8px System</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider mb-2">Corners</p>
              <p>Sharp Edges (0px)</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider mb-2">Grid</p>
              <p>12 Col (Desktop) / 4 Col (Mobile)</p>
            </div>
            <div>
              <p className="text-gray-400 uppercase tracking-wider mb-2">Components</p>
              <p>10+ Reusable</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
