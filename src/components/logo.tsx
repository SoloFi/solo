import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Sparkle } from "lucide-react";

export function Logo(props: { className?: string }) {
  const { className } = props;
  return (
    <div className={cn("flex items-center gap-1.5 text-2xl font-bold", className)}>
      <Sparkle className="w-[24px] h-[24px]" />
      <span>Solo</span>
    </div>
  );
}

export function LogoLink(props: { href: string }) {
  return (
    <Link href={props.href} className="transition-opacity hover:opacity-75">
      <Logo />
    </Link>
  );
}
