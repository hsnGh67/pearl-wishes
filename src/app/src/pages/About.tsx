import { Navbar } from '../components/Navbar';
import { Footer } from '../components/layout/Footer';
import { BackToTop } from '../components/ui/BackToTop';
import { OurStory } from '../components/about/OurStory';
import { WhyChooseUs } from '../components/about/WhyChooseUs';
import { ContactAndHours } from '../components/about/ContactAndHours';
import { AwardsAndCertifications } from '../components/about/AwardsAndCertifications';

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-gray-900">About Us</h1>
          </div>
        </div>
      </section>

      <OurStory />
      <WhyChooseUs />
      <ContactAndHours />
      <AwardsAndCertifications />
      
      <Footer />
      <BackToTop />
    </div>
  );
}