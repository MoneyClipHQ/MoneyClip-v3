import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import logoUrl from "@/assets/logos/moneyclip-logo.png";

export default function Header() {

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <img 
                  src={logoUrl} 
                  alt="MoneyClip" 
                  className="h-20 w-auto object-contain cursor-pointer"
                  data-testid="logo-moneyclip"
                />
              </Link>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/pricing">
              <span className="text-secondary hover:text-primary transition-colors duration-200 font-medium cursor-pointer">
                Pricing
              </span>
            </Link>
            <Link href="/coming-soon">
              <span className="text-secondary hover:text-primary transition-colors duration-200 font-medium cursor-pointer">
                Coming Soon
              </span>
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button
                variant="ghost"
                data-testid="button-login"
                className="text-secondary hover:text-primary transition-colors duration-200 font-medium px-4 py-2"
              >
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button
                data-testid="button-signup"
                className="bg-primary hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
