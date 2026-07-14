import { Hero } from '../components/sections/Hero';
import { Features } from '../components/sections/Features';
import { Lookbook } from '../components/sections/Lookbook';
import { Training } from '../components/sections/Training';
import { Testimonials } from '../components/sections/Testimonials';
import { ServiceAreaMap } from '../components/sections/ServiceAreaMap';
import { Newsletter } from '../components/sections/Newsletter';
import { Footer } from '../components/layout/Footer';
import { BackToTop } from '../components/ui/BackToTop';

export function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <Lookbook />
      <Training />
      <ServiceAreaMap />
      <Testimonials />
      <Newsletter />
      <Footer />
      <BackToTop />
    </>
  );
}