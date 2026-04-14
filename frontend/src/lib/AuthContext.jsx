import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    if (auth.isAuthenticated()) {
      auth.me()
        .then(u => { setUser(u); setIsAuthenticated(true); })
        .catch(() => { localStorage.removeItem('emap_token'); })
        .finally(() => setIsLoadingAuth(false));
    } else {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = () => { auth.logout(); setUser(null); setIsAuthenticated(false); };
  const navigateToLogin = (url) => auth.redirectToLogin(url);

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth,
      isLoadingPublicSettings: false, authError: null,
      logout, navigateToLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);