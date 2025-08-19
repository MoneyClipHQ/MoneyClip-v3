import { Video, Shield, Database } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Video,
      title: "Screen Recording",
      description: "Record your screen with crystal-clear audio. Perfect for market updates, portfolio reviews, and explaining complex financial concepts."
    },
    {
      icon: Shield,
      title: "Compliance Ready",
      description: "Built-in disclosure management ensures every video meets regulatory requirements. Never worry about compliance again."
    },
    {
      icon: Database,
      title: "CRM Integration",
      description: "Send videos directly to client records in Wealthbox, Redtail, and Salesforce. Streamline your entire workflow."
    }
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Built for Advisors by Advisors
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Everything you need to create professional, compliant video communications that your clients will actually watch and understand.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            
            return (
              <div key={index} className="text-center">
                <div className="bg-gray-50 rounded-xl p-8 h-full">
                  <div className="bg-primary bg-opacity-10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <IconComponent className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid={`text-feature-title-${index}`}>
                    {feature.title}
                  </h3>
                  <p className="text-secondary leading-relaxed" data-testid={`text-feature-description-${index}`}>
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
