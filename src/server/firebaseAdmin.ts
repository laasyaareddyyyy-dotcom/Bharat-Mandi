import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseAppConfig as firebaseConfig } from './firebaseConfig';

let adminDbInstance: any = null;
let initAttempted = false;

/**
 * Safe, lazy Firebase Admin Firestore initialization wrapped in try/catch.
 * Logs diagnostic errors for missing variables without logging secrets or breaking serverless startup.
 */
export function getAdminDb() {
  if (adminDbInstance) {
    return adminDbInstance;
  }

  if (initAttempted) {
    return adminDbInstance;
  }
  initAttempted = true;

  try {
    if (getApps().length > 0) {
      const app = getApp();
      adminDbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
      return adminDbInstance;
    }

    const projectId = (process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId || '').trim();
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || '';

    if (clientEmail && rawPrivateKey && projectId) {
      // Replaces escaped \n with real newlines for multiline RSA key in Vercel, and strips quotes if wrapped
      const privateKey = rawPrivateKey.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
      const app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      adminDbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
      console.log(`[Firebase Admin] Successfully initialized with cert for project: ${projectId}`);
      return adminDbInstance;
    }

    if (projectId) {
      const app = initializeApp({ projectId });
      adminDbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
      console.log(`[Firebase Admin] Initialized default app for project: ${projectId}`);
      return adminDbInstance;
    }

    console.info('[Firebase Admin Startup Note] FIREBASE_PROJECT_ID not set.');
    return null;
  } catch (err: any) {
    console.warn(`[Firebase Admin Startup Note] Step 'Firebase Admin Initialization' note: ${err?.message || err}`);
    return null;
  }
}
