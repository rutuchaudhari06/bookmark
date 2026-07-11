import {addDoc, getDoc,updateDoc, deleteDoc, collection, query, where, doc, serverTimestamp, getDocs} from "firebase/firestore";
import {db} from "../config/firebase";

import {arrayUnion} from "firebase/firestore";

//create a subject

export const createSubject = async (subjectName, userId) => {
    await addDoc(collection(db,"subjects"),{
        subjectName,
        ownerId : userId,
        collaborators: [],
        shareToken: "",
        createdAt: serverTimestamp(),
    });
};

//FETCH THE SUBJECTS TO SHOW ON FRONTEND 
//HERE WE ARE MERGING THE SUBJECTS WHERE A PARTICLUAR USER IS OWNER AND COLLABRATOR CAUSE WE WANT TO SHOW ALL THOSE SUBJECT ON THE FRONTEND OF USER LIKE WHATS'APP WHERE WE SHOW ALL THE GROUP WHICH ARE CREATED BY US AND ALSO NOT CREATED BY US

export const getUserSubject = async (userId) => {

    const ownedQuery = query(collection(db,"subjects"),where("ownerId","==",userId)); //query : only instruction and suppose the inst is to get the document then by getDocs will fetch the documents

    const collaboratedQuery=query(collection(db,"subjects"),where("collaborators","array-contains",userId));

    const [ownedSnap, collabSnap] =await Promise.all([
        getDocs(ownedQuery),
        getDocs(collaboratedQuery)
    ]);

    const subjectsMap = new Map();

    //docSnap.id : is the id that is created by the firestore , as it's unique will store it in subjectMap , and according to will map , can't use subject name as it is mutable and as the people in different collaborator can have same subject name  

    ownedSnap.forEach((docSnap)=>{

        subjectsMap.set(docSnap.id,{id: docSnap.id, ...docSnap.data(),});

    });

    collabSnap.forEach((docSnap) => {

        subjectsMap.set(docSnap.id,{id:docSnap.id,...docSnap.data()});

    });

    return Array.from(subjectsMap.values()); //to iterate through all value convert it into array
};

//update the subject name

export const updateSubjectName = async(subjectId, newName) => {
    const ref=doc(db,"subjects",subjectId);

    await updateDoc(ref,{subjectName :newName});
};

//delete the subject

export const deleteSubject = async(subjectId)=>{

    const ref=doc(db,"subjects",subjectId);

    await deleteDoc(ref);

};

export const generateShareToken = async (subjectId) => {

    const token = Math.random().toString(36).substring(2,10); //base 36 means it includes a to z and numbers from 0 to 9

    const subjectRef=doc(db,"subjects",subjectId);

    await updateDoc(subjectRef,{
        shareToken:token
    });

    return token;

};

//it's for that functionality when user clicks on the shared link then user should only see that subject id only, not all the subjects

export const getSubjectById = async (subjectId) => {

    const ref= doc(db,"subjects",subjectId);
    const snap = await getDoc(ref);

    if(!snap.exists()){

        return null;

    }

    return {
        id: snap.id,
        ...snap.data(),
    };

};

export const joinSubjectByToken = async (token, userId) =>{

    const q = query(
        collection(db,"subjects"),
        where("shareToken","==",token)
    );

    const snapshot = await getDocs(q);

    if(snapshot.empty) return null;

    const docSnap = snapshot.docs[0];

    const subjectRef = doc(db,"subjects",docSnap.id);

    await updateDoc(subjectRef,{
        collaborators: arrayUnion(userId)
    });

    return docSnap.id;

};

