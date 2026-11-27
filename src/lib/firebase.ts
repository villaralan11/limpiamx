import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
auth.languageCode = 'es';
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function registerWithEmail(
  fullName: string,
  email: string,
  password: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const cleanName = fullName.trim();
  if (cleanName) {
    await updateProfile(cred.user, { displayName: cleanName });
  }
  // Envía correo de confirmación sin bloquear el flujo si el usuario inicia de inmediato
  sendEmailVerification(cred.user).catch(() => undefined);
  return cred;
}

export async function resetPasswordByEmail(email: string) {
  return sendPasswordResetEmail(auth, email.trim());
}

export async function sendAccountVerificationEmail(user: User) {
  return sendEmailVerification(user);
}

export function isGoogleAccount(user: User | null): boolean {
  return Boolean(
    user?.providerData?.some((provider) => provider.providerId === 'google.com')
  );
}

export function getFirebaseAuthErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/unauthorized-domain': {
      const host =
        typeof window !== 'undefined' ? window.location.hostname || 'este dominio' : 'este dominio';
      return `El dominio "${host}" no está autorizado en Firebase Console → Authentication → Settings → Authorized domains.`;
    }
    case 'auth/operation-not-allowed':
      return 'Este método de acceso aún no está habilitado en Firebase Console → Authentication → Sign-in method (habilita Google o Correo electrónico/Contraseña).';
    case 'auth/popup-blocked':
      return 'Tu navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio e intenta de nuevo.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Cerraste la ventana de Google antes de completar el acceso.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta nueva.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta registrada con este correo electrónico. Inicia sesión o entra con Google.';
    case 'auth/weak-password':
      return 'La contraseña es muy débil. Usa al menos 6 caracteres combinando letras y números.';
    case 'auth/invalid-email':
      return 'Ingresa un correo electrónico con formato válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos seguidos. Espera unos minutos antes de volver a intentar.';
    case 'auth/network-request-failed':
      return 'Sin conexión a internet para validar tu cuenta. Revisa tu red e intenta de nuevo.';
    case 'auth/user-disabled':
      return 'Esta cuenta fue deshabilitada en Firebase Authentication.';
    default:
      return code
        ? `No se pudo completar la autenticación (${code}).`
        : 'No se pudo completar el inicio de sesión.';
  }
}

export async function signOutUser() {
  return signOut(auth);
}

import {
  compressBlobToCompactDataUrl,
  ImageUploadFolder,
  PreprocessedImageResult,
  preprocessImageForUpload,
} from './imagePreprocess';

export interface UploadedImageDetails {
  url: string;
  originalBytes: number;
  compressedBytes: number;
  originalHash: string;
  processedHash: string;
  width: number;
  height: number;
  contentType: string;
}

export async function uploadUserImageDetailed(
  uid: string,
  fileOrPreprocessed: File | PreprocessedImageResult,
  folder: ImageUploadFolder
): Promise<UploadedImageDetails> {
  const processed =
    fileOrPreprocessed instanceof File
      ? await preprocessImageForUpload(fileOrPreprocessed, folder)
      : fileOrPreprocessed;

  const hashPrefix = processed.processedHash.slice(0, 16);
  const storagePath = `users/${uid}/${folder}_h_${hashPrefix}.${processed.extension}`;

  let url: string;
  try {
    const fileRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(fileRef, processed.blob, {
      contentType: processed.contentType,
      customMetadata: {
        originalHash: processed.originalHash.slice(0, 16),
        processedHash: hashPrefix,
        dimensions: `${processed.width}x${processed.height}`,
      },
    });
    url = await getDownloadURL(snapshot.ref);
  } catch {
    // Fallback cleanly if Firebase Storage bucket rules are not enabled yet in starter tier
    url = await compressBlobToCompactDataUrl(processed.blob, folder);
  }

  return {
    url,
    originalBytes: processed.originalBytes,
    compressedBytes: processed.compressedBytes,
    originalHash: processed.originalHash,
    processedHash: processed.processedHash,
    width: processed.width,
    height: processed.height,
    contentType: processed.contentType,
  };
}

export async function uploadUserImage(
  uid: string,
  file: File,
  folder: ImageUploadFolder
): Promise<string> {
  const result = await uploadUserImageDetailed(uid, file, folder);
  return result.url;
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
