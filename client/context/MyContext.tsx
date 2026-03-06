"use client";

import {
  createContext,
  useState,
  ReactNode,
  useContext,
  useEffect,
} from "react";

interface MyContextType {
  persist: boolean;
  setPersist: (val: boolean) => void;
  isHydrated: boolean;
}

const MyContext = createContext<MyContextType | undefined>(undefined);

const ContextProvider = ({ children }: { children: ReactNode }) => {
  const [persist, setPersist] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("persist");
    if (saved !== null) {
      setPersist(JSON.parse(saved));
    }
    setIsHydrated(true);
  }, []);

  const values: MyContextType = {
    persist,
    isHydrated,
    setPersist: (val: boolean) => {
      setPersist(val);
      localStorage.setItem("persist", JSON.stringify(val));
    },
  };

  return <MyContext.Provider value={values}>{children}</MyContext.Provider>;
};

const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error("useMyContext must be used within a ContextProvider");
  }
  return context;
};

export { ContextProvider, useMyContext };
