export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mb-8">
            <span className="text-2xl font-bold text-primary">MoneyClip</span>
          </div>
          <div className="flex justify-center space-x-8 text-sm text-secondary">
            <a 
              href="#" 
              className="hover:text-primary transition-colors duration-200"
              data-testid="link-about"
            >
              About
            </a>
            <a 
              href="#" 
              className="hover:text-primary transition-colors duration-200"
              data-testid="link-terms"
            >
              Terms of Service
            </a>
            <a 
              href="#" 
              className="hover:text-primary transition-colors duration-200"
              data-testid="link-privacy"
            >
              Privacy Policy
            </a>
            <a 
              href="#" 
              className="hover:text-primary transition-colors duration-200"
              data-testid="link-contact"
            >
              Contact
            </a>
          </div>
          <div className="mt-8 text-sm text-secondary">
            <p data-testid="text-copyright">
              &copy; 2024 MoneyClip. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
