import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    serverTimestamp
} from "firebase/firestore";

import { db } from "../config/firebase";

export async function getBookmarks(subjectId){

    const snapshot = await getDocs(
        collection(
            db,
            "subjects",
            subjectId,
            "bookmarks"
        )
    );

    return snapshot.docs.map(doc=>({
        id:doc.id,
        ...doc.data()
    }));
}

export async function addBookmark(subjectId, bookmark){

    await addDoc(
        collection(
            db,
            "subjects",
            subjectId,
            "bookmarks"
        ),
        {
            ...bookmark,
            createdAt:serverTimestamp()
        }
    );
}

export async function deleteBookmark(subjectId, bookmarkId){

    await deleteDoc(
        doc(
            db,
            "subjects",
            subjectId,
            "bookmarks",
            bookmarkId
        )
    );
}