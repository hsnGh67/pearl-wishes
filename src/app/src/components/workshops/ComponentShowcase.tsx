/**
 * WORKSHOPS PAGE COMPONENT LIBRARY
 * 
 * This file documents all reusable components created for the Workshops page
 * following the design specifications:
 * - Desktop: 1440px width, ~4200px height
 * - Mobile: 390px width, ~5200px height
 * - 8px spacing system
 * - Desktop grid: 12 columns, 80px margins, 24px gutter
 * - Mobile grid: 4 columns, 20px margins, 16px gutter
 * - Corner radius: 8-12px (currently using 0px for sharp edges)
 * - Grayscale minimal design
 */

import { Search, Mail, Calendar } from 'lucide-react';
import { WorkshopButton } from './ButtonVariants';
import { InputField } from './InputField';
import { FilterChip } from './FilterChip';
import { Tag } from './Tag';
import { AccordionItem } from './AccordionItem';
import { useState } from 'react';

export function ComponentShowcase() {
  const [inputValue, setInputValue] = useState('');
  const [inputWithIcon, setInputWithIcon] = useState('');
  const [inputWithError, setInputWithError] = useState('');
  const [accordionOpen, setAccordionOpen] = useState(false);

  return (
    <div className="p-8 space-y-16 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl mb-2">Workshops Component Library</h1>
        <p className="text-gray-600 mb-8">
          Reusable components for Pearl Wishes Studio Workshops page
        </p>

        {/* Buttons */}
        <section className="mb-16">
          <h2 className="text-2xl mb-6 pb-2 border-b border-gray-300">Buttons</h2>
          <p className="text-sm text-gray-600 mb-4">
            Height: 44px (h-11) | Variants: Primary, Secondary, Tertiary
          </p>
          <div className="flex flex-wrap gap-4">
            <WorkshopButton variant="primary">Primary Button</WorkshopButton>
            <WorkshopButton variant="secondary">Secondary Button</WorkshopButton>
            <WorkshopButton variant="tertiary">Tertiary Link</WorkshopButton>
            <WorkshopButton variant="primary" disabled>Disabled</WorkshopButton>
          </div>
        </section>

        {/* Input Fields */}
        <section className="mb-16">
          <h2 className="text-2xl mb-6 pb-2 border-b border-gray-300">Input Fields</h2>
          <p className="text-sm text-gray-600 mb-4">
            Height: 44px (h-11) | States: Default, With Icon, Error
          </p>
          <div className="space-y-4 max-w-md">
            <InputField
              label="Default Input"
              placeholder="Enter text..."
              value={inputValue}
              onChange={setInputValue}
            />
            <InputField
              label="Input with Icon"
              placeholder="Search..."
              value={inputWithIcon}
              onChange={setInputWithIcon}
              icon={<Search size={20} />}
            />
            <InputField
              label="Input with Error"
              placeholder="your@email.com"
              value={inputWithError}
              onChange={setInputWithError}
              icon={<Mail size={20} />}
              error="Please enter a valid email address"
            />
          </div>
        </section>

        {/* Filter Chips */}
        <section className="mb-16">
          <h2 className="text-2xl mb-6 pb-2 border-b border-gray-300">Filter Chips</h2>
          <p className="text-sm text-gray-600 mb-4">
            Height: 32px (h-8) | States: Default, Selected
          </p>
          <div className="flex flex-wrap gap-2">
            <FilterChip label="Beginner" selected={false} onClick={() => {}} />
            <FilterChip label="Intermediate" selected={true} onClick={() => {}} />
            <FilterChip label="Advanced" selected={false} onClick={() => {}} />
            <FilterChip label="All Levels" selected={false} onClick={() => {}} />
          </div>
        </section>

        {/* Tags/Pills */}
        <section className="mb-16">
          <h2 className="text-2xl mb-6 pb-2 border-b border-gray-300">Tags / Pills</h2>
          <p className="text-sm text-gray-600 mb-4">
            Variants: Level, Topic, Status
          </p>
          <div className="flex flex-wrap gap-2">
            <Tag label="Beginner" variant="level" />
            <Tag label="Intermediate" variant="level" />
            <Tag label="Gel Techniques" variant="topic" />
            <Tag label="Nail Art" variant="topic" />
            <Tag label="Sold Out" variant="status" />
          </div>
        </section>

        {/* Accordion */}
        <section className="mb-16">
          <h2 className="text-2xl mb-6 pb-2 border-b border-gray-300">Accordion Item</h2>
          <p className="text-sm text-gray-600 mb-4">
            States: Collapsed, Expanded | Used for FAQ & Policies
          </p>
          <div className="space-y-2 max-w-2xl">
            <AccordionItem
              question="What should I bring to the workshop?"
              answer="All materials and tools are provided. You only need to bring yourself and a willingness to learn!"
              isOpen={accordionOpen}
              onToggle={() => setAccordionOpen(!accordionOpen)}
            />
            <AccordionItem
              question="What is your cancellation policy?"
              answer="We require 48 hours notice for cancellations to receive a full refund."
              isOpen={false}
              onToggle={() => {}}
            />
          </div>
        </section>

        {/* Design Specifications */}
        <section className="mb-16">
          <h2 className="text-2xl mb-6 pb-2 border-b border-gray-300">Design Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 border border-gray-300 bg-white">
              <h3 className="mb-4">Desktop Specifications</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Frame Width: 1440px</li>
                <li>• Frame Height: ~4200px</li>
                <li>• Columns: 12</li>
                <li>• Margins: 80px (20 on mobile)</li>
                <li>• Gutter: 24px</li>
              </ul>
            </div>
            <div className="p-6 border border-gray-300 bg-white">
              <h3 className="mb-4">Mobile Specifications</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Frame Width: 390px</li>
                <li>• Frame Height: ~5200px</li>
                <li>• Columns: 4</li>
                <li>• Margins: 20px</li>
                <li>• Gutter: 16px</li>
              </ul>
            </div>
            <div className="p-6 border border-gray-300 bg-white md:col-span-2">
              <h3 className="mb-4">Global Specifications</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Spacing System: 8px increments</li>
                <li>• Corner Radius: 0px (sharp edges for minimal vibe)</li>
                <li>• Font: Montserrat</li>
                <li>• Color Palette: Grayscale only (wireframe style)</li>
                <li>• Button Height: 44px (h-11)</li>
                <li>• Input Height: 44px (h-11)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
