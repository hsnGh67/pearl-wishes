import { Award, BookOpen } from 'lucide-react';

interface Instructor {
  id: number;
  name: string;
  title: string;
  specialties: string[];
  experience: string;
  workshops: number;
}

interface InstructorCardProps {
  instructor: Instructor;
}

export function InstructorCard({ instructor }: InstructorCardProps) {
  return (
    <div className="border border-gray-300 bg-white hover:shadow-lg transition-all">
      {/* Photo Placeholder */}
      <div className="w-full h-64 bg-gray-200"></div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl text-gray-900 mb-1">
          {instructor.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {instructor.title}
        </p>

        {/* Specialties */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Specialties:</p>
          <div className="flex flex-wrap gap-2">
            {instructor.specialties.map((specialty) => (
              <span
                key={specialty}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 border border-gray-300"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Award size={16} className="text-gray-500" />
            <span>{instructor.experience} experience</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <BookOpen size={16} className="text-gray-500" />
            <span>{instructor.workshops} workshops taught</span>
          </div>
        </div>

        {/* CTA */}
        <button className="w-full mt-6 h-11 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          View Profile
        </button>
      </div>
    </div>
  );
}
