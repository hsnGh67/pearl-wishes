import { Navbar } from '../components/Navbar';
import { Hero } from '../../components/Hero';
import { Features } from '../../components/Features';
import { Lookbook } from '../../components/Lookbook';
import { Training } from '../../components/Training';
import { Testimonials } from '../../components/Testimonials';
import { ServiceAreaMap } from '../../components/ServiceAreaMap';
import { InstagramSlider } from '../../components/InstagramSlider';
import { Newsletter } from '../../components/Newsletter';
import { Footer } from '../../components/Footer';
import { BackToTop } from '../../components/BackToTop';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Lookbook />
      <Training />
      <ServiceAreaMap />
      <Testimonials />
      <InstagramSlider />
      <Newsletter />
      <Footer />
      <BackToTop />
    </div>
  );
}