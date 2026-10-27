import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Private local upload directory for confidential evidence and reports
export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configurable security constraints
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx',
  '.webm', '.mp3', '.wav', '.m4a', '.ogg'
]);
export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/x-m4a',
]);

export interface StoredFileMetadata {
  storageKey: string;
  originalName: string;
  sanitizedName: string;
  fileSize: number;
  formattedSize: string;
  mimeType: string;
  checksum: string;
  storedPath: string;
}

export class StorageService {
  /**
   * Format bytes into human-readable string (e.g. 2.4 MB)
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Sanitize display filename to prevent path traversal and script injection
   */
  static sanitizeFilename(filename: string): string {
    const base = path.basename(filename);
    const cleaned = base.replace(/[^a-zA-Z0-9._\-\s()]/g, '_');
    return cleaned.slice(0, 100);
  }

  /**
   * Validate file extension and MIME type against statutory allowlist
   */
  static validateFileType(filename: string, mimeType?: string): { valid: boolean; error?: string } {
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return {
        valid: false,
        error: `File type '${ext}' is not permitted. Allowed formats: PDF, PNG, JPG/JPEG, DOC, DOCX.`,
      };
    }

    if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType.toLowerCase())) {
      // Minor grace for general binary stream if extension is valid
      if (mimeType !== 'application/octet-stream') {
        return {
          valid: false,
          error: `MIME type '${mimeType}' does not match statutory requirements.`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Store uploaded buffer securely with SHA-256 checksum and randomized key
   */
  static async saveBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<StoredFileMetadata> {
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${this.formatBytes(buffer.length)}) exceeds the maximum 15 MB limit.`);
    }

    const typeCheck = this.validateFileType(originalName, mimeType);
    if (!typeCheck.valid) {
      throw new Error(typeCheck.error);
    }

    const ext = path.extname(originalName).toLowerCase();
    const sanitizedName = this.sanitizeFilename(originalName);
    const randomHex = crypto.randomBytes(8).toString('hex');
    const storageKey = `doc_${Date.now()}_${randomHex}${ext}`;
    const storedPath = path.join(UPLOAD_DIR, storageKey);

    // Compute cryptographic SHA-256 hash
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    await fs.promises.writeFile(storedPath, buffer);

    return {
      storageKey,
      originalName,
      sanitizedName,
      fileSize: buffer.length,
      formattedSize: this.formatBytes(buffer.length),
      mimeType,
      checksum: hash,
      storedPath,
    };
  }

  /**
   * Resolve and safely verify a stored path to protect against path traversal
   */
  static getSafePath(storageKey: string): string | null {
    const safeKey = path.basename(storageKey);
    const resolved = path.resolve(UPLOAD_DIR, safeKey);
    if (!resolved.startsWith(UPLOAD_DIR)) {
      return null;
    }
    if (!fs.existsSync(resolved)) {
      return null;
    }
    return resolved;
  }
}
