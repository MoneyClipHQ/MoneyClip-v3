import { Clock, Shield, Users } from "lucide-react";

export default function Benefits() {
  const benefits = [
    {
      icon: Clock,
      title: "Save time on repetitive explanations",
      description: "Record once, share with multiple clients. Stop explaining the same market updates over and over.",
      color: "accent"
    },
    {
      icon: Shield,
      title: "Maintain compliance standards",
      description: "Secure sharing with controlled access, audit trails, and automatic expiration built for financial services.",
      color: "primary"
    },
    {
      icon: Users,
      title: "Improve client understanding",
      description: "Visual explanations help clients grasp complex concepts and feel more confident about their financial decisions.",
      color: "accent"
    }
  ];

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div className="lg:order-2">
            <img
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600"
              alt="Financial advisor in video call with client"
              className="rounded-2xl shadow-2xl w-full h-auto"
              data-testid="img-benefits"
            />
          </div>
          <div className="mt-12 lg:mt-0 lg:order-1">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
              Built for busy advisors who want to scale
            </h2>
            <div className="space-y-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                const iconColorClass = benefit.color === "accent" ? "text-accent" : "text-primary";
                const bgColorClass = benefit.color === "accent" ? "bg-accent bg-opacity-10" : "bg-primary bg-opacity-10";
                
                return (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className={`${bgColorClass} rounded-lg w-10 h-10 flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 ${iconColorClass}`} />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid={`text-benefit-title-${index}`}>
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
        </div>
      </div>
    </section>
  );
}
