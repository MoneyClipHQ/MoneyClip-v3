import { Button } from "@/components/ui/button";

export default function Header() {
  const handleLogin = () => {
    // TODO: Implement login functionality
    console.log("Login clicked");
  };

  const handleSignup = () => {
    // TODO: Implement signup functionality
    console.log("Signup clicked");
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-bold text-primary">MoneyClip</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={handleLogin}
              data-testid="button-login"
              className="text-secondary hover:text-primary transition-colors duration-200 font-medium px-4 py-2"
            >
              Log In
            </Button>
            <Button
              onClick={handleSignup}
              data-testid="button-signup"
              className="bg-primary hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
