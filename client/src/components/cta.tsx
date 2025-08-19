import { Button } from "@/components/ui/button";

export default function CTA() {
  const handleStartTrial = () => {
    // TODO: Implement start trial functionality
    console.log("Start Trial clicked");
  };

  const handleRequestDemo = () => {
    // TODO: Implement request demo functionality
    console.log("Request Demo clicked");
  };

  return (
    <section className="bg-primary py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to transform client communication?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Join financial advisors who are already using MoneyClip to save time and improve client relationships.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleStartTrial}
            data-testid="button-start-trial"
            className="bg-white hover:bg-gray-50 text-primary font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
          >
            Start Free Trial
          </Button>
          <Button
            variant="outline"
            onClick={handleRequestDemo}
            data-testid="button-request-demo"
            className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-4 rounded-lg transition-all duration-200 text-lg bg-transparent"
          >
            Request Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
