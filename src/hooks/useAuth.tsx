import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";

interface AuthContextType {
  isLoggedIn: boolean;
  userName: string;
  userId: string;
  login: (phone: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUserId = sessionStorage.getItem("authUser"); // Changed to sessionStorage
      
      if (savedUserId) {
        try {
          // Fetch user name from Firestore
          const userRef = doc(db, "admins", savedUserId);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setUserName(userData.name || "Unknown");
            setUserId(savedUserId);
            setIsLoggedIn(true);
          } else {
            // User no longer exists, clear session
            sessionStorage.removeItem("authUser");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          sessionStorage.removeItem("authUser");
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (phone: string) => {
    try {
      // Fetch user name during login
      const userRef = doc(db, "admins", phone);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUserName(userData.name || "Unknown");
        setUserId(phone);
        sessionStorage.setItem("authUser", phone); // Changed to sessionStorage
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    }
  };

  const logout = () => {
    sessionStorage.removeItem("authUser"); // Changed to sessionStorage
    setUserName("");
    setUserId("");
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, userId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}