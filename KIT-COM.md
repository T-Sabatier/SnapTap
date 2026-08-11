# Kit com Snap Tap (textes prêts à envoyer)

Tout est à copier-coller tel quel, ou presque : remplace `[lien]` par le lien
Play Store une fois l'app validée, et `[prénom]` par ton prénom quand tu
écris à quelqu'un. Règle valable partout : jamais de vraie personne ni de
marque déposée dans la com (dans le jeu ça va, en pub non).

Lien Play Store : https://play.google.com/store/apps/details?id=com.snaptap.game
Lien web (pour jouer sans installer) : https://www.snaptapparty.com

---

## 1. WhatsApp, le jour du lancement

### Message pour tes groupes de potes

```
Ça y est, mon jeu est sur le Play Store 🍻

Snap Tap, le jeu de cartes où tu devines ce que les autres aiment ou détestent. On y a peut-être déjà joué ensemble, là c'est la version officielle.

C'est gratuit, pas de compte à créer, jouable de 3 à 16. Franchement le meilleur truc que vous pouvez faire pour moi : l'installer et laisser 5 étoiles, ça prend 30 secondes et pour un lancement ça change tout.

[lien]
```

### Message perso (à envoyer en direct, pas en groupe)

```
Hey ! Mon jeu vient de sortir sur le Play Store 🎉 Tu peux me rendre un service ? Installe-le et mets-moi une note avec un petit com, même une ligne. Les 20 premiers avis décident si l'app décolle ou pas. Je te revaudrai ça à l'apéro 😄
[lien]
```

### Relance avis (pour ceux qui ont installé mais rien mis)

```
Merci d'avoir installé Snap Tap ! Si t'as 30 secondes, une note 5 étoiles sur le Play Store m'aiderait vraiment. C'est bête mais c'est ce que les gens regardent en premier avant de télécharger.
```

---

## 2. Bios réseaux sociaux

### Instagram / TikTok

```
Le jeu de soirée qui teste si tes potes te connaissent vraiment 🃏
3 à 16 joueurs, gratuit, sans compte
👇 Joue maintenant
```

Mets le lien Play Store en bio (ou le site, qui propose les deux).

---

## 3. Légendes de posts

À coller sous les visuels de `store-assets/promo/`. Varie, ne mets pas
toujours la même. Hashtags en fin de légende, 3 ou 4 max : #jeudesoiree
#jeudapero #soireeentrepotes #snaptap

### Pour les mèmes cartes

```
Tout le monde a un pote comme ça.
```

```
On a tous une position très ferme sur le sujet.
```

```
Carte réelle du jeu. On assume.
```

### Pour les duels « Plutôt X ou Y »

```
Débat. Tranchez en commentaire.
```

```
Il y a deux types de personnes. Vous êtes lesquels ?
```

```
Question qui a détruit des amitiés. À vous.
```

### Pour le carrousel « comment on joue » (store-assets/promo/carousel/, 6 slides dans l'ordre)

```
Le principe en 4 étapes. Tu crois connaître tes potes, le jeu vérifie. Gratuit, sans compte, lien en bio.
```

À publier en post épinglé : c'est lui qui apprend les règles aux visiteurs
du profil. Regénérable via `node scripts/gen-carousel.mjs`.

### Pour la vidéo de gameplay

```
Snap Tap : tu crois connaître tes potes, le jeu vérifie. Gratuit sur le Play Store, lien en bio.
```

---

## 4. DM micro-influenceurs

Qui viser : des comptes français entre 5 000 et 50 000 abonnés qui parlent
jeux de société, soirées, apéro ou couple/amitié. Les petits comptes
répondent, les gros non. Cherche « jeu de soirée », « jeu d'apéro », « soirée
jeux » sur TikTok et Insta et remonte les créateurs qui reviennent.

Ce que tu offres : des codes promo Play Console pour débloquer les packs
(gratuits à générer, menu Monétisation > Promotions > Codes promotionnels).
Pour eux, et un lot pour leurs abonnés s'ils veulent faire un concours.

### Le message

```
Salut ! Je m'appelle [prénom], je développe en solo un jeu de soirée mobile qui vient de sortir : Snap Tap. Le principe : à chaque manche, tu devines ce que tes potes aiment ou détestent. Gratuit, sans compte, jusqu'à 16 joueurs sur leurs téléphones.

Je vais être direct : j'ai pas de budget pub 😅 Mais si le concept te parle, je t'offre les packs premium (et des codes pour tes abonnés si tu veux faire un concours). Zéro obligation derrière, teste d'abord et vois si ça te plaît.

Le jeu : [lien]
```

### Relance (une seule, une semaine après, s'il n'a pas répondu)

```
Hello, je me permets une petite relance au cas où mon message soit passé à la trappe. Si c'est pas ton délire, aucun souci, bonne continuation !
```

---

## 5. Pitch pour les bars (affiche QR)

L'affiche A4 est prête dans `store-assets/promo/` (300dpi, à imprimer).
Vise les bars où les gens restent en groupe : bars à bières, bars à jeux,
cafés étudiants. Le bon moment : en semaine vers 17h, quand c'est calme.

### Ce que tu dis au comptoir

```
Bonjour ! Je suis développeur indépendant, j'ai créé un jeu d'apéro qui se joue sur téléphone, entre 3 et 16 personnes autour d'une table. C'est gratuit, il n'y a rien à installer pour essayer, on scanne un QR code et ça démarre. Je cherche quelques bars sympas qui accepteraient d'afficher une petite affiche A4. Ça occupe les tables et ça fait rester les gens. Je vous en laisse une ?
```

S'il hésite, propose-lui de tester en direct sur son téléphone, la partie
se lance en 30 secondes. C'est ta meilleure démo.

---

## 6. Story de lancement

Le visuel est déjà généré (`store-assets/promo/`). Texte à mettre par-dessus
ou en légende :

```
Après des mois de taf, mon jeu est enfin sur le Play Store 🎉 Gratuit, sans compte. Venez tester et dites-moi tout.
```

---

## 7. Rythme de publication

Deux posts par semaine, pas plus, avec le stock de visuels (regénérable via
`node scripts/gen-promo.mjs` en changeant les listes en tête de script) :

- un mème carte en début de semaine
- un duel « Plutôt X ou Y » le jeudi ou vendredi (les gens préparent leur
  week-end, c'est le bon créneau)

Réponds aux commentaires sous les duels, c'est le but du format : chaque
réponse relance le post dans l'algorithme.

---

## Rappels

- Les 15 premiers avis Play Store comptent plus que n'importe quel post.
  C'est l'action numéro 1 du jour de lancement.
- Le vrai moteur reste les soirées en vrai : chaque partie jouée = des
  téléphones qui scannent ton QR. Les réseaux entretiennent, les soirées
  convertissent.
- Pas de pub payante pour l'instant (décision du 19/07), on ne filme rien,
  on ne joue pas la comédie : les visuels et la vidéo Remotion font le boulot.
