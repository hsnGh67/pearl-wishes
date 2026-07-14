const reasons = [
  {
    title: 'Thoughtful Craft',
    description: 'Every detail matters. From preparation to finish, each set is created with precision, balance, and intention — ensuring refined results that stand the test of time.',
  },
  {
    title: 'Premium Products',
    description: 'We work exclusively with carefully selected, high-quality products chosen for performance, safety, and nail health. Quality is never compromised, because exceptional results begin with exceptional materials.',
  },
  {
    title: 'Personal Experience',
    description: 'No two clients are the same. We take time to understand your style, needs, and occasion, delivering a service that feels considered, personal, and never formulaic.',
  },
];

export function WhyChooseUs() {
  return (
    <section className="pt-32 pb-20 bg-[#fef5f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-gray-900 mb-4">Why Choose Us</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're committed to providing exceptional service that goes beyond expectations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {reasons.map((reason, index) => (
            <div key={index} className="border-2 overflow-hidden" style={{ backgroundColor: '#FEFCFA', borderColor: '#3D3935' }}>
              <div className="grid md:grid-cols-2">
                {index === 1 ? (
                  <>
                    <div className="bg-gray-300 aspect-square md:aspect-auto min-h-[300px]"></div>
                    <div className="p-12 flex flex-col justify-center bg-[#efe5e5]">
                      <h3 className="text-gray-900 mb-4">{reason.title}</h3>
                      <p className="text-gray-600">{reason.description}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-12 flex flex-col justify-center bg-[#efe5e5]">
                      <h3 className="text-gray-900 mb-4">{reason.title}</h3>
                      <p className="text-gray-600">{reason.description}</p>
                    </div>
                    <div className="bg-gray-300 aspect-square md:aspect-auto min-h-[300px]"></div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}