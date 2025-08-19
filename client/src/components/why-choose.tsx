import { Clock, Users, Star, Shield } from "lucide-react";

export default function WhyChoose() {
  const benefits = [
    {
      icon: Clock,
      title: "Save Hours Every Week",
      description: "Record once, share with multiple clients. Stop repeating the same explanations."
    },
    {
      icon: Users,
      title: "Improve Client Understanding",
      description: "Visual explanations help clients grasp complex concepts and make better decisions."
    },
    {
      icon: Star,
      title: "Professional Brand Image",
      description: "Custom-branded video pages that reinforce your professional image and trust."
    },
    {
      icon: Shield,
      title: "Built-in Compliance",
      description: "Never worry about regulatory requirements with automatic disclosure management."
    }
  ];

  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Financial Advisors Choose MoneyClip
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            
            return (
              <div key={index} className="text-center">
                <div className="bg-white rounded-xl p-6 h-full shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3" data-testid={`text-why-title-${index}`}>
                    {benefit.title}
                  </h3>
                  <p className="text-secondary text-sm leading-relaxed" data-testid={`text-why-description-${index}`}>
                    {benefit.description}
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