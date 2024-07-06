import LinkButton from "@/components/link-button";
import { LogoLink } from "@/components/logo";
import TopBar from "@/components/top-bar";
import { Button } from "@/components/ui/button";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Bell, LineChart } from "lucide-react";

export const Route = createFileRoute("/__layout")({
  component: () => () => {
    return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-background md:block">
          <div className="flex flex-col h-full max-h-screen gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <LogoLink href="/" />
              <Button variant="outline" size="icon" className="w-8 h-8 ml-auto">
                <Bell className="w-4 h-4" />
                <span className="sr-only">Toggle notifications</span>
              </Button>
            </div>
            <div className="flex-1">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                <LinkButton href="#" active={true}>
                  <LineChart className="w-4 h-4" />
                  Dashboard
                </LinkButton>
              </nav>
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          <TopBar />
          <main className="flex flex-col flex-1 gap-4 p-4 lg:gap-6 lg:p-8 bg-muted/40">
            <Outlet />
          </main>
        </div>
      </div>
    );
  },
});
