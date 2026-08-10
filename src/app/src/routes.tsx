import { createBrowserRouter } from "react-router";
import { MainLayout } from "./components/layout/MainLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminRoute } from "./components/auth/AdminRoute";
import { HomePage } from "./pages/HomePage";
import About from "./pages/About";
import Workshops from "./pages/Workshops";
import WorkshopsMobile from "./pages/WorkshopsMobile";
import WorkshopsIndex from "./pages/WorkshopsIndex";
import WorkshopsShowcase from "./pages/WorkshopsShowcase";
import WorkshopsDesignSystem from "./pages/WorkshopsDesignSystem";
import WorkshopsStructure from "./pages/WorkshopsStructure";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminCalendar } from "./pages/admin/AdminCalendar";
import { AdminPayments } from "./pages/admin/AdminPayments";
import { AdminServices } from "./pages/admin/AdminServices";
import { AdminWorkshops } from "./pages/admin/AdminWorkshops";
import { AdminContent } from "./pages/admin/AdminContent";
import { AdminPromoCodes } from "./pages/admin/AdminPromoCodes";
import { AdminPromoCodeCreate } from "./pages/admin/AdminPromoCodeCreate";
import { AdminPromoCodeDetails } from "./pages/admin/AdminPromoCodeDetails";
import TestBookingCreation from "./pages/admin/TestBookingCreation";
import DatabaseSetup from "./pages/DatabaseSetup";
import { Login } from "./pages/Login";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "about", element: <About /> },
      { path: "workshops", element: <Workshops /> },
      { path: "workshops-mobile", element: <WorkshopsMobile /> },
      { path: "workshops/index", element: <WorkshopsIndex /> },
      { path: "workshops/showcase", element: <WorkshopsShowcase /> },
      { path: "workshops/design-system", element: <WorkshopsDesignSystem /> },
      { path: "workshops/structure", element: <WorkshopsStructure /> },
      { path: "setup-database", element: <DatabaseSetup /> },
      { path: "login", element: <Login /> },
    ],
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: "users", element: <AdminUsers /> },
          { path: "calendar", element: <AdminCalendar /> },
          { path: "payments", element: <AdminPayments /> },
          { path: "services", element: <AdminServices /> },
          { path: "workshops", element: <AdminWorkshops /> },
          { path: "content", element: <AdminContent /> },
          { path: "promo-codes", element: <AdminPromoCodes /> },
          { path: "promo-codes/create", element: <AdminPromoCodeCreate /> },
          { path: "promo-codes/:id", element: <AdminPromoCodeDetails /> },
          { path: "promo-codes/:id/edit", element: <AdminPromoCodeCreate /> },
          { path: "test-booking-creation", element: <TestBookingCreation /> },
        ],
      },
    ],
  },
]);
