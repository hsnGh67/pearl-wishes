import { useState, useEffect } from "react";
import { WorkshopsNavbar } from "../components/workshops/WorkshopsNavbar";
import { WorkshopHero } from "../components/workshops/WorkshopHero";
import { HowItWorks } from "../components/workshops/HowItWorks";
import { CompleteNailCourse } from "../components/workshops/CompleteNailCourse";
import { AdvancedNailCourse } from "../components/workshops/AdvancedNailCourse";
import { WorkshopInfo } from "../components/workshops/WorkshopInfo";
import { WorkshopFAQ } from "../components/workshops/WorkshopFAQ";
import { Footer } from "../components/layout/Footer";
import { BackToTop } from "../components/ui/BackToTop";
import { getActiveWorkshops } from "../lib/db/workshops";
import {
  formatWorkshopForDisplay,
  Workshop,
  WorkshopDisplay,
} from "../schema/workshop.schema";
import WorkshopsDetails from "./WorkshopsDetails";

export default function Workshops() {
  const [isGettingWorkshops, setIsGettingWorkshops] = useState(false);
  const [activeWorkshops, setActiveWorkshops] = useState<WorkshopDisplay[]>([]);
  const getWorkshops = async () => {
    try {
      setIsGettingWorkshops(true);
      const workshops = await getActiveWorkshops();
      const workshopDisplay = workshops.map(formatWorkshopForDisplay);
      setActiveWorkshops(workshopDisplay);
    } catch (error) {
      console.error("Error getting workshops:", error);
    } finally {
      setIsGettingWorkshops(false);
    }
  };

  useEffect(() => {
    getWorkshops();
  }, []);

  if (isGettingWorkshops) {
    return <div>Loading workshops...</div>;
  }
  if (activeWorkshops.length === 0) {
    return <div>No workshops found</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <WorkshopsNavbar />
      <WorkshopHero />
      <HowItWorks />
      <div id="workshop-info">
        {activeWorkshops.map((workshop) => (
          <WorkshopsDetails key={workshop.id} workshopDetails={workshop} />
        ))}
      </div>

      {/* <CompleteNailCourse />
      <AdvancedNailCourse /> */}
      <WorkshopInfo />
      <WorkshopFAQ />
      <Footer />
      <BackToTop />
    </div>
  );
}
