import { LineChart } from "lucide-react";
import LinkButton from "./link-button";
import { cn } from "@/lib/utils";
import { LogoLink } from "./logo";
import { useMemo } from "react";
import { useRouterState } from "@tanstack/react-router";

export function Nav(props: {
  device?: "desktop" | "mobile";
  hasLogo?: boolean;
  className?: string;
}) {
  const { device = "desktop", hasLogo = false, className } = props;
  const router = useRouterState();

  const iconSize = useMemo(
    () => (device === "desktop" ? "w-4 h-4" : "w-5 h-5"),
    [device],
  );

  const navStyle = useMemo(
    () =>
      device === "desktop"
        ? "grid px-2 text-sm font-medium lg:px-4"
        : "grid gap-2 text-lg font-medium",
    [device],
  );

  const routes = [
    {
      icon: LineChart,
      label: "Dashboard",
      href: "/",
    },
    {
      icon: LineChart,
      label: "Portfolios",
      href: "/portfolios",
    },
  ];

  console.log("routes", routes);

  return (
    <nav className={cn(navStyle, className)}>
      {hasLogo && <LogoLink href="/" />}
      {routes.map((route) => (
        <LinkButton
          key={route.label}
          href={route.href}
          active={route.href === router.location.pathname}
        >
          <route.icon className={iconSize} />
          {route.label}
        </LinkButton>
      ))}
    </nav>
  );
}
