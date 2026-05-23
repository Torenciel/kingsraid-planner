// components/Modals/ModalManager.js
import { useModal } from "../../contexts/ModalContext";
import "./ModalManager.css";
import AvatarSelectorModal from "./AvatarSelectorModal";
import BannerSelectorModal from "./BannerSelectorModal";
import ConfirmationModal from "./ConfirmationModal";
import TeamSettingsModal from "./TeamSettingsModal";


const ModalManager = () => {
  const { activeModal, modalData, closeModal } = useModal();

  const renderModal = () => {
    switch (activeModal) {
      case "avatar":
        return <AvatarSelectorModal data={modalData} onClose={closeModal} />;
      case "banner":
        return <BannerSelectorModal data={modalData} onClose={closeModal} />;
      case "confirmation":
        return <ConfirmationModal data={modalData} onClose={closeModal} />;
      case "team-settings":
        return <TeamSettingsModal data={modalData} onClose={closeModal} />;

      default:
        return null;
    }
  };

  if (!activeModal) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !modalData?.isNewTeam) {
      closeModal();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {renderModal()}
      </div>
    </div>
  );
};

export default ModalManager;
