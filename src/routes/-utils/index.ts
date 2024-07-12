import { ParsedLocation, redirect } from "@tanstack/react-router";
import { isTokenExpired } from "@/lib/utils";

export const mustBeAuthenticated = ({ location }: { location: ParsedLocation }) => {
  const token = localStorage.getItem("token");
  if (isTokenExpired(token)) {
    throw redirect({
      to: "/signIn",
      search: {
        redirect: location.href,
      },
    });
  }
};

export const alreadyAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!isTokenExpired(token)) {
    throw redirect({
      to: "/",
    });
  }
};
