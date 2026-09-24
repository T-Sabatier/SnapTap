// MODE DÉBATS — questions OUI / NON (spec : MODE-SANS-FILTRE.md).
// Toutes les cartes ci-dessous ont été VALIDÉES une par une par l'utilisateur
// le 24/09/2026. Règle d'écriture : phrases très courtes, style télégraphique,
// "Tu" seulement si c'est ambigu.
//
// Format : [texte, ton, ici?]. `ici` = la carte vise les gens de la table.
// ⚠️ AJOUTER EN FIN DE LISTE UNIQUEMENT : l'id d'une carte = sa position
// (sert à l'anti-répétition mémorisée sur le tel de l'hôte).
//
// Pour l'instant FR seulement : le mode n'est proposé qu'aux salons en français.

// Tons du Soft : pique (piquant/clivant), leger (pour souffler), exist (débats longs)
const SOFT = [
  // Fournée 1
  ['Ananas sur la pizza ?', 'leger'],
  ['Tu dors en chaussettes ?', 'leger'],
  ['Rester ami avec son ex ?', 'pique'],
  ["Au 1er date, l'homme paie ?", 'pique'],
  ['Le camping, des vraies vacances ?', 'leger'],
  ['Tu réponds aux vocaux en vocal ?', 'leger'],
  ['Garder un portefeuille trouvé ?', 'exist'],
  ['Connaître la date de sa mort ?', 'exist'],
  ['Tu sauterais en parachute ?', 'leger'],
  ['Un an sans tel pour 50 000 € ?', 'leger'],
  ['Tu ferais une télé-réalité ?', 'leger'],
  ['Déjà pissé dans une piscine ?', 'pique'],
  ['Déjà stalké ton ex ?', 'pique'],
  ['Déjà fraudé dans le métro ?', 'pique'],
  ['Déjà menti sur ton âge ?', 'pique'],
  ["Déjà ghosté quelqu'un ?", 'pique'],
  ['Tu laisses en vu ?', 'leger'],
  ['Tu te douches le soir ?', 'leger'],
  ['Tu manges un insecte pour 100 € ?', 'leger'],
  ['Déjà pleuré devant un dessin animé ?', 'leger'],
  // Clivantes
  ["L'amitié homme-femme existe ?", 'pique'],
  ["Liker les photos d'un(e) autre, c'est tromper ?", 'pique'],
  ['Partager ses mots de passe en couple ?', 'pique'],
  ["Le premier message, c'est à l'homme ?", 'pique'],
  ['Géolocalisation partagée en couple ?', 'pique'],
  ['Le tel interdit à table ?', 'pique'],
  ['Réseaux sociaux interdits avant 15 ans ?', 'pique'],
  ['Influenceur, un vrai métier ?', 'pique'],
  ['La semaine de 4 jours ?', 'pique'],
  ['Le pourboire, obligatoire ?', 'pique'],
  ["Partager l'addition au centime près ?", 'pique'],
  ["Prêter de l'argent à un pote ?", 'pique'],
  ['La chirurgie esthétique, ça passe ?', 'pique'],
  ['Démissionner sans avoir de plan B ?', 'pique'],
  ['Draguer au boulot, ça passe ?', 'pique'],
  ['Les zoos, à fermer ?', 'pique'],
  ['La chasse, à interdire ?', 'pique'],
  ['La corrida, à interdire ?', 'pique'],
  ['Les trottinettes, à virer des villes ?', 'pique'],
  ["Se rencontrer sur une appli, c'est moins bien ?", 'pique'],
  // Piquantes
  ["Déjà eu un crush sur quelqu'un ici ?", 'pique', 1],
  ["Déjà dit du mal de quelqu'un ici ?", 'pique', 1],
  ['Déjà embrassé un inconnu ?', 'pique'],
  ['Déjà écrit à ton ex à 3h du mat ?', 'pique'],
  ['Déjà envoyé un message à la mauvaise personne ?', 'pique'],
  ['Déjà menti sur ton CV ?', 'pique'],
  ['Déjà volé dans un magasin ?', 'pique'],
  ["Déjà fait semblant de pas voir quelqu'un ?", 'pique'],
  ["Déjà été jaloux d'un pote ?", 'pique'],
  ['Déjà oublié exprès de rembourser un pote ?', 'pique'],
  ['Tu pardonnerais une tromperie ?', 'pique'],
  ["Tu sortirais avec l'ex d'un pote ?", 'pique'],
  ["Tu dis à ton pote qu'on le trompe ?", 'pique'],
  ['Tu balances un pote pour 10 000 € ?', 'pique'],
  ['Tu quittes ton couple pour 1 million ?', 'pique'],
  ['Tu te remettrais avec un ex ?', 'pique'],
  ['Un pote peut sortir avec ton ex ?', 'pique'],
  ["L'argent fait le bonheur ?", 'pique'],
  ['Tu lis un journal intime trouvé ?', 'pique'],
  ['Mentir pour couvrir un pote ?', 'pique'],
  // Existentielles
  ['Tu voudrais vivre éternellement ?', 'exist'],
  ['Tu revivrais ta vie à l\'identique ?', 'exist'],
  ['Tu effacerais un souvenir ?', 'exist'],
  ['Tu voudrais connaître ton avenir ?', 'exist'],
  ["Tu échangerais ta vie avec quelqu'un ici ?", 'exist', 1],
  ['Le destin existe ?', 'exist'],
  ['On vit dans une simulation ?', 'exist'],
  ['Les extraterrestres existent ?', 'exist'],
  ['Tu partirais sur Mars sans retour ?', 'exist'],
  ["L'amour dure toute une vie ?", 'exist'],
  ['Tu retournerais à tes 15 ans ?', 'exist'],
  ['Les gens changent vraiment ?', 'exist'],
  ['Tu voudrais lire dans les pensées ?', 'exist'],
  ["Tu veux savoir ce qu'on pense de toi ?", 'exist', 1],
  ['Tout plaquer pour recommencer ailleurs ?', 'exist'],
  ['Le bonheur, ça se choisit ?', 'exist'],
  ['On peut être ami avec tout le monde ?', 'exist'],
  ["Mieux vaut être craint qu'aimé ?", 'exist'],
  ['La vérité, toujours bonne à dire ?', 'exist'],
  ['On a tous un prix ?', 'exist'],
  ['Tu serais prêt à tout pour réussir ?', 'exist'],
  ['Il y a une seule personne faite pour nous ?', 'exist'],
  ['Tu voudrais être célèbre ?', 'exist'],
  ['Tuer 1 personne pour en sauver 5 ?', 'exist'],
  ['Tu tuerais pour sauver ta famille ?', 'exist'],
  ["Épouser quelqu'un pour son argent ?", 'exist'],
  ['Mentir au tribunal pour un pote ?', 'exist'],
  ['Garder 10 000 € versés par erreur ?', 'exist'],
  ["Effacer quelqu'un de ta mémoire ?", 'exist'],
  // Légères
  ['On dit chocolatine ?', 'leger'],
  ['Chaussettes avec des sandales ?', 'leger'],
  ['Ketchup sur les pâtes ?', 'leger'],
  ['Tu fais ton lit le matin ?', 'leger'],
  ['Tu dors fenêtre ouverte ?', 'leger'],
  ['Tu écoutes les vocaux en accéléré ?', 'leger'],
  ['Les chats mieux que les chiens ?', 'leger'],
  ["Le Nouvel An, c'est surcoté ?", 'leger'],
  ['Télétravail tous les jours ?', 'leger'],
  ['Chez ses parents à 30 ans, ça passe ?', 'leger'],
  ['Tu vivrais à la campagne ?', 'leger'],
  ["Tu vivrais à l'étranger ?", 'leger'],
  ['Tu te ferais un tatouage ?', 'leger'],
  ['Déjà mangé un truc tombé par terre ?', 'leger'],
  ["Déjà fait semblant d'aimer un cadeau ?", 'leger'],
  ['Déjà menti pour esquiver une soirée ?', 'leger'],
  ['Déjà dit « je t\'aime » en premier ?', 'leger'],
  ['Déjà allé au ciné tout seul ?', 'leger'],
  ['Déjà fouillé le tel de ton ex ?', 'leger'],
];

