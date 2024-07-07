import { ModeToggle } from "@/components/mode-toggle";
import SymbolSearchDialog from "@/components/symbol-search-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SheetTrigger, SheetContent, Sheet } from "@/components/ui/sheet";
import { CircleUser, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { Command, CommandInput } from "./ui/command";
import { useState } from "react";
import { Nav } from "./nav";
import { CurrencySelect } from "./currency-select";

const TopBar = () => {
  const [isSymbolSearchOpen, setIsSymbolSearchOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background lg:h-[60px] px-4 lg:px-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="w-5 h-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <Nav device="mobile" hasLogo />
        </SheetContent>
      </Sheet>
      <Command className="rounded-lg border h-max max-w-[500px] bg-secondary">
        <CommandInput
          placeholder="Search for symbols..."
          onClick={() => setIsSymbolSearchOpen(true)}
        />
      </Command>
      <div className="flex-1 w-full" />
      <CurrencySelect onSelect={console.log} />
      <ModeToggle />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="w-5 h-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {isSymbolSearchOpen && (
        <SymbolSearchDialog
          isOpen={isSymbolSearchOpen}
          onOpenChange={setIsSymbolSearchOpen}
          onSelect={console.log}
        />
      )}
    </header>
  );
};

export default TopBar;
