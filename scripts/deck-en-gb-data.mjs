// Deck UK : uniquement les cartes qui DIFFÈRENT de l'anglais (US). Le seed part
// du deck US (deck-en-data.mjs) et applique ces overrides pour cards_en_gb.
export const DECK_EN_GB = {
  // ===== Politics (13, tous britanniques) =====
  def_politique_barack_obama: { t: 'Tony Blair', g: 'Anyone old enough to remember 1997 drinks 2' },
  def_politique_donald_trump: { t: 'Boris Johnson', g: "Anyone who's argued politics at the pub drinks 2" },
  def_politique_emmanuel_macron: { t: 'Keir Starmer', g: 'Anyone who knows which party he leads drinks 1, else 2' },
  def_politique_eric_zemmour: { t: 'Nigel Farage', g: 'No debating this round: whoever comments drinks 2' },
  '-OxuTBUGporUNBqFLnSx': { t: 'David Cameron', g: 'Anyone who remembers the Brexit vote drinks 2' },
  '-OxuTBds4ORp5-z937tN': { t: 'Rishi Sunak', g: 'The richest at the table drinks 2' },
  '-OxuSuEef1tnMSObgDn_': { t: 'Gordon Brown', g: 'Anyone who was voting in the 2000s drinks 2' },
  def_politique_jean_luc_melenchon: { t: 'Jeremy Corbyn', g: "Anyone who's been to a protest drinks 2" },
  '-OxuTBor-SkSSJOJijfs': { t: 'Ed Davey', g: 'Anyone who knows their local MP drinks 1, else 2' },
  def_politique_marine_le_pen: { t: 'Theresa May', g: 'Anyone who watched a full leaders’ debate drinks 2' },
  '-OxuTBJHkk3bVJJzuXiN': { t: 'Liz Truss', g: '@Outlast a lettuce or drink 2' },
  '-OxuTByiEGGuTP0LZSp0': { t: 'Angela Rayner', g: "Anyone who's stood up for the working class drinks 2" },
  '-OxuTB8fuDpCQu-61zUJ': { t: 'Nicola Sturgeon', g: 'Team independence drinks 1, the rest 2' },

  // ===== Pop Culture (15, britannique) =====
  '-OxwTHMjzlyLo3mHT_r-': { t: 'The Great British Bake Off', g: '@Describe a soggy bottom or drink 2' },
  '-OxwC6MZEBNtT67wIig8': { t: 'Bonfire Night', g: '@Do a firework sound or drink 2' },
  def_culture_hugo_decrypte: { t: 'Boxing Day', g: 'Anyone who shops the Boxing Day sales drinks 2' },
  def_culture_inoxtag: { t: "Dragons' Den", g: 'The winner makes anyone drink 3, no negotiation' },
  def_culture_koh_lanta: { t: 'Strictly Come Dancing', g: '@Do a cha-cha step or drink 2' },
  '-OxwTHsTV_j3MiL6teCK': { t: 'The Royal Family', g: 'Anyone who watched a royal wedding drinks 2' },
  '-OxwTHXNVx-1hzFvLyHu': { t: 'Monty Python', g: '@Do a silly walk or drink 2' },
  '-OxwTHhvl_0_caY4YG5v': { t: 'The FA Cup', g: 'Anyone who supports a football club drinks 2' },
  def_culture_les_ch_tis: { t: 'Geordie Shore', g: '@Order a round in a Geordie accent or drink 2' },
  def_culture_les_marseillais: { t: 'Love Island', g: 'Anyone who watches reality TV drinks 2, admit it' },
  def_culture_mcfly_carlito: { t: 'Doctor Who', g: 'Name a Doctor Who actor or drink 2' },
  def_culture_quotidien: { t: 'Gogglebox', g: 'Anyone who watches telly on the sofa every night drinks 2' },
  def_culture_tibo_inshape: { t: 'Coronation Street', g: "Anyone who's watched a soap this month drinks 2" },
  def_culture_top_chef: { t: "Britain's Got Talent", g: 'Vote: the biggest show-off at the table drinks 2' },
  '-OxwTHBvaMvwikziGa6A': { t: 'EastEnders', g: '@Do the EastEnders "doof doof" or drink 2' },

  // ===== Sports (9 overrides ; Boxing & Tennis identiques à l'US) =====
  def_sport_foot: { t: 'Football', g: 'Anyone who owns a football shirt drinks 2' },
  def_sport_padel: { t: 'Cricket', g: "Anyone who's sat through a full cricket match drinks 2" },
  def_sport_rugby: { t: 'Rugby', g: "Anyone who's watched a Six Nations game drinks 2" },
  def_sport_f1: { t: 'F1', g: '@Do an engine sound or drink 2' },
  def_sport_mma: { t: 'Darts', g: '@Shout "one hundred and eighty!" or drink 2' },
  def_sport_basket: { t: 'Snooker', g: 'Vote: the most patient at the table drinks 2' },
  def_sport_course_a_pied: { t: 'Golf', g: 'Anyone who finds golf boring drinks 2' },
  '-OxwNZRZDu3J3B6uQCOZ': { t: 'Grand National', g: '@Pick a horse name at random, backers drink 2' },
  def_sport_crossfit: { t: 'Cycling', g: '@Hold a plank for 10 seconds or drink 2' },

  // ===== Food (8, britannique) =====
  def_bouffe_camembert: { t: 'Marmite', g: 'Team love-it drinks 1, team hate-it drinks 2' },
  def_bouffe_couscous: { t: 'Greggs sausage roll', g: "Anyone who's had a Greggs this week drinks 2" },
  def_bouffe_raclette: { t: 'Fish & chips', g: 'Anyone who has it with mushy peas drinks 1, the rest 2' },
  '-OxwBzTkFwWTSmf933gx': { t: 'Full English breakfast', g: 'Anyone who puts beans on the plate drinks 2' },
  def_bouffe_b_uf_bourguignon: { t: "Shepherd's pie", g: 'Anyone who calls it cottage pie drinks 2' },
  def_bouffe_gratin_dauphinois: { t: 'Yorkshire pudding', g: 'No Yorkshire on your roast? Drink 2' },
  '-OxwC-93lUt00ZC4dyTn': { t: 'Sunday roast', g: 'The last to host a roast drinks 2' },
  '-OxwBz6eDky0gxnYvJ2z': { t: 'Bangers & mash', g: "Anyone who's had it this week drinks 2" },

  // ===== Music (4, britannique) =====
  '-OxwSvRvUchEvldIdd0v': { t: 'Adele', g: '@Belt one Adele line or drink 2' },
  '-OxwSvcDE4o1e0oa0I2H': { t: 'Ed Sheeran', g: 'Anyone with an Ed Sheeran song in a playlist drinks 2' },
  '-OxwSv8gXRkoxVby_FXp': { t: 'Stormzy', g: '@Rap one Stormzy line or drink 2' },
  def_musique_coldplay: { t: 'Central Cee', g: '@Rap one Central Cee line or drink 2' },

  // ===== Drinks (2) =====
  def_boisson_pastis: { t: "Pimm's", g: "Anyone who's had a Pimm's in summer drinks 2" },
  def_boisson_bubble_tea: { t: 'A cup of tea', g: 'Milk first? Drink 2. Everyone has an opinion' },

  // ===== Divers =====
  '-Oxka2JrgyC2Vo93fV0q': { t: 'Kebab at 3am', g: 'Team kebab drinks 1, team chippy drinks 2' },
  def_voyages_train_de_nuit: { t: 'Ibiza', g: "Anyone who's been on a lads'/girls' holiday drinks 2" },
  def_tech_vinted: { t: 'Depop', g: 'Anyone with a package on the way drinks 2' },
  def_celebrite_steven_spielberg: { t: 'Marcus Rashford', g: '@Do a goal celebration or drink 2' },
  def_celebrite_sigourney_weaver: { t: 'Idris Elba', g: 'Anyone who thinks he should be James Bond drinks 2' },
  def_cartoons_code_lyoko: { t: 'Peppa Pig', g: '@Do a Peppa snort or drink 2' },
  def_cine_oss_117: { t: 'Johnny English', g: '@Do a clumsy spy move or drink 2' },
  def_cine_les_tuche: { t: 'A Mr Bean sketch', g: '@Do a Mr Bean face or drink 2' },
};
