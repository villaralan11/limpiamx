'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { subscribeToAuth } from '@/lib/firebase';

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => subscribeToAuth((nextUser) => {
    setUser(nextUser);
    setLoading(false);
  }), []);

  return { user, loading };
}
