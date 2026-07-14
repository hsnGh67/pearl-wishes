import { MapPin, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function MobileWorkshopInfo() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openPolicy, setOpenPolicy] = useState<number | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const togglePolicy = (index: number) => {
    setOpenPolicy(openPolicy === index ? null : index);
  };

  const pricingTiers = [
    {
      name: 'Standard',
      price: '£75',
      includes: [
        'Workshop access',
        'Basic materials kit',
        'Digital certificate',
        'Tea & refreshments'
      ]
    },
    {
      name: 'Pro Kit',
      price: '£125',
      includes: [
        'Workshop access',
        'Premium materials kit',
        'Digital certificate',
        'Tea & refreshments',
        'Take-home practice set',
        'Exclusive workbook'
      ],
      highlighted: true
    },
    {
      name: '1:1 Add-on',
      price: '£45',
      includes: [
        '30-min private session',
        'Personalized feedback',
        'Custom technique review'
      ]
    }
  ];

  const policies = [
    {
      title: 'Cancellation',
      content: 'Full refund available up to 7 days before the workshop. Cancellations within 7 days will receive a 50% refund. No refunds within 48 hours of the workshop start time.'
    },
    {
      title: 'Reschedule',
      content: 'You may reschedule to another available workshop date at no charge up to 72 hours before your scheduled session. Rescheduling within 72 hours is subject to availability and may incur a £15 fee.'
    },
    {
      title: 'Seat transfer',
      content: 'Seats are transferable to another person. Please notify us at least 24 hours before the workshop with the new attendee\'s name and contact information.'
    },
    {
      title: 'Minimum attendees',
      content: 'Workshops require a minimum of 4 attendees to proceed. If minimum is not met, we will notify you 48 hours in advance and offer a full refund or transfer to another date.'
    }
  ];

  const whatToBring = [
    'Valid ID for check-in',
    'Comfortable clothing',
    'Note-taking materials (optional)'
  ];

  const whatsProvided = [
    'All workshop materials',
    'Practice tools & equipment',
    'Tea, coffee & snacks',
    'Workstation setup'
  ];

  return (
    <section className="px-5 py-8">
      {/* Location & Logistics Accordion */}
      <div className="mb-4">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('location')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-gray-900">Location & Logistics</h3>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                openSection === 'location' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSection === 'location' && (
            <div className="px-4 pb-4 pt-0">
              {/* Address */}
              <div className="mb-4">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-900 text-sm">Pearl Wishes Studio</p>
                    <p className="text-gray-600 text-sm">
                      45 Kensington High Street<br />
                      London W8 5ED
                    </p>
                  </div>
                </div>
                <button className="w-full h-10 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors rounded-md text-sm">
                  Open in Maps
                </button>
              </div>

              {/* What to Bring */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="text-gray-900 text-sm mb-2">What to bring</h4>
                <ul className="space-y-2">
                  {whatToBring.map((item, index) => (
                    <li key={index} className="text-gray-600 text-sm flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What's Provided */}
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h4 className="text-gray-900 text-sm mb-2">What's provided</h4>
                <ul className="space-y-2">
                  {whatsProvided.map((item, index) => (
                    <li key={index} className="text-gray-600 text-sm flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Arrival Note */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <p className="text-gray-700 text-sm">
                  <span className="text-gray-900">Please arrive 10 minutes early</span> for check-in and workstation setup.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Accordion */}
      <div className="mb-4">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('pricing')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-gray-900">Pricing & What's Included</h3>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                openSection === 'pricing' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSection === 'pricing' && (
            <div className="px-4 pb-4 pt-0">
              <div className="space-y-3">
                {pricingTiers.map((tier, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      tier.highlighted
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200'
                    }`}
                  >
                    {/* Tier Header */}
                    <div className="flex items-baseline justify-between mb-3">
                      <h4 className="text-gray-900">{tier.name}</h4>
                      <div className="text-gray-900">{tier.price}</div>
                    </div>

                    {/* Includes */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-2">Includes:</p>
                      <ul className="space-y-2">
                        {tier.includes.map((item, idx) => (
                          <li key={idx} className="text-gray-700 text-sm flex items-start gap-2">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Select Button */}
                    <button
                      className={`w-full h-10 rounded-md transition-colors text-sm ${
                        tier.highlighted
                          ? 'bg-gradient-to-r from-[#FFD4C3] to-[#E8D5C4] text-gray-900 hover:opacity-90'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Select {tier.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Policies Accordion */}
      <div>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('policies')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-gray-900">Policies</h3>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                openSection === 'policies' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openSection === 'policies' && (
            <div className="px-4 pb-4 pt-0">
              <div className="space-y-2">
                {policies.map((policy, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Policy Header */}
                    <button
                      onClick={() => togglePolicy(index)}
                      className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-900 text-sm">{policy.title}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                          openPolicy === index ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Policy Content */}
                    {openPolicy === index && (
                      <div className="px-3 pb-3 pt-0">
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {policy.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
