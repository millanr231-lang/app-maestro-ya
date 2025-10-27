'use client';

import {
  doc,
  onSnapshot,
  DocumentReference,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
  Firestore,
} from 'firebase/firestore';
import { useEffect, useState, useCallback } from 'react';

import { useFirestore } from '@/firebase/provider';

// This is a simplified version. A more robust hook would also handle
// memoizing the document reference if the path is built dynamically.
export function useDoc<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const firestore = useFirestore() as Firestore;

  useEffect(() => {
    if (!firestore || !path) {
      setLoading(false);
      setData(null);
      return;
    }

    // It's important that the path string is stable, or this effect
    // will re-run on every render.
    const docRef: DocumentReference<DocumentData> = doc(firestore, path);

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (snapshot.exists()) {
          const docData = { ...snapshot.data(), id: snapshot.id };
          setData(docData as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error(`Error fetching document at ${path}:`, err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [firestore, path]); // Dependency array ensures effect runs only when firestore or path changes

  return { data, loading, error };
}
