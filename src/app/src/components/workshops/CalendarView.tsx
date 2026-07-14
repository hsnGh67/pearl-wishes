import { ChevronLeft, ChevronRight, Calendar, Clock, User, X } from 'lucide-react';
import { useState } from 'react';

interface Workshop {
  id: number;
  title: string;
  level: string;
  topic: string;
  date: string;
  time: string;
  duration: string;
  instructor: {
    name: string;
    avatar: string;
  };
  price: string;
  seatsLeft: number | null;
  soldOut?: boolean;
  isNew?: boolean;
}

// Mock workshops data with specific dates
const workshopsData: Workshop[] = [
  {
    id: 1,
    title: 'Complete Guide to Gel Polish Application',
    level: 'Beginner',
    topic: 'Gel Techniques',
    date: 'Jan 15, 2026',
    time: '10:00 AM',
    duration: '3 hours',
    instructor: {
      name: 'Laura Bennett',
      avatar: 'LB'
    },
    price: '£75',
    seatsLeft: 12,
    isNew: true
  },
  {
    id: 2,
    title: 'French Manicure Mastery Workshop',
    level: 'Intermediate',
    topic: 'Nail Art',
    date: 'Jan 18, 2026',
    time: '2:00 PM',
    duration: '2.5 hours',
    instructor: {
      name: 'Sarah Mitchell',
      avatar: 'SM'
    },
    price: '£90',
    seatsLeft: 6
  },
  {
    id: 3,
    title: 'Advanced 3D Nail Art Design',
    level: 'Advanced',
    topic: 'Nail Art',
    date: 'Jan 22, 2026',
    time: '11:00 AM',
    duration: '4 hours',
    instructor: {
      name: 'Emma Chen',
      avatar: 'EC'
    },
    price: '£145',
    seatsLeft: null,
    soldOut: true
  },
  {
    id: 4,
    title: 'Building a Profitable Nail Business',
    level: 'All Levels',
    topic: 'Business',
    date: 'Jan 25, 2026',
    time: '6:00 PM',
    duration: '2 hours',
    instructor: {
      name: 'Rachel Stevens',
      avatar: 'RS'
    },
    price: '£65',
    seatsLeft: 15
  },
  {
    id: 5,
    title: 'Acrylic Extensions Fundamentals',
    level: 'Beginner',
    topic: 'Extensions',
    date: 'Jan 28, 2026',
    time: '10:00 AM',
    duration: '3.5 hours',
    instructor: {
      name: 'Nina Rodriguez',
      avatar: 'NR'
    },
    price: '£95',
    seatsLeft: 2,
    isNew: true
  },
  {
    id: 6,
    title: 'Nail Health & Restoration Techniques',
    level: 'Intermediate',
    topic: 'Business',
    date: 'Jan 30, 2026',
    time: '1:00 PM',
    duration: '3 hours',
    instructor: {
      name: 'Dr. Maya Patel',
      avatar: 'MP'
    },
    price: '£110',
    seatsLeft: 8
  },
  {
    id: 7,
    title: 'Gel Extension Foundations',
    level: 'Beginner',
    topic: 'Extensions',
    date: 'Jan 15, 2026',
    time: '2:00 PM',
    duration: '3 hours',
    instructor: {
      name: 'Sarah Mitchell',
      avatar: 'SM'
    },
    price: '£85',
    seatsLeft: 3
  },
  {
    id: 8,
    title: 'Color Theory for Nail Artists',
    level: 'Intermediate',
    topic: 'Nail Art',
    date: 'Jan 18, 2026',
    time: '10:00 AM',
    duration: '2 hours',
    instructor: {
      name: 'Emma Chen',
      avatar: 'EC'
    },
    price: '£70',
    seatsLeft: 10
  }
];

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // January 2026
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Get calendar days for the current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Convert to Monday = 0, Sunday = 6
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Get workshops for a specific date
  const getWorkshopsForDate = (date: Date | null) => {
    if (!date) return [];
    
    return workshopsData.filter(workshop => {
      const workshopDate = new Date(workshop.date);
      return workshopDate.toDateString() === date.toDateString();
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date(2026, 0, 1)); // January 2026
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date(2026, 0, 1); // Mock today as Jan 1, 2026
    return date.toDateString() === today.toDateString();
  };

  const calendarDays = getCalendarDays();

  return (
    <section className="px-5 lg:px-20 py-16 max-w-[1440px] mx-auto">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-8">
        <h2 className="text-gray-900">Calendar View (MVP)</h2>
        <p className="text-sm text-gray-600">
          Browse workshops by date
        </p>
      </div>

      {/* Calendar Header */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="h-9 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-md text-sm"
            >
              Today
            </button>
            <button
              onClick={goToPreviousMonth}
              className="w-9 h-9 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-md flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextMonth}
              className="w-9 h-9 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-md flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {/* Week Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center py-2 text-sm text-gray-600">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => {
              const workshops = getWorkshopsForDate(date);
              const visibleWorkshops = workshops.slice(0, 3);
              const moreCount = workshops.length - 3;

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border border-gray-200 rounded-md ${
                    date ? 'bg-white' : 'bg-gray-50'
                  } ${isToday(date) ? 'border-gray-900 border-2' : ''}`}
                >
                  {date && (
                    <>
                      <div className={`text-sm mb-2 ${isToday(date) ? 'text-gray-900' : 'text-gray-700'}`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {visibleWorkshops.map(workshop => (
                          <button
                            key={workshop.id}
                            onClick={() => setSelectedWorkshop(workshop)}
                            className={`w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-100 transition-colors ${
                              workshop.soldOut ? 'bg-gray-200 text-gray-500' : 'bg-gray-300 text-gray-800'
                            }`}
                          >
                            <div className="truncate">{workshop.time}</div>
                            <div className="truncate">{workshop.title}</div>
                          </button>
                        ))}
                        {moreCount > 0 && (
                          <div className="text-xs text-gray-500 px-2 py-1">
                            +{moreCount} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workshop Details Panel */}
      {selectedWorkshop && (
        <div className="fixed inset-0 z-50 flex items-start justify-end" style={{ backgroundColor: 'rgba(61, 57, 53, 0.2)' }}>
          <div className="w-full max-w-md h-full bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-gray-900">Workshop Details</h3>
              <button
                onClick={() => setSelectedWorkshop(null)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="p-6">
              {/* Cover Image */}
              <div className="relative h-48 bg-gray-300 rounded-lg mb-6">
                {selectedWorkshop.isNew && !selectedWorkshop.soldOut && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-3 py-1 bg-gray-900 text-white text-xs rounded-md">
                      New
                    </span>
                  </div>
                )}
                {selectedWorkshop.soldOut && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-3 py-1 bg-gray-700 text-white text-xs rounded-md">
                      Sold out
                    </span>
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="text-gray-900 mb-4">{selectedWorkshop.title}</h2>

              {/* Tags */}
              <div className="flex gap-2 mb-6">
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  {selectedWorkshop.level}
                </span>
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  {selectedWorkshop.topic}
                </span>
              </div>

              {/* Info */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Date & Time</div>
                    <div className="text-gray-900">
                      {selectedWorkshop.date} at {selectedWorkshop.time}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="text-gray-900">{selectedWorkshop.duration}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm text-gray-700">
                    {selectedWorkshop.instructor.avatar}
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Instructor</div>
                    <div className="text-gray-900">{selectedWorkshop.instructor.name}</div>
                  </div>
                </div>
              </div>

              {/* Price & Seats */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Price</div>
                  <div className="text-gray-900">{selectedWorkshop.price}</div>
                </div>
                {selectedWorkshop.soldOut ? (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                    No seats available
                  </span>
                ) : selectedWorkshop.seatsLeft !== null && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Availability</div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      selectedWorkshop.seatsLeft <= 3
                        ? 'bg-red-50 text-red-700'
                        : selectedWorkshop.seatsLeft <= 5
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-green-50 text-green-700'
                    }`}>
                      {selectedWorkshop.seatsLeft} seats left
                    </span>
                  </div>
                )}
              </div>

              {/* Reserve Button */}
              <button
                className={`w-full h-12 rounded-lg transition-colors ${
                  selectedWorkshop.soldOut
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'text-white'
                }`}
                style={!selectedWorkshop.soldOut ? { backgroundColor: '#3D3935' } : {}}
                onMouseEnter={(e) => {
                  if (!selectedWorkshop.soldOut) e.currentTarget.style.backgroundColor = '#1F1F1F';
                }}
                onMouseLeave={(e) => {
                  if (!selectedWorkshop.soldOut) e.currentTarget.style.backgroundColor = '#3D3935';
                }}
                disabled={selectedWorkshop.soldOut}
              >
                {selectedWorkshop.soldOut ? 'Sold Out' : 'Reserve Your Spot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}