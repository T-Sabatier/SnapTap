// Deck AU (Australie) : overrides par-dessus le deck US (deck-en-data.mjs).
// Le seed part du deck US et applique ces cartes pour cards_en_au.
// OMIT_AU = cartes US retirées pour l'Australie (politiques/émissions en trop).
export const DECK_EN_AU = {
  // ===== Politics (9, australiens) =====
  def_politique_barack_obama: { t: 'Bob Hawke', g: '@Skull a drink like Hawkey or drink 2' },
  def_politique_donald_trump: { t: 'Pauline Hanson', g: "Anyone who's argued politics at a party drinks 2" },
  def_politique_emmanuel_macron: { t: 'Anthony Albanese', g: 'Anyone who knows what year Albo became PM drinks 1, else 2' },
  def_politique_eric_zemmour: { t: 'Peter Dutton', g: 'No debating this round: whoever comments drinks 2' },
  '-OxuTBUGporUNBqFLnSx': { t: 'Paul Keating', g: '@Deliver a brutal Keating-style insult or drink 2' },
  '-OxuTBds4ORp5-z937tN': { t: 'Julia Gillard', g: 'Anyone who remembers the "misogyny speech" drinks 2' },
  '-OxuSuEef1tnMSObgDn_': { t: 'Tony Abbott', g: 'Anyone who owns a pair of budgie smugglers drinks 2' },
  '-OxuTBJHkk3bVJJzuXiN': { t: 'Kevin Rudd', g: 'Anyone who remembers "Kevin07" drinks 2' },
  '-OxuTB8fuDpCQu-61zUJ': { t: 'Scott Morrison', g: 'Anyone who remembers "I don\'t hold a hose" drinks 2' },

  // ===== Pop Culture (12, australien) =====
  '-OxwTHMjzlyLo3mHT_r-': { t: 'The AFL Grand Final', g: 'Anyone who watches just for the halftime show drinks 2' },
  '-OxwC6MZEBNtT67wIig8': { t: 'Christmas in the heat', g: 'Anyone who eats until they nap drinks 2' },
  def_culture_hugo_decrypte: { t: 'Boxing Day sales', g: "Anyone who's fought a crowd for a deal drinks 2" },
  def_culture_inoxtag: { t: 'Kath & Kim', g: "Vote: whoever thinks they're the fanciest drinks 2" },
  def_culture_koh_lanta: { t: 'Australian Survivor', g: '@Hold a plank for 10 seconds or drink 2' },
  '-OxwTHsTV_j3MiL6teCK': { t: 'A Bunnings snag', g: 'Everyone cheers to the snag, a national treasure' },
  '-OxwTHXNVx-1hzFvLyHu': { t: 'The Logies', g: '@Give a fake acceptance speech or drink 2' },
  '-OxwTHhvl_0_caY4YG5v': { t: 'The Block', g: 'Vote: the handiest at the table hands out 2' },
  def_culture_les_ch_tis: { t: 'Married at First Sight', g: 'Vote: the most likely to go on MAFS drinks 2' },
  def_culture_tibo_inshape: { t: 'Australian Idol', g: '@Sing one line out loud or drink 2' },
  def_culture_top_chef: { t: 'MasterChef Australia', g: 'Vote: the best cook at the table hands out 2' },
  '-OxwTHBvaMvwikziGa6A': { t: 'Neighbours', g: 'Vote: the most dramatic person at the table drinks 2' },

  // ===== Sports (7, australien) =====
  def_sport_foot: { t: 'AFL (Aussie Rules)', g: 'Anyone who barracks for a team drinks 2' },
  def_sport_padel: { t: 'Cricket', g: "Anyone who's sat through a full day of cricket drinks 2" },
  def_sport_rugby: { t: 'State of Origin (NRL)', g: "Anyone who's watched a State of Origin drinks 2" },
  def_sport_f1: { t: 'The Bathurst 1000', g: '@Do an engine sound or drink 2' },
  def_sport_mma: { t: 'Netball', g: 'Vote: the most competitive at the table drinks 2' },
  '-OxwNZRZDu3J3B6uQCOZ': { t: 'Backyard cricket', g: "Anyone who's played backyard cricket while drinking drinks 2" },
  def_sport_tennis: { t: 'The Australian Open', g: "Anyone who's stayed up late for the Aus Open drinks 2" },

  // ===== Food (9, australien) =====
  def_bouffe_camembert: { t: 'Vegemite', g: 'Team love-it drinks 1, team hate-it drinks 2' },
  def_bouffe_couscous: { t: 'Fairy bread', g: 'Everyone drinks 1 to fairy bread, a classic' },
  def_bouffe_raclette: { t: 'A meat pie', g: 'Anyone who drowns it in tomato sauce drinks 1, the rest 2' },
  '-OxwBzTkFwWTSmf933gx': { t: 'A Dagwood dog', g: 'Team Dagwood dog drinks 1, team no-thanks drinks 2' },
  def_bouffe_b_uf_bourguignon: { t: 'A roast lamb', g: 'Anyone who can actually cook a roast drinks 1, the rest 2' },
  def_bouffe_gratin_dauphinois: { t: 'A parmy', g: "Anyone who's ordered a parmy at the pub drinks 2" },
  '-OxwC-93lUt00ZC4dyTn': { t: 'A sausage roll', g: "Anyone who's grabbed one from the bakery this week drinks 2" },
  '-OxwBz6eDky0gxnYvJ2z': { t: 'Weet-Bix', g: 'Vote: the biggest eater at the table drinks 2' },
  '-OxwBzIjbMk8wtLzkY_v': { t: 'A Tim Tam', g: "Anyone who's finished a whole packet solo drinks 2" },

  // ===== Music (4, australien) =====
  '-OxwSvRvUchEvldIdd0v': { t: 'Kylie Minogue', g: '@Sing one Kylie line or drink 2' },
  '-OxwSvcDE4o1e0oa0I2H': { t: 'The Kid LAROI', g: 'Anyone with a Kid LAROI song in a playlist drinks 2' },
  '-OxwSv8gXRkoxVby_FXp': { t: 'Hilltop Hoods', g: 'Anyone with an Aussie hip-hop song in a playlist drinks 2' },
  def_musique_coldplay: { t: 'Cold Chisel', g: 'Anyone who\'s sung along to "Khe Sanh" at a pub drinks 2' },

  // ===== Drinks (2, australien) =====
  def_boisson_pastis: { t: 'Goon (cask wine)', g: "Anyone who's survived a big night on goon drinks 2" },
  def_boisson_bubble_tea: { t: 'A flat white', g: 'Any coffee snobs at the table drink 2' },

  // ===== Divers (8) =====
  '-Oxka2JrgyC2Vo93fV0q': { t: 'A Maccas run at 3am', g: 'Team Maccas drinks 1, team servo pie drinks 2' },
  def_voyages_train_de_nuit: { t: 'Schoolies', g: "Anyone who's been on a schoolies or mates' trip drinks 2" },
  def_tech_vinted: { t: 'Gumtree', g: 'Anyone with a Gumtree sale on the go drinks 2' },
  def_celebrite_steven_spielberg: { t: 'Sam Kerr', g: '@Do a goal celebration or drink 2' },
  def_celebrite_sigourney_weaver: { t: 'Chris Hemsworth', g: "Anyone who thinks he's the best Thor drinks 2" },
  def_cartoons_code_lyoko: { t: 'Bluey', g: "Anyone who's secretly cried at a Bluey episode drinks 2" },
  def_cine_oss_117: { t: 'The Castle', g: "Anyone who's fought their landlord or council drinks 2" },
  def_cine_les_tuche: { t: 'Crocodile Dundee', g: '@Do the "that\'s not a knife" line or drink 2' },
};

// Cartes US retirées pour l'Australie (4 politiques + 3 émissions de trop) :
// elles n'apparaîtront pas dans cards_en_au.
export const OMIT_AU = new Set([
  'def_politique_jean_luc_melenchon', // Bernie Sanders
  '-OxuTBor-SkSSJOJijfs', // JD Vance
  'def_politique_marine_le_pen', // Kamala Harris
  '-OxuTByiEGGuTP0LZSp0', // Nancy Pelosi
  'def_culture_les_marseillais', // The Bachelor
  'def_culture_mcfly_carlito', // MrBeast
  'def_culture_quotidien', // TMZ
]);
