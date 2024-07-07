import { dayjs, parseJwt } from "@/lib/utils";
import { axios } from "@/query/axios";
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
  signUp: (email: string, password: string, accessKey: string) => Promise<string>;
}
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await axios.post("/signIn", { email, password });
    const token = res.data.token;
    if (!token) throw new Error(res.data.message);
    setToken(token);
    return token as string | undefined;
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, accessKey: string) => {
      const res = await axios.post(
        "/signUp",
        { email, password },
        {
          headers: {
            Authorization: `Bearer ${accessKey}`,
          },
        },
      );
      return res.data as string;
    },
    [],
  );

  useEffect(() => {
    if (token) {
      const parsedToken = parseJwt(token);
      const expiration = parsedToken.exp;
      const expired = dayjs().isAfter(dayjs(expiration * 1000));
      if (expired) {
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
    }),
    [signIn, signUp, token],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
