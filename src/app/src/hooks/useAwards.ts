import { useEffect, useState } from "react";
import { getAwards } from "../lib/db/awards-certifications";
import {
  AwardCard,
  DEFAULT_AWARD_ITEMS,
} from "../schema/awards-certifications.schema";

export function useAwards() {
  const [items, setItems] = useState<AwardCard[]>(DEFAULT_AWARD_ITEMS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const data = await getAwards();
        if (isCancelled) return;

        if (data.length > 0) {
          setItems(data);
        }
      } catch (error) {
        console.error("Error fetching awards certifications cards:", error);
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
