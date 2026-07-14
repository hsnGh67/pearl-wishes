import { Outlet } from 'react-router';
import { Navbar } from '../Navbar';
import { Hero } from '../sections/Hero';
import { AboutUs } from '../sections/AboutUs';
import { Features } from '../sections/Features';
import { Lookbook } from '../sections/Lookbook';
import { Training } from '../sections/Training';
import { Testimonials } from '../sections/Testimonials';
import { ServiceAreaMap } from '../sections/ServiceAreaMap';
import { Newsletter } from '../sections/Newsletter';
import { Footer } from './Footer';
import { BackToTop } from '../ui/BackToTop';

export function MainLayout() {
  return (
    <div style={{ margin: 0, padding: 0, width: '100%', overflow: 'hidden' }}>
      <Navbar />
      <Outlet />
    </div>
  );
}