import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gh_token') || null);
  const [admin, setAdmin] = useState(() => localStorage.getItem('gh_admin') || null);

  const login = (tok, username) => {
    localStorage.setItem('gh_token', tok);
    localStorage.setItem('gh_admin', username);
    setToken(tok);
    setAdmin(username);
  };

  const logout = () => {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('gh_admin');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ token, admin, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
