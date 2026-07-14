import { Menu, X } from 'lucide-react';

interface MobileWorkshopsNavProps {
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

export function MobileWorkshopsNav({ isMenuOpen, onMenuToggle }: MobileWorkshopsNavProps) {
  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Treatments', href: '/workshops-mobile' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' }
  ];

  return (
    <>
      {/* Top Navigation */}
      <nav className="sticky top-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between h-16 px-5">
          {/* Logo */}
          <a href="/" className="text-gray-900">
            Pearl Wishes Studio
          </a>
          
          {/* Hamburger Button */}
          <button
            onClick={onMenuToggle}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 rounded-md transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </div>
      </nav>

      {/* Full Screen Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 pt-16">
          <div className="px-5 py-8">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block py-4 text-gray-900 hover:bg-gray-50 px-4 -mx-4 rounded-md transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}