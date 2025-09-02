// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
  user: string | null;
  seatChosen: boolean;
  login: (username: string) => Promise<void>;
  logout: () => Promise<void>;
  chooseSeat: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [seatChosen, setSeatChosen] = useState(false);

  // Load state from storage on app start
  useEffect(() => {
    (async () => {
      const savedUser = await AsyncStorage.getItem("user");
      const savedSeat = await AsyncStorage.getItem("seatChosen");
      if (savedUser) setUser(savedUser);
      if (savedSeat === "true") setSeatChosen(true);
    })();
  }, []);

  const login = async (username: string) => {
    setUser(username);
    await AsyncStorage.setItem("user", username);
  };

  const logout = async () => {
    setUser(null);
    setSeatChosen(false);
    await AsyncStorage.multiRemove(["user", "seatChosen"]);
  };

  const chooseSeat = async () => {
    setSeatChosen(true);
    await AsyncStorage.setItem("seatChosen", "true");
  };

  return (
    <AuthContext.Provider value={{ user, seatChosen, login, logout, chooseSeat }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
