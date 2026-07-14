import { Search, Calendar, ChevronDown, SlidersHorizontal, List, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../../components/ui/sheet';

export function FilterToolbar() {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  return (
    <>
      {/* Desktop Toolbar - NOTE: In production, add sticky positioning with top-offset after scroll */}
      <div className="hidden lg:block bg-white border border-gray-200 rounded-xl p-4 mb-12">
        <div className="flex items-center gap-3">
          {/* Left side filters */}
          <div className="flex items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by workshop or instructor"
                className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-lg"
              />
            </div>

            {/* Date Dropdown */}
            <Select defaultValue="any-date">
              <SelectTrigger className="w-[140px] h-11 bg-gray-50 border-gray-200 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                <SelectValue placeholder="Any date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any-date">Any date</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This week</SelectItem>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="next-month">Next month</SelectItem>
              </SelectContent>
            </Select>

            {/* Level Dropdown */}
            <Select defaultValue="all-levels">
              <SelectTrigger className="w-[140px] h-11 bg-gray-50 border-gray-200 rounded-lg">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-levels">All levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Right side filters */}
          <div className="flex items-center gap-3">
            {/* Topic Dropdown */}
            <Select defaultValue="all-topics">
              <SelectTrigger className="w-[140px] h-11 bg-gray-50 border-gray-200 rounded-lg">
                <SelectValue placeholder="All topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-topics">All topics</SelectItem>
                <SelectItem value="nail-art">Nail Art</SelectItem>
                <SelectItem value="gel-techniques">Gel Techniques</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="extensions">Extensions</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Range Dropdown */}
            <Select defaultValue="any-price">
              <SelectTrigger className="w-[140px] h-11 bg-gray-50 border-gray-200 rounded-lg">
                <SelectValue placeholder="Any price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any-price">Any price</SelectItem>
                <SelectItem value="under-50">Under £50</SelectItem>
                <SelectItem value="50-100">£50 - £100</SelectItem>
                <SelectItem value="100-200">£100 - £200</SelectItem>
                <SelectItem value="over-200">Over £200</SelectItem>
              </SelectContent>
            </Select>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-11">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 h-full rounded-l-lg transition-colors ${
                  viewMode === 'list'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={viewMode === 'list' ? { backgroundColor: '#3D3935' } : {}}
              >
                <List className="w-4 h-4" />
                <span className="text-sm">List</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 px-4 h-full rounded-r-lg transition-colors ${
                  viewMode === 'calendar'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={viewMode === 'calendar' ? { backgroundColor: '#3D3935' } : {}}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-sm">Calendar</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <Select defaultValue="soonest">
              <SelectTrigger className="w-[160px] h-11 bg-gray-50 border-gray-200 rounded-lg">
                <SelectValue placeholder="Sort: Soonest" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soonest">Sort: Soonest</SelectItem>
                <SelectItem value="latest">Sort: Latest</SelectItem>
                <SelectItem value="price-low">Sort: Price (Low)</SelectItem>
                <SelectItem value="price-high">Sort: Price (High)</SelectItem>
                <SelectItem value="popular">Sort: Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile Toolbar - Filters button opens modal sheet */}
      <div className="lg:hidden bg-white border border-gray-200 rounded-xl p-4 mb-8">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search workshops..."
              className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-lg"
            />
          </div>

          {/* Filters Button - Opens Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="h-11 px-4 border-gray-200 bg-gray-50 rounded-lg"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl">
              <SheetHeader className="mb-6">
                <SheetTitle>Filter Workshops</SheetTitle>
                <SheetDescription>
                  Refine your search to find the perfect workshop
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 overflow-y-auto h-[calc(100%-100px)]">
                {/* Date Filter */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Date</label>
                  <Select defaultValue="any-date">
                    <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200 rounded-lg">
                      <SelectValue placeholder="Any date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any-date">Any date</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This week</SelectItem>
                      <SelectItem value="this-month">This month</SelectItem>
                      <SelectItem value="next-month">Next month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Level Filter */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Level</label>
                  <Select defaultValue="all-levels">
                    <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200 rounded-lg">
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-levels">All levels</SelectItem>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic Filter */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Topic</label>
                  <Select defaultValue="all-topics">
                    <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200 rounded-lg">
                      <SelectValue placeholder="All topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-topics">All topics</SelectItem>
                      <SelectItem value="nail-art">Nail Art</SelectItem>
                      <SelectItem value="gel-techniques">Gel Techniques</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="extensions">Extensions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Price Range</label>
                  <Select defaultValue="any-price">
                    <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200 rounded-lg">
                      <SelectValue placeholder="Any price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any-price">Any price</SelectItem>
                      <SelectItem value="under-50">Under £50</SelectItem>
                      <SelectItem value="50-100">£50 - £100</SelectItem>
                      <SelectItem value="100-200">£100 - £200</SelectItem>
                      <SelectItem value="over-200">Over £200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Mode */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">View Mode</label>
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg h-11">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex items-center justify-center gap-2 flex-1 h-full rounded-l-lg transition-colors ${
                        viewMode === 'list'
                          ? 'text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      style={viewMode === 'list' ? { backgroundColor: '#3D3935' } : {}}
                    >
                      <List className="w-4 h-4" />
                      <span className="text-sm">List</span>
                    </button>
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={`flex items-center justify-center gap-2 flex-1 h-full rounded-r-lg transition-colors ${
                        viewMode === 'calendar'
                          ? 'text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      style={viewMode === 'calendar' ? { backgroundColor: '#3D3935' } : {}}
                    >
                      <CalendarDays className="w-4 h-4" />
                      <span className="text-sm">Calendar</span>
                    </button>
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Sort By</label>
                  <Select defaultValue="soonest">
                    <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-200 rounded-lg">
                      <SelectValue placeholder="Sort: Soonest" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soonest">Soonest</SelectItem>
                      <SelectItem value="latest">Latest</SelectItem>
                      <SelectItem value="price-low">Price (Low to High)</SelectItem>
                      <SelectItem value="price-high">Price (High to Low)</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-200">
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 h-11 rounded-lg">
                    Clear All
                  </Button>
                  <Button className="flex-1 h-11 rounded-lg transition-all" style={{ backgroundColor: '#3D3935', color: '#E9CFCA' }} onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1F1F1F';
                    e.currentTarget.style.color = '#D0A096';
                  }} onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3D3935';
                    e.currentTarget.style.color = '#E9CFCA';
                  }}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}