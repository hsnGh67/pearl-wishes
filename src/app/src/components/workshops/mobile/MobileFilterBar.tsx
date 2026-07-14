import { Search, SlidersHorizontal, ChevronDown, List, Calendar } from 'lucide-react';

interface MobileFilterBarProps {
  view: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
}

export function MobileFilterBar({ view, onViewChange }: MobileFilterBarProps) {
  return (
    <div className="px-5 py-4 border-t border-b border-gray-200 bg-white sticky top-16 z-30">
      {/* Search and Filter Row */}
      <div className="flex gap-2 mb-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search workshops..."
            className="w-full h-10 pl-10 pr-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900"
          />
        </div>
        
        {/* Filters Button */}
        <button className="h-10 px-4 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-700 hover:bg-gray-50 transition-colors">
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-sm">Filters</span>
        </button>
      </div>

      {/* Sort and View Toggle Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Sort Dropdown */}
        <div className="flex-1">
          <div className="relative">
            <select className="w-full h-10 pl-3 pr-10 border border-gray-300 rounded-lg text-sm text-gray-700 appearance-none focus:outline-none focus:border-gray-900 bg-white">
              <option>Sort: Upcoming</option>
              <option>Sort: Price (Low to High)</option>
              <option>Sort: Price (High to Low)</option>
              <option>Sort: Popularity</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none" />
          </div>
        </div>

        {/* List/Calendar Toggle - Segmented Control */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewChange('list')}
            className={`h-8 px-4 rounded-md flex items-center gap-2 text-sm transition-colors ${
              view === 'list'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <List className="w-4 h-4" />
            <span>List</span>
          </button>
          <button
            onClick={() => onViewChange('calendar')}
            className={`h-8 px-4 rounded-md flex items-center gap-2 text-sm transition-colors ${
              view === 'calendar'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Cal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
