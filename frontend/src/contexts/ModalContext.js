// contexts/ModalContext.js
import { createContext, useContext, useState, useCallback } from "react";

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [modalStack, setModalStack] = useState([]);

  const openModal = useCallback((modalType, data = null) => {
    if (activeModal) {
      setModalStack(prev => [...prev, { type: activeModal, data: modalData }]);
    }
    setActiveModal(modalType);
    setModalData(data);
  }, [activeModal, modalData]);

  const closeModal = useCallback(() => {
    if (modalStack.length > 0) {
      const previousModal = modalStack[modalStack.length - 1];
      setModalStack(prev => prev.slice(0, -1));
      setActiveModal(previousModal.type);
      setModalData(previousModal.data);
    } else {
      setActiveModal(null);
      setModalData(null);
    }
  }, [modalStack]);

  const closeAllModals = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
    setModalStack([]);
  }, []);

  const openConfirmationModal = useCallback((config) => {
    const defaultConfig = {
      title: 'Confirmation',
      message: 'Are you sure?',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: () => {},
      onCancel: () => {},
      danger: false
    };
    openModal('confirmation', { ...defaultConfig, ...config });
  }, [openModal]);

  const isModalOpen = useCallback((modalType = null) => {
    if (modalType === null) return activeModal !== null;
    return activeModal === modalType;
  }, [activeModal]);

  const value = {
    activeModal,
    modalData,
    modalStack,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    openConfirmationModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};
