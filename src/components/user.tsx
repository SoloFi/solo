import { useContext } from "react";
import { UserContext } from "./user-provider";

export const useUser = () => {
  return useContext(UserContext);
};
