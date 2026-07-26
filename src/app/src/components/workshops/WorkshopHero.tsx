export function WorkshopHero() {
  return (
    <section className="relative pt-32 pb-24 flex items-center justify-center min-h-[70vh]">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url(/nail-hygiene-care%20(1).jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 text-center px-5 lg:px-20 max-w-4xl mx-auto">
        <h1 className="mb-6" style={{ color: "#3D3935" }}>
          Nail Training workshops
        </h1>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
          Professional hands-on nail training for beginners and
          experienced nail technicians. Our workshops are held
          monthly and designed to build confidence, precision,
          and real-world skills.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="h-12 px-8 py-3 border-2 transition-all"
            style={{
              backgroundColor: "#3D3935",
              borderColor: "#3D3935",
              color: "#E9CFCA",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1F1F1F";
              e.currentTarget.style.borderColor = "#1F1F1F";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3D3935";
              e.currentTarget.style.borderColor = "#3D3935";
            }}
            onClick={() =>
              window.scrollTo({
                top: document.getElementById("workshop-info")
                  ?.offsetTop,
                behavior: "smooth",
              })
            }
          >
            View Courses
          </button>
          <button
            className="h-12 px-8 py-3 border-2 transition-all"
            style={{
              borderColor: "#3D3935",
              color: "#3D3935",
              backgroundColor: "#E9CFCA",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#3D3935";
              e.currentTarget.style.color = "#E9CFCA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#E9CFCA";
              e.currentTarget.style.color = "#3D3935";
            }}
          >
            Contact Us
          </button>
        </div>
      </div>
    </section>
  );
}