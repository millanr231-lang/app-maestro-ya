
'use client';
import { app, auth, firestore } from './index';
import { FirebaseProvider } from './provider';
import { ReactNode, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { UserContext } from './auth/use-user';


type FirebaseClientProviderProps = {
  children: ReactNode;
};

export function FirebaseClientProvider({
  children,
}: FirebaseClientProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      <FirebaseProvider
        app={app}
        auth={auth}
        firestore={firestore}
      >
        {children}
      </FirebaseProvider>
    </UserContext.Provider>
  );
}
