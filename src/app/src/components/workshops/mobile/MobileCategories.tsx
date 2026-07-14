export function MobileCategories() {
  const categories = [
    {
      name: 'Gel Techniques',
      count: 12,
      icon: '💅'
    },
    {
      name: 'Nail Art',
      count: 18,
      icon: '🎨'
    },
    {
      name: 'Extensions',
      count: 8,
      icon: '✨'
    },
    {
      name: 'Business',
      count: 6,
      icon: '💼'
    },
    {
      name: 'Health & Care',
      count: 10,
      icon: '🌿'
    },
    {
      name: 'Advanced',
      count: 14,
      icon: '🏆'
    }
  ];

  return (
    <section className="px-5 py-8">
      {/* Section Header */}
      <h2 className="text-gray-900 mb-4">Browse by Category</h2>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((category, index) => (
          <button
            key={index}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-900 transition-colors text-left"
          >
            <div className="text-2xl mb-2">{category.icon}</div>
            <h3 className="text-gray-900 text-sm mb-1">{category.name}</h3>
            <p className="text-xs text-gray-600">{category.count} workshops</p>
          </button>
        ))}
      </div>
    </section>
  );
}
