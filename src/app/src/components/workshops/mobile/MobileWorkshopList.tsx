import { Clock, User, MapPin } from 'lucide-react';

export function MobileWorkshopList() {
  const workshops = [
    {
      id: 1,
      title: 'Complete Guide to Gel Polish Application',
      level: 'Beginner',
      topic: 'Gel Techniques',
      date: 'Jan 15, 2026',
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
      title: 'French Manicure Mastery Workshop',
      level: 'Intermediate',
      topic: 'Nail Art',
      date: 'Jan 18, 2026',
      time: '2:00 PM',
      duration: '2.5 hours',
      instructor: 'Sarah Mitchell',
      location: 'Pearl Wishes Studio',
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
      instructor: 'Emma Chen',
      location: 'Pearl Wishes Studio',
      price: '£145',
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
      instructor: 'Rachel Stevens',
      location: 'Pearl Wishes Studio',
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
      instructor: 'Nina Rodriguez',
      location: 'Pearl Wishes Studio',
      price: '£95',
      seatsLeft: 2,
      isNew: true
    },
    {
      id: 6,
      title: 'Nail Health & Restoration Techniques',
      level: 'Intermediate',
      topic: 'Health & Care',
      date: 'Jan 30, 2026',
      time: '1:00 PM',
      duration: '3 hours',
      instructor: 'Dr. Maya Patel',
      location: 'Pearl Wishes Studio',
      price: '£110',
      seatsLeft: 8
    }
  ];

  return (
    <section className="px-5 py-8" id="workshops">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900">All Workshops</h2>
        <p className="text-sm text-gray-600">{workshops.length} workshops</p>
      </div>

      {/* 1-Column Workshop Cards */}
      <div className="space-y-4">
        {workshops.map((workshop) => (
          <div
            key={workshop.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
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
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  {workshop.level}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Topic Badge */}
              <div className="mb-3">
                <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                  {workshop.topic}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-gray-900 mb-3">{workshop.title}</h3>

              {/* Meta Info */}
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{workshop.date} at {workshop.time} • {workshop.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>{workshop.instructor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{workshop.location}</span>
                </div>
              </div>

              {/* Price and Seats */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <div>
                  <div className="text-gray-900">{workshop.price}</div>
                  {!workshop.soldOut && workshop.seatsLeft <= 5 && (
                    <p className="text-xs text-red-600 mt-1">
                      Only {workshop.seatsLeft} seats left
                    </p>
                  )}
                </div>
                {workshop.soldOut && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                    No seats
                  </span>
                )}
              </div>

              {/* Reserve Button */}
              <button
                className={`w-full h-12 rounded-lg transition-colors ${
                  workshop.soldOut
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#FFD4C3] to-[#E8D5C4] text-gray-900 hover:opacity-90'
                }`}
                disabled={workshop.soldOut}
              >
                {workshop.soldOut ? 'Sold Out' : 'Reserve Your Spot'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="mt-6">
        <button className="w-full h-12 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          Load more workshops
        </button>
      </div>
    </section>
  );
}
