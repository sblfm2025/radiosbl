import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
  type WhereFilterOp
} from "firebase/firestore";
import { getFirebaseFirestore } from "../lib/firebase";

export async function listDocuments<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [orderBy("createdAt", "desc")]
): Promise<Array<T & { id: string }>> {
  const snapshot = await getDocs(
    query(collection(getFirebaseFirestore(), collectionName), ...constraints)
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as T)
  }));
}

export async function queryDocuments<T extends DocumentData>(
  collectionName: string,
  field: string,
  operator: WhereFilterOp,
  value: any
): Promise<Array<T & { id: string }>> {
  const snapshot = await getDocs(
    query(collection(getFirebaseFirestore(), collectionName), where(field, operator, value))
  );

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as T)
  }));
}

export async function getDocument<T extends DocumentData>(
  collectionName: string,
  id: string
): Promise<(T & { id: string }) | null> {
  const snapshot = await getDoc(doc(getFirebaseFirestore(), collectionName, id));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as T)
  };
}

export async function createDocument<T extends DocumentData>(
  collectionName: string,
  payload: T
): Promise<string> {
  const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
    ...payload,
    createdAt: serverTimestamp()
  });

  return ref.id;
}

export async function upsertDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  payload: T
): Promise<void> {
  await setDoc(doc(getFirebaseFirestore(), collectionName, id), payload, {
    merge: true
  });
}

export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  id: string,
  payload: T
): Promise<void> {
  await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
    ...payload,
    updatedAt: serverTimestamp()
  });
}

export function subscribeDocuments<T extends DocumentData>(
  collectionName: string,
  onNext: (documents: Array<T & { id: string }>) => void,
  onError?: (error: Error) => void,
  constraints: QueryConstraint[] = [orderBy("createdAt", "desc")]
): Unsubscribe {
  return onSnapshot(
    query(collection(getFirebaseFirestore(), collectionName), ...constraints),
    (snapshot) => {
      onNext(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as T)
        }))
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}
