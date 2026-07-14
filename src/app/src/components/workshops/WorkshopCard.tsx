import { Calendar, Clock, Users, MapPin, ChevronDown } from 'lucide-react';
import { Tag } from './Tag';
import { useState } from 'react';

interface Workshop {
  id: number;
  title: string;
  instructor: string;
  date: string;
  time: string;
  duration: string;
  level: string;
  topic: string;
  price: number;
  spots: number;
  soldOut: boolean;
  description?: string;
}

interface WorkshopCardProps {
  workshop: Workshop;
}

export function WorkshopCard({ workshop }: WorkshopCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Default description if none provided
  const description = workshop.description ||
    "Join us for an immersive hands-on workshop designed to elevate your nail artistry skills. You'll learn professional techniques, industry best practices, and gain confidence working with the latest tools and products in a supportive, creative environment.";

  return (
    <div
      className={`border transition-all duration-300 hover:shadow-xl group ${
        workshop.soldOut ? 'opacity-80' : ''
      }`}
      style={{
        backgroundColor: '#FEFCFA',
        borderColor: '#DCD4CD'
      }}
    >
      {/* Premium Image with Gradient Overlay */}
      <div className="w-full h-64 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent"></div>

        {workshop.soldOut && (
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center">
            <span
              className="px-6 py-3 text-sm tracking-wider border-2"
              style={{
                backgroundColor: '#FEFCFA',
                color: '#3D3935',
                borderColor: '#3D3935'
              }}
            >
              SOLD OUT
            </span>
          </div>
        )}

        {/* Level Badge */}
        {!workshop.soldOut && (
          <div className="absolute top-4 left-4">
            <Tag label={workshop.level} variant="level" />
          </div>
        )}
      </div>

      {/* Content - Enhanced Spacing */}
      <div className="p-8">
        {/* Topic Tag */}
        <div className="mb-4">
          <Tag label={workshop.topic} variant="topic" />
        </div>

        {/* Title - Enhanced Typography */}
        <h3 className="text-gray-900 mb-3 leading-tight group-hover:text-gray-700 transition-colors">
          {workshop.title}
        </h3>

        {/* Instructor - Editorial Style */}
        <p className="text-gray-600 mb-6 tracking-wide" style={{ fontSize: '0.9375rem' }}>
          Led by <span className="text-gray-900">{workshop.instructor}</span>
        </p>

        {/* Description - Expandable Content */}
        <div className="mb-8">
          <div className="relative">
            <p
              className={`text-gray-700 leading-relaxed transition-all duration-500 ${
                isExpanded ? 'line-clamp-none' : 'line-clamp-3'
              }`}
              style={{ fontSize: '0.9375rem' }}
            >
              {description}
            </p>

            {/* Fade gradient for collapsed state */}
            {!isExpanded && (
              <div
                className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
                style={{
                  background: 'linear-gradient(to bottom, transparent, #FEFCFA)'
                }}
              ></div>
            )}
          </div>

          {/* Show More/Less Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-3 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Details Grid - Enhanced Layout */}
        <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b" style={{ borderColor: '#DCD4CD' }}>
          <div className="flex items-start gap-3">
            <Calendar size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Date</p>
              <p className="text-sm text-gray-900">{workshop.date}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Time</p>
              <p className="text-sm text-gray-900">{workshop.time}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Availability</p>
              <p className="text-sm text-gray-900">
                {workshop.soldOut
                  ? 'Fully booked'
                  : `${workshop.spots} spots left`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Location</p>
              <p className="text-sm text-gray-900">London Studio</p>
            </div>
          </div>
        </div>

        {/* Price and CTA - Premium Layout */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">From</p>
            <span className="text-3xl text-gray-900" style={{ letterSpacing: '-0.02em' }}>
              £{workshop.price}
            </span>
          </div>

          <button
            disabled={workshop.soldOut}
            className={`h-12 px-8 transition-all duration-300 ${
              workshop.soldOut
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-300'
                : 'text-white border-2 hover:shadow-lg'
            }`}
            style={!workshop.soldOut ? {
              backgroundColor: '#3D3935',
              borderColor: '#3D3935'
            } : {}}
            onMouseEnter={(e) => {
              if (!workshop.soldOut) {
                e.currentTarget.style.backgroundColor = '#1F1F1F';
                e.currentTarget.style.borderColor = '#1F1F1F';
              }
            }}
            onMouseLeave={(e) => {
              if (!workshop.soldOut) {
                e.currentTarget.style.backgroundColor = '#3D3935';
                e.currentTarget.style.borderColor = '#3D3935';
              }
            }}
          >
            {workshop.soldOut ? 'Sold Out' : 'Reserve Your Spot'}
          </button>
        </div>
      </div>
    </div>
  );
}