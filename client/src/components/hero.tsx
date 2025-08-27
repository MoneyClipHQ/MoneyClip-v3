import { Button } from "@/components/ui/button";

export default function Hero() {
  const handleGetStarted = () => {
    // TODO: Implement get started functionality
    console.log("Get Started clicked");
  };

  return (
    <section className="bg-white py-20 sm:py-24 lg:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
          Screen recording made{" "}
          <span className="text-primary">secure</span> for financial advisors
        </h1>
        <p className="mt-6 text-xl text-secondary leading-relaxed max-w-3xl mx-auto">
          Give your clients advice they can actually understand — and rewatch — with compliant screen recordings that save you time.
        </p>
        <div className="mt-10">
          <Button
            onClick={handleGetStarted}
            data-testid="button-get-started"
            className="bg-primary hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </section>
  );
}
