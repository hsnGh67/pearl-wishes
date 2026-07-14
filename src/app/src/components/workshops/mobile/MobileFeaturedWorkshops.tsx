import { Clock, User } from 'lucide-react';

export function MobileFeaturedWorkshops() {
  const workshops = [
    {
      id: 1,
      title: 'Complete Guide to Gel Polish Application',
      level: 'Beginner',
      date: 'Jan 15, 2026',
      time: '10:00 AM',
      duration: '3 hours',
      instructor: 'Laura Bennett',
      price: '£75',
      seatsLeft: 12,
      isNew: true
    },
    {
      id: 2,
      title: 'French Manicure Mastery Workshop',
      level: 'Intermediate',
      date: 'Jan 18, 2026',
      time: '2:00 PM',
      duration: '2.5 hours',
      instructor: 'Sarah Mitchell',
      price: '£90',
      seatsLeft: 6
    },
    {
      id: 3,
      title: 'Advanced 3D Nail Art Design',
      level: 'Advanced',
      date: 'Jan 22, 2026',
      time: '11:00 AM',
      duration: '4 hours',
      instructor: 'Emma Chen',
      price: '£145',
      soldOut: true
    }
  ];

  return (
    <section className="py-8">
      {/* Section Header */}
      <div className="px-5 mb-4">
        <h2 className="text-gray-900">Featured Workshops</h2>
      </div>

      {/* Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 px-5 pb-2">
          {workshops.map((workshop) => (
            <div
              key={workshop.id}
              className="flex-shrink-0 w-[280px] bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-40 bg-gray-300">
                {workshop.isNew && !workshop.soldOut && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-3 py-1 bg-gray-900 text-white text-xs rounded-md">
                      New
                    </span>
                  </div>
                )}
                {workshop.soldOut && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center px-3 py-1 bg-gray-700 text-white text-xs rounded-md">
                      Sold out
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Level Badge */}
                <div className="mb-3">
                  <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                    {workshop.level}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-gray-900 mb-3 line-clamp-2 min-h-[3rem]">
                  {workshop.title}
                </h3>

                {/* Meta Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{workshop.date} • {workshop.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{workshop.instructor}</span>
                  </div>
                </div>

                {/* Price and Button */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-900">{workshop.price}</span>
                  <button
                    className={`h-9 px-4 rounded-md text-sm transition-colors ${
                      workshop.soldOut
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                    disabled={workshop.soldOut}
                  >
                    {workshop.soldOut ? 'Sold Out' : 'Reserve'}
                  </button>
                </div>

                {/* Seats Left */}
                {!workshop.soldOut && workshop.seatsLeft <= 5 && (
                  <p className="mt-2 text-xs text-red-600">
                    Only {workshop.seatsLeft} seats left
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
