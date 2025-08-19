import { useState, useRef, useEffect } from "react";
import { ChevronDown, User, Settings, Shield, Palette, LogOut } from "lucide-react";
import { Link } from "wouter";

interface DashboardHeaderProps {
  advisorName: string;
}

export default function DashboardHeader({ advisorName }: DashboardHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isDropdownOpen]);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleDropdownToggle();
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" data-testid="logo-dashboard">
            <div className="flex items-center space-x-2 cursor-pointer">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">MC</span>
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                MoneyClip
              </span>
            </div>
          </Link>

          {/* User Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleDropdownToggle}
              onKeyDown={handleKeyDown}
              className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              data-testid="button-advisor-menu"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">{advisorName}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu">
                  <Link href="/branding">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                      data-testid="button-branding"
                    >
                      <Palette className="w-4 h-4" />
                      <span>Branding</span>
                    </button>
                  </Link>
                  
                  <Link href="/compliance">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                      data-testid="button-compliance"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Compliance</span>
                    </button>
                  </Link>
                  
                  <Link href="/settings">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                      data-testid="button-settings"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                  </Link>
                  
                  <div className="border-t border-gray-100 dark:border-gray-600 my-1" />
                  
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
                    data-testid="button-signout"
                    onClick={() => {
                      // Handle sign out
                      console.log("Sign out clicked");
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}