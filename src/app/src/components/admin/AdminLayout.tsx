import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Users, Calendar, CreditCard, FileText, LayoutDashboard, LogOut, Scissors, Sparkles, Tag } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/calendar', label: 'Calendar', icon: Calendar },
    { path: '/admin/payments', label: 'Payments & Transactions', icon: CreditCard },
    { path: '/admin/services', label: 'Services', icon: Scissors },
    { path: '/admin/workshops', label: 'Workshops', icon: Sparkles },
    { path: '/admin/promo-codes', label: 'Promo Codes', icon: Tag },
    { path: '/admin/content', label: 'Content Management', icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: '#FEFCFA' }}>
      {/* Sidebar */}
      <aside className="w-64 border-r-2 flex flex-col shrink-0 h-screen" style={{ 
        borderColor: '#3D3935',
        backgroundColor: '#FAF7F5'
      }}>
        {/* Logo */}
        <div className="p-6 border-b-2" style={{ borderColor: '#3D3935' }}>
          <Link to="/" className="flex items-center gap-3" style={{ color: '#3D3935' }}>
            <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#3D3935' }}>
              <span className="text-white font-semibold text-sm">PW</span>
            </div>
            <div>
              <div className="font-semibold" style={{ color: '#3D3935' }}>Pearl Wishes</div>
              <div className="text-xs" style={{ color: '#3D3935' }}>Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 border-2 transition-all"
                style={{
                  borderColor: active ? '#3D3935' : '#DCD4CD',
                  backgroundColor: active ? '#3D3935' : 'transparent',
                  color: active ? '#FEFCFA' : '#3D3935',
                }}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t-2 space-y-2" style={{ borderColor: '#3D3935' }}>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate('/');
            }}
            className="flex w-full items-center gap-3 px-4 py-3 border-2 hover:border-gray-400 transition-all"
            style={{
              borderColor: '#DCD4CD',
              color: '#3D3935',
            }}
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 border-2 hover:border-gray-400 transition-all"
            style={{
              borderColor: '#DCD4CD',
              color: '#3D3935',
            }}
          >
            <span>Back to Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}