import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from '../types';

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);

  if (ctx === null) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}
