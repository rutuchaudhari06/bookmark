import {createContext, useContext, useEffect, useState} from "react";
import { onAuthStateChanged } from "firebase/auth";
import {auth} from "../config/firebase";

const AuthContext = createContext();

export const AuthProvider = ({children})=>{ // children = whatever you put BETWEEN a component’s opening and closing tags.

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        const unsub = onAuthStateChanged(auth, (currentUser)=>{
            setUser(currentUser);
            setLoading(false);
        });

        return ()=> unsub();

    },[]);

    return (
        <AuthContext.Provider value={{user}}>
            {!loading && children}
        </AuthContext.Provider>

    );
};

export const useAuth = () => useContext(AuthContext);