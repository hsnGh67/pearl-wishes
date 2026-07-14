import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Mock submission - in production, this would send to your backend
      console.log('Newsletter signup:', email);
      setIsSubmitted(true);
      setEmail('');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
    }
  };

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="border-2 border-gray-900 p-8 md:p-12 lg:p-16" style={{ background: 'linear-gradient(105deg, #FCEAE0, #EACAB8)' }}>
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8" style={{ 
                stroke: 'url(#mailGradient)'
              }} />
              <svg width="0" height="0">
                <defs>
                  <linearGradient id="mailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{ stopColor: '#FCEAE0' }} />
                    <stop offset="100%" style={{ stopColor: '#EACAB8' }} />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            <h2 className="text-gray-800 mb-4">Stay Updated</h2>
            <p className="text-gray-700 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter for exclusive promotions, beauty tips, and early access to new services. 
              Get updates delivered straight to your inbox.
            </p>

            {isSubmitted ? (
              <div className="bg-white border-2 border-gray-200 p-6 max-w-md mx-auto">
                <p className="text-gray-800">
                  Thank you for subscribing! Check your email for confirmation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 h-12 px-4"
                  />
                  <Button 
                    type="submit"
                    className="inline-flex items-center gap-2 px-8 py-3 transition-colors border-2 h-12 whitespace-nowrap"
                    style={{ 
                      backgroundColor: '#3D3935',
                      background: '#3D3935',
                      borderColor: '#3D3935',
                      color: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1F1F1F';
                      e.currentTarget.style.background = '#1F1F1F';
                      e.currentTarget.style.borderColor = '#1F1F1F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3D3935';
                      e.currentTarget.style.background = '#3D3935';
                      e.currentTarget.style.borderColor = '#3D3935';
                    }}
                  >
                    <span style={{
                      background: 'linear-gradient(to right, #FCEAE0, #EACAB8)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent'
                    }}>Subscribe</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-4 text-center">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}