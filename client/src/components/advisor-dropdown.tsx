import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, UserIcon, PaletteIcon, ShieldCheckIcon, SettingsIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdvisorDropdownProps {
  advisorName: string;
  onSignOut?: () => void;
  onSettings?: () => void;
  onBranding?: () => void;
  onCompliance?: () => void;
}

export default function AdvisorDropdown({ 
  advisorName, 
  onSignOut, 
  onSettings, 
  onBranding, 
  onCompliance 
}: AdvisorDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  const menuItems = [
    {
      icon: PaletteIcon,
      label: "Branding",
      onClick: onBranding,
      testId: "menu-branding"
    },
    {
      icon: ShieldCheckIcon,
      label: "Compliance",
      onClick: onCompliance,
      testId: "menu-compliance"
    },
    {
      icon: SettingsIcon,
      label: "Settings",
      onClick: onSettings,
      testId: "menu-settings"
    },
    {
      icon: LogOutIcon,
      label: "Sign out",
      onClick: onSignOut,
      testId: "menu-signout"
    }
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        data-testid="button-advisor-menu"
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
      >
        <UserIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{advisorName}</span>
        <span className="sm:hidden">{advisorName.split(' ')[0]}</span>
        <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.onClick?.();
                setIsOpen(false);
              }}
              data-testid={item.testId}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}