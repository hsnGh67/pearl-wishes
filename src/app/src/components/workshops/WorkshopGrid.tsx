import { WorkshopCard } from './WorkshopCard';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkshopGridProps {
  selectedLevel: string | null;
  selectedTopic: string | null;
}

export function WorkshopGrid({ selectedLevel, selectedTopic }: WorkshopGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const workshops = [
    {
      id: 1,
      title: 'Gel Manicure Fundamentals',
      instructor: 'Sarah Johnson',
      date: 'March 15, 2026',
      time: '10:00 AM - 2:00 PM',
      duration: '4 hours',
      level: 'Beginner',
      topic: 'Gel Techniques',
      price: 150,
      spots: 8,
      soldOut: false,
    },
    {
      id: 2,
      title: 'Advanced Nail Art Techniques',
      instructor: 'Maria Rodriguez',
      date: 'March 18, 2026',
      time: '1:00 PM - 5:00 PM',
      duration: '4 hours',
      level: 'Advanced',
      topic: 'Nail Art',
      price: 180,
      spots: 0,
      soldOut: true,
    },
    {
      id: 3,
      title: 'BIAB Application Masterclass',
      instructor: 'Emma Thompson',
      date: 'March 22, 2026',
      time: '9:00 AM - 1:00 PM',
      duration: '4 hours',
      level: 'Intermediate',
      topic: 'BIAB',
      price: 165,
      spots: 5,
      soldOut: false,
    },
    {
      id: 4,
      title: 'Gel Extensions Complete Guide',
      instructor: 'Lisa Chen',
      date: 'March 25, 2026',
      time: '10:00 AM - 4:00 PM',
      duration: '6 hours',
      level: 'All Levels',
      topic: 'Extensions',
      price: 220,
      spots: 6,
      soldOut: false,
    },
    {
      id: 5,
      title: 'Building Your Nail Business',
      instructor: 'Rebecca Moore',
      date: 'March 28, 2026',
      time: '2:00 PM - 6:00 PM',
      duration: '4 hours',
      level: 'All Levels',
      topic: 'Business',
      price: 140,
      spots: 12,
      soldOut: false,
    },
    {
      id: 6,
      title: 'Chrome & Metallic Finishes',
      instructor: 'Sarah Johnson',
      date: 'April 1, 2026',
      time: '11:00 AM - 3:00 PM',
      duration: '4 hours',
      level: 'Intermediate',
      topic: 'Nail Art',
      price: 170,
      spots: 0,
      soldOut: true,
    },
    {
      id: 7,
      title: 'Professional Gel Application',
      instructor: 'Maria Rodriguez',
      date: 'April 5, 2026',
      time: '10:00 AM - 2:00 PM',
      duration: '4 hours',
      level: 'Beginner',
      topic: 'Gel Techniques',
      price: 155,
      spots: 7,
      soldOut: false,
    },
    {
      id: 8,
      title: 'Creative Nail Design Workshop',
      instructor: 'Emma Thompson',
      date: 'April 8, 2026',
      time: '1:00 PM - 5:00 PM',
      duration: '4 hours',
      level: 'Advanced',
      topic: 'Nail Art',
      price: 185,
      spots: 4,
      soldOut: false,
    },
  ];

  // Filter workshops
  const filteredWorkshops = workshops.filter((workshop) => {
    if (selectedLevel && workshop.level !== selectedLevel) return false;
    if (selectedTopic && workshop.topic !== selectedTopic) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredWorkshops.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedWorkshops = filteredWorkshops.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section className="py-16 px-5 lg:px-20">
      <div className="max-w-[1440px] mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-sm tracking-wider uppercase text-gray-500 mb-2">
            Available Courses
          </p>
          <h2 className="text-4xl text-gray-900 mb-4">
            Upcoming Workshops
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Choose from our range of professional training sessions designed to 
            enhance your nail artistry skills.
          </p>
        </div>

        {/* Workshop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayedWorkshops.map((workshop) => (
            <WorkshopCard key={workshop.id} workshop={workshop} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-10 w-10 flex items-center justify-center border text-sm transition-colors ${
                  currentPage === page
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-10 w-10 flex items-center justify-center border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
