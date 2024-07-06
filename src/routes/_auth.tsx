import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Outlet />
    </div>
  ),
});
