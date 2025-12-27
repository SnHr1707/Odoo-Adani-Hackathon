import React, { useState, createContext, useEffect } from 'react';
import axios from 'axios';

export const API = axios.create({ baseURL: "http://localhost:8000" });

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  // Refresh User Profile on Mount
  useEffect(() => {
    if (user && user.id) {
        API.get(`/auth/me?user_id=${user.id}`)
           .then(res => {
               // Update state with fresh data from DB (including new team_id)
               const freshUser = { ...user, ...res.data };
               setUser(freshUser);
               localStorage.setItem('user', JSON.stringify(freshUser));
           })
           .catch(err => console.error("Failed to refresh profile", err));
    }
  }, []); // Run once on app load

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};