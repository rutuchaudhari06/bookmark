import {
  collection,
  doc,
  getDoc,
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

// Create a join request, unless one already exists for this user, and
// notify the folder owner that someone wants in.
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

  try {
    const subjectSnap = await getDoc(doc(db, "subjects", subjectId));
    if (subjectSnap.exists()) {
      const subjectData = subjectSnap.data();
      if (subjectData.ownerId) {
        await createNotification(subjectData.ownerId, {
          type: "join_request",
          title: "New Access Request",
          description: `${user.displayName || user.email} requested access to "${
            subjectData.subjectName || "your folder"
          }"`,
          subjectId,
          requestId: docRef.id,
          requesterId: user.uid,
          requesterName: user.displayName || user.email,
          subjectName: subjectData.subjectName || "your folder",
        });
      }
    }
  } catch (error) {
    console.error("Failed to notify folder owner:", error);
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

// Owner-only: approve — add to collaborators, remove the request, notify the requester.
export const approveJoinRequest = async (subjectId, requestId, userId) => {
  const subjectDocRef = doc(db, "subjects", subjectId);
  await updateDoc(subjectDocRef, {
    collaborators: arrayUnion(userId),
  });

  const requestDocRef = doc(db, "subjects", subjectId, "joinRequests", requestId);
  await deleteDoc(requestDocRef);

  try {
    const subjectSnap = await getDoc(subjectDocRef);
    const subjectName = subjectSnap.exists() ? subjectSnap.data().subjectName : "the folder";
    await createNotification(userId, {
      type: "request_approved",
      title: "Access Approved",
      description: `Your request to join "${subjectName}" has been approved.`,
      subjectId,
    });
  } catch (error) {
    console.error("Failed to notify requester:", error);
  }
};

// Owner-only: reject — remove the request, collaborators untouched, notify the requester.
export const rejectJoinRequest = async (subjectId, requestId, userId) => {
  const requestDocRef = doc(db, "subjects", subjectId, "joinRequests", requestId);
  await deleteDoc(requestDocRef);

  try {
    if (userId) {
      const subjectSnap = await getDoc(doc(db, "subjects", subjectId));
      const subjectName = subjectSnap.exists() ? subjectSnap.data().subjectName : "the folder";
      await createNotification(userId, {
        type: "request_rejected",
        title: "Access Rejected",
        description: `Your request to join "${subjectName}" has been declined.`,
        subjectId,
      });
    }
  } catch (error) {
    console.error("Failed to notify requester:", error);
  }
};