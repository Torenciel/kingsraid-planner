import "./Home.css";
import { Link } from "react-router-dom";
const BASE_PATH = process.env.PUBLIC_URL || "";

const Home = () => {


  const images = [
    "/kingsraid-data/assets/heroes/Crow/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Kibera/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Lavril/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Lilia/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Loman/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Morrah/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Ricardo/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Theo/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Xerah/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Xerah/cos/Limited.png",
    "/kingsraid-data/assets/heroes/Xerah/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Annette/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Cecilia/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Chase/cos/Halloween.png",
    "/kingsraid-data/assets/heroes/Clause/cos/Ashen.png",
    "/kingsraid-data/assets/heroes/Clause/cos/World.png",
    "/kingsraid-data/assets/heroes/Crow/cos/World.png",
    "/kingsraid-data/assets/heroes/Evan/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Valance/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Theo/cos/Substory.png",
    "/kingsraid-data/assets/heroes/Talisha/cos/Limited.png",
    "/kingsraid-data/assets/heroes/Taily/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Shamilla/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Shakmeh/cos/Limited.png",
    "/kingsraid-data/assets/heroes/Shakmeh/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Selene/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Roi/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Roi/cos/World.png",
    "/kingsraid-data/assets/heroes/Riheet/cos/Limited.png",
    "/kingsraid-data/assets/heroes/Ricardo/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Requina/cos/World.png",
    "/kingsraid-data/assets/heroes/Rebel Clause/cos/Limited.png",
    "/kingsraid-data/assets/heroes/Rebel Clause/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Priscilla/cos/Substory.png",
    "/kingsraid-data/assets/heroes/Phillop/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Pansirone/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Ophelia/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Ophelia/cos/Substory.png",
    "/kingsraid-data/assets/heroes/Oddy/cos/World.png",
    "/kingsraid-data/assets/heroes/Oddy/cos/School.png",
    "/kingsraid-data/assets/heroes/Oddy/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Nia/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Naila/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Mitra/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Miruru/cos/Legend.png",
    "/kingsraid-data/assets/heroes/Mediana/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Maria/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Luna/cos/School.png",
    "/kingsraid-data/assets/heroes/Luna/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Lucikiel/cos/Limited.png",
    "/kingsraid-data/assets/heroes/Lucias/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Loman/cos/Halloween.png",
    "/kingsraid-data/assets/heroes/Loman/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Lilia/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Lavril/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Lakrak/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Lakrak/cos/Halloween.png",
    "/kingsraid-data/assets/heroes/Kirze/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Kibera/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Kasel/cos/World.png",
    "/kingsraid-data/assets/heroes/Kasel/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Kasel/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Kara/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Isolet/cos/Limited.png",
    "/kingsraid-data/assets/heroes/Isolet/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Isaiah/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Hilda/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Gremory/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Gremory/cos/Casual.png",
    "/kingsraid-data/assets/heroes/Glenwys/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Glenwys/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Gladi/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Gau/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Fluss/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Fallen Frey/cos/Limited.png",
    "/kingsraid-data/assets/heroes/Ezekiel/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Evan/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Estelle/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Esker/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Erze/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Dimael/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Demia/cos/World.png",
    "/kingsraid-data/assets/heroes/Dark Lord Kasel/cos/Limited.png",
    "/kingsraid-data/assets/heroes/Dark Lord Kasel/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Dakaris/cos/Swimsuit.png",
    "/kingsraid-data/assets/heroes/Crow/cos/Substory.png",
    "/kingsraid-data/assets/heroes/Crow/cos/School.png",
    "/kingsraid-data/assets/heroes/Cleo/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Clause/visual.png",
    "/kingsraid-data/assets/heroes/Chrisha/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Cecilia/cos/League of Honor.png",
    "/kingsraid-data/assets/heroes/Aselica/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Artemia/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Arch/cos/Glory.png",
    "/kingsraid-data/assets/heroes/Aisha/cos/Basic.png",
    "/kingsraid-data/assets/heroes/Lakrak/cos/Working.png"

];
   const randomImage =
    images[Math.floor(Math.random() * images.length)];

  return (
    <>
<div className="home-hero">
  <div className="home-text">
    <p className="main-title">King's Raid Planner</p>
    <p className="main-subtitle">Build, Save and Share your teams.</p>
<p className="website-description">
KingsRaid Planner is currently in testing. If you encounter a bug or have ideas to improve the site, please share them on the <Link className="page-link" to="/feedback">feedback</Link> or <Link className="page-link" to="/bug-report">bug report</Link> page.
</p>  </div>

      <div className="main-image-container">
        <img
          src={`${BASE_PATH}${randomImage}`}
          alt="King's Raid Character"
          className="main-image"
        />
      </div>
</div>

    </>
  );
}

export default Home;
