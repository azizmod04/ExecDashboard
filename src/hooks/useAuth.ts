import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (token.startsWith('local_')) {
        const users = JSON.parse(localStorage.getItem('local_users') || '[]');
        const found = users.find((u: any) => u.id === token.replace('local_', ''));
        if (found) setUser({ id: found.id, email: found.email, role: 'user' });
        setLoading(false);
      } else {
        api.auth.me()
          .then(setUser)
          .catch(() => localStorage.removeItem('token'))
          .finally(() => setLoading(false));
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.auth.login(email, password);
      localStorage.setItem('token', res.access_token);
      setUser(res.user);
      return res.user;
    } catch {
      // Fallback: local login
      const users = JSON.parse(localStorage.getItem('local_users') || '[]');
      const found = users.find((u: any) => u.email === email && u.password === password);
      if (found) {
        const user = { id: found.id, email: found.email, role: 'user' };
        localStorage.setItem('token', 'local_' + found.id);
        setUser(user);
        return user;
      }
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      const res = await api.auth.register(email, password);
      localStorage.setItem('token', res.access_token);
      setUser(res.user);
      return res.user;
    } catch {
      // Fallback: local registration
      const users = JSON.parse(localStorage.getItem('local_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        throw new Error('البريد الإلكتروني مسجل مسبقاً');
      }
      const newUser = { id: 'user_' + Date.now(), email, password, role: 'user' };
      users.push(newUser);
      localStorage.setItem('local_users', JSON.stringify(users));
      const user = { id: newUser.id, email: newUser.email, role: 'user' };
      localStorage.setItem('token', 'local_' + newUser.id);
      setUser(user);
      return user;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
