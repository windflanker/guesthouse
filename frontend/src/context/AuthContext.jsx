import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('gh_token') || null);
  const [admin, setAdmin] = useState(() => localStorage.getItem('gh_admin') || null);
  const [role,  setRole]  = useState(() => localStorage.getItem('gh_role')  || null);

  const login = (tok, username, role) => {
    localStorage.setItem('gh_token', tok);
    localStorage.setItem('gh_admin', username);
    localStorage.setItem('gh_role',  role);
    setToken(tok);
    setAdmin(username);
    setRole(role);
  };

  const logout = () => {
    localStorage.removeItem('gh_token');
    localStorage.removeItem('gh_admin');
    localStorage.removeItem('gh_role');
    setToken(null);
    setAdmin(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, admin, role, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
