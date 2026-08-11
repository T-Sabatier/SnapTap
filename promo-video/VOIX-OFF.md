# Voix off de la vidéo de présentation (SnapTapPresentation)

Vidéo de ~27 s, rythme Reels : phrases courtes, débit énergique. Les
sous-titres incrustés affichent ce texte (sauf quand il est déjà en énorme à
l'écran). Génère la voix sur ElevenLabs avec ce script, puis pose-la sur le
MP4 (CapCut) ou dépose le fichier dans `public/voix-off.mp3` et passe
`USE_VOICE` à `true` dans `src/Presentation.jsx` avant de re-render.

Conseils ElevenLabs : voix française jeune et énergique, débit rapide (style
créateur TikTok, pas voix de pub). Génère UN CLIP PAR LIGNE : plus facile à
caler, et si une ligne déborde tu ajustes juste son `sec` dans `SEGMENTS`
(src/Presentation.jsx) puis `npm run render-presentation`.

## Script (timecodes indicatifs)

| Début | Durée | Texte à lire |
|-------|-------|--------------|
| 0:00.0 | 1,6 s | Tu crois connaître tes potes ? |
| 0:01.6 | 1,3 s | Prouve-le. |
| 0:02.9 | 2,3 s | Léa veut ce qu'elle aime. |
| 0:05.2 | 2,8 s | Pose la carte qui lui va le mieux. |
| 0:08.0 | 3,2 s | Elle choisit à l'aveugle. |
| 0:11.2 | 2,6 s | C'est ta carte ? Plus un point ! |
| 0:13.8 | 1,6 s | Et en mode apéro ? |
| 0:15.4 | 3,0 s | Chaque carte a sa règle à boire ! |
| 0:18.4 | 2,2 s | Trois à seize joueurs. Gratuit. |
| 0:20.6 | 2,6 s | Snap Tap. Lien en bio ! |

Fin : 0:23.2 (696 frames à 30 fps).

## Si l'audio ne rentre pas dans un segment

1. Ouvre `src/Presentation.jsx`, table `SEGMENTS` en tête de fichier.
2. Change le `sec` du segment concerné (les suivants se décalent tout seuls).
3. `npm run render-presentation` (depuis promo-video/). Le MP4 sort dans
   `store-assets/promo/snap-tap-presentation-1080x1920.mp4`.
