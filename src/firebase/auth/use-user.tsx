'use client';

import { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/firebase/provider';
import { Auth, onAuthStateChanged } from 'firebase/auth';

export type UserContext = {
  user: User | null;
  loading: boolean;
};

export const UserContext = createContext<UserContext>({
  user: null,
  loading: true,
});

export const useUser = () => {
  return useContext(UserContext);
};
