import { useEffect, useState } from "react";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { getlookbooks } from "../../lib/db/content";

interface LookbookImage {
  id?: string;
  image_url: string;
  title?: string | null;
  position?: number | null;
}

const lookbookLayout = [
  {
    wrapperClass: "col-span-2 row-span-2 bg-gray-200",
    imageClass: "min-h-[300px]",
  },
  { wrapperClass: "aspect-square bg-gray-200", imageClass: "" },
  { wrapperClass: "aspect-square bg-gray-200", imageClass: "" },
  { wrapperClass: "aspect-square bg-gray-200", imageClass: "" },
  { wrapperClass: "aspect-square bg-gray-200", imageClass: "" },
  {
    wrapperClass: "col-span-2 bg-gray-200",
    imageClass: "aspect-[2/1]",
  },
  { wrapperClass: "aspect-square bg-gray-200", imageClass: "" },
  { wrapperClass: "aspect-square bg-gray-200", imageClass: "" },
  { wrapperClass: "aspect-square bg-gray-200", imageClass: "" },
  { wrapperClass: "aspect-square bg-gray-200", imageClass: "" },
];

export function Lookbook() {
  const [lookbooks, setLookbooks] = useState<LookbookImage[]>(
    [],
  );

  const getData = async () => {
    try {
      const data = await getlookbooks();
      setLookbooks((data as LookbookImage[] | null) || []);
    } catch (error) {
      console.error("Error fetching lookbooks:", error);
    }
  };

  useEffect(() => {
    getData();
  }, []);

  const sortedLookbooks = [...lookbooks].sort(
    (first, second) =>
      (first.position ?? 0) - (second.position ?? 0),
  );

  return (
    <div className="relative">
      <div
        className="pt-8 pb-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: "#EADDD5" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-gray-800 mb-4">Lookbook</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our collection of nail designs and
              treatments
            </p>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedLookbooks.map((lookbook, index) => {
              const layout =
                lookbookLayout[index % lookbookLayout.length];

              return (
                <div
                  key={
                    lookbook.id ??
                    `${lookbook.image_url}-${index}`
                  }
                  className={layout.wrapperClass}
                >
                  <ImageWithFallback
                    src={lookbook.image_url}
                    alt={
                      lookbook.title || "Lookbook nail design"
                    }
                    loading="lazy"
                    className={`w-full h-full object-cover object-center ${layout.imageClass}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}