import { Clock, Shield, Users } from "lucide-react";

export default function Benefits() {
  const benefits = [
    {
      icon: Clock,
      title: "Save Time & Scale",
      description: "Record once, share with multiple clients. Stop repeating the same market updates and portfolio explanations.",
      color: "accent"
    },
    {
      icon: Shield,
      title: "Stay Compliant",
      description: "Password-protected links with expiration dates, audit trails, and secure hosting designed for financial advisors.",
      color: "primary"
    },
    {
      icon: Users,
      title: "Better Client Outcomes",
      description: "Visual explanations improve understanding. Clients arrive at meetings more informed and confident.",
      color: "accent"
    }
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Built for busy advisors who want to scale
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            const iconColorClass = benefit.color === "accent" ? "text-accent" : "text-primary";
            const bgColorClass = benefit.color === "accent" ? "bg-accent bg-opacity-10" : "bg-primary bg-opacity-10";
            
            return (
              <div key={index} className="text-center">
                <div className="bg-white rounded-xl p-6 h-full">
                  <div className={`${bgColorClass} rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4`}>
                    <IconComponent className={`w-6 h-6 ${iconColorClass}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3" data-testid={`text-benefit-title-${index}`}>
                    {benefit.title}
                  </h3>
                  <p className="text-secondary" data-testid={`text-benefit-description-${index}`}>
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
