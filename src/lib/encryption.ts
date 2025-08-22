import crypto from "crypto";

// Configuration for encryption
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
  if (key.length < 32) {
    throw new Error("ENCRYPTION_KEY must be at least 32 characters long");
  }
  return key;
}

/**
 * Derive a key from the master key and salt using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, "sha512");
}

/**
 * Encrypt a string value
 * @param text The text to encrypt
 * @returns Base64 encoded encrypted data with salt, IV, and encrypted data
 */
export function encrypt(text: string): string {
  try {
    const masterKey = getEncryptionKey();

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from master key and salt
    const key = deriveKey(masterKey, salt);

    // Create cipher with key and IV
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Combine salt, IV, and encrypted data
    const combined = Buffer.concat([salt, iv, Buffer.from(encrypted, "hex")]);

    return combined.toString("base64");
  } catch (error) {
    throw new Error(
      `Encryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Decrypt a string value
 * @param encryptedData Base64 encoded encrypted data
 * @returns The decrypted text
 */
export function decrypt(encryptedData: string): string {
  try {
    const masterKey = getEncryptionKey();

    // Decode from base64
    const combined = Buffer.from(encryptedData, "base64");

    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH);

    // Derive key from master key and salt
    const key = deriveKey(masterKey, salt);

    // Create decipher with key and IV
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(
      `Decryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Create a hash of the API key for validation purposes
 * @param apiKey The API key to hash
 * @returns SHA-256 hash of the API key
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * Verify an API key against its hash
 * @param apiKey The API key to verify
 * @param hash The stored hash to verify against
 * @returns True if the API key matches the hash
 */
export function verifyApiKeyHash(apiKey: string, hash: string): boolean {
  const computedHash = hashApiKey(apiKey);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(hash));
}
