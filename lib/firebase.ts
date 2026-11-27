'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getFirestore, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import firebaseFallback from '@/firebase-applet-config.json';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseFallback.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseFallback.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseFallback.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseFallback.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseFallback.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseFallback.appId,
};

export function isFirebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

function getFirebaseApp() {
  if (!isFirebaseConfigured()) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

function getFirebaseAuth() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
}

function getFirebaseDb() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getFirestore(app, firebaseFallback.firestoreDatabaseId);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Falta configurar Firebase para iniciar sesión con Google.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export async function signOutGoogle() {
  const auth = getFirebaseAuth();
  if (auth) await signOut(auth);
}

export type ProfileRecord = {
  displayName: string;
  email: string;
  phone: string;
  city: string;
  role: 'cliente' | 'profesional';
};

export async function loadProfile(uid: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  const snapshot = await getDoc(doc(db, 'profiles', uid));
  return snapshot.exists() ? (snapshot.data() as Partial<ProfileRecord>) : null;
}

export async function saveProfile(uid: string, profile: ProfileRecord) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  await setDoc(doc(db, 'profiles', uid), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
}

export type ListingRecord = {
  title: string;
  service: string;
  city: string;
  rate: number;
  zones: string;
  availability: string;
  description: string;
};

export async function saveListing(uid: string, listing: ListingRecord) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  await addDoc(collection(db, 'listings'), { ...listing, ownerId: uid, status: 'published', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export type BookingRecord = {
  professionalName: string;
  service: string;
  date: string;
  hours: number;
  notes: string;
};

export async function saveBooking(uid: string, booking: BookingRecord) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  const reference = await addDoc(collection(db, 'bookings'), { ...booking, clientId: uid, status: 'requested', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return reference.id;
}

export async function loadBookings(uid: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  const snapshot = await getDocs(query(collection(db, 'bookings'), where('clientId', '==', uid)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<BookingRecord & { id: string; status: string }>;
}

export async function cancelBooking(uid: string, bookingId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  await updateDoc(doc(db, 'bookings', bookingId), { status: 'cancelled', cancelledBy: uid, updatedAt: serverTimestamp() });
}

export type ReportRecord = {
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
};

export async function submitReport(uid: string, report: ReportRecord) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  await addDoc(collection(db, 'reports'), { ...report, reporterId: uid, status: 'open', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

function favoriteDocumentId(uid: string, professionalId: string) {
  return `${uid}_${professionalId}`;
}

export async function isFavorite(uid: string, professionalId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  const snapshot = await getDoc(doc(db, 'favorites', favoriteDocumentId(uid, professionalId)));
  return snapshot.exists();
}

export async function saveFavorite(uid: string, professionalId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  await setDoc(doc(db, 'favorites', favoriteDocumentId(uid, professionalId)), { ownerId: uid, professionalId, createdAt: serverTimestamp() });
}

export async function removeFavorite(uid: string, professionalId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  await deleteDoc(doc(db, 'favorites', favoriteDocumentId(uid, professionalId)));
}

export async function loadFavorites(uid: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error('Firebase no está configurado.');
  const snapshot = await getDocs(query(collection(db, 'favorites'), where('ownerId', '==', uid)));
  return snapshot.docs.map((item) => item.data().professionalId as string);
}
