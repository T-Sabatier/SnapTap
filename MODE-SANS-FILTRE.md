# Mode "Sans Filtre" — Spec (à préparer, sortie plus tard)

> ⚠️ **NE PAS SORTIR AVANT QUE L'APP AIT PRIS.** Ce mode fait passer TOUTE l'app
> en **18+** (IARC note sur le contenu le plus hard accessible, même payant).
> Le sortir = update marketing planifié + re-remplir le questionnaire IARC.
> Alternative : garder ce mode **web-only** pour que l'app Android reste PEGI 12.

## Concept
Un mode party/débat, séparé de Normal et Apéro. Fini "devine le boss".
Ici : **un sujet clivant tombe, chacun choisit son camp en secret, on révèle
les camps, le camp minoritaire paie.** Le fun = l'engueulade qui part à table.

## Déroulé d'un tour
1. Une carte s'affiche sur **tous les téléphones** en même temps.
2. Chacun tape **son camp en secret** (2 boutons, ex. POUR / CONTRE).
3. Tout le monde a répondu → **RÉVÉLATION** : les 2 camps avec pseudos colorés.
4. **Le camp minoritaire paie** (forfait, voir plus bas).
5. **"DÉBATTEZ !"** — court temps pour que ça s'embrouille, puis manche suivante.

Pas de "boss", pas de points → mode 100% party/débat/à boire.

## Règles à boire (cartes DÉBAT)
- **Minorité** → paie 2 (t'es seul de ton avis = t'assumes).
- **Égalité** (3 vs 3) → tout le monde boit 1 (au débat !).
- **Unanimité** → tout le monde trinque 1 (rare, on fête l'accord).

## Les 2 types de cartes
### 1. DÉBAT (le cœur)
Sujet clivant + 2 camps. La minorité paie. **Boutons HARMONISÉS : seulement 3
paires** (pas un truc différent à chaque carte) :
- **POUR / CONTRE** → opinions & débats (+ les "would you", POUR = je le ferais)
- **CHAUD / PAS CHAUD** → "ça te tente ?" (sexe)
- **DÉJÀ FAIT / JAMAIS** → confessions

### 2. DÉFI (intercalé, pour le rythme façon Picolo)
Défi direct qui désigne quelqu'un (dernier à…, vote…, le plus…). Forfait boire,
ou strip si activé.

## Réglage "Strip" (ON/OFF, choisi par l'hôte à la création)
- **OFF (par défaut)** → forfait = **toujours boire**. Jouable partout, sans gêne.
- **ON** → strip **intercalé de temps en temps** (PAS tous les tours) + **légère
  escalade** vers la fin (plus on avance, plus le forfait pousse vers le strip).
- Forfait strip = **"retire un vêtement OU bois"** (au choix) → même activé,
  personne n'est forcé. Consensuel.

## Intégration technique (à coder à l'étape 2)
- **3ᵉ mode** à côté de Normal / Apéro (switch sur l'accueil).
- **Deck séparé** : node Firebase dédié. Structure carte :
  `{ text, type: 'debat'|'defi', a?, b?, strip?: bool }`.
- Réutilise l'infra : rooms, tel par joueur, révélation, pseudos colorés.
- Nouvelle boucle : afficher carte → collecter réponses (rooms/$code/answers)
  → révéler split → forfait → suivant. Réglage `settings.strip`.
- **Premium 18+** (comme Apéro/Coquin).

---

# Première fournée de cartes

## 🗳️ POUR / CONTRE (opinions, débats, "would you") — 37
**Sociétal**
- La peine de mort
- L'avortement
- L'euthanasie
- Légaliser toutes les drogues
- La légalisation du cannabis
- La prostitution légale
- Le port d'armes
- La GPA (mère porteuse)
- La religion / croire en Dieu
- La chirurgie esthétique à 20 ans
- Le véganisme
- La corrida
- La chasse
- Le nucléaire
- Le revenu universel
- Le service militaire obligatoire
- Les zoos (animaux en captivité)

**Couple / relations**
- La monogamie
- Le mariage, une arnaque ?
- Un enfant avant 25 ans
- Coucher le premier soir
- Le sexe sans sentiments
- Pardonner une infidélité
- Rester ami avec son ex
- Un compte bancaire commun
- Payer l'addition au 1er rendez-vous
- Rester ensemble "pour les enfants"
- Dire à ton pote que sa/son partenaire le trompe
- Le contrat de mariage (prénup)
- Regarder du porno en couple

**Moral / dark / would-you**
- Manger un pote pour survivre
- Aider un pote à cacher un corps
- Garder un portefeuille plein trouvé par terre
- Balancer un pote à la police
- Vendre son âme pour réussir
- Connaître la date de sa mort
- Coucher pour une promotion

## 🔥 CHAUD / PAS CHAUD (ça te tente ?) — 14
- Sexe pendant les règles
- Le plan à trois
- La sodomie
- Un coup d'un soir
- Les sextoys dans le couple
- Coucher avec le parent d'un pote
- La partouze
- L'échangisme
- Le BDSM (domination / soumission)
- Les menottes
- La fessée
- Les jeux de rôle au lit
- Le sexe entre amis (friends with benefits)
- Le sexe réconciliation

## 😳 DÉJÀ FAIT / JAMAIS (confessions) — 23
- Fouiller le tel de son/sa partenaire
- Stalker son ex sur Insta
- Envoyer un nude
- Envoyer un nude à la mauvaise personne
- Coucher avec un(e) collègue
- Simuler un orgasme
- Mentir sur son nombre de partenaires
- Coucher avec quelqu'un rencontré le soir même
- Coucher avec l'ex d'un(e) pote
- Faire l'amour dans un lieu public
- Recoucher avec un ex
- Draguer quelqu'un en couple
- Se filmer (sextape)
- Coucher avec deux personnes le même jour
- Répondre à un ex à 3h du mat
- Tromper quelqu'un
- Ghoster quelqu'un du jour au lendemain
- Faire semblant d'aimer un cadeau de merde
- Mentir sur où on était à son/sa partenaire
- Voler un truc en magasin
- Resquiller dans le train / le métro
- Pisser dans une piscine
- Conduire sans permis

## 🎯 Défis (forfait boire — toujours dispo)
- Le dernier à lever la main boit 3
- Vote : le plus susceptible de finir à poil ce soir boit 2
- Le plus vieux et le plus jeune de la table trinquent : 2 chacun
- Vote : le plus gros dragueur boit 2

## 👕 Défis STRIP (seulement si Strip = ON, occasionnels + escalade)
- Vote : le plus sexy de la table retire un haut ou boit 3
- Le dernier à toucher son nez : retire un vêtement ou bois 3
- Celui qui a le plus de fringues sur lui en enlève une (ou distribue 3)
- @Fais un pas de strip-tease de 5 sec ou retire un vêtement
- Vote : le plus coincé retire un vêtement ou cul-sec

## Lignes rouges (contenu — jamais)
Mineurs, non-consentement/viol, zoophilie/inceste, haine sur un groupe,
apologie d'un truc qui tue (volant bourré, suicide). En dehors : open bar.
