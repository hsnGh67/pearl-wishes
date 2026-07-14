import { InstructorCard } from './InstructorCard';

export function InstructorSection() {
  const instructors = [
    {
      id: 1,
      name: 'Sarah Johnson',
      title: 'Lead Nail Technician',
      specialties: ['Gel Techniques', 'Nail Art'],
      experience: '12+ years',
      workshops: 45,
    },
    {
      id: 2,
      name: 'Maria Rodriguez',
      title: 'Master Educator',
      specialties: ['Advanced Art', 'Extensions'],
      experience: '10+ years',
      workshops: 38,
    },
    {
      id: 3,
      name: 'Emma Thompson',
      title: 'BIAB Specialist',
      specialties: ['BIAB', 'Natural Nails'],
      experience: '8+ years',
      workshops: 32,
    },
    {
      id: 4,
      name: 'Lisa Chen',
      title: 'Extension Expert',
      specialties: ['Extensions', 'Sculpting'],
      experience: '15+ years',
      workshops: 52,
    },
  ];

  return (
    <section className="py-16 px-5 lg:px-20 bg-gray-50">
      <div className="max-w-[1440px] mx-auto">
        {/* Section Header */}
        <div className="mb-12">
          <p className="text-sm tracking-wider uppercase text-gray-500 mb-2">
            Expert Educators
          </p>
          <h2 className="text-4xl text-gray-900 mb-4">
            Meet Your Instructors
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Learn from industry-leading professionals with years of experience 
            in nail artistry and education.
          </p>
        </div>

        {/* Instructor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {instructors.map((instructor) => (
            <InstructorCard key={instructor.id} instructor={instructor} />
          ))}
        </div>
      </div>
    </section>
  );
}
