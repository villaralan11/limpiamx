import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BASE64_LENGTH = 5_500_000; // ~4 MB binary image

interface FirebaseConfigFile {
  apiKey?: string;
  projectId?: string;
}

function readFirebaseApiKey(): string {
  try {
    const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as FirebaseConfigFile;
    return typeof parsed.apiKey === 'string' ? parsed.apiKey : '';
  } catch {
    return '';
  }
}

const FIREBASE_WEB_API_KEY = readFirebaseApiKey();

interface VerifiedCaller {
  uid: string;
  email: string;
}

async function verifyFirebaseBearerToken(authHeader: string | undefined): Promise<VerifiedCaller | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken || idToken.length < 20 || !FIREBASE_WEB_API_KEY) {
    return null;
  }

  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(FIREBASE_WEB_API_KEY)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    users?: Array<{ localId?: string; email?: string; disabled?: boolean }>;
  };
  const firstUser = payload.users?.[0];
  if (!firstUser?.localId || firstUser.disabled) {
    return null;
  }

  return {
    uid: firstUser.localId,
    email: typeof firstUser.email === 'string' ? firstUser.email : '',
  };
}

interface ParsedImageInput {
  mimeType: string;
  data: string;
}

function parseImagePayload(rawInput: unknown): ParsedImageInput | null {
  if (typeof rawInput !== 'string') return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  let mimeType = 'image/jpeg';
  let base64Data = trimmed;

  const dataUrlMatch = trimmed.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (dataUrlMatch) {
    mimeType = dataUrlMatch[1];
    base64Data = dataUrlMatch[2].replace(/\s+/g, '');
  } else if (trimmed.startsWith('data:')) {
    return null;
  } else {
    base64Data = trimmed.replace(/\s+/g, '');
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Data)) {
      return null;
    }
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return null;
  }

  if (base64Data.length < 200 || base64Data.length > MAX_IMAGE_BASE64_LENGTH) {
    return null;
  }

  return { mimeType, data: base64Data };
}

function normalizeSpanishTokens(input: string): string[] {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function compareIneNameWithProfile(expectedName: string, extractedName: string): boolean {
  const expectedTokens = normalizeSpanishTokens(expectedName);
  const extractedTokens = normalizeSpanishTokens(extractedName);
  if (expectedTokens.length === 0 || extractedTokens.length === 0) {
    return false;
  }

  const extractedSet = new Set(extractedTokens);
  let matched = 0;
  for (const token of expectedTokens) {
    if (extractedSet.has(token)) {
      matched += 1;
    }
  }

  const minNeeded = expectedTokens.length === 1 ? 1 : Math.min(2, expectedTokens.length);
  return matched >= minNeeded || matched / expectedTokens.length >= 0.5;
}

function isValidCurpFormat(curpRaw: string): boolean {
  const curp = curpRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z]{4}\d{6}[HMX][A-Z]{2}[BCDFGHJKLMNPQRSTVWXYZ]{3}[A-Z0-9]\d$/.test(curp);
}

function isValidClaveElectorFormat(claveRaw: string): boolean {
  const clave = claveRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z]{6}\d{8}[HM]\d{3}$/.test(clave);
}

function maskCurp(curpRaw: string): string {
  const clean = curpRaw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 10) return '';
  return `${clean.slice(0, 6)}******${clean.slice(-4)}`;
}

interface GeminiIneAnalysis {
  isMexicanIneFront: boolean;
  isMexicanIneBack: boolean;
  frontLooksAuthentic: boolean;
  backLooksAuthentic: boolean;
  extractedFullName: string;
  extractedCurp: string;
  extractedClaveElector: string;
  vigenciaYear: number;
  mrzOrQrDetected: boolean;
  visionConfidence: number;
  observations: string;
}

