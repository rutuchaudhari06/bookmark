import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { generateShareToken } from "./subjectService";

// Builds (or reuses) the share link for a subject.
export const getOrCreateShareLink = async (subjectId) => {
  const token = await generateShareToken(subjectId);
  return `${window.location.origin}/join/${token}`;
};

// Looks up a subject by its shareToken. Returns null if the token is invalid/expired.
export const getSubjectByShareToken = async (token) => {
  if (!token) return null;

  const q = query(collection(db, "subjects"), where("shareToken", "==", token));
  const snap = await getDocs(q);

  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};