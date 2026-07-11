import {doc,setDoc, serverTimestamp} from "firebase/firestore"
import {db} from "../config/firebase";

export const createUserDoc = async (user) => {

    if(!user) return;

    const userReference= doc(db,"users",user.uid);

    await setDoc(userReference, {
        userId : user.uid,
        email: user.email,
        name:user.displayName || "New User",
        createdAt : serverTimestamp()
    }).catch(err => console.error("Firestore write error:",err));
}; 