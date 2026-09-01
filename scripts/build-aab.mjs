// Build complet de l'AAB Play Store en UNE commande : npm run aab
//   1) build web  2) cap sync android  3) bundleRelease (signé)
//   4) copie l'AAB TOUJOURS au même endroit + archive versionnée.
// Fini de chercher dans android/app/build/outputs/... 🙃
import { execSync } from 'node:child_process';
import { readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const run = (cmd, cwd) => {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: cwd || root, stdio: 'inherit' });
};

// --- Build ---
run('npm run build');
run('npx cap sync android');
run(process.platform === 'win32' ? '.\\gradlew.bat bundleRelease' : './gradlew bundleRelease', join(root, 'android'));

// --- Version (pour nommer l'archive) ---
const gradle = readFileSync(join(root, 'android', 'app', 'build.gradle'), 'utf8');
const vName = (gradle.match(/versionName\s+"([^"]+)"/) || [])[1] || 'x';
const vCode = (gradle.match(/versionCode\s+(\d+)/) || [])[1] || '0';

// --- Copie ---
// UN SEUL dossier : snap-tap-store/Versions/, fichier nommé à la suite des
// autres (snap-tap-v<name>-vc<code>.aab). Celui à uploader = le + haut vc.
const src = join(root, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
// (01/09/2026 : dossier déménagé par l'utilisateur dans "Snaptap Ressources")
const versionsDir = 'C:/Users/Valky/Desktop/Snaptap Ressources/snap-tap-store/Versions';
mkdirSync(versionsDir, { recursive: true });

const archive = join(versionsDir, `snap-tap-v${vName}-vc${vCode}.aab`);
copyFileSync(src, archive);

console.log(`\n✅ AAB v${vName} (vc${vCode}) prêt.`);
console.log(`   >>> À UPLOADER : ${archive}`);
