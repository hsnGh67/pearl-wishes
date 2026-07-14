import { ExternalLink, Layout, Palette, FileText, Grid3x3 } from 'lucide-react';

export default function WorkshopsIndex() {
  const pages = [
    {
      title: 'Main Workshops Page',
      description: 'Complete, functional workshops page with all sections, filtering, and pagination.',
      url: '/workshops',
      icon: Layout,
      color: 'bg-gray-900',
    },
    {
      title: 'Component Showcase',
      description: 'Interactive library showing all reusable components with usage examples.',
      url: '/workshops/showcase',
      icon: Grid3x3,
      color: 'bg-gray-700',
    },
    {
      title: 'Design System',
      description: 'Complete design specifications including colors, typography, and spacing.',
      url: '/workshops/design-system',
      icon: Palette,
      color: 'bg-gray-600',
    },
    {
      title: 'Page Structure',
      description: 'Visual layout hierarchy for desktop (1440px) and mobile (390px) frames.',
      url: '/workshops/structure',
      icon: FileText,
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-5 lg:px-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-6xl mb-4 text-gray-900">
            Workshops Page
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            A comprehensive workshops system for Pearl Wishes Studio featuring a minimal 
            grayscale design with sharp edges, clean lines, and professional course listings.
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {pages.map((page) => {
            const Icon = page.icon;
            return (
              <a
                key={page.url}
                href={page.url}
                className="block border-2 border-gray-300 bg-white hover:shadow-xl transition-all group"
              >
                <div className={`${page.color} text-white p-6 flex items-center gap-4`}>
                  <Icon size={32} />
                  <h2 className="text-2xl">{page.title}</h2>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4">{page.description}</p>
                  <div className="flex items-center gap-2 text-gray-900 group-hover:gap-3 transition-all">
                    <span>View Page</span>
                    <ExternalLink size={16} />
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="bg-white border-2 border-gray-900 p-8 mb-12">
          <h2 className="text-3xl mb-6 text-gray-900">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Responsive Design', value: '390px → 1440px' },
              { label: 'Spacing System', value: '8px increments' },
              { label: 'Corner Radius', value: '0px (sharp edges)' },
              { label: 'Color Palette', value: 'Grayscale only' },
              { label: 'Font Family', value: 'Montserrat' },
              { label: 'Grid System', value: '12 col / 4 col' },
              { label: 'Components', value: '10+ reusable' },
              { label: 'Sample Data', value: '8 workshops, 4 instructors' },
              { label: 'Framework', value: 'React + TypeScript' },
            ].map((feature) => (
              <div key={feature.label} className="border border-gray-300 p-4">
                <div className="text-sm text-gray-600 mb-1">{feature.label}</div>
                <div className="text-gray-900">{feature.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Design Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white border-2 border-gray-900 p-8">
            <h3 className="text-2xl mb-4 text-gray-900">Desktop Frame</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between pb-2 border-b border-gray-300">
                <span className="text-gray-600">Name:</span>
                <span className="text-gray-900">Workshops — Desktop</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Width:</span>
                <span className="text-gray-900">1440px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Height:</span>
                <span className="text-gray-900">~4200px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Columns:</span>
                <span className="text-gray-900">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Margins:</span>
                <span className="text-gray-900">80px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gutter:</span>
                <span className="text-gray-900">24px</span>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-900 p-8">
            <h3 className="text-2xl mb-4 text-gray-900">Mobile Frame</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between pb-2 border-b border-gray-300">
                <span className="text-gray-600">Name:</span>
                <span className="text-gray-900">Workshops — Mobile</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Width:</span>
                <span className="text-gray-900">390px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Height:</span>
                <span className="text-gray-900">~5200px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Columns:</span>
                <span className="text-gray-900">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Margins:</span>
                <span className="text-gray-900">20px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gutter:</span>
                <span className="text-gray-900">16px</span>
              </div>
            </div>
          </div>
        </div>

        {/* Components List */}
        <div className="bg-white border-2 border-gray-900 p-8 mb-12">
          <h2 className="text-3xl mb-6 text-gray-900">Reusable Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Top Navigation (with active state)',
              'Button Variants (Primary/Secondary/Tertiary)',
              'Input Field (Default/Icon/Error states)',
              'Dropdown (Closed/Open states)',
              'Filter Chip (Default/Selected)',
              'Tag/Pill (Level/Topic/Status)',
              'Workshop Card (Default/Hover/Sold-out)',
              'Instructor Card',
              'Section Header (Eyebrow + Title + Subtitle)',
              'Accordion Item (Collapsed/Expanded)',
              'Pagination',
            ].map((component, index) => (
              <div key={component} className="flex items-start gap-3 border border-gray-300 p-3">
                <span className="text-sm text-gray-500 mt-0.5">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-sm text-gray-900">{component}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation */}
        <div className="bg-gray-900 text-white p-8">
          <h2 className="text-3xl mb-4">Documentation</h2>
          <p className="text-gray-300 mb-6">
            Comprehensive documentation files are included in the project root:
          </p>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• <code className="bg-gray-800 px-2 py-1">/WORKSHOPS_DOCUMENTATION.md</code> - Complete technical docs</li>
            <li>• <code className="bg-gray-800 px-2 py-1">/WORKSHOPS_QUICK_START.md</code> - Quick reference guide</li>
            <li>• <code className="bg-gray-800 px-2 py-1">/src/components/workshops/README.md</code> - Component library</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
