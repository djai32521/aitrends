const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Usage: node encrypt-key.js <YOUR_API_KEY>");
    process.exit(1);
}

const key = args[0];
const salt = "J@#$9s0d"; // Must match the client-side salt

const textToChars = (text) => text.split("").map((c) => c.charCodeAt(0));
const byteHex = (n) => ("0" + Number(n).toString(16)).substr(-2);
const applySaltToChar = (code) => textToChars(salt).reduce((a, b) => a ^ b, code);

const encrypted = textToChars(key)
    .map(applySaltToChar)
    .map(byteHex)
    .join("");

console.log("\nEncrypted Key generated successfully!");
console.log("-----------------------------------------");
console.log(encrypted);
console.log("-----------------------------------------");
console.log("\n1. Create a .env file in the project root (if not exists).");
console.log(`2. Add the following line:\nVITE_GEMINI_API_KEY_ENCRYPTED=${encrypted}`);
