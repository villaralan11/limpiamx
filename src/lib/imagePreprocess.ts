import { VALIDATION_LIMITS } from '../types/marketplace';

export type ImageUploadFolder = 'avatar' | 'portfolio';

export interface PreprocessedImageResult {
  blob: Blob;
  contentType: 'image/webp' | 'image/jpeg';
  extension: 'webp' | 'jpg';
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
  originalHash: string;
  processedHash: string;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_RAW_INPUT_BYTES = 15 * 1024 * 1024; // 15 MB raw input before resize/compression
const MAX_STORAGE_BYTES = 1.8 * 1024 * 1024; // Strictly under 2 MB storage.rules limit

export function formatBytesShort(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export async function computeBlobSha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const bytes = new Uint8Array(hashBuffer);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Deterministic fallback fingerprint if subtle crypto is unavailable
  const view = new Uint8Array(buffer);
  let h1 = 0x811c9dc5;
  for (let i = 0; i < view.length; i += 1) {
    h1 ^= view[i];
    h1 = Math.imul(h1, 0x01000193);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}_${view.length}`;
}

export function extractHashTokenFromUrl(url: string): string | null {
  const match = url.match(/_h_([0-9a-f]{16})(?:_|\.)/i);
  return match ? match[1].toLowerCase() : null;
}

function loadImageDimensions(blob: Blob): Promise<{
  img: HTMLImageElement;
  cleanup: () => void;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({
        img,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo decodificar el archivo de imagen.'));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: 'image/webp' | 'image/jpeg',
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Resizes and compresses a user image client-side before uploading to Firebase Storage.
 * - Avatars: max 512x512 px
 * - Portfolio: max 1280x1280 px
 * Prefers WebP for optimal catalog speed and falls back to JPEG when needed.
 */
export async function preprocessImageForUpload(
  file: File,
  folder: ImageUploadFolder
): Promise<PreprocessedImageResult> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Formato no compatible. Usa imágenes JPG, PNG o WebP.');
  }
  if (file.size === 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }
  if (file.size > MAX_RAW_INPUT_BYTES) {
    throw new Error('La imagen original supera el límite máximo permitido de 15 MB.');
  }

  const originalHash = await computeBlobSha256(file);
  const maxDim = folder === 'avatar' ? 512 : 1280;
  const initialQuality = folder === 'avatar' ? 0.8 : 0.82;

  const { img, cleanup } = await loadImageDimensions(file);
  try {
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    const targetW = Math.max(1, Math.round(srcW * scale));
    const targetH = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo inicializar el procesador de imágenes.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Encode to WebP when supported, else JPEG
    let contentType: 'image/webp' | 'image/jpeg' = 'image/webp';
    let quality = initialQuality;
    let outputBlob = await canvasToBlob(canvas, 'image/webp', quality);

    if (!outputBlob || outputBlob.type !== 'image/webp') {
      contentType = 'image/jpeg';
      outputBlob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }

    while (outputBlob && outputBlob.size > MAX_STORAGE_BYTES && quality > 0.45) {
      quality = Math.max(0.45, quality - 0.12);
      const nextBlob = await canvasToBlob(canvas, contentType, quality);
      if (!nextBlob) break;
      outputBlob = nextBlob;
    }

    if (!outputBlob) {
      throw new Error('No se pudo comprimir la imagen para subirla.');
    }

    const processedHash = await computeBlobSha256(outputBlob);

    return {
      blob: outputBlob,
      contentType,
      extension: contentType === 'image/webp' ? 'webp' : 'jpg',
      width: targetW,
      height: targetH,
      originalBytes: file.size,
      compressedBytes: outputBlob.size,
      originalHash,
      processedHash,
    };
  } finally {
    cleanup();
  }
}

/**
 * Compact Data URL fallback when Storage upload cannot complete (keeps Firestore payload <= 45 KB).
 */
export async function compressBlobToCompactDataUrl(
  sourceBlob: Blob,
  folder: ImageUploadFolder
): Promise<string> {
  const maxDim = folder === 'avatar' ? 220 : 400;
  const { img, cleanup } = await loadImageDimensions(sourceBlob);
  try {
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No se pudo procesar la imagen.');
    }
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.72;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > VALIDATION_LIMITS.photoUrlMax - 500 && quality > 0.35) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    return dataUrl;
  } finally {
    cleanup();
  }
}

/**
 * Resolves a content hash from an existing image URL (data URL, local asset, or Firebase Storage URL)
 * to compare against new uploads and block duplicates across sessions.
 */
export async function computeImageUrlHash(url: string): Promise<string | null> {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const response = await fetch(trimmed);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await computeBlobSha256(blob);
  } catch {
    return null;
  }
}
