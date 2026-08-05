// Carnet FRANÇAIS. Chaque clé a son équivalent dans les autres carnets.
// Le HTML simple (<b>) dans certaines valeurs est rendu via dangerouslySetInnerHTML.
export const fr = {
  common: {
    language: 'Langue',
    close: 'Fermer',
  },
  settings: {
    title: 'Paramètres',
    language: 'Langue',
  },
  home: {
    yourName: 'Ton prénom',
    namePlaceholder: 'Prénom…',
    start: 'Lancer',
    create: 'Créer une partie',
    orJoinCode: 'Ou rejoins avec un code',
    codePlaceholder: 'CODE',
    join: 'Rejoindre',
    taglineNormal: "Devine ce qu'ils aiment ou pas…",
    taglineApero: 'Mode apéro : les cartes font boire',
    invitedTitle: 'Tu as été invité dans la room',
    invitedSub: 'Mets ton prénom et rejoins 👇',
    shopButton: 'Boutique',
    joinTitle: 'Tu rejoins la partie',
    joinInstead: 'Ou créer une partie à la place',
  },
  apero: {
    name: 'Mode Apéro',
    onLabel: 'Activé · les cartes font boire !',
    offLabel: 'Jeu à boire · active-le',
    premiumSub: 'Jeu à boire · premium',
    premiumTag: 'Premium · jeu à boire',
    teaserDesc:
      'Transforme Snap Tap en <b>jeu à boire</b> : chaque carte choisie déclenche une règle qui fait boire la table.',
    teaserHost: "L'hôte débloque, <b>tout le salon</b> en profite.",
  },
  rules: {
    title: 'Règles',
    titleApero: '🍻 Règles apéro',
    normal: [
      '• 3 joueurs minimum, chacun sur son appareil',
      '• Main de <b>7 cartes</b> chacun',
      "• Un joueur tiré au sort annonce <b>J'AIME</b> ou <b>J'AIME PAS</b>",
      '• Les autres posent une carte face cachée',
      '• Il choisit sa carte préférée → <b>+1 point</b>',
      '• Premier à <b>5 points</b> gagne',
    ],
    apero: [
      '• 3 joueurs minimum, chacun sur son appareil',
      "• Un joueur annonce <b>J'AIME</b> ou <b>J'AIME PAS</b>",
      '• Il choisit sa carte préférée → <b>+1 point</b>',
      '• La carte choisie déclenche <b>une règle à boire</b>',
      '• <b>Le boss et le gagnant ne boivent jamais</b>',
    ],
  },
  shop: {
    title: '🛒 Boutique',
    subtitle: 'Packs premium',
    mobileOnly: "Achats disponibles uniquement sur l'app mobile",
    mobileOnlyLong: "Ces packs s'achètent dans l'app mobile",
    owned: 'Débloqué',
    buy: 'Acheter {price}',
    restore: 'Restaurer mes achats',
    aperoName: 'Mode Apéro',
    aperoDesc:
      'Le jeu à boire : chaque carte choisie fait boire la table. Inclut la catégorie « Bourré·e ».',
    ultraName: 'Pack Ultra',
    ultraDesc:
      '7 catégories premium : Coquin (+18), Jeux vidéo, Dessins animés, Tech, Culture FR, Mode, Politique.',
  },
  footer: {
    privacy: 'Confidentialité',
    terms: 'Conditions',
    legal: 'Mentions légales',
  },
  errors: {
    errorPrefix: 'Erreur : ',
    enterName: 'Mets ton prénom',
    cantCreate: 'Impossible de créer une room, réessaye',
    firebaseRules: 'Erreur Firebase : vérifie tes règles (mode test)',
    codeLength: 'Le code fait 4 lettres',
    invalidCode: 'Code invalide',
    roomNotFound: 'Room introuvable',
    gameInProgress: 'Partie déjà en cours dans cette room',
    roomFull: 'Room complète ({max} joueurs max)',
    firebaseConfig: 'Erreur Firebase : vérifie ta config .env',
  },
};
