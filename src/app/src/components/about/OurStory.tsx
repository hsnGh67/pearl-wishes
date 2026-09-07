import { useEffect, useState } from "react";
import { getOurStorySection } from "../../lib/db/content";
import { ContentSection } from "../../schema/content.schema";

const FALLBACK_PARAGRAPHS = [
  "At Pearl Wishes Studio, we approach nail artistry with intention, care, and respect for individuality. Every service is thoughtfully designed to feel calm, personal, and refined — never rushed, never generic.",
  "Our studio was created for clients who value precision, healthy nails, and timeless beauty. From private appointments to bridal and VIP services, we focus on clean structure, elegant finishes, and an experience that feels considered from start to finish.",
  "We work exclusively with trusted, high-quality products and refined techniques, prioritising nail health and long-lasting results. Based in London, Pearl Wishes Studio also offers select mobile appointments, delivering the same level of care wherever you are.",
];

export function OurStory() {
  const [section, setSection] = useState<ContentSection | null>(null);

  useEffect(() => {
    getOurStorySection()
      .then((d) => setSection(d))
      .catch(() => {});
  }, []);

  const heading = section?.title || "Our Story";
  const paragraphs = section?.description
    ? section.description.split(/\n\n+/).filter(Boolean)
    : FALLBACK_PARAGRAPHS;
  const imageUrl = section?.content_url || null;

  return (
    <section className="px-[32px] py-[40px]" style={{ backgroundColor: "#FEFCFA" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-gray-800 mb-6">{heading}</h3>
            <div className="space-y-4 text-gray-600 text-justify">
              {paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
          <div className="aspect-square overflow-hidden rounded">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Our story"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="bg-gray-300 w-full h-full" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
