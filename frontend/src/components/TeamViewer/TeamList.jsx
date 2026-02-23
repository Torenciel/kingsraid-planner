import TeamCard from "../components/TeamCard";

export default function PublicTeams({ teams }) {
  return (
    <div className="team-grid">
      {teams.map((team) => (
        <TeamCard
          key={team._id}
          team={team}
          onUpvote={(id) => console.log("upvote", id)}
          onBookmark={(id) => console.log("bookmark", id)}
        />
      ))}
    </div>
  );
}
