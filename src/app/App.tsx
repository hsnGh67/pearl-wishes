import { RouterProvider } from "react-router";
import { router } from "./src/routes";
import { AuthProvider } from "./src/providers/AuthProvider";
import { WorkshopTabProvider } from "./src/contexts/WorkshopTabContext";

export default function App() {
  return (
    <AuthProvider>
      <WorkshopTabProvider>
        <RouterProvider router={router} />
      </WorkshopTabProvider>
    </AuthProvider>
  );
}