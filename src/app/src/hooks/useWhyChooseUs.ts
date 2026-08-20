import { useEffect, useState } from "react";
import { getWhyChooseUs } from "../lib/db/why-choose-us";
import {
  DEFAULT_WHY_ITEMS,
  WhyCard,
} from "../schema/why-choose-us.schema";

export function useWhyChooseUs() {
  const [items, setItems] = useState<WhyCard[]>(DEFAULT_WHY_ITEMS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const data = await getWhyChooseUs();
        if (isCancelled) return;

        if (data.length > 0) {
          setItems(data);
        }
      } catch (error) {
        console.error("Error fetching why choose us cards:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, []);

  return { items, isLoading };
}
