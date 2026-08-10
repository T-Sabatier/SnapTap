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
Sujet clivant + 2 camps. La minorité paie. Chaque carte porte ses 2 boutons
(POUR/CONTRE, CHAUD/PAS CHAUD, JE L'AI FAIT/JAMAIS, ÇA ME TENTE/JAMAIS…).

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

## 🗳️ Débats société (pour/contre — la minorité paie)
- La peine de mort — POUR / CONTRE
- L'avortement — POUR / CONTRE
- L'euthanasie — POUR / CONTRE
- Légaliser toutes les drogues — POUR / CONTRE
- La prostitution légale — POUR / CONTRE
- Le port d'armes — POUR / CONTRE
- La GPA (mère porteuse) — POUR / CONTRE
- Le mariage, une arnaque ? — D'ACCORD / PAS D'ACCORD
- La monogamie — À VIE / SURCÔTÉ
- Un enfant avant 25 ans — POUR / JAMAIS

## 🔥 Débats intimes / tabou
- Sexe pendant les règles — CHAUD / PAS CHAUD
- Le plan à trois — CHAUD / JAMAIS
- Coucher le premier soir — POUR / FAUT ATTENDRE
- Tromper, c'est impardonnable ? — OUI / ÇA DÉPEND
- La sodomie — POUR / CONTRE
- Le sexe sans sentiments — POUR / IMPOSSIBLE
- Un coup d'un soir — POUR / JAMAIS
- Les sextoys dans le couple — POUR / BOF

## 😳 Confessions (déjà fait / jamais)
- Fouiller le tel de son/sa partenaire — JE L'AI FAIT / JAMAIS
- Stalker son ex sur Insta — CETTE SEMAINE / JAMAIS
- Envoyer un nude — DÉJÀ FAIT / JAMAIS
- Coucher avec un(e) collègue — DÉJÀ FAIT / JAMAIS
- Simuler un orgasme — DÉJÀ FAIT / JAMAIS
- Mentir sur son nombre de partenaires — DÉJÀ FAIT / JAMAIS

## 😈 Would you (je le ferais / jamais)
- Manger un pote pour survivre — JE LE FERAIS / JAMAIS
- Aider un pote à cacher un corps — JE PRENDS LA PELLE / J'APPELLE LES FLICS
- Coucher avec le parent d'un pote — ÇA ME TENTE / JAMAIS
- Garder un portefeuille plein trouvé par terre — JE GARDE / JE RENDS
- Balancer un pote à la police — ÇA DÉPEND / JAMAIS

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
