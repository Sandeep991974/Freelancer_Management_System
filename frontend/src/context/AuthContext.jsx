import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load auth data from localStorage on mount
    const storedToken = localStorage.getItem('fms_token');
    const storedUser = localStorage.getItem('fms_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('fms_token', newToken);
    localStorage.setItem('fms_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('fms_token');
    localStorage.removeItem('fms_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    const freshUser = { ...user, ...updatedUser };
    localStorage.setItem('fms_user', JSON.stringify(freshUser));
    setUser(freshUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
