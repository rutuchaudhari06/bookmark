import {addDoc, collection, query, where, getDocs, updateDoc, deleteDoc, doc, serverTimestamp} from "firebase/firestore";
import {db} from "../config/firebase";

export const createNote = async (
    {title, content, subjectId, userId, visibility,}
) => {

    await addDoc(collection(db, "subjects", subjectId, "notes"),{

        title,
        content,
        subjectId,
        bookmarkId:null,
        createdBy: userId,
        visibility,
        createdAt: serverTimestamp(),
    });
};

export const getNotesBySubject = async (subjectId) => {

    const q = query(
        collection(db, "subjects", subjectId, "notes"),
        where("subjectId","==",subjectId)
    );

    const snap=await getDocs(q);

    const notes=[];

    snap.forEach((doc)=>{

        notes.push({id: doc.id, ...doc.data()});

    });

    return notes;

};



export const updateNote = async (subjectId, noteId, updatedData) => {

    const ref= doc(db, "subjects", subjectId, "notes", noteId);

    await updateDoc(ref,updatedData);

};

export const deleteNote = async (subjectId, noteId) => {
    const ref=doc(db, "subjects", subjectId, "notes", noteId);

    await deleteDoc(ref);
};


