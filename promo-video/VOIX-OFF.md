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
| 0:00.0 | 2,0 s | Tu crois connaître tes potes ? |
| 0:02.0 | 1,5 s | Prouve-le. |
| 0:03.5 | 2,8 s | Léa veut ce qu'elle aime. |
| 0:06.3 | 3,2 s | Pose la carte qui lui va le mieux. |
| 0:09.5 | 3,5 s | Elle choisit à l'aveugle. |
| 0:13.0 | 3,0 s | C'est ta carte ? Plus un point ! |
| 0:16.0 | 2,0 s | Et en mode apéro ? |
| 0:18.0 | 3,5 s | Chaque carte a sa règle à boire ! |
| 0:21.5 | 2,5 s | Trois à seize joueurs. Gratuit. |
| 0:24.0 | 3,0 s | Snap Tap. Lien en bio ! |

Fin : 0:27.0 (810 frames à 30 fps).

## Si l'audio ne rentre pas dans un segment

1. Ouvre `src/Presentation.jsx`, table `SEGMENTS` en tête de fichier.
2. Change le `sec` du segment concerné (les suivants se décalent tout seuls).
3. `npm run render-presentation` (depuis promo-video/). Le MP4 sort dans
   `store-assets/promo/snap-tap-presentation-1080x1920.mp4`.
