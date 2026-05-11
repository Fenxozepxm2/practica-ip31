import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { StaffAuth } from "./pages/StaffAuth";
import { Specialists } from "./pages/Specialists";
import { SpecialistProfile } from "./pages/SpecialistProfile";
import { Profile } from "./pages/Profile";
import { StaffProfile } from "./pages/StaffProfile";
import { JoinTeam } from "./pages/JoinTeam";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "login", Component: Login },
      { path: "register", Component: Register },
      { path: "staff-auth", Component: StaffAuth },
      { path: "specialists", Component: Specialists },
      { path: "specialist/:id", Component: SpecialistProfile },
      { path: "profile", Component: Profile },
      { path: "staff-profile", Component: StaffProfile },
      { path: "join-team", Component: JoinTeam },
    ],
  },
]);