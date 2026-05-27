"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sun, Moon, User, Settings, LogOut, Menu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import Breadcrumbs from "./breadcrumbs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import Link from "next/link";

export default function Navbar() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    // Dark mode: purely from localStorage, no network call, instant
    const savedDarkMode = localStorage.getItem("darkMode");
    const isDark = savedDarkMode === "true";
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    // User fetch is low priority — run after paint so it doesn't block render
    const fetchUser = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        setUser(tokens?.signInDetails?.loginId || "");
      } catch {
        // not logged in or offline — silently ignore
      }
    };
    // Use requestIdleCallback if available, else setTimeout
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(fetchUser);
    } else {
      setTimeout(fetchUser, 0);
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    document.documentElement.classList.toggle("dark", newMode);
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/");
      setUser("");
    } catch (error) {
      console.error("Sign out error:", error);
      setIsSigningOut(false);
    }
  };

  // Don't block render waiting for dark mode — default to light
  const darkModeReady = isDarkMode !== null;

  return (
    <div className="fixed top-0 left-0 w-full z-50">
        <header className="flex items-center justify-between bg-gray-700 p-4 border-b shadow-md">
        {/* Logo */}
        <Link href="/" className="flex items-center cursor-pointer">
          <img
            src="/assets/logo-2.png"
            alt="Logo"
            className="h-11 mr-4"
            loading="lazy"
          />
        </Link>

        {/* Mobile Menu */}
        <div className="sm:hidden">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative focus:outline-none focus:ring-0 hover:bg-transparent cursor-pointer">
                <Menu className="h-5 w-5 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {darkModeReady && (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); setTimeout(() => setMenuOpen(false), 200); }}>
                  <div className="flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    <Switch checked={!!isDarkMode} onCheckedChange={toggleDarkMode} />
                    <Moon className="h-5 w-5" />
                  </div>
                </DropdownMenuItem>
              )}
              {user && (
                <DropdownMenuItem className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  <User className="h-4 w-4" />
                  {user}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Settings className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="flex items-center gap-2">
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-4">
          {darkModeReady && (
            <div className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-white" />
              <Switch checked={!!isDarkMode} onCheckedChange={toggleDarkMode} />
              <Moon className="h-5 w-5 text-white" />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <Button variant="ghost" size="icon" className="focus:outline-none focus:ring-0 hover:bg-transparent">
                <User className="h-5 w-5 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user && (
                <DropdownMenuItem className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  <User className="h-5 w-5" /> {user}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="h-4 w-4" /> <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut} className="flex items-center gap-2 cursor-pointer">
                <LogOut className="h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <Breadcrumbs />
      {isSigningOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-md shadow-md">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Signing out...</span>
          </div>
        </div>
      )}
    </div>
  );
}
