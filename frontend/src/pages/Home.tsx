import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import PostCard from "../components/PostCard";

type Post = {
  id: string;
  authorId: string;
  authorName?: string;
  authorPhotoURL?: string; // <-- Added
  content: string;
  imageURL?: string;
  likedBy: string[];
  timestamp: string;
};

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchFeed = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const following: string[] = userSnap.data()?.following || [];

      let postQuery;
      if (following.length > 0) {
        postQuery = query(
          collection(db, "posts"),
          where("authorId", "in", following.slice(0, 10)),
          orderBy("timestamp", "desc"),
          limit(50)
        );
      } else {
        postQuery = query(
          collection(db, "posts"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
      }

      const snap = await getDocs(postQuery);

      const postsRaw = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Post, "id" | "authorName" | "authorPhotoURL">),
      }));

      const authorIds = Array.from(new Set(postsRaw.map((post) => post.authorId)));

      const authorMap: Record<
        string,
        { name: string; photoURL: string }
      > = {};

      await Promise.all(
        authorIds.map(async (id) => {
          const authorDoc = await getDoc(doc(db, "users", id));
          if (authorDoc.exists()) {
            const data = authorDoc.data();
            authorMap[id] = {
              name: data.displayName || "Unknown",
              photoURL: data.photoURL || "",
            };
          }
        })
      );

      const postData: Post[] = postsRaw.map((post) => ({
        ...post,
        authorName: authorMap[post.authorId]?.name || "Unknown",
        authorPhotoURL: authorMap[post.authorId]?.photoURL || "",
      }));

      setPosts(postData);
    };

    fetchFeed();
  }, [user]);

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {posts.length === 0 ? (
        <p className="text-center text-gray-500">No posts to show yet.</p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
