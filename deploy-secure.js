import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Encryption Logic (Same as crypto.ts/encrypt-key.js)
const encrypt = (text) => {
    const salt = "J@#$9s0d";
    const textToChars = (t) => t.split("").map((c) => c.charCodeAt(0));
    const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
    const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);
    return textToChars(text).map(applySaltToChar).map(byteHex).join("");
};

// 1. Read .env to find the PLAIN key
const envPath = path.join(__dirname, '.env');
let plainKey = '';
let fileContent = '';

if (fs.existsSync(envPath)) {
    fileContent = fs.readFileSync(envPath, 'utf-8');
    const match = fileContent.match(/VITE_GEMINI_API_KEY=(.+)/);
    if (match && match[1]) {
        plainKey = match[1].trim();
    }
}

if (!plainKey) {
    console.log("⚠️ No VITE_GEMINI_API_KEY found in .env. Assuming key is already encrypted or not set.");
}

// 2. Prepare Environment for Build
const env = { ...process.env };
if (plainKey) {
    console.log("🔒 Encrypting API Key for build...");
    const encryptedKey = encrypt(plainKey);
    env.VITE_GEMINI_API_KEY_ENCRYPTED = encryptedKey;

    // CRITICAL: Remove the plain key so Vite doesn't inline it!
    delete env.VITE_GEMINI_API_KEY;
    // Also remove from the loaded content if it was loaded by dotenv inside Vite (Vite does load .env files)
    // To be absolutely sure, we can temporarily rename .env, but that's risky if the script crashes.
    // Instead, we will rely on defining the variables explicitly in the build command or relying on the fact that we passed `env` 
    // BUT Vite loads .env from file system automatically.
    // To prevent Vite from loading .env, we can pass `--mode production` (standard via vite build) 
    // BUT Vite STILL loads .env!
    // We must ensure Vite does NOT see the plain key.
}

console.log("🚀 Starting Secure Build...");

// Strategy to prevent Vite from reading the plain key from .env file:
// We will rename .env to .env.backup temporarily during the build.
if (fs.existsSync(envPath)) {
    fs.renameSync(envPath, path.join(__dirname, '.env.backup'));
}

try {
    // Run Build
    execSync('npm run build', { stdio: 'inherit', env });
    console.log("✅ Build successful!");
} catch (e) {
    console.error("❌ Build failed:", e);
    // Restore .env before exiting
    if (fs.existsSync(path.join(__dirname, '.env.backup'))) {
        fs.renameSync(path.join(__dirname, '.env.backup'), envPath);
    }
    process.exit(1);
}

// Restore .env
if (fs.existsSync(path.join(__dirname, '.env.backup'))) {
    fs.renameSync(path.join(__dirname, '.env.backup'), envPath);
}

// 3. Deploy
console.log("📤 Deploying to gh-pages...");

// Add .nojekyll to prevent GitHub Pages from ignoring files starting with _
const noJekyllPath = path.join(__dirname, 'dist', '.nojekyll');
try {
    fs.writeFileSync(noJekyllPath, '');
    console.log("✅ Created .nojekyll file");
} catch (e) {
    console.warn("⚠️ Failed to create .nojekyll file:", e);
}

try {
    execSync('npx gh-pages -d dist -t', { stdio: 'inherit' }); // Added -t (dotfiles) just in case, though .nojekyll is usually enough
    console.log("✅ Deployed successfully!");
} catch (e) {
    console.error("❌ Deployment failed:", e);
    process.exit(1);
}
