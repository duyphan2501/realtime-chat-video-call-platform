"use client";

import  { createContext, useState, useEffect, ReactNode, useContext } from "react";

interface MyContextType {
  persist: boolean;
  setPersist: (val: boolean) => void;
}

const MyContext = createContext<MyContextType | undefined>(undefined);

const ContextProvider = ({ children }: { children: ReactNode }) => {
  const [persist, setPersist] = useState<boolean>(false);

  useEffect(() => {
    const stored = localStorage.getItem("persist");
    if (stored) setPersist(JSON.parse(stored));
  }, []);

  const values: MyContextType = {
    persist,
    setPersist: (val: boolean) => {
      setPersist(val);
      localStorage.setItem("persist", JSON.stringify(val));
    }
  };

  return (
    <MyContext.Provider value={values}>
      {children}
    </MyContext.Provider>
  ); 
};

const useMyContext = () => { 
  const context = useContext(MyContext);
  if (!context) {
    throw new Error("useMyContext must be used within a ContextProvider");
  }
  return context;
}


export { ContextProvider, useMyContext };
