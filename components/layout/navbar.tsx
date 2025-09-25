"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
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

export default function Navbar() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Dark mode initialization
  useEffect(() => {
    const initialize = async () => {
      const savedDarkMode = localStorage.getItem("darkMode");
      const isDark = savedDarkMode === "true";
      setIsDarkMode(isDark);
      document.documentElement.classList.toggle("dark", isDark);

      const Authuser = await getUser();
      if (Authuser) {
        setUser(Authuser);
      }
    };

    initialize();
  }, []);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    document.documentElement.classList.toggle("dark", newMode);
  };

  const getUser = async () => {
    try {
      const { tokens } = await fetchAuthSession();

      return tokens?.signInDetails?.loginId || '';
    } catch (error) {
      console.error("Error fetching user:", error);
      return '';
    }
  };

  const handleSignOut = async () => {
    
    setIsSigningOut(true);
    try {
      await signOut();
      // Redirect immediately without waiting
      router.push('/');
      
      // Clear any local state
      setUser('');
    
      
    } catch (error) {
      console.error("Sign out error:", error);
    } 
    
  };

  if (isDarkMode === null) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-50">
      <header className="flex items-center justify-between bg-gray-700 p-4 border-b shadow-md">
        {/* Logo */}
        <div className="flex items-center">
          <Image
            src="/assets/logo_white.png"
            alt="Logo"
            width={120}
            height={60}
            className="h-10 mr-2"
          />
        </div>

        {/* Mobile Menu */}
        <div className="sm:hidden">
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative focus:outline-none focus:ring-0 hover:bg-transparent cursor-pointer">
                <Menu className="h-5 w-5 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); setTimeout(() => setMenuOpen(false), 200); }}>
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                  <Moon className="h-5 w-5" />
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer">
                <User className="h-4 w-4" />
                {user}
              </DropdownMenuItem>

            
              <DropdownMenuItem>
                <Settings className="h-4 w-4" />
                Settings</DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-white" />
            <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
            <Moon className="h-5 w-5 text-white" />
          </div>
          

          
          <DropdownMenu >
            <DropdownMenuTrigger asChild className="cursor-pointer">
              <Button variant="ghost" size="icon" className="focus:outline-none focus:ring-0 hover:bg-transparent">
                <User className="h-5 w-5 text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-xs font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer">
                <User className="h-5 w-5" />
                {user}
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Logout
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
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
              Signing out...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}