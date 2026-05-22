import { createContext, useCallback, useContext, useState } from "react";

const SlotPanelContext = createContext(null);

export const SlotPanelProvider = ({ children }) => {
  // activeSlot: { teamSlotIndex, subSlotIndex } | null
  // subSlotIndex 0-3 = UW/UT/Artifact/GearSet, 4 = Perks
  const [activeSlot, setActiveSlot] = useState(null);

  const openSlotPanel = useCallback((teamSlotIndex, subSlotIndex) => {
    setActiveSlot((prev) => {
      // clicking the same slot toggles it closed
      if (prev && prev.teamSlotIndex === teamSlotIndex && prev.subSlotIndex === subSlotIndex) {
        return null;
      }
      return { teamSlotIndex, subSlotIndex };
    });
  }, []);

  const closeSlotPanel = useCallback(() => setActiveSlot(null), []);

  return (
    <SlotPanelContext.Provider value={{ activeSlot, openSlotPanel, closeSlotPanel }}>
      {children}
    </SlotPanelContext.Provider>
  );
};

export const useSlotPanel = () => {
  const ctx = useContext(SlotPanelContext);
  if (!ctx) throw new Error("useSlotPanel must be used inside SlotPanelProvider");
  return ctx;
};
