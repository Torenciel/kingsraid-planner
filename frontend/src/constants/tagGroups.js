export const TAG_GROUPS = [
  {
    id: "wb",
    label: "World Boss",
    tags: [
      { id: "wb_mountain", name: "WB1", image: "/kingsraid-data/assets/bosses/Mountain Fortress.png" },
      { id: "wb_protianus", name: "WB2", image: "/kingsraid-data/assets/bosses/Protianus.png" },
      { id: "wb_xanadus", name: "WB3", image: "/kingsraid-data/assets/bosses/Xanadus.png" },
    ],
  },
  {
    id: "raid",
    label: "Raid",
    tags: [
      { id: "raid_black", name: "Black Dragon", image: "/kingsraid-data/assets/bosses/Black_Dragon.png" },
      { id: "raid_fire", name: "Fire Dragon", image: "/kingsraid-data/assets/bosses/Fire_Dragon.png" },
      { id: "raid_frost", name: "Frost Dragon", image: "/kingsraid-data/assets/bosses/Frost_Dragon.png" },
      { id: "raid_poison", name: "Poison Dragon", image: "/kingsraid-data/assets/bosses/Poison_Dragon.png" },
    ],
  },
  {
    id: "gc",
    label: "Guild Conquest",
    tags: [
      { id: "gc_lakreil", name: "Lakreil", image: "/kingsraid-data/assets/bosses/Lakreil.png" },
      { id: "gc_tyrfas", name: "Tyrfas", image: "/kingsraid-data/assets/bosses/Tyrfas.png" },
      { id: "gc_velkazar", name: "Velkazar", image: "/kingsraid-data/assets/bosses/Velkazar.png" },
    ],
  },
  {
    id: "gr",
    label: "Guild Raid",
    tags: [
      { id: "gr_gushak", name: "Gushak", image: "/kingsraid-data/assets/bosses/Gushak.png" },
      { id: "gr_lakreil", name: "Lakreil", image: "/kingsraid-data/assets/bosses/Lakreil.png" },
      { id: "gr_manticore", name: "Manticore", image: "/kingsraid-data/assets/bosses/Manticore.png" },
      { id: "gr_maviel", name: "Maviel", image: "/kingsraid-data/assets/bosses/Maviel.png" },
      { id: "gr_nordik", name: "Nordik", image: "/kingsraid-data/assets/bosses/Nordik.png" },
      { id: "gr_nubis", name: "Nubis", image: "/kingsraid-data/assets/bosses/Nubis.png" },
      { id: "gr_tyrfas", name: "Tyrfas", image: "/kingsraid-data/assets/bosses/Tyrfas.png" },
      { id: "gr_Xakios", name: "Xakios", image: "/kingsraid-data/assets/bosses/Xakios.png" },
    ],
  },
  {
    id: "trial",
    label: "Trial",
    tags: [
      { id: "trial_imet", name: "Imet", image: "/kingsraid-data/assets/bosses/Imet.png" },
      { id: "trial_musama", name: "Musama", image: "/kingsraid-data/assets/bosses/Musama.png" },
      { id: "trial_sekmaha", name: "Sekmaha", image: "/kingsraid-data/assets/bosses/Sekmaha.png" },
    ],
  },
  {
    id: "shakmeh",
    label: "Shakmeh",
    tags: [
      { id: "devourer_shakmeh", name: "Devourer", image: "/kingsraid-data/assets/bosses/Devourer Shakmeh.png" },
      { id: "otherworldly_shakmeh", name: "Otherworldly", image: "/kingsraid-data/assets/bosses/Otherworldly Darkness Shakmeh.png" },
    ],
  },
  {
    id: "story",
    label: "Story",
    tags: [
      { id: "story_ch1", name: "Chapter 1" },
      { id: "story_ch2", name: "Chapter 2" },
      { id: "story_ch3", name: "Chapter 3" },
    ],
  },
  {
    id: "pvp",
    label: "PvP",
    tags: [
      { id: "league_of_victory", name: "League of Victory" },
      { id: "league_of_honor", name: "League of Honor" },
    ],
  },
  {
    id: "other",
    label: "Other Content",
    tags: [
      { id: "other_farming", name: "Farming" },
      { id: "other_event", name: "Event" },
    ],
  },
];

export const TAG_MAP = Object.fromEntries(
  TAG_GROUPS.flatMap((group) =>
    group.tags.map((tag) => [tag.id, `${group.label}: ${tag.name}`])
  )
);
