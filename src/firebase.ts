import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// Use the provided database ID or default to '(default)'
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Test connection to Firestore
async function testConnection() {
  try {
    // Try to fetch a non-existent document to trigger a server check
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log("✅ Firestore connection successful");
  } catch (error: any) {
    console.error("❌ Firestore Connection Error:", error.code, error.message);
    
    if (error.message.includes('the client is offline')) {
      console.error("SUGGESTION: Firestore cannot reach the server. This often means the 'Firestore Database' has not been created in your Firebase Console yet.");
    } else if (error.code === 'permission-denied') {
      console.log("Note: Permission denied is actually a good sign! It means we reached the server but were blocked by rules (which is expected for this test).");
    } else {
      console.error("SUGGESTION: Check if your Project ID and API Key in firebase-applet-config.json are correct.");
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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
