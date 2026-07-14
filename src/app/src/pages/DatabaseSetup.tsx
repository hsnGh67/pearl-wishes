import { useState } from 'react';
import { setupDatabase } from '../scripts/setupDatabase';

export default function DatabaseSetup() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSetup = async () => {
    setStatus('loading');
    setMessage('Setting up database...');

    try {
      const result = await setupDatabase();
      
      if (result.success) {
        setStatus('success');
        setMessage('✅ Database setup completed successfully! All tables created and seed data inserted.');
      } else {
        setStatus('error');
        setMessage('❌ Setup failed. Please check console for details.');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Setup error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: '#FEFCFA' }}>
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8" style={{ borderColor: '#EADDD5', borderWidth: '1px' }}>
          <div className="text-center mb-8">
            <h1 className="text-3xl mb-2" style={{ color: '#3D3935' }}>
              Pearl Wishes Studio
            </h1>
            <p className="text-lg" style={{ color: '#3D3935', opacity: 0.7 }}>
              Database Setup
            </p>
          </div>

          <div className="mb-8">
            <div className="bg-gray-50 rounded-lg p-6 mb-6" style={{ backgroundColor: '#FAF7F5' }}>
              <h2 className="text-xl mb-4" style={{ color: '#3D3935' }}>
                What will be set up:
              </h2>
              <ul className="space-y-2" style={{ color: '#3D3935' }}>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Database tables (users, services, workshops, orders, etc.)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Indexes for optimized performance</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Automatic timestamp triggers</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Sample services (10 nail treatments)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Admin user account</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Sample testimonials</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Content sections for CMS</span>
                </li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm" style={{ color: '#3D3935' }}>
                <strong>Note:</strong> This setup is safe to run multiple times. It will skip seeding if data already exists.
              </p>
            </div>
          </div>

          <button
            onClick={handleSetup}
            disabled={status === 'loading' || status === 'success'}
            className="w-full py-4 px-6 rounded-lg transition-all duration-200 text-white"
            style={{
              background: status === 'success' 
                ? '#4ade80' 
                : status === 'loading'
                ? '#D0A096'
                : 'linear-gradient(135deg, #FCEAE0 0%, #EACAB8 100%)',
              color: '#3D3935',
              cursor: status === 'loading' || status === 'success' ? 'not-allowed' : 'pointer',
              opacity: status === 'loading' || status === 'success' ? 0.7 : 1
            }}
          >
            {status === 'loading' && '⏳ Setting up database...'}
            {status === 'success' && '✅ Setup Complete!'}
            {status === 'error' && '🔄 Retry Setup'}
            {status === 'idle' && '🚀 Start Database Setup'}
          </button>

          {message && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                status === 'success' ? 'bg-green-50 border border-green-200' :
                status === 'error' ? 'bg-red-50 border border-red-200' :
                'bg-blue-50 border border-blue-200'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap" style={{ color: '#3D3935' }}>
                {message}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-6 text-center">
              <p className="text-sm mb-4" style={{ color: '#3D3935', opacity: 0.7 }}>
                Your database is ready! You can now:
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href="/admin"
                  className="py-2 px-4 rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#EADDD5',
                    color: '#3D3935'
                  }}
                >
                  Go to Admin Panel
                </a>
                <a
                  href="/"
                  className="py-2 px-4 rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#FAF7F5',
                    color: '#3D3935'
                  }}
                >
                  Return to Homepage
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
