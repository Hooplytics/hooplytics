import { createBrowserRouter } from "react-router-dom";

import { App } from "./App";
import { HomePage } from "./components/HomePage";
import { ProfilePage } from "./components/ProfilePage";
import { AuthenticationPage } from "./components/AuthenticationPage";

export const router = createBrowserRouter([
    { path: "/", element: <App/> },
    { path: "/", element: <HomePage /> },
    { path: "/profile", element: <ProfilePage /> },
    { path: "/profile/players", element: <ProfilePage /> },
    { path: "/profile/teams", element: <ProfilePage /> },
    { path: "/login", element: <AuthenticationPage /> },
    { path: "/signup", element: <AuthenticationPage /> },
])