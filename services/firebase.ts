import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  limit,
  deleteDoc
} from "firebase/firestore";

let db: any = null;

export const initFirebase = (config: any) => {
  if (db) return db;
  try {
    const app = initializeApp(config);
    db = getFirestore(app);
    return db;
  } catch (e) {
    console.error("Firebase Init Error", e);
    return null;
  }
};

export const syncCollection = (collectionName: string, callback: (data: any[]) => void) => {
  if (!db) return null;
  const q = query(collection(db, collectionName), limit(1000));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(data);
  });
};

export const saveDataToCloud = async (collectionName: string, id: string, data: any) => {
  if (!db) return;
  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, data, { merge: true });
  } catch (e) {
    console.error("Cloud Save Error", e);
  }
};

export const deleteDataFromCloud = async (collectionName: string, id: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (e) {
    console.error("Cloud Delete Error", e);
  }
};