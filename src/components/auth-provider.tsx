import { isTokenExpired } from "@/lib/utils";
import { axios } from "@/query/axios";
import { AxiosError } from "axios";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface AuthContextType {
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, accessKey: string) => Promise<void>;
  signOut: () => void;
}
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await axios.post("/signIn", { email, password });
      const token = data?.token;
      setToken(token);
      localStorage.setItem("token", token);
    } catch (e) {
      const error = e as AxiosError;
      throw new Error(error.response?.data as string);
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, accessKey: string) => {
      try {
        const { data } = await axios.post(
          "/signUp",
          { email, password },
          {
            headers: {
              Authorization: `Bearer ${accessKey}`,
            },
          },
        );
        const token = data?.token;
        setToken(token);
        localStorage.setItem("token", token);
      } catch (e) {
        const error = e as AxiosError;
        throw new Error(error.response?.data as string);
      }
    },
    [],
  );

  const signOut = useCallback(() => {
    setToken(null);
    localStorage.removeItem("token");
  }, []);

  useEffect(() => {
    if (token) {
      if (isTokenExpired(token)) {
        setToken(null);
        return;
      }
      axios.defaults.headers.common["Authorization"] = "Bearer " + token;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  }, [token]);

  const contextValue = useMemo(
    () => ({
      token,
      signIn,
      signUp,
      signOut,
    }),
    [signIn, signOut, signUp, token],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
