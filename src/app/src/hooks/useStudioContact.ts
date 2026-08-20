import { useEffect, useState } from "react";
import { CONTACT_INFO } from "../lib/constants";
import { getContactAndHours } from "../lib/db/studio-contact";
import {
  DEFAULT_HOUR_ROWS,
  HourRow,
  mapBusinessHourToHourRow,
} from "../schema/studio-contact.schema";

export interface StudioContactFields {
  phone: string;
  email: string;
  address: string;
}

const FALLBACK_CONTACT: StudioContactFields = {
  phone: CONTACT_INFO.phone,
  email: CONTACT_INFO.email,
  address: CONTACT_INFO.address,
};

export function useStudioContact() {
  const [contact, setContact] = useState<StudioContactFields>(FALLBACK_CONTACT);
  const [hours, setHours] = useState<HourRow[]>(DEFAULT_HOUR_ROWS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const data = await getContactAndHours();
        if (isCancelled) return;

        if (data.contact) {
          setContact({
            phone: data.contact.phone,
            email: data.contact.email,
            address: data.contact.address,
          });
        }

        if (data.hours.length > 0) {
          setHours(data.hours.map(mapBusinessHourToHourRow));
        }
      } catch (error) {
        console.error("Error fetching studio contact and hours:", error);
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

  return { contact, hours, isLoading };
}
