import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import {
  syncAuthToExtension,
  clearAuthFromExtension,
} from "../services/extensionAuthBridge";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (!currentUser) {
        clearAuthFromExtension();
        return;
      }

      try {
        await syncAuthToExtension(currentUser);
      } catch (error) {
        console.error("Failed to sync auth to extension on login:", error);
      }
    });

    const unsubscribeToken = onIdTokenChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          await syncAuthToExtension(currentUser);
        } catch (error) {
          console.error("Failed to sync auth to extension:", error);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
