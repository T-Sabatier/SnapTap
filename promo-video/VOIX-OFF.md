# Voix off de la vidéo de présentation (SnapTapPresentation)

La vidéo dure ~43 s, les sous-titres sont incrustés et affichent EXACTEMENT
ce texte. Génère la voix sur ElevenLabs avec ce script, puis pose-la sur le
MP4 (CapCut) ou dépose le fichier dans `public/voix-off.mp3` et passe
`USE_VOICE` à `true` dans `src/Presentation.jsx` avant de re-render.

Conseils ElevenLabs : une voix française naturelle et enjouée (pas
« publicité radio »), stabilité moyenne pour garder du peps. Génère de
préférence UN CLIP PAR LIGNE : c'est plus facile à caler sur les timecodes,
et si une ligne déborde tu ajustes juste son `sec` dans `SEGMENTS`
(src/Presentation.jsx) et tu re-render : `npm run render-presentation`.

## Script (timecodes indicatifs)

| Début | Durée | Texte à lire |
|-------|-------|--------------|
| 0:00.0 | 4,5 s | Snap Tap, c'est le jeu qui teste si tes potes te connaissent vraiment. |
| 0:04.5 | 5,0 s | À chaque manche, un joueur annonce s'il veut ce qu'il aime… ou ce qu'il déteste. |
| 0:09.5 | 4,5 s | Les autres posent la carte qui lui correspond le mieux. |
| 0:14.0 | 4,5 s | Elle choisit sa préférée, sans savoir qui a posé quoi. |
| 0:18.5 | 3,5 s | Si c'est ta carte : plus un point. |
| 0:22.0 | 3,0 s | Premier à cinq points, victoire. |
| 0:25.0 | 3,5 s | Et pour pimenter la soirée : le mode apéro. |
| 0:28.5 | 5,0 s | Chaque carte déclenche sa règle à boire. Et le gagnant, lui, ne boit jamais. |
| 0:33.5 | 4,5 s | De 3 à 16 joueurs, chacun sur son téléphone. Gratuit, sans compte. |
| 0:38.0 | 5,0 s | Snap Tap, sur le Play Store et sur snaptapparty.com. |

Fin : 0:43.0 (1290 frames à 30 fps).

## Si l'audio ne rentre pas dans un segment

1. Ouvre `src/Presentation.jsx`, table `SEGMENTS` en tête de fichier.
2. Change le `sec` du segment concerné (les suivants se décalent tout seuls).
3. `npm run render-presentation` (depuis promo-video/). Le MP4 sort dans
   `store-assets/promo/snap-tap-presentation-1080x1920.mp4`.
