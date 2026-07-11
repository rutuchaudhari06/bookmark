import {
  addDoc, collection, query, orderBy, getDocs,
  doc, updateDoc, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";

const notifRef = (userId) => collection(db, "users", userId, "notifications");

// type: "join_request" | "request_approved" | "request_rejected" | "folder_shared"
export const createNotification = async (userId, { type, title, description, subjectId }) => {
  if (!userId) return;
  await addDoc(notifRef(userId), {
    type,
    title,
    description: description || "",
    subjectId: subjectId || null,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const getNotifications = async (userId) => {
  if (!userId) return [];
  const q = query(notifRef(userId), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  return list;
};

export const markAllAsRead = async (userId, notifications) => {
  const unread = notifications.filter((n) => !n.read);
  if (unread.length === 0) return;
  const batch = writeBatch(db);
  unread.forEach((n) => {
    batch.update(doc(db, "users", userId, "notifications", n.id), { read: true });
  });
  await batch.commit();
};