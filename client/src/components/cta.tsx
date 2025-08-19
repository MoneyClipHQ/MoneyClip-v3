import { Button } from "@/components/ui/button";

export default function CTA() {
  const handleStartTrial = () => {
    // TODO: Implement start trial functionality
    console.log("Start Trial clicked");
  };

  return (
    <section className="bg-primary py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Built for Advisors by Advisors
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
          Created by financial professionals who understand the unique challenges of client communication and regulatory compliance.
        </p>
        <div className="flex justify-center">
          <Button
            onClick={handleStartTrial}
            data-testid="button-start-trial"
            className="bg-white hover:bg-gray-50 text-primary font-semibold px-8 py-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
}
