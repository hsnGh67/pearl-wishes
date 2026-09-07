import { RouterProvider } from "react-router";
import { router } from "./routes";
import { WorkshopTabProvider } from "./contexts/WorkshopTabContext";
import { AuthProvider } from "./providers/AuthProvider";

export default function App() {
  return (
    <AuthProvider>
      <WorkshopTabProvider>
        <RouterProvider router={router} />
      </WorkshopTabProvider>
    </AuthProvider>
  );
}