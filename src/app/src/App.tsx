import { RouterProvider } from 'react-router';
import { router } from './routes';
import { WorkshopTabProvider } from './contexts/WorkshopTabContext';

export default function App() {
  return (
    <WorkshopTabProvider>
      <RouterProvider router={router} />
    </WorkshopTabProvider>
  );
}
