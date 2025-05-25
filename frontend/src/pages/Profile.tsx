import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

type UserInfo = {
  displayName: string;
  photoURL?: string;
  followers: string[];
  following: string[];
};

export default function Profile() {
  const { uid } = useParams(); // target user's UID
  const { user } = useAuth(); // current logged-in user
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid) return;

      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserInfo;
        setUserInfo(data);

        // set follow state based on current user
        if (user && data.followers.includes(user.uid)) {
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
        }
      }
    };

    fetchUser();
  }, [uid, user]);

  const toggleFollow = async () => {
    if (!user || !uid || user.uid === uid) return;

    try {
      const followUserFn = httpsCallable<{ targetUid: string }, { following: boolean }>(
        functions,
        "followUser"
      );

      const result = await followUserFn({ targetUid: uid });
      const { following } = result.data;

      setIsFollowing(following);

      // Update followers list in UI for consistency
      setUserInfo((prev) =>
        prev
          ? {
              ...prev,
              followers: following
                ? [...prev.followers, user.uid]
                : prev.followers.filter((id) => id !== user.uid),
            }
          : prev
      );
    } catch (err) {
      console.error("Failed to follow/unfollow:", err);
    }
  };

  const fallbackImage =
    "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg";

  if (!userInfo) return <p>Loading profile...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded shadow bg-white">
      <div className="flex items-center gap-4">
        <img
          src={userInfo.photoURL || fallbackImage}
          alt="Profile"
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <h1 className="text-2xl font-bold">{userInfo.displayName}</h1>
          <p className="text-sm text-gray-600">
            {userInfo.followers.length} Followers · {userInfo.following.length} Following
          </p>
          {user && user.uid !== uid && (
            <button
              onClick={toggleFollow}
              className={`mt-2 px-4 py-1 rounded text-white ${
                isFollowing ? "bg-red-500" : "bg-blue-500"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
