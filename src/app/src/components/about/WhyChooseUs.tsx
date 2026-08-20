import { useWhyChooseUs } from "../../hooks/useWhyChooseUs";
import { WhyCard } from "../../schema/why-choose-us.schema";

function WhyChooseUsMedia({ item }: { item: WhyCard }) {
  if (item.imageUrl) {
    return (
      <div className="aspect-square md:aspect-auto min-h-[300px] overflow-hidden bg-gray-300">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="bg-gray-300 aspect-square md:aspect-auto min-h-[300px] flex items-center justify-center">
      {item.icon ? (
        <span className="text-6xl" aria-hidden="true">
          {item.icon}
        </span>
      ) : null}
    </div>
  );
}

export function WhyChooseUs() {
  const { items } = useWhyChooseUs();

  return (
    <section className="pt-32 pb-20 bg-[#fef5f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-gray-900 mb-4">Why Choose Us</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We're committed to providing exceptional service that goes beyond expectations.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="border-2 overflow-hidden"
              style={{ backgroundColor: "#FEFCFA", borderColor: "#3D3935" }}
            >
              <div className="grid md:grid-cols-2">
                {index % 2 === 1 ? (
                  <>
                    <WhyChooseUsMedia item={item} />
                    <div className="p-12 flex flex-col justify-center bg-[#efe5e5]">
                      <h3 className="text-gray-900 mb-4">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-12 flex flex-col justify-center bg-[#efe5e5]">
                      <h3 className="text-gray-900 mb-4">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                    <WhyChooseUsMedia item={item} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
