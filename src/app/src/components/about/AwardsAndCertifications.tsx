import { Star } from "lucide-react";
import { useAwards } from "../../hooks/useAwards";
import { AwardCard } from "../../schema/awards-certifications.schema";

function AwardBadge({ item }: { item: AwardCard }) {
  if (item.imageUrl) {
    return (
      <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
      style={{ backgroundColor: "#E9CFCA" }}
    >
      <Star className="w-6 h-6" style={{ color: "#3D3935" }} />
    </div>
  );
}

export function AwardsAndCertifications() {
  const { items } = useAwards();

  return (
    <section className="pt-32 pb-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-gray-900 mb-4">Awards & Certifications</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our commitment to excellence has been recognized by industry leaders and clients alike.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-8 border rounded-xl text-center"
                style={{ backgroundColor: "#FEFCFA", borderColor: "#DCD4CD" }}
              >
                <AwardBadge item={item} />
                <h3 className="font-semibold mb-1" style={{ color: "#3D3935" }}>
                  {item.name}
                </h3>
                <p className="text-gray-500 text-sm mb-2">{item.issuer}</p>
                <p className="text-sm font-medium" style={{ color: "#D0A096" }}>
                  {item.year}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 border-2 border-gray-200" style={{ backgroundColor: '#FEFCFA' }}>
            <p className="text-gray-600">
              Our technicians are fully insured and regularly undertake continuing professional development to stay current with the latest techniques and trends.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
