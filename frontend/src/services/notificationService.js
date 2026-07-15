import {
  addDoc, collection, query, orderBy, getDocs, onSnapshot,
  doc, deleteDoc, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";

const notifRef = (userId) => collection(db, "users", userId, "notifications");

// type: "join_request" | "request_approved" | "request_rejected" | "folder_shared"
// requestId/requesterId/requesterName/subjectName are only used by
// "join_request" notifications so the bell can approve/reject inline.
export const createNotification = async (
  userId,
  { type, title, description, subjectId, requestId, requesterId, requesterName, subjectName }
) => {
  if (!userId) return;
  await addDoc(notifRef(userId), {
    type,
    title,
    description: description || "",
    subjectId: subjectId || null,
    requestId: requestId || null,
    requesterId: requesterId || null,
    requesterName: requesterName || null,
    subjectName: subjectName || null,
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

// Live subscription — keeps the caller's state in sync with Firestore in
// real time (new access requests, approvals, rejections) without requiring
// a page refresh. Returns an unsubscribe function.
export const subscribeToNotifications = (userId, callback) => {
  if (!userId) return () => {};
  const q = query(notifRef(userId), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      callback(list);
    },
    (error) => {
      console.error("Notification listener error:", error);
    }
  );
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

// Removes a single notification — used once a join request has been
// approved/rejected so it disappears from the bell immediately.
export const deleteNotification = async (userId, notificationId) => {
  if (!userId || !notificationId) return;
  await deleteDoc(doc(db, "users", userId, "notifications", notificationId));
};