// contexts/PerksContext.js
import { createContext, useContext, useState } from "react";

const PerksContext = createContext();

export const usePerks = () => {
  const context = useContext(PerksContext);
  if (!context) {
    throw new Error("usePerks must be used within PerksProvider");
  }
  return context;
};

export const PerksProvider = ({ children }) => {
  const [perks, setPerks] = useState(Array(8).fill(null));

  const updatePerks = (teamSlotIndex, newPerks) => {
    setPerks((prev) => {
      const newPerksArray = [...prev];
      newPerksArray[teamSlotIndex] = newPerks;
      return newPerksArray;
    });
  };

  const value = {
    perks,
    updatePerks,
  };

  return (
    <PerksContext.Provider value={value}>{children}</PerksContext.Provider>
  );
};
