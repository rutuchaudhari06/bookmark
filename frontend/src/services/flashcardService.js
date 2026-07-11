import {addDoc, collection, query, where, getDocs, updateDoc, deleteDoc, doc, serverTimestamp} from "firebase/firestore";
import {db} from "../config/firebase";

export const createFlashcard = async ({question, answer, subjectId, userId, difficulty}) => {

    await addDoc(collection(db, "subjects", subjectId, "flashcards"),{
        question,
        answer,
        subjectId,
        bookmarkId : null,
        createdBy: userId,
        difficulty,
        createdAt: serverTimestamp(),
    });

};


export const getFlashcardBySubject = async (subjectId) => {

    const q = query(collection(db, "subjects", subjectId, "flashcards"), where("subjectId","==",subjectId));

    const snap = await getDocs(q);

    const flashcards = [];

    snap.forEach((doc)=>{

        flashcards.push({id: doc.id, ...doc.data()});

    });

    return flashcards;

};

export const updateFlashcard = async (subjectId, flashcardId, updatedData) => {
    await updateDoc(
        doc(db, "subjects", subjectId, "flashcards", flashcardId),
        updatedData
    );
};

export const deleteFlashcard = async (subjectId, flashcardId) => {
    await deleteDoc(
        doc(db, "subjects", subjectId, "flashcards", flashcardId)
    );
};