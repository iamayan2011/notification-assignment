import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import Navbar from "./components/Navbar";
import CreatePost from "./components/CreatePost";
import Search from "./pages/Search";

<Route path="/search" element={<Search />} />


function AppRoutes() {
  const { user } = useAuth();
  if (!user) return <SignIn />;           // simple auth gate
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile/:uid" element={<Profile />} />
        <Route path="/create" element={<CreatePost />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<Navigate to="/home" />} />
        

      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
