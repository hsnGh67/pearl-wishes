import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function ContactAndHours() {
  return (
    <section className="pt-32 pb-20" style={{ backgroundColor: '#FEFCFA' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-gray-900">Contact & Business Hours</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8 p-8 md:p-12 bg-[#efdfd8]">
            <h3 className="text-gray-900 mb-6">Contact Information</h3>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3D3935' }}>
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-900 mb-1">Location</p>
                <p className="text-gray-600">Serving all of London</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3D3935' }}>
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-900 mb-1">Phone</p>
                <p className="text-gray-600">+44 7123 456789</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3D3935' }}>
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-gray-900 mb-1">Email</p>
                <p className="text-gray-600">hello@pearlwishesstudio.co.uk</p>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-8 p-8 md:p-12 bg-[#efdfd8]">
            <h3 className="text-gray-900 mb-6">Business Hours</h3>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3D3935' }}>
                <Clock className="h-6 w-6 text-white bg-[#c8b7b700]" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex justify-between">
                  <span className="text-gray-900">Monday - Saturday</span>
                  <span className="text-gray-600">10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-900">Sunday</span>
                  <span className="text-gray-600">11:00 AM - 5:00 PM</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-2 border-gray-200 bg-[#4e4845]">
              <p className="text-[#ecf0f8] text-justify"> We offer flexible scheduling including early morning and late evening appointments by request. Contact us to discuss your preferred time.<span className="text-gray-900">Note:</span></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}