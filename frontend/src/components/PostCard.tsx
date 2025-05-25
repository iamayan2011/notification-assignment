import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

type Post = {
  id: string;
  authorId: string;
  content: string;
  imageURL?: string;
  likedBy: string[];
  timestamp: string;
  authorName?: string;
  authorPhotoURL?: string;
};

type ToggleLikeResponse = {
  liked: boolean;
};

export default function PostCard({ post }: { post: Post }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (user) setLiked(post.likedBy.includes(user.uid));
  }, [user, post.likedBy]);

  const toggleLike = async () => {
    if (!user) return;

    try {
      const toggleLikeFn = httpsCallable<{ postId: string }, ToggleLikeResponse>(
        functions,
        "toggleLike"
      );
      const result = await toggleLikeFn({ postId: post.id });
      setLiked(result.data.liked);
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const fallbackImage =
    "https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg";

  return (
    <div className="border rounded p-4 bg-white shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <img
          src={post.authorPhotoURL || fallbackImage}
          alt="Author"
          className="w-10 h-10 rounded-full object-cover"
        />
        <span className="font-semibold">{post.authorName || "Unknown"}</span>
      </div>
      <p className="mt-1">{post.content}</p>
      {post.imageURL && (
        <img
          src={post.imageURL}
          alt=""
          className="mt-2 max-h-64 w-full object-cover rounded"
        />
      )}
      <div className="flex justify-between items-center mt-2">
        <p className="text-sm text-gray-500">
          {new Date(post.timestamp).toLocaleString()}
        </p>
        <button
          onClick={toggleLike}
          className={`text-sm font-medium ${
            liked ? "text-red-500" : "text-gray-500"
          }`}
        >
          ♥ {liked ? "Liked" : "Like"}
        </button>
      </div>
    </div>
  );
}
