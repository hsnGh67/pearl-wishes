import { Plus, Edit, Trash2, Clock, Award, UserCheck, Upload, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

export function AdminTreatments() {
  const [expandedSection, setExpandedSection] = useState<string | null>('homepage');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-800 mb-2">Website Content Management</h1>
        <p className="text-gray-600">Manage all sections of your website from here</p>
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-4">
        
        {/* Homepage Section */}
        <Card className="border-2 overflow-hidden" style={{ borderColor: '#DCD4CD' }}>
          <button
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('homepage')}
          >
            <div className="flex items-center gap-3">
              <h3 style={{ color: '#3D3935' }}>Homepage</h3>
              <span className="text-sm px-3 py-1" style={{ backgroundColor: '#FAF7F5', color: '#3D3935' }}>
                Main landing page
              </span>
            </div>
            {expandedSection === 'homepage' ? (
              <ChevronUp className="w-5 h-5" style={{ color: '#3D3935' }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: '#3D3935' }} />
            )}
          </button>
          
          {expandedSection === 'homepage' && (
            <div className="border-t-2 p-6" style={{ borderColor: '#DCD4CD' }}>
              <div className="space-y-6">
                
                {/* Hero Section */}
                <div className="p-4 border-2 rounded-md" style={{ borderColor: '#DCD4CD', backgroundColor: '#FEFCFA' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium" style={{ color: '#3D3935' }}>Hero Section</h4>
                    <Button
                      className="border-2 p-2"
                      style={{
                        borderColor: '#DCD4CD',
                        backgroundColor: 'transparent',
                        color: '#3D3935'
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="font-medium" style={{ color: '#3D3935' }}>Main Headline</label>
                      <p className="text-gray-600 mt-1">Luxury nail care at your doorstep</p>
                    </div>
                    <div>
                      <label className="font-medium" style={{ color: '#3D3935' }}>Subheadline</label>
                      <p className="text-gray-600 mt-1">Premium mobile nail treatments in London</p>
                    </div>
                    <div>
                      <label className="font-medium" style={{ color: '#3D3935' }}>CTA Button Text</label>
                      <p className="text-gray-600 mt-1">Book Your Appointment</p>
                    </div>
                  </div>
                </div>

                {/* Services Overview */}
                <div className="p-4 border-2 rounded-md" style={{ borderColor: '#DCD4CD', backgroundColor: '#FEFCFA' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium" style={{ color: '#3D3935' }}>Services Overview</h4>
                    <Button
                      className="border-2 p-2"
                      style={{
                        borderColor: '#DCD4CD',
                        backgroundColor: 'transparent',
                        color: '#3D3935'
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="font-medium" style={{ color: '#3D3935' }}>Section Title</label>
                      <p className="text-gray-600 mt-1">Our Services</p>
                    </div>
                    <div>
                      <label className="font-medium" style={{ color: '#3D3935' }}>Section Description</label>
                      <p className="text-gray-600 mt-1">Professional nail treatments brought to your home</p>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="p-4 border-2 rounded-md" style={{ borderColor: '#DCD4CD', backgroundColor: '#FEFCFA' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium" style={{ color: '#3D3935' }}>About Section</h4>
                    <Button
                      className="border-2 p-2"
                      style={{
                        borderColor: '#DCD4CD',
                        backgroundColor: 'transparent',
                        color: '#3D3935'
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="font-medium" style={{ color: '#3D3935' }}>Section Title</label>
                      <p className="text-gray-600 mt-1">About Pearl Wishes Studio</p>
                    </div>
                    <div>
                      <label className="font-medium" style={{ color: '#3D3935' }}>Description</label>
                      <p className="text-gray-600 mt-1">We bring luxury nail care directly to you...</p>
                    </div>
                  </div>
                </div>

                {/* Testimonials */}
                <div className="p-4 border-2 rounded-md" style={{ borderColor: '#DCD4CD', backgroundColor: '#FEFCFA' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium" style={{ color: '#3D3935' }}>Testimonials Section</h4>
                    <Button
                      className="border-2 p-2"
                      style={{
                        borderColor: '#DCD4CD',
                        backgroundColor: 'transparent',
                        color: '#3D3935'
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="font-medium" style={{ color: '#3D3935' }}>Section Title</label>
                      <p className="text-gray-600 mt-1">What Our Clients Say</p>
                    </div>
                    <div>
                      <label className="font-medium" style={{ color: '#3D3935' }}>Number of Testimonials</label>
                      <p className="text-gray-600 mt-1">3 active testimonials</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </Card>

        {/* Services Page Section */}
        <Card className="border-2 overflow-hidden" style={{ borderColor: '#DCD4CD' }}>
          <button
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('services')}
          >
            <div className="flex items-center gap-3">
              <h3 style={{ color: '#3D3935' }}>Services Page</h3>
              <span className="text-sm px-3 py-1" style={{ backgroundColor: '#FAF7F5', color: '#3D3935' }}>
                Treatment listings
              </span>
            </div>
            {expandedSection === 'services' ? (
              <ChevronUp className="w-5 h-5" style={{ color: '#3D3935' }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: '#3D3935' }} />
            )}
          </button>
          
          {expandedSection === 'services' && (
            <div className="border-t-2 p-6" style={{ borderColor: '#DCD4CD' }}>
              <p className="text-gray-600 text-center py-8">Services page content management coming soon...</p>
            </div>
          )}
        </Card>

        {/* About Page Section */}
        <Card className="border-2 overflow-hidden" style={{ borderColor: '#DCD4CD' }}>
          <button
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('about')}
          >
            <div className="flex items-center gap-3">
              <h3 style={{ color: '#3D3935' }}>About Page</h3>
              <span className="text-sm px-3 py-1" style={{ backgroundColor: '#FAF7F5', color: '#3D3935' }}>
                Company information
              </span>
            </div>
            {expandedSection === 'about' ? (
              <ChevronUp className="w-5 h-5" style={{ color: '#3D3935' }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: '#3D3935' }} />
            )}
          </button>
          
          {expandedSection === 'about' && (
            <div className="border-t-2 p-6" style={{ borderColor: '#DCD4CD' }}>
              <p className="text-gray-600 text-center py-8">About page content management coming soon...</p>
            </div>
          )}
        </Card>

        {/* Workshops Page Section */}
        <Card className="border-2 overflow-hidden" style={{ borderColor: '#DCD4CD' }}>
          <button
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('workshops')}
          >
            <div className="flex items-center gap-3">
              <h3 style={{ color: '#3D3935' }}>Workshops Page</h3>
              <span className="text-sm px-3 py-1" style={{ backgroundColor: '#FAF7F5', color: '#3D3935' }}>
                Training programs
              </span>
            </div>
            {expandedSection === 'workshops' ? (
              <ChevronUp className="w-5 h-5" style={{ color: '#3D3935' }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: '#3D3935' }} />
            )}
          </button>
          
          {expandedSection === 'workshops' && (
            <div className="border-t-2 p-6" style={{ borderColor: '#DCD4CD' }}>
              <p className="text-gray-600 text-center py-8">Workshops page content management coming soon...</p>
            </div>
          )}
        </Card>

        {/* Contact Page Section */}
        <Card className="border-2 overflow-hidden" style={{ borderColor: '#DCD4CD' }}>
          <button
            className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('contact')}
          >
            <div className="flex items-center gap-3">
              <h3 style={{ color: '#3D3935' }}>Contact Page</h3>
              <span className="text-sm px-3 py-1" style={{ backgroundColor: '#FAF7F5', color: '#3D3935' }}>
                Contact information
              </span>
            </div>
            {expandedSection === 'contact' ? (
              <ChevronUp className="w-5 h-5" style={{ color: '#3D3935' }} />
            ) : (
              <ChevronDown className="w-5 h-5" style={{ color: '#3D3935' }} />
            )}
          </button>
          
          {expandedSection === 'contact' && (
            <div className="border-t-2 p-6" style={{ borderColor: '#DCD4CD' }}>
              <p className="text-gray-600 text-center py-8">Contact page content management coming soon...</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}