async function analyzeIneWithGemini(
  front: ParsedImageInput,
  back: ParsedImageInput
): Promise<GeminiIneAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    const missingErr = new Error(
      'Falta configurar GEMINI_API_KEY en Settings > Secrets para ejecutar el verificador automático de INE.'
    ) as Error & { statusCode?: number };
    missingErr.statusCode = 503;
    throw missingErr;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const prompt = [
    'Eres un sistema especializado en validación documental de credenciales para votar emitidas por el INE o IFE de México.',
    'Recibes exactamente DOS imágenes:',
    '- Imagen 1: supuesto ANVERSO (frente) de la credencial INE/IFE.',
    '- Imagen 2: supuesto REVERSO (parte trasera) de la credencial INE/IFE.',
    '',
    'Evalúa con rigor si ambas imágenes corresponden realmente a una credencial para votar mexicana vigente o legible:',
    '1. Anverso (Imagen 1): debe mostrar elementos propios de la credencial INE/IFE (fotografía del titular, encabezados INSTITUTO NACIONAL ELECTORAL / INSTITUTO FEDERAL ELECTORAL / CREDENCIAL PARA VOTAR, nombre, clave de elector, CURP, vigencia o sección). Si es un objeto aleatorio, pantalla en blanco, meme o un documento distinto, marca isMexicanIneFront=false y frontLooksAuthentic=false.',
    '2. Reverso (Imagen 2): debe mostrar elementos del reverso de la INE/IFE (códigos QR, código de barras, zona de firma/huella o líneas OCR/MRZ con formato IDMEX y caracteres <<<). Si es idéntico al frente o no corresponde al reverso de una INE/IFE, marca isMexicanIneBack=false.',
    '3. Extrae con precisión si son legibles: nombre completo del titular (extractedFullName), CURP de 18 caracteres (extractedCurp), Clave de elector de 18 caracteres (extractedClaveElector) y año límite de vigencia (vigenciaYear, por ejemplo 2029, o 0 si no es legible).',
    '4. Asigna visionConfidence entre 0 y 100 según la claridad, legibilidad y coherencia visual anverso-reverso.',
    '5. En observations escribe 1 oración breve en español explicando el resultado de la inspección.',
  ].join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: front.mimeType, data: front.data } },
          { inlineData: { mimeType: back.mimeType, data: back.data } },
        ],
      },
    ],
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isMexicanIneFront: { type: Type.BOOLEAN },
          isMexicanIneBack: { type: Type.BOOLEAN },
          frontLooksAuthentic: { type: Type.BOOLEAN },
          backLooksAuthentic: { type: Type.BOOLEAN },
          extractedFullName: { type: Type.STRING },
          extractedCurp: { type: Type.STRING },
          extractedClaveElector: { type: Type.STRING },
          vigenciaYear: { type: Type.INTEGER },
          mrzOrQrDetected: { type: Type.BOOLEAN },
          visionConfidence: { type: Type.INTEGER },
          observations: { type: Type.STRING },
        },
        required: [
          'isMexicanIneFront',
          'isMexicanIneBack',
          'frontLooksAuthentic',
          'backLooksAuthentic',
          'extractedFullName',
          'extractedCurp',
          'extractedClaveElector',
          'vigenciaYear',
          'mrzOrQrDetected',
          'visionConfidence',
          'observations',
        ],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('El servicio de inspección visual no devolvió respuesta.');
  }

  return JSON.parse(text) as GeminiIneAnalysis;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: 'limpiamx-api',
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim()),
    });
  });

  app.post('/api/ine/verify', async (req: Request, res: Response) => {
    try {
      const caller = await verifyFirebaseBearerToken(req.headers.authorization);
      if (!caller) {
        res.status(401).json({
          error: 'Sesión no válida o expirada. Vuelve a iniciar sesión para verificar tu INE.',
        });
        return;
      }

      const body = (req.body ?? {}) as {
        frontImageBase64?: unknown;
        backImageBase64?: unknown;
        expectedName?: unknown;
      };

      const front = parseImagePayload(body.frontImageBase64);
      const back = parseImagePayload(body.backImageBase64);

      if (!front || !back) {
        res.status(400).json({
          error: 'Debes adjuntar dos imágenes válidas en formato JPG, PNG o WebP (anverso y reverso).',
        });
        return;
      }

      if (front.data === back.data) {
        res.status(400).json({
          error: 'El anverso y el reverso no pueden ser el mismo archivo. Sube ambos lados de tu INE.',
        });
        return;
      }

      const expectedName =
        typeof body.expectedName === 'string' ? body.expectedName.trim().slice(0, 120) : '';

      const analysis = await analyzeIneWithGemini(front, back);
      const currentYear = new Date().getFullYear();

      const curpClean = (analysis.extractedCurp ?? '').trim().toUpperCase();
      const claveClean = (analysis.extractedClaveElector ?? '').trim().toUpperCase();
      const curpFormatValid = isValidCurpFormat(curpClean);
      const claveElectorValid = isValidClaveElectorFormat(claveClean);
      const vigenciaYear = Number.isFinite(analysis.vigenciaYear) ? Math.round(analysis.vigenciaYear) : 0;
      const vigenciaActive = vigenciaYear === 0 || vigenciaYear >= currentYear;
      const nameMatchesProfile =
        !expectedName || !analysis.extractedFullName
          ? true
          : compareIneNameWithProfile(expectedName, analysis.extractedFullName);

      const rejectionReasons: string[] = [];

      if (!analysis.isMexicanIneFront || !analysis.frontLooksAuthentic) {
        rejectionReasons.push('No se detectó una credencial INE/IFE válida y legible en el anverso.');
      }
      if (!analysis.isMexicanIneBack || !analysis.backLooksAuthentic) {
        rejectionReasons.push('No se detectó el reverso oficial de la credencial INE/IFE.');
      }
      if (!analysis.mrzOrQrDetected) {
        rejectionReasons.push('No se identificaron códigos QR, barras ni zona OCR/MRZ (IDMEX) en el reverso.');
      }
      if (vigenciaYear > 0 && vigenciaYear < currentYear) {
        rejectionReasons.push(`La credencial muestra vigencia expirada (${vigenciaYear}).`);
      }
      if (!curpFormatValid && !claveElectorValid && analysis.visionConfidence < 75) {
        rejectionReasons.push('No fue posible validar la estructura oficial de la CURP ni de la Clave de Elector.');
      }
      if (expectedName && analysis.extractedFullName && !nameMatchesProfile) {
        rejectionReasons.push(
          'El nombre detectado en la INE no coincide con el nombre registrado en tu perfil.'
        );
      }

      const isVerified = rejectionReasons.length === 0 && analysis.visionConfidence >= 60;

      const confidenceScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            analysis.visionConfidence * 0.7 +
              (curpFormatValid ? 15 : 0) +
              (claveElectorValid ? 10 : 0) +
              (analysis.mrzOrQrDetected ? 5 : 0)
          )
        )
      );

      const verificationId = `ine_${crypto.randomBytes(6).toString('hex')}`;
      const verifiedAt = new Date().toISOString();

      res.json({
        verdict: isVerified ? 'verified' : 'rejected',
        verificationId,
        confidenceScore,
        vigenciaYear: vigenciaYear > 0 ? vigenciaYear : null,
        maskedCurp: curpFormatValid ? maskCurp(curpClean) : null,
        extractedNameMatch: nameMatchesProfile,
        checks: {
          frontIneDetected: Boolean(analysis.isMexicanIneFront && analysis.frontLooksAuthentic),
          backIneDetected: Boolean(analysis.isMexicanIneBack && analysis.backLooksAuthentic),
          mrzOrQrDetected: Boolean(analysis.mrzOrQrDetected),
          curpFormatValid,
          claveElectorValid,
          vigenciaActive,
          nameMatchesProfile,
        },
        summary:
          analysis.observations?.slice(0, 280) ||
          (isVerified
            ? 'Credencial INE validada correctamente en anverso y reverso.'
            : 'Los documentos no superaron la verificación automática de INE.'),
        rejectionReasons,
        verifiedAt,
      });
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode || 500;
      const message =
        err instanceof Error && err.message
          ? err.message
          : 'Error interno al verificar la credencial INE.';
      console.error('INE verification error:', err);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LimpiaMX server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LimpiaMX server:', err);
  process.exit(1);
});