// Tons de l'Adulte : chaud, conf (confessions), dark, societe, cash (sans sexe)
const ADULT = [
  // Fournée 1
  ['Plan à trois ?', 'chaud'],
  ['Sexe pendant les règles ?', 'chaud'],
  ['Sodomie ?', 'chaud'],
  ["Coup d'un soir ?", 'chaud'],
  ['Sextoys en couple ?', 'chaud'],
  ["Coucher avec le parent d'un pote ?", 'chaud'],
  ['Partouze ?', 'chaud'],
  ['Échangisme ?', 'chaud'],
  ['BDSM ?', 'chaud'],
  ['Menottes ?', 'chaud'],
  ['La fessée ?', 'chaud'],
  ['Jeux de rôle au lit ?', 'chaud'],
  ['Sexe entre potes ?', 'chaud'],
  ['Sexe de réconciliation ?', 'chaud'],
  ['Coucher le premier soir, ça passe ?', 'chaud'],
  ['Porno en couple ?', 'chaud'],
  ['Déjà envoyé un nude ?', 'conf'],
  ['Déjà envoyé un nude à la mauvaise personne ?', 'conf'],
  ['Déjà couché avec un(e) collègue ?', 'conf'],
  ['Déjà simulé ?', 'conf'],
  ['Déjà menti sur ton nombre de partenaires ?', 'conf'],
  ["Déjà couché avec l'ex d'un pote ?", 'conf'],
  ["Déjà fait l'amour dans un lieu public ?", 'conf'],
  ['Déjà recouché avec un ex ?', 'conf'],
  ["Déjà dragué quelqu'un en couple ?", 'conf'],
  ['Déjà fait une sextape ?', 'conf'],
  ['Déjà couché avec 2 personnes le même jour ?', 'conf'],
  ['Déjà trompé ?', 'conf'],
  ['Déjà été trompé ?', 'conf'],
  ["Déjà couché avec quelqu'un ici ?", 'conf', 1],
  ['Déjà conduit sans permis ?', 'conf'],
  ['Manger un pote pour survivre ?', 'dark'],
  ['Aider un pote à cacher un corps ?', 'dark'],
  ['Balancer un pote à la police ?', 'dark'],
  ['Vendre ton âme pour réussir ?', 'dark'],
  ['Coucher pour une promotion ?', 'dark'],
  ['Tromper si personne ne le sait jamais ?', 'dark'],
  ['Un bouton : 1 million, mais un inconnu meurt ?', 'dark'],
  ['Tu dénoncerais ton frère ?', 'dark'],
  ['Pour la peine de mort ?', 'societe'],
  ["L'euthanasie, à légaliser ?", 'societe'],
  ['Légaliser le cannabis ?', 'societe'],
  ['Légaliser toutes les drogues ?', 'societe'],
  ['Légaliser la prostitution ?', 'societe'],
  ["Le port d'arme en France ?", 'societe'],
  ['La GPA, à autoriser ?', 'societe'],
  ['Tu crois en Dieu ?', 'societe'],
  ['Service militaire obligatoire ?', 'societe'],
  ['Le revenu universel ?', 'societe'],
  // Fournée 2 — révélations
  ["Tu coucherais avec quelqu'un ici ?", 'chaud', 1],
  ["Déjà embrassé quelqu'un ici ?", 'conf', 1],
  ["Déjà fait un rêve chaud sur quelqu'un ici ?", 'conf', 1],
  ["Tu sortirais avec quelqu'un ici ?", 'chaud', 1],
  ["Déjà eu un crush sur le/la partenaire de quelqu'un ici ?", 'conf', 1],
  ["Déjà dragué l'ex de quelqu'un ici ?", 'conf', 1],
  ["Déjà eu un plan cul avec quelqu'un ici ?", 'conf', 1],
  ["Quelqu'un ici embrasse mal ?", 'chaud', 1],
  ['Un plan à trois avec 2 personnes ici ?', 'chaud', 1],
  ["Déjà raconté la vie sexuelle de quelqu'un ici ?", 'conf', 1],
  ["Tu caches un secret à quelqu'un ici ?", 'cash', 1],
  ["Tu connais un secret de quelqu'un ici ?", 'cash', 1],
  ["Déjà menti à quelqu'un ici ce soir ?", 'cash', 1],
  ["Déjà stalké quelqu'un ici ?", 'conf', 1],
  ['Plus de 10 partenaires ?', 'conf'],
  ["Déjà couché avec quelqu'un de 15 ans de plus ?", 'conf'],
  ['Déjà payé pour du sexe ?', 'conf'],
  ['Déjà envoyé un nude cette semaine ?', 'conf'],
  ["Déjà fantasmé sur quelqu'un ici ?", 'conf', 1],
  // Fournée 3
  ['Sexe en voiture ?', 'chaud'],
  ['Sexe au bureau ?', 'chaud'],
  ['Une relation libre ?', 'chaud'],
  ['Sexe sans sentiments ?', 'chaud'],
  ['Un plan cul régulier ?', 'chaud'],
  ['Tu dors nu ?', 'chaud'],
  ['Déjà eu un plan cul ?', 'conf'],
  ['Déjà couché sans connaître son prénom ?', 'conf'],
  ['Déjà été surpris en plein acte ?', 'conf'],
  ['Déjà fait un strip-tease ?', 'conf'],
  ['Déjà vomi en soirée ?', 'cash'],
  ['Déjà fini au poste ?', 'cash'],
  ["Déjà réveillé sans savoir où t'étais ?", 'cash'],
  // Fournée 4
  ["Quelqu'un ici te plaît ce soir ?", 'chaud', 1],
  ["Quelqu'un ici t'a déjà vu tout nu ?", 'conf', 1],
  ['Déjà fait un plan à trois ?', 'conf'],
  ['Déjà dit un autre prénom au lit ?', 'conf'],
  ["Déjà fait l'amour dans un train ?", 'conf'],
  ['Déjà sexté au boulot ?', 'conf'],
  ['Déjà trompé par vengeance ?', 'conf'],
  ["Déjà couché avec quelqu'un par pitié ?", 'conf'],
  ["Déjà regretté un coup d'un soir ?", 'conf'],
  ["Déjà eu un coup d'un soir en vacances ?", 'conf'],
  ['Sexe sous la douche ?', 'chaud'],
  // Fournée 5 — attirance entre joueurs
  ["Quelqu'un ici serait bon au lit ?", 'chaud', 1],
  ["Quelqu'un ici a un corps de rêve ?", 'chaud', 1],
  ["Déjà pensé à quelqu'un ici pendant l'acte ?", 'conf', 1],
  ["Quelqu'un ici t'a déjà fait des avances ?", 'conf', 1],
  ["Déjà repoussé les avances de quelqu'un ici ?", 'conf', 1],
  ["Déjà dormi dans le même lit que quelqu'un ici ?", 'conf', 1],
  ["Coucher avec quelqu'un ici pour 1 000 € ?", 'chaud', 1],
  ["Quelqu'un ici est trop bien pour son couple ?", 'cash', 1],
  ['Jaloux si 2 personnes ici couchaient ensemble ?', 'chaud', 1],
  ["Déjà envoyé un message chaud à quelqu'un ici ?", 'conf', 1],
  ["T'as un nude de quelqu'un ici ?", 'conf', 1],
  ['Tu ferais un strip-tease devant nous ?', 'chaud', 1],
  ['Tu embrasses ton voisin de gauche ?', 'chaud', 1],
  ["Une nuit avec l'ex de quelqu'un ici ?", 'chaud', 1],
  // Fournée 6 — sans sexe
  ['Déjà menti sur ton salaire ?', 'cash'],
  ["T'as des dettes ?", 'cash'],
  ['Un an de prison pour 1 million ?', 'cash'],
  ["Déjà volé de l'argent à tes parents ?", 'cash'],
  ["T'as un parent préféré ?", 'cash'],
  ['Tes parents en EHPAD, ça passe ?', 'cash'],
  ["T'as déjà eu honte de ta famille ?", 'cash'],
  ['Déjà pris de la drogue ?', 'cash'],
  ['Déjà oublié toute une soirée ?', 'cash'],
  ['Déjà fraudé les impôts ?', 'cash'],
  ['Déjà volé au boulot ?', 'cash'],
  ['Tu montres ton historique de recherche ?', 'cash'],
  ['Tu laisses la table lire ton dernier message ?', 'cash'],
  ['Tu montres ta dernière photo ?', 'cash'],
  ["Quelqu'un ici peut envoyer un message de ton tel ?", 'cash', 1],
  ["T'as un contact enregistré sous un faux nom ?", 'cash'],
  ["T'as déjà supprimé une conversation par peur ?", 'cash'],
];

