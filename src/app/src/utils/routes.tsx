import { createBrowserRouter } from "react-router";
import Home from "../pages/Home";
import About from "../pages/About";
import Workshops from "../pages/Workshops";
import WorkshopsMobile from "../pages/WorkshopsMobile";
import WorkshopsIndex from "../pages/WorkshopsIndex";
import WorkshopsShowcase from "../pages/WorkshopsShowcase";
import WorkshopsDesignSystem from "../pages/WorkshopsDesignSystem";
import WorkshopsStructure from "../pages/WorkshopsStructure";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/about",
    Component: About,
  },
  {
    path: "/workshops",
    Component: Workshops,
  },
  {
    path: "/workshops-mobile",
    Component: WorkshopsMobile,
  },
  {
    path: "/workshops/index",
    Component: WorkshopsIndex,
  },
  {
    path: "/workshops/showcase",
    Component: WorkshopsShowcase,
  },
  {
    path: "/workshops/design-system",
    Component: WorkshopsDesignSystem,
  },
  {
    path: "/workshops/structure",
    Component: WorkshopsStructure,
  },
]);