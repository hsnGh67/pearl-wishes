import { ChevronLeft, ChevronRight, Clock, User, MapPin } from 'lucide-react';
import { useState } from 'react';

export function MobileCalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // January 2026

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Mock weekly workshops data
  const weeklyWorkshops = [
    {
      id: 1,
      title: 'Complete Guide to Gel Polish Application',
      date: 'Monday, Jan 15',
      time: '10:00 AM',
      duration: '3 hours',
      instructor: 'Laura Bennett',
      location: 'Pearl Wishes Studio',
      price: '£75',
      seatsLeft: 12,
      isNew: true
    },
    {
      id: 2,
      title: 'Gel Extension Foundations',
      date: 'Monday, Jan 15',
      time: '2:00 PM',
      duration: '3 hours',
      instructor: 'Sarah Mitchell',
      price: '£85',
      seatsLeft: 3
    },
    {
      id: 3,
      title: 'French Manicure Mastery Workshop',
      date: 'Thursday, Jan 18',
      time: '2:00 PM',
      duration: '2.5 hours',
      instructor: 'Sarah Mitchell',
      location: 'Pearl Wishes Studio',
      price: '£90',
      seatsLeft: 6
    },
    {
      id: 4,
      title: 'Color Theory for Nail Artists',
      date: 'Thursday, Jan 18',
      time: '10:00 AM',
      duration: '2 hours',
      instructor: 'Emma Chen',
      price: '£70',
      seatsLeft: 10
    },
    {
      id: 5,
      title: 'Advanced 3D Nail Art Design',
      date: 'Wednesday, Jan 22',
      time: '11:00 AM',
      duration: '4 hours',
      instructor: 'Emma Chen',
      location: 'Pearl Wishes Studio',
      price: '£145',
      soldOut: true
    },
    {
      id: 6,
      title: 'Building a Profitable Nail Business',
      date: 'Saturday, Jan 25',
      time: '6:00 PM',
      duration: '2 hours',
      instructor: 'Rachel Stevens',
      location: 'Pearl Wishes Studio',
      price: '£65',
      seatsLeft: 15
    }
  ];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <section className="px-5 py-8" id="calendar">
      {/* Month Selector */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="w-10 h-10 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-md flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h3 className="text-gray-900">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h3>
          
          <button
            onClick={goToNextMonth}
            className="w-10 h-10 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-md flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900">Upcoming Workshops</h2>
        <p className="text-sm text-gray-600">{weeklyWorkshops.length} this month</p>
      </div>

      {/* Weekly List */}
      <div className="space-y-4">
        {weeklyWorkshops.map((workshop) => (
          <div
            key={workshop.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            {/* Date Header */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
              <span className="text-sm text-gray-900">{workshop.date}</span>
              {workshop.isNew && !workshop.soldOut && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-900 text-white text-xs rounded-md">
                  New
                </span>
              )}
              {workshop.soldOut && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-700 text-white text-xs rounded-md">
                  Sold out
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-gray-900 mb-3">{workshop.title}</h3>

            {/* Meta Info */}
            <div className="space-y-2 mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>{workshop.time} • {workshop.duration}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 flex-shrink-0" />
                <span>{workshop.instructor}</span>
              </div>
              {workshop.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{workshop.location}</span>
                </div>
              )}
            </div>

            {/* Price and Button */}
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-gray-900">{workshop.price}</div>
                {!workshop.soldOut && workshop.seatsLeft <= 5 && (
                  <p className="text-xs text-red-600 mt-1">
                    {workshop.seatsLeft} seats left
                  </p>
                )}
              </div>
              <button
                className={`h-10 px-6 rounded-lg transition-colors text-sm ${
                  workshop.soldOut
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
                disabled={workshop.soldOut}
              >
                {workshop.soldOut ? 'Sold Out' : 'Reserve'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
