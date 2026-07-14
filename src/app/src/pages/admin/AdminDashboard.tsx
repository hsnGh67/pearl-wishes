import { Users, Calendar, CreditCard, TrendingUp, Database } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { useState } from 'react';
import { setupDatabase } from '../../scripts/setupDatabase';
import { SQLSchemaDisplay } from '../../components/admin/SQLSchemaDisplay';

export function AdminDashboard() {
  const [setupStatus, setSetupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [setupMessage, setSetupMessage] = useState('');
  const [showSQL, setShowSQL] = useState(false);

  const handleDatabaseSetup = async () => {
    setSetupStatus('loading');
    setSetupMessage('Setting up database...');

    try {
      const result = await setupDatabase();
      
      if (result.success) {
        setSetupStatus('success');
        setSetupMessage('✅ Database setup completed successfully!');
      } else {
        setSetupStatus('error');
        setSetupMessage('❌ Setup failed. Please check console for details.');
      }
    } catch (error) {
      setSetupStatus('error');
      setSetupMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Setup error:', error);
    }
  };

  const stats = [
    { label: 'Total Users', value: '1,234', icon: Users, change: '+12%' },
    { label: 'Appointments Today', value: '23', icon: Calendar, change: '+5%' },
    { label: 'Revenue This Month', value: '£12,450', icon: CreditCard, change: '+18%' },
    { label: 'Growth Rate', value: '24%', icon: TrendingUp, change: '+3%' },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to Pearl Wishes Studio Admin Panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6 border-2" style={{ borderColor: '#DCD4CD' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 flex items-center justify-center" style={{ backgroundColor: '#3D3935' }}>
                  <Icon className="w-6 h-6" style={{ color: '#FEFCFA' }} />
                </div>
                <span className="text-green-600 text-sm font-semibold">{stat.change}</span>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-semibold" style={{ color: '#3D3935' }}>{stat.value}</p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6 border-2" style={{ borderColor: '#DCD4CD' }}>
          <h3 className="mb-4" style={{ color: '#3D3935' }}>Recent Appointments</h3>
          <div className="space-y-3">
            {[
              { name: 'Sarah Johnson', service: 'Gel Manicure', time: '2:00 PM' },
              { name: 'Emma Wilson', service: 'Pedicure', time: '3:30 PM' },
              { name: 'Lucy Brown', service: 'Nail Art', time: '4:45 PM' },
            ].map((appointment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border" style={{ borderColor: '#DCD4CD' }}>
                <div>
                  <p className="font-semibold" style={{ color: '#3D3935' }}>{appointment.name}</p>
                  <p className="text-sm text-gray-600">{appointment.service}</p>
                </div>
                <span className="text-sm" style={{ color: '#3D3935' }}>{appointment.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-2" style={{ borderColor: '#DCD4CD' }}>
          <h3 className="mb-4" style={{ color: '#3D3935' }}>Recent Payments</h3>
          <div className="space-y-3">
            {[
              { name: 'Sarah Johnson', amount: '£45.00', status: 'Completed' },
              { name: 'Emma Wilson', amount: '£38.00', status: 'Completed' },
              { name: 'Lucy Brown', amount: '£52.00', status: 'Pending' },
            ].map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-3 border" style={{ borderColor: '#DCD4CD' }}>
                <div>
                  <p className="font-semibold" style={{ color: '#3D3935' }}>{payment.name}</p>
                  <p className="text-sm text-gray-600">{payment.status}</p>
                </div>
                <span className="font-semibold" style={{ color: '#3D3935' }}>{payment.amount}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Database Setup Section */}
      <Card className="p-6 border-2" style={{ borderColor: '#DCD4CD' }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-lg" style={{ backgroundColor: '#EADDD5' }}>
            <Database className="w-6 h-6" style={{ color: '#3D3935' }} />
          </div>
          <div className="flex-1">
            <h3 className="mb-2" style={{ color: '#3D3935' }}>Database Setup</h3>
            
            {setupStatus === 'idle' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm mb-2" style={{ color: '#3D3935' }}>
                    <strong>Step 1:</strong> Copy the SQL schema and run it in your Supabase SQL Editor
                  </p>
                  <div className="flex gap-2 mt-3">
                    <a
                      href="https://supabase.com/dashboard/project/xqanbblitsqasnkbbana/sql/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 text-sm rounded-lg transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #FCEAE0 0%, #EACAB8 100%)',
                        color: '#3D3935'
                      }}
                    >
                      🔗 Open Supabase SQL Editor
                    </a>
                    <button
                      onClick={() => {
                        const sqlSchema = `-- =============================================`;
                        setShowSQL(true);
                      }}
                      className="px-4 py-2 text-sm rounded-lg transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #FCEAE0 0%, #EACAB8 100%)',
                        color: '#3D3935'
                      }}
                    >
                      📋 Copy SQL Schema
                    </button>
                  </div>
                  <p className="text-xs mt-3 text-gray-600">
                    After copying, paste the SQL in Supabase and click the "RUN" button
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm mb-3" style={{ color: '#3D3935' }}>
                    <strong>Step 2:</strong> After the SQL runs successfully in Supabase, click this button to add services and data
                  </p>
                  <button
                    onClick={handleDatabaseSetup}
                    className="py-3 px-6 rounded-lg transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #FCEAE0 0%, #EACAB8 100%)',
                      color: '#3D3935'
                    }}
                  >
                    🌱 Add Services & Data to Database
                  </button>
                </div>
              </div>
            )}

            {setupStatus === 'loading' && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm" style={{ color: '#3D3935' }}>
                  ⏳ Seeding database with services, admin user, and initial content...
                </p>
              </div>
            )}

            {setupStatus === 'success' && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm mb-2" style={{ color: '#3D3935' }}>
                  ✅ Database setup complete! Your database now includes:
                </p>
                <ul className="text-sm space-y-1 ml-4" style={{ color: '#3D3935' }}>
                  <li>• 10 nail care services</li>
                  <li>• Admin user (admin@pearlwishes.com)</li>
                  <li>• 3 sample testimonials</li>
                  <li>• Content sections for your website</li>
                </ul>
              </div>
            )}

            {setupStatus === 'error' && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm" style={{ color: '#3D3935' }}>
                    {setupMessage}
                  </p>
                  <p className="text-sm mt-2" style={{ color: '#3D3935' }}>
                    💡 Make sure you've run the SQL schema in Supabase first (Step 1 above)
                  </p>
                </div>
                <button
                  onClick={handleDatabaseSetup}
                  className="py-3 px-6 rounded-lg transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #FCEAE0 0%, #EACAB8 100%)',
                    color: '#3D3935'
                  }}
                >
                  🔄 Retry Seeding
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* SQL Schema Textarea */}
      {showSQL && (
        <Card className="p-6 border-2" style={{ borderColor: '#DCD4CD' }}>
          <h3 className="mb-4" style={{ color: '#3D3935' }}>SQL Schema</h3>
          <SQLSchemaDisplay />
        </Card>
      )}
    </div>
  );
}