export const decryptKey = (encrypted: string): string => {
  if (!encrypted) return "";
  try {
    const salt = "J@#$9s0d"; // Simple static salt
    const textToChars = (text: string) => text.split("").map((c) => c.charCodeAt(0));
    const applySaltToChar = (code: number) => textToChars(salt).reduce((a, b) => a ^ b, code);
    return encrypted
      .match(/.{1,2}/g)!
      .map((hex) => parseInt(hex, 16))
      .map(applySaltToChar)
      .map((charCode) => String.fromCharCode(charCode))
      .join("");
  } catch (e) {
    console.error("Failed to decrypt key", e);
    return "";
  }
};
