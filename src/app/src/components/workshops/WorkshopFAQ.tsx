import { useState } from 'react';
import { AccordionItem } from './AccordionItem';

export function WorkshopFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'What should I bring to the workshop?',
      answer: 'All materials and tools are provided. You only need to bring yourself and a willingness to learn! We recommend wearing comfortable clothing and bringing a notebook if you like to take notes.',
    },
    {
      question: 'What is your cancellation policy?',
      answer: 'We require 48 hours notice for cancellations to receive a full refund. Cancellations made less than 48 hours before the workshop will receive a 50% refund. No-shows are non-refundable.',
    },
    {
      question: 'Do I need prior experience?',
      answer: 'It depends on the workshop level. Beginner workshops require no prior experience, while Intermediate and Advanced workshops assume you have foundational knowledge. Check the workshop description for specific requirements.',
    },
    {
      question: 'Will I receive a certificate?',
      answer: 'This workshop is focused on hands-on learning and practical exploration rather than formal certification. Participants will gain experience, insights, and new skills during the sessions.',
    },
    {
      question: 'What is the class size?',
      answer: 'We keep our workshops small to ensure personalized attention, typically 8-12 participants per session. This allows our instructors to provide hands-on guidance to each student.',
    },
    {
      question: 'Can I purchase products used in the workshop?',
      answer: 'Yes! All products and tools used during the workshop are available for purchase at a discounted rate. Our instructors can recommend the best starter kits based on your interests.',
    },
  ];

  const policies = [
    {
      question: 'Age Requirements',
      answer: 'Participants must be 18+ years old. Valid ID may be required at check-in.',
    },
    {
      question: 'Health & Safety',
      answer: 'Please inform us of any allergies or sensitivities before the workshop. All tools are sanitized between uses following industry standards.',
    },
    {
      question: 'Photography Policy',
      answer: 'Photography for personal use is allowed. Professional photography or filming requires prior approval from our team.',
    },
    {
      question: 'Rescheduling',
      answer: 'You may reschedule to another available workshop date up to 7 days before your scheduled session, subject to availability.',
    },
  ];

  return (
    <section className="py-16 px-5 lg:px-20">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQs */}
          <div>
            <div className="mb-8">
              <p className="text-sm tracking-wider uppercase text-gray-500 mb-2">
                Common Questions
              </p>
              <h2 className="text-4xl mb-4" style={{ color: '#3D3935' }}>
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === index}
                  onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                />
              ))}
            </div>
          </div>

          {/* Policies */}
          <div>
            <div className="mb-8">
              <p className="text-sm tracking-wider uppercase text-gray-500 mb-2">
                Important Information
              </p>
              <h2 className="text-4xl mb-4" style={{ color: '#3D3935' }}>
                Workshop Policies
              </h2>
            </div>

            <div className="space-y-2">
              {policies.map((policy, index) => (
                <AccordionItem
                  key={index}
                  question={policy.question}
                  answer={policy.answer}
                  isOpen={openIndex === (index + faqs.length)}
                  onToggle={() => setOpenIndex(openIndex === (index + faqs.length) ? null : (index + faqs.length))}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