const toCards = (list, prefix) =>
  list.map(([t, tone, ici], i) => ({ id: `${prefix}${i}`, t, tone, ...(ici ? { ici: 1 } : {}) }));

export const DEBATS_SOFT = toCards(SOFT, 's');
export const DEBATS_ADULT = toCards(ADULT, 'a');

// Nombre de questions par partie (réglage salon) et défaut.
export const DEBATS_COUNTS = [10, 15, 20, 25];
export const DEBATS_DEFAULT_COUNT = 20;
// Marques de minorité avant de devenir MOUTON NOIR (puis retour à 0).
export const MOUTON_AT = 3;
// Part de cartes Adulte en option Adulte (le reste = Soft, pour respirer).
const ADULT_SHARE = 0.7;

// Le mode n'est visible que sur la preview Vercel / en dev / avec ?debats,
// tant que l'achat n'est pas branché : un merge accidentel sur main ne le
// rend pas public (ni gratuit) sur snaptapparty.com ni dans l'app.
export function debatsAvailable() {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h.endsWith('.vercel.app') || new URLSearchParams(window.location.search).has('debats');
}

// ---------- Anti-répétition (tel de l'hôte) ----------
const seenKey = (deck) => `st_debats_seen_${deck}`;
function readSeen(deck) {
  try {
    const v = JSON.parse(localStorage.getItem(seenKey(deck)) || '[]');
    return new Set(Array.isArray(v) ? v : []);
  } catch {
    return new Set();
  }
}
function writeSeen(deck, set) {
  try {
    localStorage.setItem(seenKey(deck), JSON.stringify([...set]));
  } catch {
    /* stockage indisponible : on joue sans mémoire */
  }
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tire `n` cartes d'une liste en privilégiant celles jamais vues sur ce tel.
// Quand il n'en reste plus assez, la mémoire repart de zéro.
function drawFresh(cards, n, deck) {
  let seen = readSeen(deck);
  let fresh = cards.filter((c) => !seen.has(c.id));
  if (fresh.length < n) {
    seen = new Set();
    fresh = cards;
  }
  const picked = shuffled(fresh).slice(0, n);
  picked.forEach((c) => seen.add(c.id));
  writeSeen(deck, seen);
  return picked;
}

// Ordonne les cartes pour alterner les tons : jamais 3 fois le même ton
// d'affilée (dans la mesure du possible) et, en Soft, une seule carte "ici"
// par partie (en Adulte c'est la signature du mode : pas de limite).
function arrange(cards, { maxIci }) {
  let ici = 0;
  const rest = [];
  const pool = [];
  cards.forEach((c) => {
    if (c.ici && maxIci != null) {
      if (ici < maxIci) {
        ici++;
        pool.push(c);
      } else rest.push(c);
    } else pool.push(c);
  });
  const out = [];
  let remaining = shuffled(pool);
  while (remaining.length) {
    const a = out[out.length - 1];
    const b = out[out.length - 2];
    const blocked = a && b && a.tone === b.tone ? a.tone : null;
    let idx = remaining.findIndex((c) => c.tone !== blocked);
    if (idx < 0) idx = 0;
    out.push(remaining[idx]);
    remaining = remaining.filter((_, i) => i !== idx);
  }
  return { out, dropped: rest };
}

// Sélection des questions d'une partie. deck = 'soft' | 'adult'.
export function pickDebatQuestions(deck, n) {
  if (deck === 'adult') {
    const nAdult = Math.round(n * ADULT_SHARE);
    const cards = [
      ...drawFresh(DEBATS_ADULT, nAdult, 'adult'),
      ...drawFresh(DEBATS_SOFT, n - nAdult, 'soft'),
    ];
    return arrange(cards, { maxIci: null }).out.map(({ t, tone }) => ({ t, tone }));
  }
  // Soft : on tire un peu plus pour remplacer les cartes "ici" en trop.
  const { out } = arrange(drawFresh(DEBATS_SOFT, n + 4, 'soft'), { maxIci: 1 });
  return out.slice(0, n).map(({ t, tone }) => ({ t, tone }));
}

// ---------- Gages du MOUTON NOIR (mode Normal, sans alcool) ----------
// Validés par l'utilisateur le 24/09/2026. La TABLE vote parmi 3 gages tirés
// au hasard, dont toujours au moins 1 calme (pour les timides).
// Format : [texte, 'calme' | 'show', durable?]. Durable = règle qui tient
// jusqu'au prochain mouton noir.
const GAGES = [
  ['10 squats.', 'calme'],
  ['La planche, 20 secondes.', 'calme'],
  ['10 pompes.', 'calme'],
  ['Danse 10 secondes sans musique.', 'show'],
  ['Chaise contre le mur, 20 secondes.', 'calme'],
  ['3 tours sur toi-même, puis marche droit.', 'calme'],
  ["Tiens sur un pied jusqu'à la prochaine question.", 'calme'],
  ['Chante un refrain.', 'show'],
  ['Mime un film, la table devine.', 'show'],
  ["Imite quelqu'un ici, la table devine qui.", 'show'],
  ["Ton meilleur cri d'animal.", 'show'],
  ['Rappe ta journée en 4 phrases.', 'show'],
  ['Fais une pub pour ton voisin de droite.', 'show'],
  ['Présente la météo comme à la télé.', 'show'],
  ['Discours de mariage pour 2 joueurs.', 'show'],
  ['Présente-toi comme dans une télé-réalité.', 'show'],
  ['Raconte ta pire honte.', 'show'],
  ['Raconte ton pire date.', 'show'],
  ['Avoue ton plaisir coupable.', 'show'],
  ['Dis ta pire habitude.', 'show'],
  ['Raconte ton plus gros mensonge.', 'show'],
  ['Un compliment à chaque joueur.', 'calme'],
  ["Déclaration d'amour à ton voisin de droite.", 'show'],
  ['Dis ce que tu préfères chez ton voisin de gauche.', 'show'],
  ['Serre la main de tout le monde, très sérieusement.', 'calme'],
  ['Câlin au joueur de ton choix.', 'show'],
  ['Regarde ton voisin dans les yeux 20 s sans rire.', 'calme'],
  ['Reste sérieux, la table essaie de te faire rire.', 'show'],
  ["Fais rire quelqu'un en 10 secondes.", 'show'],
  ['La table te pose une question, tu réponds.', 'show'],
  ['La table te choisit un surnom pour la partie.', 'calme'],
  ['Ton voisin de droite te coiffe.', 'show'],
  ['La table choisit ta pose pour une photo.', 'show'],
  ['Échange ta place avec qui tu veux.', 'calme'],
  ["Montre ton fond d'écran.", 'calme'],
  ['Montre ta dernière photo.', 'calme'],
  ['5 capitales en 10 secondes.', 'calme'],
  ["L'alphabet à l'envers jusqu'à M.", 'calme'],
  ['Parle avec un accent.', 'show', 1],
  ['Parle de toi à la 3ᵉ personne.', 'show', 1],
  ['Interdit de dire « oui » ou « non » à voix haute.', 'calme', 1],
  ['Finis chaque phrase par « mon capitaine ».', 'show', 1],
  ['Interdit de montrer tes dents.', 'calme', 1],
  ['Lève la main avant de parler.', 'calme', 1],
  ['Vouvoie tout le monde.', 'calme', 1],
  ['Parle en chuchotant.', 'calme', 1],
  ['Appelle tout le monde « chef ».', 'calme', 1],
  ['Interdit de dire les prénoms.', 'calme', 1],
  ['Parle comme un robot.', 'show', 1],
  ['Rime à chaque phrase.', 'show', 1],
].map(([t, kind, durable]) => ({ t, kind, ...(durable ? { durable: 1 } : {}) }));

// Temps de vote de la table (ms).
export const GAGE_VOTE_MS = 15000;

// 3 gages au hasard : 1 calme garanti + 2 autres, mélangés.
export function pickGageOptions() {
  const calm = shuffled(GAGES.filter((g) => g.kind === 'calme'));
  const first = calm[0];
  const rest = shuffled(GAGES.filter((g) => g !== first)).slice(0, 2);
  return shuffled([first, ...rest]);
}
