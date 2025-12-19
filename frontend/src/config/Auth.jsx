
import {createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup} from "firebase/auth"
import {auth,googleProvider} from "./firebase"

export const signUp = async (email, password)=>{
            try{
                return await createUserWithEmailAndPassword(auth, email, password);
            } catch(error){
                console.error(error);
                throw error;
            }

 };

 //sign in pending

export const logIn = async (email, password) => {

    try{

        return await signInWithEmailAndPassword(auth,email, password);

    }
    catch(error){
        console.error(error);

        throw error;
    }

 };

export const signInWithGoogle = async ()=>{
            try{
                return await signInWithPopup(auth, googleProvider);
            } catch(error){
                console.error(error);
                throw error;
            }

 };

export const logout = async ()=>{
            try{
                return await signOut(auth);
            } catch(error){
                console.error(error);
                throw error;
            }
 };