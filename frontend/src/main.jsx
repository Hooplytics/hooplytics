import { StrictMode } from 'react'
import { RouterProvider } from "react-router-dom";
import { createRoot } from 'react-dom/client'
import { router } from './router.jsx';
import { AuthContextProvider } from './context/AuthContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthContextProvider >
      <RouterProvider router={router} />
    </AuthContextProvider>
  </StrictMode>,
)
