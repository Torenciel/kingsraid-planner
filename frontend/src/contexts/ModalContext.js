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

  // Types de modals supportés
  const MODAL_TYPES = {
    // Modals existants
    ARTIFACT: 'artifact',
    GEARSET: 'gearset',
    PERK: 'perk',
    UW: 'uw',
    UT: 'ut',
    SW: 'sw',
    HERO: 'hero',
    
    // Nouveaux modals pour le système de sauvegarde
    TEAM_SAVE: 'team_save',
    TEAM_LOAD: 'team_load',
    TEAM_SHARE: 'team_share',
    TEAM_SETTINGS: 'team_settings',
    
    // Modals d'équipement améliorés
    ARTIFACT_SELECT: 'artifact_select',
    GEARSET_SELECT: 'gearset_select',
    PERK_SELECT: 'perk_select',
    
    // Modals d'information
    HERO_DETAILS: 'hero_details',
    ITEM_DETAILS: 'item_details',
    
    // Modals système
    CONFIRMATION: 'confirmation',
    ALERT: 'alert',
    LOADING: 'loading'
  };

  const openModal = useCallback((modalType, data = null) => {
    console.log(`📱 Opening modal: ${modalType}`, data);
    
    // Empiler la modal actuelle si elle existe
    if (activeModal) {
      setModalStack(prev => [...prev, { type: activeModal, data: modalData }]);
    }
    
    setActiveModal(modalType);
    setModalData(data);
  }, [activeModal, modalData]);

  const closeModal = useCallback(() => {
    console.log(`📱 Closing modal: ${activeModal}`);
    
    // Dépiler si on a des modals en attente
    if (modalStack.length > 0) {
      const previousModal = modalStack[modalStack.length - 1];
      setModalStack(prev => prev.slice(0, -1));
      setActiveModal(previousModal.type);
      setModalData(previousModal.data);
    } else {
      setActiveModal(null);
      setModalData(null);
    }
  }, [activeModal, modalStack]);

  const closeAllModals = useCallback(() => {
    console.log('📱 Closing all modals');
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
    
    openModal(MODAL_TYPES.CONFIRMATION, { ...defaultConfig, ...config });
  }, [openModal]);

  const openAlertModal = useCallback((config) => {
    const defaultConfig = {
      title: 'Alert',
      message: '',
      type: 'info', // 'info', 'success', 'warning', 'error'
      onClose: () => {}
    };
    
    openModal(MODAL_TYPES.ALERT, { ...defaultConfig, ...config });
  }, [openModal]);

  const openLoadingModal = useCallback((message = 'Loading...') => {
    openModal(MODAL_TYPES.LOADING, { message });
  }, [openModal]);

  // Fonctions spécifiques pour les équipements
  const openArtifactModal = useCallback((data) => {
    // Format des données attendues pour le nouveau système
    const modalData = {
      teamSlotIndex: data.teamSlotIndex,
      subSlotType: 'artifact', // Identifiant du type
      currentItem: data.currentItem, // Format: { artifactSlug, artifactInfo, stars }
      currentStars: data.currentStars || 0,
      heroSlug: data.heroSlug,
      heroClass: data.heroClass,
      onSelect: data.onSelect // Fonction callback
    };
    
    openModal(MODAL_TYPES.ARTIFACT_SELECT, modalData);
  }, [openModal]);

  const openGearsetModal = useCallback((data) => {
    const modalData = {
      teamSlotIndex: data.teamSlotIndex,
      subSlotType: 'gearSet',
      currentItem: data.currentItem, // Format: { gearSetSlug, gearSetInfo, pieces }
      heroSlug: data.heroSlug,
      heroClass: data.heroClass,
      onSelect: data.onSelect
    };
    
    openModal(MODAL_TYPES.GEARSET_SELECT, modalData);
  }, [openModal]);

  const openPerkModal = useCallback((data) => {
    const modalData = {
      teamSlotIndex: data.teamSlotIndex,
      heroSlug: data.heroSlug,
      heroClass: data.heroClass,
      currentPerks: data.currentPerks || {
        t3: { s1: null, s2: null, s3: null, s4: null },
        t5: null
      },
      onSelect: data.onSelect
    };
    
    openModal(MODAL_TYPES.PERK_SELECT, modalData);
  }, [openModal]);

  const openUWModal = useCallback((data) => {
    const modalData = {
      teamSlotIndex: data.teamSlotIndex,
      subSlotType: 'uw',
      heroSlug: data.heroSlug,
      currentStars: data.currentStars || 0,
      onSelect: data.onSelect
    };
    
    openModal(MODAL_TYPES.UW, modalData);
  }, [openModal]);

  const openUTModal = useCallback((data) => {
    const modalData = {
      teamSlotIndex: data.teamSlotIndex,
      subSlotType: 'ut',
      heroSlug: data.heroSlug,
      currentConfig: data.currentConfig || { choice: 0, stars: 0 },
      onSelect: data.onSelect
    };
    
    openModal(MODAL_TYPES.UT, modalData);
  }, [openModal]);

  const openSWModal = useCallback((data) => {
    const modalData = {
      teamSlotIndex: data.teamSlotIndex,
      subSlotType: 'sw',
      heroSlug: data.heroSlug,
      currentAdvancement: data.currentAdvancement || null, // 0, 1, 2 ou null
      onSelect: data.onSelect
    };
    
    openModal(MODAL_TYPES.SW, modalData);
  }, [openModal]);

  const openTranscendenceModal = useCallback((data) => {
    const modalData = {
      teamSlotIndex: data.teamSlotIndex,
      subSlotType: 'transcendence',
      heroSlug: data.heroSlug,
      currentLevel: data.currentLevel || 0,
      onSelect: data.onSelect
    };
    
    openModal(MODAL_TYPES.CONFIRMATION, {
      title: 'Transcendence Level',
      message: `Select transcendence level for ${data.heroSlug} (0-5)`,
      customContent: 'transcendence_selector',
      ...modalData
    });
  }, [openModal]);

  // Fonctions pour la gestion des équipes
  const openTeamSaveModal = useCallback((teamData) => {
    openModal(MODAL_TYPES.TEAM_SAVE, {
      teamData,
      onSave: (savedTeam) => {
        console.log('Team saved:', savedTeam);
        closeModal();
      },
      onCancel: () => closeModal()
    });
  }, [openModal, closeModal]);

  const openTeamLoadModal = useCallback((onTeamLoaded) => {
    openModal(MODAL_TYPES.TEAM_LOAD, {
      onSelect: (team) => {
        if (onTeamLoaded) onTeamLoaded(team);
        closeModal();
      },
      onCancel: () => closeModal()
    });
  }, [openModal, closeModal]);

  const openTeamSettingsModal = useCallback((currentSettings, onSave) => {
    openModal(MODAL_TYPES.TEAM_SETTINGS, {
      currentSettings,
      onSave: (newSettings) => {
        if (onSave) onSave(newSettings);
        closeModal();
      },
      onCancel: () => closeModal()
    });
  }, [openModal, closeModal]);

  const openHeroDetailsModal = useCallback((heroSlug) => {
    openModal(MODAL_TYPES.HERO_DETAILS, {
      heroSlug,
      onClose: () => closeModal()
    });
  }, [openModal, closeModal]);

  const openItemDetailsModal = useCallback((itemType, itemData) => {
    openModal(MODAL_TYPES.ITEM_DETAILS, {
      itemType,
      itemData,
      onClose: () => closeModal()
    });
  }, [openModal, closeModal]);

  // Vérifier si une modal est ouverte
  const isModalOpen = useCallback((modalType = null) => {
    if (modalType === null) {
      return activeModal !== null;
    }
    return activeModal === modalType;
  }, [activeModal]);

  // Obtenir les données de la modal pour un type spécifique
  const getModalDataForType = useCallback((expectedType) => {
    if (activeModal === expectedType) {
      return modalData;
    }
    return null;
  }, [activeModal, modalData]);

  const value = {
    // États
    activeModal,
    modalData,
    modalStack,
    
    // Types de modals
    MODAL_TYPES,
    
    // Fonctions de base
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalDataForType,
    
    // Fonctions spécifiques pour les équipements
    openArtifactModal,
    openGearsetModal,
    openPerkModal,
    openUWModal,
    openUTModal,
    openSWModal,
    openTranscendenceModal,
    
    // Fonctions pour la gestion des équipes
    openTeamSaveModal,
    openTeamLoadModal,
    openTeamSettingsModal,
    
    // Fonctions d'information
    openHeroDetailsModal,
    openItemDetailsModal,
    
    // Fonctions système
    openConfirmationModal,
    openAlertModal,
    openLoadingModal
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};