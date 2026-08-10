import { RouterProvider } from "react-router";
import { router } from "./src/routes";
import { AuthProvider } from "./src/providers/AuthProvider";

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
