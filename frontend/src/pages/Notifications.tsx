// frontend/src/pages/Notifications.tsx
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, updateDoc, doc, limit } from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

interface Notification {
  id: string;
  title: string;
  desc: string;
  actionURL: string;
  timestamp: string;
  read: boolean;
  type: string;
  postId?: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    return onSnapshot(q, (snap) => {
      const notifications: Notification[] = snap.docs.map((docSnap: DocumentData) => {
        const data = docSnap.data();
        const { id } = docSnap;
        return {
          id,
          ...(data as Omit<Notification, "id">),
        };
      });
      setNotifs(notifications);
    });
  }, [user]);

  const markRead = async (n: Notification) => {
    if (!n.read) {
      await updateDoc(doc(db, "users", user!.uid, "notifications", n.id), { read: true });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {notifs.map((n) => (
        <Link
          key={n.id}
          to={n.actionURL}
          onClick={() => markRead(n)}
          className={`block p-4 border rounded ${n.read ? "bg-gray-100" : "bg-white"}`}
        >
          <p className="font-semibold">{n.title}</p>
          <p>{n.desc}</p>
          <p className="text-sm text-gray-500">
            {new Date(n.timestamp).toLocaleString()}
          </p>
        </Link>
      ))}
    </div>
  );
}
