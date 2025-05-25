import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { collection, query, onSnapshot, where } from "firebase/firestore";

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?query=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md p-4 flex flex-wrap justify-between items-center">
      <div className="flex flex-wrap items-center space-x-6">
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `font-medium hover:text-blue-600 ${isActive ? "text-blue-600" : "text-gray-700"}`
          }
        >
          Home
        </NavLink>

        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `relative font-medium hover:text-blue-600 ${isActive ? "text-blue-600" : "text-gray-700"}`
          }
        >
          Notifications
          {unreadCount > 0 && (
            <span
              className="absolute -top-2 -right-4 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount}
            </span>
          )}
        </NavLink>

        <NavLink
          to="/create"
          className={({ isActive }) =>
            `font-medium hover:text-green-600 ${isActive ? "text-green-600" : "text-gray-700"}`
          }
        >
          + Post
        </NavLink>

        {user && (
          <NavLink
            to={`/profile/${user.uid}`}
            className={({ isActive }) =>
              `font-medium hover:text-purple-600 ${isActive ? "text-purple-600" : "text-gray-700"}`
            }
          >
            My Profile
          </NavLink>
        )}

        <button
          onClick={handleLogout}
          className="text-red-500 font-medium ml-4 hover:underline"
        >
          Logout
        </button>
      </div>

      <form onSubmit={handleSearch} className="mt-2 sm:mt-0">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="border p-2 rounded"
        />
      </form>
    </nav>
  );
}
