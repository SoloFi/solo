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

export interface UserContextType {
  token: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, accessKey: string) => Promise<void>;
  signOut: () => void;
  currency: string;
  switchCurrency: (currency: string) => void;
}
export const UserContext = createContext<UserContextType>({} as UserContextType);

const UserProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currency, setCurrency] = useState<string>(
    localStorage.getItem("currency") ?? "USD",
  );

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

  const switchCurrency = useCallback((currency: string) => {
    setCurrency(currency);
    localStorage.setItem("currency", currency);
  }, []);

  const contextValue = useMemo(
    () => ({
      token,
      signIn,
      signUp,
      signOut,
      currency,
      switchCurrency,
    }),
    [currency, signIn, signOut, signUp, switchCurrency, token],
  );

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};

export default UserProvider;
