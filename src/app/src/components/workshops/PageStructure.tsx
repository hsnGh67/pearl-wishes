/**
 * Visual representation of the Workshops page structure
 * Shows the layout hierarchy for both Desktop and Mobile
 */

export function PageStructure() {
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl mb-4 text-gray-900">Workshops Page Structure</h1>
        <p className="text-xl text-gray-600 mb-12">
          Visual layout hierarchy for Desktop (1440px) and Mobile (390px) frames
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Desktop Layout */}
          <div>
            <h2 className="text-2xl mb-4 text-gray-900">Desktop (1440px × ~4200px)</h2>
            <div className="bg-white border-2 border-gray-900 p-4 space-y-2">
              {/* Navbar */}
              <div className="border border-gray-700 bg-gray-800 text-white p-3 text-sm">
                <div className="uppercase text-xs mb-1 text-gray-400">Fixed Navbar</div>
                <div>Logo | Nav Links | Book Button</div>
                <div className="text-xs text-gray-400 mt-1">Height: 64px (h-16)</div>
              </div>

              {/* Hero */}
              <div className="border border-gray-400 bg-gray-50 p-6 text-sm">
                <div className="uppercase text-xs mb-2 text-gray-500">Hero Section</div>
                <div className="space-y-1">
                  <div className="text-xs">Eyebrow: "Professional Training"</div>
                  <div>H1: "Nail Art Workshops"</div>
                  <div className="text-xs">Description + 2 CTA buttons</div>
                </div>
                <div className="text-xs text-gray-500 mt-2">~400px</div>
              </div>

              {/* Filter Section */}
              <div className="border border-gray-400 bg-white p-4 text-sm">
                <div className="uppercase text-xs mb-2 text-gray-500">Filter Section</div>
                <div className="space-y-1 text-xs">
                  <div>Search Input | Date Dropdown</div>
                  <div>Level Chips: Beginner, Intermediate, Advanced, All</div>
                  <div>Topic Chips: Gel, Art, Extensions, BIAB, Business</div>
                </div>
                <div className="text-xs text-gray-500 mt-2">~200px</div>
              </div>

              {/* Workshop Grid */}
              <div className="border border-gray-400 bg-white p-4 text-sm">
                <div className="uppercase text-xs mb-2 text-gray-500">Workshop Grid</div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-gray-200 p-2 text-xs text-center border border-gray-400">
                      Card {i}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500">3 columns × 2 rows</div>
                <div className="text-xs mt-1">[Pagination: &lt; 1 2 3 &gt;]</div>
                <div className="text-xs text-gray-500 mt-2">~1200px</div>
              </div>

              {/* Instructor Section */}
              <div className="border border-gray-400 bg-gray-50 p-4 text-sm">
                <div className="uppercase text-xs mb-2 text-gray-500">Instructor Section</div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-200 p-2 text-xs text-center border border-gray-400">
                      Instructor {i}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">4 columns, ~600px</div>
              </div>

              {/* FAQ Section */}
              <div className="border border-gray-400 bg-white p-4 text-sm">
                <div className="uppercase text-xs mb-2 text-gray-500">FAQ Section</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-100 p-2 text-xs border border-gray-300">
                    FAQs (6 items)<br/>Accordion
                  </div>
                  <div className="bg-gray-100 p-2 text-xs border border-gray-300">
                    Policies (4 items)<br/>Accordion
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">2 columns, ~800px</div>
              </div>

              {/* Footer */}
              <div className="border border-gray-700 bg-gray-900 text-white p-3 text-sm">
                <div className="uppercase text-xs mb-1 text-gray-400">Footer</div>
                <div className="text-xs">About | Contact | Hours | Social</div>
                <div className="text-xs text-gray-400 mt-1">~400px</div>
              </div>

              <div className="text-center pt-2 text-xs text-gray-500 border-t border-gray-300 mt-2">
                Total Height: ~4200px
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div>
            <h2 className="text-2xl mb-4 text-gray-900">Mobile (390px × ~5200px)</h2>
            <div className="bg-white border-2 border-gray-900 p-4 space-y-2">
              {/* Navbar */}
              <div className="border border-gray-700 bg-gray-800 text-white p-3 text-sm">
                <div className="uppercase text-xs mb-1 text-gray-400">Fixed Navbar</div>
                <div className="text-xs">Logo | Hamburger Menu</div>
                <div className="text-xs text-gray-400 mt-1">Height: 64px</div>
              </div>

              {/* Hero */}
              <div className="border border-gray-400 bg-gray-50 p-4 text-sm">
                <div className="uppercase text-xs mb-1 text-gray-500">Hero (Stacked)</div>
                <div className="text-xs">Eyebrow + H1 + Desc + 2 CTAs</div>
                <div className="text-xs text-gray-500 mt-1">~500px</div>
              </div>

              {/* Filter Section */}
              <div className="border border-gray-400 bg-white p-3 text-sm">
                <div className="uppercase text-xs mb-1 text-gray-500">Filter (Stacked)</div>
                <div className="text-xs space-y-1">
                  <div>Search (full width)</div>
                  <div>Dropdown (full width)</div>
                  <div>Level chips (wrapped)</div>
                  <div>Topic chips (wrapped)</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">~350px</div>
              </div>

              {/* Workshop Grid */}
              <div className="border border-gray-400 bg-white p-3 text-sm">
                <div className="uppercase text-xs mb-1 text-gray-500">Workshop Grid</div>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-gray-200 p-2 text-xs border border-gray-400">
                      Workshop Card {i} (Full Width)
                    </div>
                  ))}
                </div>
                <div className="text-xs mt-1">[Pagination]</div>
                <div className="text-xs text-gray-500 mt-1">1 column, ~2400px</div>
              </div>

              {/* Instructor Section */}
              <div className="border border-gray-400 bg-gray-50 p-3 text-sm">
                <div className="uppercase text-xs mb-1 text-gray-500">Instructors</div>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-gray-200 p-2 text-xs border border-gray-400">
                      Instructor {i} (Full Width)
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">1 column, ~1200px</div>
              </div>

              {/* FAQ Section */}
              <div className="border border-gray-400 bg-white p-3 text-sm">
                <div className="uppercase text-xs mb-1 text-gray-500">FAQ (Stacked)</div>
                <div className="space-y-2">
                  <div className="bg-gray-100 p-2 text-xs border border-gray-300">
                    FAQs Section<br/>(6 accordions)
                  </div>
                  <div className="bg-gray-100 p-2 text-xs border border-gray-300">
                    Policies Section<br/>(4 accordions)
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">~1000px</div>
              </div>

              {/* Footer */}
              <div className="border border-gray-700 bg-gray-900 text-white p-3 text-sm">
                <div className="uppercase text-xs mb-1 text-gray-400">Footer (Stacked)</div>
                <div className="text-xs">All sections stacked</div>
                <div className="text-xs text-gray-400 mt-1">~500px</div>
              </div>

              <div className="text-center pt-2 text-xs text-gray-500 border-t border-gray-300 mt-2">
                Total Height: ~5200px
              </div>
            </div>
          </div>
        </div>

        {/* Component Details */}
        <div className="mt-12 bg-white border-2 border-gray-900 p-8">
          <h2 className="text-2xl mb-6 text-gray-900">Component Height Breakdown</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="mb-3 pb-2 border-b border-gray-300 text-gray-900">Desktop Sections</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Navbar (Fixed)</span>
                  <span className="text-gray-900">64px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Hero Section</span>
                  <span className="text-gray-900">~400px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Filter Section</span>
                  <span className="text-gray-900">~200px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Workshop Grid</span>
                  <span className="text-gray-900">~1200px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Instructor Section</span>
                  <span className="text-gray-900">~600px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">FAQ Section</span>
                  <span className="text-gray-900">~800px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Footer</span>
                  <span className="text-gray-900">~400px</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">~4200px</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 pb-2 border-b border-gray-300 text-gray-900">Mobile Sections</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Navbar (Fixed)</span>
                  <span className="text-gray-900">64px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Hero Section</span>
                  <span className="text-gray-900">~500px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Filter Section</span>
                  <span className="text-gray-900">~350px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Workshop Grid</span>
                  <span className="text-gray-900">~2400px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Instructor Section</span>
                  <span className="text-gray-900">~1200px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">FAQ Section</span>
                  <span className="text-gray-900">~1000px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Footer</span>
                  <span className="text-gray-900">~500px</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">~5200px</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Grid Changes */}
        <div className="mt-8 bg-white border-2 border-gray-900 p-8">
          <h2 className="text-2xl mb-6 text-gray-900">Responsive Grid Changes</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-3 px-4 text-gray-900">Section</th>
                  <th className="text-center py-3 px-4 text-gray-900">Mobile (&lt;768px)</th>
                  <th className="text-center py-3 px-4 text-gray-900">Tablet (768-1023px)</th>
                  <th className="text-center py-3 px-4 text-gray-900">Desktop (≥1024px)</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Workshop Grid</td>
                  <td className="text-center py-3 px-4">1 column</td>
                  <td className="text-center py-3 px-4">2 columns</td>
                  <td className="text-center py-3 px-4">3 columns</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Instructor Grid</td>
                  <td className="text-center py-3 px-4">1 column</td>
                  <td className="text-center py-3 px-4">2 columns</td>
                  <td className="text-center py-3 px-4">4 columns</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">FAQ Section</td>
                  <td className="text-center py-3 px-4">Stacked</td>
                  <td className="text-center py-3 px-4">Stacked</td>
                  <td className="text-center py-3 px-4">2 columns</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4">Filter Section</td>
                  <td className="text-center py-3 px-4">Stacked</td>
                  <td className="text-center py-3 px-4">Mixed</td>
                  <td className="text-center py-3 px-4">Inline</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Padding (px-)</td>
                  <td className="text-center py-3 px-4">5 (20px)</td>
                  <td className="text-center py-3 px-4">20 (80px)</td>
                  <td className="text-center py-3 px-4">20 (80px)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
