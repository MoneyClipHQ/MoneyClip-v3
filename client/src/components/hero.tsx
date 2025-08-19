import { Button } from "@/components/ui/button";

export default function Hero() {
  const handleGetStarted = () => {
    // TODO: Implement get started functionality
    console.log("Get Started clicked");
  };

  const handleWatchDemo = () => {
    // TODO: Implement watch demo functionality
    console.log("Watch Demo clicked");
  };

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Screen recording made{" "}
              <span className="text-primary">secure</span> for advisors
            </h1>
            <p className="mt-6 text-xl text-secondary leading-relaxed max-w-2xl lg:max-w-none">
              Record your screen, share securely with clients, and improve understanding while saving time. Built specifically for financial advisors.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                onClick={handleGetStarted}
                data-testid="button-get-started"
                className="bg-primary hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
              >
                Get Started Free
              </Button>
              <Button
                variant="outline"
                onClick={handleWatchDemo}
                data-testid="button-watch-demo"
                className="border-2 border-gray-300 hover:border-primary text-secondary hover:text-primary font-semibold px-8 py-4 rounded-lg transition-all duration-200 text-lg"
              >
                Watch Demo
              </Button>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-5">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
              alt="Financial advisor working at desk with modern technology"
              className="rounded-2xl shadow-2xl w-full h-auto"
              data-testid="img-hero"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
