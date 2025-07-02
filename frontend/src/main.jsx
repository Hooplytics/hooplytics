import { StrictMode } from 'react'
import { RouterProvider } from "react-router-dom";
import { createRoot } from 'react-dom/client'
import { router } from './router.jsx';
import { AuthContextProvider } from './context/AuthContext.jsx';
import { FavoritesProvider } from './context/FavoritesContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthContextProvider >
      <FavoritesProvider> 
        <RouterProvider router={router} />
      </FavoritesProvider>
    </AuthContextProvider>
  </StrictMode>,
)
