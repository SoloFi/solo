import { AuthContextType } from "@/components/auth-provider";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export interface RouteContextType {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<RouteContextType>()({
  component: () => (
    <>
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  ),
});
