import { Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { FilterChip } from './FilterChip';

interface FilterSectionProps {
  selectedLevel: string | null;
  selectedTopic: string | null;
  onLevelChange: (level: string | null) => void;
  onTopicChange: (topic: string | null) => void;
}

export function FilterSection({ 
  selectedLevel, 
  selectedTopic, 
  onLevelChange, 
  onTopicChange 
}: FilterSectionProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'All Levels'];
  const topics = ['Gel Techniques', 'Nail Art', 'Extensions', 'BIAB', 'Business'];

  return (
    <section className="py-8 px-5 lg:px-20 border-b border-gray-200">
      <div className="max-w-[1440px] mx-auto">
        <div className="flex flex-col gap-6">
          {/* Search and Dropdown Row */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search workshops..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full h-11 pl-12 pr-4 border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-500 transition-colors"
              />
            </div>

            <div className="relative w-full md:w-64">
              <button
                onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                className="w-full h-11 px-4 border border-gray-300 bg-white text-gray-700 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span>Select Date</span>
                <ChevronDown size={20} className={`transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDateDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 border border-gray-300 bg-white shadow-lg z-10">
                  <button className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 border-b border-gray-200">
                    This Week
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 border-b border-gray-200">
                    This Month
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 border-b border-gray-200">
                    Next 3 Months
                  </button>
                  <button className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700">
                    All Dates
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filter Chips Row */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 mr-2">Level:</span>
              {levels.map((level) => (
                <FilterChip
                  key={level}
                  label={level}
                  selected={selectedLevel === level}
                  onClick={() => onLevelChange(selectedLevel === level ? null : level)}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 mr-2">Topic:</span>
              {topics.map((topic) => (
                <FilterChip
                  key={topic}
                  label={topic}
                  selected={selectedTopic === topic}
                  onClick={() => onTopicChange(selectedTopic === topic ? null : topic)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
