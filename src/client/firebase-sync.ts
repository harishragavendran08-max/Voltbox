import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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

interface SyncPayload {
  cart?: Record<string, number>;
  wishlist?: number[];
  billEmail?: string;
}

const app: FirebaseApp = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth: Auth = getAuth(app);

let privateStateUnsub: (() => void) | null = null;
let currentUid: string | null = null;

function handleFirestoreError(
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

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

function sanitizeCartForBlueprint(cart: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!cart || typeof cart !== 'object') return out;
  const entries = Object.entries(cart as Record<string, unknown>).slice(0, 50);
  for (const [k, v] of entries) {
    const qty = Math.floor(Number(v));
    if (k && Number.isFinite(qty) && qty > 0 && qty <= 99) {
      out[String(k).slice(0, 24)] = qty;
    }
  }
  return out;
}

function sanitizeWishlistForBlueprint(wishlist: unknown): number[] {
  if (!Array.isArray(wishlist)) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const item of wishlist) {
    const id = Math.floor(Number(item));
    if (Number.isInteger(id) && id > 0 && !seen.has(id)) {
      seen.add(id);
      out.push(id);
      if (out.length >= 50) break;
    }
  }
  return out;
}

async function ensureUserDocsExist(user: FirebaseUser): Promise<void> {
  if (!user.emailVerified) return;

  const publicPath = `users/${user.uid}/public/profile`;
  const publicRef = doc(db, 'users', user.uid, 'public', 'profile');
  try {
    const snap = await getDoc(publicRef);
    if (!snap.exists()) {
      await setDoc(publicRef, {
        uid: user.uid,
        displayName: String(user.displayName || user.email?.split('@')[0] || 'Voltbox Builder').slice(0, 80),
        avatarColor: '#ffd23f',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, publicPath);
  }

  const privatePath = `users/${user.uid}/private/state`;
  const privateRef = doc(db, 'users', user.uid, 'private', 'state');
  try {
    const snap = await getDoc(privateRef);
    if (!snap.exists()) {
      await setDoc(privateRef, {
        ownerId: user.uid,
        email: String(user.email || '').slice(0, 200),
        cart: {},
        wishlist: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }
}

async function syncPrivateStateToFirestore(payload: SyncPayload): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return false;

  const privatePath = `users/${user.uid}/private/state`;
  const privateRef = doc(db, 'users', user.uid, 'private', 'state');
  try {
    const snap = await getDoc(privateRef);
    const existingData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
    const nextCart =
      payload.cart !== undefined
        ? sanitizeCartForBlueprint(payload.cart)
        : sanitizeCartForBlueprint(existingData?.cart);
    const nextWishlist =
      payload.wishlist !== undefined
        ? sanitizeWishlistForBlueprint(payload.wishlist)
        : sanitizeWishlistForBlueprint(existingData?.wishlist);
    const nextBillEmail =
      typeof payload.billEmail === 'string' && payload.billEmail.trim()
        ? payload.billEmail.trim().slice(0, 200)
        : typeof existingData?.billEmail === 'string'
          ? existingData.billEmail.slice(0, 200)
          : undefined;

    const docBody: Record<string, unknown> = {
      ownerId: user.uid,
      email: String(existingData?.email || user.email || '').slice(0, 200),
      cart: nextCart,
      wishlist: nextWishlist,
      createdAt: existingData?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (nextBillEmail) {
      docBody.billEmail = nextBillEmail;
    }
    await setDoc(privateRef, docBody, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }
}

async function syncOrderToFirestore(order: {
  id: string;
  total: number;
  count: number;
  paymentMethod?: string;
  status?: string;
}): Promise<boolean> {
  const user = auth.currentUser;
  if (!user || !user.emailVerified) return false;

  const cleanOrderId = String(order.id || '').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 64);
  if (cleanOrderId.length < 3) return false;

  const orderPath = `users/${user.uid}/orders/${cleanOrderId}`;
  const orderRef = doc(db, 'users', user.uid, 'orders', cleanOrderId);
  try {
    const allowedStatuses = new Set(['Order Placed', 'Processing', 'Shipped', 'Delivered']);
    const safeStatus = allowedStatuses.has(String(order.status || '')) ? String(order.status) : 'Order Placed';
    await setDoc(orderRef, {
      orderId: cleanOrderId,
      ownerId: user.uid,
      status: safeStatus,
      total: Math.max(0, Math.min(1_000_000, Number(order.total) || 0)),
      count: Math.max(1, Math.min(200, Math.floor(Number(order.count) || 1))),
      paymentMethod: String(order.paymentMethod || 'Card').slice(0, 80),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, orderPath);
  }
}

function attachPrivateListener(user: FirebaseUser): void {
  if (privateStateUnsub) {
    privateStateUnsub();
    privateStateUnsub = null;
  }
  const pathForOnSnapshot = `users/${user.uid}/private/state`;
  privateStateUnsub = onSnapshot(
    doc(db, 'users', user.uid, 'private', 'state'),
    (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data();
      window.dispatchEvent(new CustomEvent('voltbox:firestore-state', { detail: data }));
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
    }
  );
}

onAuthStateChanged(auth, async (user) => {
  if (privateStateUnsub) {
    privateStateUnsub();
    privateStateUnsub = null;
  }
  currentUid = user ? user.uid : null;
  if (user && user.emailVerified) {
    try {
      await ensureUserDocsExist(user);
      attachPrivateListener(user);
    } catch (err) {
      console.warn('Firestore profile bootstrap warning:', err);
    }
  }
  window.dispatchEvent(
    new CustomEvent('voltbox:firebase-auth', {
      detail: user
        ? {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
          }
        : null,
    })
  );
});

async function signInWithGooglePopup(): Promise<{
  uid: string;
  email: string | null;
  displayName: string | null;
} | null> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  if (!cred.user) return null;
  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName,
  };
}

async function signOutFirebase(): Promise<void> {
  if (privateStateUnsub) {
    privateStateUnsub();
    privateStateUnsub = null;
  }
  await firebaseSignOut(auth);
}

testConnection();

(window as unknown as Record<string, unknown>).VoltboxFirebase = {
  db,
  auth,
  getUid: () => currentUid,
  signInWithGooglePopup,
  signOutFirebase,
  syncPrivateStateToFirestore,
  syncOrderToFirestore,
};
