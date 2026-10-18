import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

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

    const missingVars: string[] = [];
    if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
    if (!rawPrivateKey) missingVars.push('FIREBASE_PRIVATE_KEY');

    if (missingVars.length > 0) {
      console.error(`[Firebase Admin Startup Error] Missing required environment variable(s): ${missingVars.join(', ')}`);
    }

    if (clientEmail && rawPrivateKey) {
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

    console.error('[Firebase Admin Startup Error] Unable to initialize Firebase Admin SDK: Missing required environment variable FIREBASE_PROJECT_ID.');
    return null;
  } catch (err: any) {
    console.error(`[Firebase Admin Startup Exception] Step 'Firebase Admin Initialization' failed: ${err?.message || err}`);
    return null;
  }
}
