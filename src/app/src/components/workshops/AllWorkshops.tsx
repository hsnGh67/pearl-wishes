import { Calendar, Clock, User } from 'lucide-react';
import { useState } from 'react';

interface Workshop {
  id: number;
  title: string;
  level: string;
  topic: string;
  date: string;
  time: string;
  sessionCount: number;
  sessionDurationHours: number;
  instructor: {
    name: string;
    avatar: string;
  };
  price: string;
  seatsLeft: number | null;
  soldOut?: boolean;
  isNew?: boolean;
}

const workshopsData: Workshop[] = [
  {
    id: 1,
    title: 'Complete Guide to Gel Polish Application',
    level: 'Beginner',
    topic: 'Gel Techniques',
    date: 'Jan 25, 2026',
    time: '10:00 AM',
    sessionCount: 1,
    sessionDurationHours: 3,
    instructor: { name: 'Laura Bennett', avatar: 'LB' },
    price: '£75',
    seatsLeft: 12,
    isNew: true,
  },
  {
    id: 2,
    title: 'French Manicure Mastery Workshop',
    level: 'Intermediate',
    topic: 'Nail Art',
    date: 'Jan 28, 2026',
    time: '2:00 PM',
    sessionCount: 1,
    sessionDurationHours: 2.5,
    instructor: { name: 'Sarah Mitchell', avatar: 'SM' },
    price: '£90',
    seatsLeft: 6,
  },
  {
    id: 3,
    title: 'Advanced 3D Nail Art Design',
    level: 'Advanced',
    topic: 'Nail Art',
    date: 'Feb 1, 2026',
    time: '11:00 AM',
    sessionCount: 2,
    sessionDurationHours: 4,
    instructor: { name: 'Emma Chen', avatar: 'EC' },
    price: '£145',
    seatsLeft: null,
    soldOut: true,
  },
  {
    id: 4,
    title: 'Building a Profitable Nail Business',
    level: 'All Levels',
    topic: 'Business',
    date: 'Feb 3, 2026',
    time: '6:00 PM',
    sessionCount: 1,
    sessionDurationHours: 2,
    instructor: { name: 'Rachel Stevens', avatar: 'RS' },
    price: '£65',
    seatsLeft: 15,
  },
  {
    id: 5,
    title: 'Acrylic Extensions Fundamentals',
    level: 'Beginner',
    topic: 'Extensions',
    date: 'Feb 5, 2026',
    time: '10:00 AM',
    sessionCount: 3,
    sessionDurationHours: 3.5,
    instructor: { name: 'Nina Rodriguez', avatar: 'NR' },
    price: '£95',
    seatsLeft: 2,
    isNew: true,
  },
  {
    id: 6,
    title: 'Nail Health & Restoration Techniques',
    level: 'Intermediate',
    topic: 'Business',
    date: 'Feb 8, 2026',
    time: '1:00 PM',
    sessionCount: 2,
    sessionDurationHours: 3,
    instructor: { name: 'Dr. Maya Patel', avatar: 'MP' },
    price: '£110',
    seatsLeft: 8,
  },
];

export function AllWorkshops() {
  const [visibleCount, setVisibleCount] = useState(6);
  const totalWorkshops = 18; // Mock total count
  const displayedWorkshops = workshopsData.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 6, totalWorkshops));
  };

  return (
    null
  );
}

function WorkshopCard({ workshop }: { workshop: Workshop }) {
  const isSoldOut = workshop.soldOut;
  const isLowSeats = workshop.seatsLeft && workshop.seatsLeft <= 3;

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
        isSoldOut ? 'opacity-60' : ''
      }`}
    >
      {/* Cover Image with Badges */}
      <div className="relative h-48 bg-gray-300">
        {workshop.isNew && !isSoldOut && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-3 py-1 bg-gray-900 text-white text-xs rounded-md">
              New
            </span>
          </div>
        )}
        {isSoldOut && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-3 py-1 bg-gray-700 text-white text-xs rounded-md">
              Sold out
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5">
        {/* Title - max 2 lines */}
        <h3 className="text-gray-900 mb-3 line-clamp-2 min-h-[3rem]">
          {workshop.title}
        </h3>

        {/* Tags - Level + Topic */}
        <div className="flex gap-2 mb-4">
          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
            {workshop.level}
          </span>
          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
            {workshop.topic}
          </span>
        </div>

        {/* Info Row - Date, Time, Duration */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{workshop.date}</span>
            <span className="text-gray-400">•</span>
            <span>{workshop.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {workshop.sessionCount > 1
                ? `${workshop.sessionCount} sess. × ${workshop.sessionDurationHours}h`
                : `${workshop.sessionDurationHours}h`}
            </span>
          </div>
        </div>

        {/* Instructor Row */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-700">
            {workshop.instructor.avatar}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{workshop.instructor.name}</span>
          </div>
        </div>

        {/* Bottom Row - Seats Badge only (price shown in detail tab + booking flow) */}
        <div className="flex items-center justify-end mb-4">
          {isSoldOut ? (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
              No seats
            </span>
          ) : workshop.seatsLeft !== null && (
            <span className={`text-xs px-2 py-1 rounded ${
              isLowSeats
                ? 'bg-red-50 text-red-700' 
                : workshop.seatsLeft <= 5 
                ? 'bg-orange-50 text-orange-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              {workshop.seatsLeft} seats left
            </span>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2">
          <button 
            className={`flex-1 h-10 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-lg ${
              isSoldOut ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isSoldOut}
          >
            View details
          </button>
          <button 
            className={`flex-1 h-10 rounded-lg transition-colors ${
              isSoldOut 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'text-white'
            }`}
            style={!isSoldOut ? { backgroundColor: '#3D3935' } : {}}
            onMouseEnter={(e) => {
              if (!isSoldOut) e.currentTarget.style.backgroundColor = '#1F1F1F';
            }}
            onMouseLeave={(e) => {
              if (!isSoldOut) e.currentTarget.style.backgroundColor = '#3D3935';
            }}
            disabled={isSoldOut}
          >
            Reserve
          </button>
        </div>
      </div>
    </div>
  );
}
