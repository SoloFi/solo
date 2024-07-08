import { ParsedLocation, redirect } from "@tanstack/react-router";
import { RouteContextType } from "./routes/__root";

export const checkNotAuth = ({
  context,
  location,
}: {
  context: RouteContextType;
  location: ParsedLocation;
}) => {
  if (!context.auth.token) {
    throw redirect({
      to: "/signIn",
      search: {
        redirect: location.href,
      },
    });
  }
};

export const checkAuth = ({
  context,
}: {
  context: RouteContextType;
  location: ParsedLocation;
}) => {
  if (context.auth.token) {
    throw redirect({
      to: "/",
    });
  }
};
