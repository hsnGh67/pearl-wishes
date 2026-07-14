export function MobileWorkshopHero() {
  return (
    <section className="px-5 py-12">
      {/* Hero Image */}
      <div className="h-48 bg-gray-300 rounded-lg mb-6"></div>
      
      {/* Heading */}
      <h1 className="text-gray-900 mb-4">
        Master Your Craft
      </h1>
      
      {/* Description */}
      <p className="text-gray-600 mb-8">
        Join expert-led workshops and elevate your nail artistry skills. From beginner fundamentals to advanced techniques.
      </p>
      
      {/* Stacked CTAs */}
      <div className="space-y-3">
        <a
          href="#workshops"
          className="block w-full h-12 bg-gradient-to-r from-[#FFD4C3] to-[#E8D5C4] text-gray-900 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          Browse Workshops
        </a>
        <a
          href="#calendar"
          className="block w-full h-12 border border-gray-300 text-gray-700 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          View Calendar
        </a>
      </div>
    </section>
  );
}
