import { createContext } from "react";

// 暂时保留AuthContext，以备后用
export const AuthContext = createContext({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  logout: () => {},
});