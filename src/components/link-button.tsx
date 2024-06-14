import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

export default function LinkButton(props: {
  href: string;
  children: React.ReactNode;
  className?: string;
  active?: boolean;
}) {
  const { href, children, className, active } = props;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 font-semibold transition-all rounded-lg text-muted-foreground hover:text-primary aria-selected:bg-muted aria-selected:text-primary",
        className,
      )}
      aria-selected={active}
    >
      {children}
    </Link>
  );
}
