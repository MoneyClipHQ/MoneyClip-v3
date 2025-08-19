import { Video, Share, GraduationCap } from "lucide-react";

export default function Process() {
  const steps = [
    {
      icon: Video,
      title: "Record Your Screen",
      description: "Capture your screen as you explain portfolios, market updates, or financial strategies. One-click recording with no technical setup.",
      color: "primary"
    },
    {
      icon: Share,
      title: "Share a Secure Link",
      description: "Generate password-protected, expiring links that meet compliance requirements. Control who sees what and for how long.",
      color: "primary"
    },
    {
      icon: GraduationCap,
      title: "Educate Your Clients",
      description: "Clients watch at their convenience, replay complex sections, and arrive at meetings with better understanding.",
      color: "accent"
    }
  ];

  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Three simple steps to better client communication
          </h2>
          <p className="text-xl text-secondary max-w-2xl mx-auto">
            Transform complex financial concepts into clear, engaging recordings your clients will actually understand.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            const iconColorClass = step.color === "accent" ? "text-accent" : "text-primary";
            const bgColorClass = step.color === "accent" ? "bg-accent bg-opacity-10" : "bg-primary bg-opacity-10";
            
            return (
              <div key={index} className="text-center group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <div className={`${bgColorClass} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6`}>
                    <IconComponent className={`w-8 h-8 ${iconColorClass}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4" data-testid={`text-step-title-${index}`}>
                    {step.title}
                  </h3>
                  <p className="text-secondary leading-relaxed" data-testid={`text-step-description-${index}`}>
                    {step.description}
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
