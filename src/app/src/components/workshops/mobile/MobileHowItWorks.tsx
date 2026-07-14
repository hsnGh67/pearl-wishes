import { CheckCircle2 } from 'lucide-react';

export function MobileHowItWorks() {
  const steps = [
    {
      number: 1,
      title: 'Choose a workshop',
      description: 'Browse our calendar and select a workshop that matches your skill level and interests.'
    },
    {
      number: 2,
      title: 'Reserve your seat',
      description: 'Secure your spot with a simple booking process. Limited seats available per session.'
    },
    {
      number: 3,
      title: 'Attend & practice',
      description: 'Join the workshop, learn new techniques, and receive a certificate upon completion.'
    }
  ];

  const outcomes = [
    'Master professional application techniques',
    'Understand product selection and quality',
    'Learn proper nail preparation methods',
    'Develop efficient workflow strategies',
    'Gain confidence in complex designs',
    'Build a strong foundation for client work'
  ];

  const skills = ['Precision', 'Technique', 'Artistry'];

  return (
    <section className="px-5 py-12 bg-gray-50">
      {/* How It Works */}
      <div className="mb-12">
        <h2 className="text-gray-900 mb-6">How it works</h2>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4 bg-white border border-gray-200 rounded-lg p-4">
              {/* Number Badge */}
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center">
                {step.number}
              </div>
              
              {/* Step Content */}
              <div className="flex-1 pt-1">
                <h3 className="text-gray-900 mb-1">{step.title}</h3>
                <p className="text-gray-600 text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What You'll Learn */}
      <div>
        <h2 className="text-gray-900 mb-6">What you'll learn</h2>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          {/* Outcomes List */}
          <div className="space-y-3 mb-6">
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm">{outcome}</p>
              </div>
            ))}
          </div>

          {/* Skill Tags */}
          <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b border-gray-200">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 text-sm rounded-md"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Materials Note */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <h4 className="text-gray-900 text-sm mb-2">Materials</h4>
            <p className="text-gray-600 text-sm">
              All essential materials provided • Optional premium kit available for purchase
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
