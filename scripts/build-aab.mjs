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

// --- Copies ---
const src = join(root, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const storeDir = 'C:/Users/Valky/Desktop/snap-tap-store';
const versionsDir = join(storeDir, 'Versions');
mkdirSync(versionsDir, { recursive: true });

const latest = join(storeDir, 'snap-tap-LATEST.aab');
const archive = join(versionsDir, `snap-tap-v${vName}-vc${vCode}.aab`);
copyFileSync(src, latest);
copyFileSync(src, archive);

console.log(`\n✅ AAB v${vName} (vc${vCode}) prêt.`);
console.log(`   À UPLOADER  → ${latest}`);
console.log(`   Archive     → ${archive}`);
