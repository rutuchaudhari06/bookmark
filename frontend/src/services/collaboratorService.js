import {updateDoc, doc, arrayUnion, arrayRemove} from "firebase/firestore";
import {db} from "../config/firebase";

//here db refers to specific firebase database on which we want to work

export const addCollaborator = async(subjectId, userId) => {

    const ref=doc(db,"subjects",subjectId);

    await updateDoc(ref,{
        collaborators: arrayUnion(userId),
    });

};

export const removeCollaborator = async(subjectId, userId) => {
    const ref=doc(db,"subjects",subjectId);

    updateDoc(ref,{
        collaborators: arrayRemove(userId),
    });
};