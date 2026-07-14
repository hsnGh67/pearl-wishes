import { Award, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const items = [
  {
    type: 'certification',
    title: 'NVQ Level 3 Beauty Therapy',
    issuer: 'VTCT',
    year: '2023',
  },
  {
    type: 'certification',
    title: 'Professional Nail Technician',
    issuer: 'British Association of Beauty Therapy & Cosmetology',
    year: '2022',
  },
  {
    type: 'award',
    title: 'Best Mobile Nail Service London 2024',
  },
];

export function AwardsAndCertifications() {
  return (
    <section className="pt-32 pb-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-gray-900 mb-4">Awards & Certifications</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our commitment to excellence has been recognized by industry leaders and clients alike.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {items.map((item, index) => (
              null
            ))}
          </div>

          <div className="mt-8 p-6 border-2 border-gray-200" style={{ backgroundColor: '#FEFCFA' }}>
            <p className="text-gray-600">
              Our technicians are fully insured and regularly undertake continuing professional development to stay current with the latest techniques and trends.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}