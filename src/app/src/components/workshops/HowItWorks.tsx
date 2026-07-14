import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function HowItWorks() {
  const [isExpanded, setIsExpanded] = useState(false);
  const steps = [
    {
      number: 1,
      title: 'Choose your workshop',
      description: 'Select the workshop that matches your experience level and goals.'
    },
    {
      number: 2,
      title: 'Select your month & reserve your seat',
      description: 'Workshops are held monthly. Choose your preferred month during booking to secure your place. Limited seats available.'
    },
    {
      number: 3,
      title: 'Attend & practice',
      description: 'Attend your scheduled workshop, practice professional techniques, and receive a certificate upon completion.'
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
    <section className="px-5 lg:px-20 py-16 max-w-[1440px] mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left Column - How It Works */}
        <div>
          <h2 className="mb-8" style={{ color: '#3D3935' }}>How it works</h2>
          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-4">
                {/* Number Badge */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full text-white flex items-center justify-center" style={{ backgroundColor: '#3D3935' }}>
                  {step.number}
                </div>

                {/* Step Content */}
                <div className="flex-1 pt-1">
                  <h3 className="mb-1" style={{ color: '#3D3935' }}>{step.title}</h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - What You'll Learn */}
        <div>
          <h2 className="mb-8" style={{ color: '#3D3935' }}>What you'll learn</h2>

          <div className="mb-8">
            {/* Outcomes List */}
            <div className="space-y-3">
              {outcomes.map((outcome, index) => (
                <div key={index} className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#3D3935' }} />
                  <p className="text-gray-700">{outcome}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Materials Note */}
          <div className="border p-4" style={{ borderColor: '#DCD4CD', background: 'linear-gradient(to right, #FCEAE0, #EACAB8)' }}>
            <h4 className="text-sm mb-2" style={{ color: '#3D3935' }}>Materials</h4>
            <p className="text-gray-600 text-sm">
              All essential materials provided • Optional premium kit available for purchase
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
