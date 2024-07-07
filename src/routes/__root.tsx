import { AuthContextType } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export interface RouteContextType {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<RouteContextType>()({
  component: () => (
    <>
      <Outlet />
      <Toaster />
      {import.meta.env.DEV && <TanStackRouterDevtools position="bottom-right" />}
    </>
  ),
});
