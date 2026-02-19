// components/Modals/ModalManager.js
import { useModal } from "../../contexts/ModalContext";
import ArtifactModal from "./ArtifactModal";
import GearSetModal from "./GearSetModal";
import "./ModalManager.css";
import PerkModal from "./PerkModal";
import UTModal from "./UTModal";
import UWModal from "./UWModal";
import AvatarSelectorModal from "./AvatarSelectorModal";
import BannerSelectorModal from "./BannerSelectorModal";


const ModalManager = () => {
  const { activeModal, modalData, closeModal } = useModal();

  const renderModal = () => {
    switch (activeModal) {
      case "uw":
        return <UWModal data={modalData} onClose={closeModal} />;
      case "ut":
        return <UTModal data={modalData} onClose={closeModal} />;
      case "artifact":
        return <ArtifactModal data={modalData} onClose={closeModal} />;
      case "perk":
        return <PerkModal data={modalData} onClose={closeModal} />;
      case "gearset":
        return <GearSetModal data={modalData} onClose={closeModal} />;
      case "avatar":
        return <AvatarSelectorModal data={modalData} onClose={closeModal} />;
      case "banner":
        return <BannerSelectorModal data={modalData} onClose={closeModal} />;

      default:
        return null;
    }
  };

  if (!activeModal) return null;

  // Gère le clic sur l'overlay (pour fermer le modal)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
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
