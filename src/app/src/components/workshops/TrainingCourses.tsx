export function TrainingCourses() {
  const courses = [
    {
      title: 'Complete Nail Training Course',
      subtitle: 'Beginner to Professional',
      description: 'A complete step-by-step training programme designed for beginners with no previous experience.',
      highlights: [
        'Beginner friendly',
        'Monthly workshops',
        'Live model practice',
        'Professional tools included'
      ],
      price: 'Starting from £XXX'
    },
    {
      title: 'Advanced Nail Update Course',
      subtitle: 'For Experienced Nail Technicians',
      description: 'A skill-refresh and update course focusing on the latest nail techniques and industry trends.',
      highlights: [
        'Advanced level',
        'Monthly workshops',
        'Personalised correction',
        'Latest products & tools'
      ],
      price: 'Starting from £XXX'
    }
  ];

  return (
    <section className="px-5 lg:px-20 py-16 max-w-[1440px] mx-auto">
      <h2 className="text-gray-900 text-center mb-12">Our Training Courses</h2>

      <div className="max-w-3xl mx-auto space-y-8">
        {courses.map((course, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-8"
          >
            {/* Course Header */}
            <div className="mb-6">
              <h3 className="text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 text-lg">{course.subtitle}</p>
            </div>

            {/* Description */}
            <p className="text-gray-700 mb-6 leading-relaxed">
              {course.description}
            </p>

            {/* Highlights */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {course.highlights.map((highlight, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            </div>

            {/* Price and Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-gray-200">
              <div className="text-gray-900">{course.price}</div>
              <button className="h-10 px-6 bg-gray-800 text-white hover:bg-gray-900 transition-colors rounded-md text-sm">
                View Course Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
