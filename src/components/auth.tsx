import { useContext } from "react";
import { AuthContext } from "./auth-provider";

export const useAuth = () => {
  return useContext(AuthContext);
};
