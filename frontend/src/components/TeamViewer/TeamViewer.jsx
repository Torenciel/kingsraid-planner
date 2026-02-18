import { HeroProvider } from "../contexts/HeroContext";
import TeamViewer from "../components/TeamViewer/TeamViewer";
import "../index.css";

function TeamView() {
  return (
    <HeroProvider>
      <TeamViewer />
    </HeroProvider>
  );
}

export default TeamView;
