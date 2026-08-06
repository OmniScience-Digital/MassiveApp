"use client";

// components/layout/navbar.tsx

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sun, Moon, User, Settings, LogOut, Menu, Loader2, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Breadcrumbs from "./breadcrumbs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import amplifyOutputs from "../../amplify_outputs.json";
import Link from "next/link";

const getIsTestEnv = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost") return true;
  const redirectUris: string[] = amplifyOutputs.auth.oauth.redirect_sign_in_uri;
  const matchedUri = redirectUris.find((uri) => uri.includes(hostname));
  if (!matchedUri) return false;
  return matchedUri.includes("test.");
};

export default function Navbar() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isTestEnv, setIsTestEnv] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsTestEnv(getIsTestEnv());

    const savedDarkMode = localStorage.getItem("darkMode");
    const isDark = savedDarkMode === "true";
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    const fetchUser = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        const email = tokens?.signInDetails?.loginId || "";
        if (!email) {
          router.replace("/");
          return;
        }
        setUser(email);
        const groups = (tokens?.idToken?.payload["cognito:groups"] as string[] | undefined) ?? [];
        setIsAdmin(groups.includes("ADMIN"));
      } catch {
        router.replace("/");
      }
    };

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
      await signOut({ global: true });
    } catch (error) {
      console.warn("Sign out error:", error);
    } finally {
      setUser("");
      router.replace("/");
      setIsSigningOut(false);
    }
  };

  const darkModeReady = isDarkMode !== null;

  return (
    <div className="fixed top-0 left-0 w-full z-50 mb-10">
      <header className="flex items-center justify-between bg-gray-700 p-4 border-b shadow-md">
        <Link href="/" className="flex items-center cursor-pointer">
          <img src="/assets/logo-2.png" alt="Logo" className="h-11 mr-4" loading="lazy" />
        </Link>

        {/* Mobile Menu */}
        <div className="sm:hidden">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              {/* ✅ plain <button> instead of shadcn Button */}
              <button className="flex items-center justify-center size-9 cursor-pointer focus:outline-none bg-transparent border-none hover:bg-transparent">
                <Menu className="h-4 w-4 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 z-[100]">
              {darkModeReady && (
                <DropdownMenuItem onClick={(e) => { e.preventDefault(); setTimeout(() => setMenuOpen(false), 200); }}>
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <Switch checked={!!isDarkMode} onCheckedChange={toggleDarkMode} />
                    <Moon className="h-4 w-4" />
                  </div>
                </DropdownMenuItem>
              )}
              {user && (
                <DropdownMenuItem className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  <User className="h-4 w-4" /> {user}
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/credentials" className="flex items-center gap-2 cursor-pointer">
                    <ShieldCheck className="h-4 w-4" /> Credentials Vault
                  </Link>
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
              <Sun className="h-4 w-4 text-white" />
              <Switch checked={!!isDarkMode} onCheckedChange={toggleDarkMode} />
              <Moon className="h-4 w-4 text-white" />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* ✅ plain <button> instead of shadcn Button */}
              <button className="flex items-center justify-center size-9 cursor-pointer focus:outline-none bg-transparent border-none hover:bg-transparent">
                <User className="h-4 w-4 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[100]">
              {user && (
                <DropdownMenuItem className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  <User className="h-4 w-4" /> {user}
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/credentials" className="flex items-center gap-2 cursor-pointer">
                    <ShieldCheck className="h-4 w-4" /> Credentials Vault
                  </Link>
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

      {isTestEnv && (
        <div className="flex items-center justify-center gap-1.5 bg-gray-200/60 dark:bg-gray-700/40 text-orange-500 dark:text-orange-400 text-[10px] py-0.5 tracking-wider">
          <span>⚠</span> TEST ENV <span>⚠</span>
        </div>
      )}

      <Breadcrumbs />

      {isSigningOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-md shadow-md">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Signing out...</span>
          </div>
        </div>
      )}
    </div>
  );
}