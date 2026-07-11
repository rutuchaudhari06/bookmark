import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config/firebase";

import { createNotification } from "./notificationService";

const requestsRef = (subjectId) =>
  collection(db, "subjects", subjectId, "joinRequests");

// Find an existing (pending) request from this user for this subject.
export const findExistingRequest = async (subjectId, userId) => {
  const q = query(requestsRef(subjectId), where("userId", "==", userId));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

// Create a join request, unless one already exists for this user.
export const createJoinRequest = async (subjectId, user) => {
  const existing = await findExistingRequest(subjectId, user.uid);
  if (existing) return existing;

  const docRef = await addDoc(requestsRef(subjectId), {
    userId: user.uid,
    displayName: user.displayName || user.email || "Unknown user",
    email: user.email || "",
    status: "pending",
    createdAt: serverTimestamp(),
  });

  if (ownerId) {
    await createNotification(ownerId, {
      type: "join_request",
      title: "New access request",
      description: `${user.displayName || user.email} requested access to "${subjectName || "your folder"}"`,
      subjectId,
    });
  }

  return { id: docRef.id, userId: user.uid, status: "pending" };
};

// Owner-only: list all pending requests for a subject.
export const getPendingRequests = async (subjectId) => {
  const q = query(requestsRef(subjectId), where("status", "==", "pending"));
  const snap = await getDocs(q);

  const requests = [];
  snap.forEach((docSnap) => requests.push({ id: docSnap.id, ...docSnap.data() }));
  return requests;
};

// Owner-only: approve — add to collaborators, then remove the request.
export const approveJoinRequest = async (subjectId, requestId, userId) => {
  const subjectDocRef = doc(db, "subjects", subjectId);
  await updateDoc(subjectDocRef, {
    collaborators: arrayUnion(userId),
  });

  const requestDocRef = doc(db, "subjects", subjectId, "joinRequests", requestId);
  await deleteDoc(requestDocRef);

  await createNotification(userId, {
    type: "request_approved",
    title: "Request approved",
    description: `You now have access to "${subjectName || "the folder"}"`,
    subjectId,
  });
};

// Owner-only: reject — just remove the request, collaborators untouched.
export const rejectJoinRequest = async (subjectId, requestId) => {
  const requestDocRef = doc(db, "subjects", subjectId, "joinRequests", requestId);
  await deleteDoc(requestDocRef);

  if (userId) {
    await createNotification(userId, {
      type: "request_rejected",
      title: "Request declined",
      description: `Your request to join "${subjectName || "the folder"}" was declined`,
      subjectId,
    });
  }
};