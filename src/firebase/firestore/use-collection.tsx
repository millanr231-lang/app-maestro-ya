'use client';

import {
  collection,
  onSnapshot,
  query,
  Query,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';

import { useFirestore } from '@/firebase/provider';

export function useCollection<T>(path: string | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  const firestore = useFirestore();

  const collectionPath = useMemo(() => path, [path]);

  useEffect(() => {
    if (!firestore || !collectionPath) {
      setLoading(false);
      setData(null);
      return;
    }

    const collectionQuery: Query<DocumentData> = query(
      collection(firestore, collectionPath)
    );

    const unsubscribe = onSnapshot(
      collectionQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(docs as T[]);
        setLoading(false);
      },
      (err: FirestoreError) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, collectionPath]);

  return { data, loading, error };
}
