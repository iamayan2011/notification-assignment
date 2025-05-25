import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

type User = {
  id: string;
  displayName: string;
  photoURL?: string;
};

export default function Search() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const queryParam = new URLSearchParams(location.search).get("query") || "";

  useEffect(() => {
    const searchUsers = async () => {
      if (!queryParam.trim()) return;

      setLoading(true);
      const usersRef = collection(db, "users");
      const allUsersSnap = await getDocs(usersRef);

      const matchedUsers = allUsersSnap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<User, "id">) }))
        .filter((user) =>
          user.displayName.toLowerCase().includes(queryParam.toLowerCase())
        );

      setUsers(matchedUsers);
      setLoading(false);
    };

    searchUsers();
  }, [queryParam]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">
        Search Results for "{queryParam}"
      </h2>

      {loading ? (
        <p>Searching...</p>
      ) : users.length === 0 ? (
        <p>No users found with name "{queryParam}"</p>
      ) : (
        <ul className="space-y-4">
          {users.map((user) => (
            <li key={user.id}>
              <Link
                to={`/profile/${user.id}`}
                className="block p-4 border rounded hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold">
                      {user.displayName[0]}
                    </div>
                  )}
                  <p className="font-medium">{user.displayName}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
