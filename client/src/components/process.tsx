import { Video, Share, Monitor, Clock } from "lucide-react";

export default function Process() {
  const steps = [
    {
      number: "1",
      title: "Record your screen and audio",
      description: "Walk clients through plans, documents, or dashboards in your own words.",
      icon: Video
    },
    {
      number: "2", 
      title: "Send secure link",
      description: "Share a private, encrypted video link with just a click.",
      icon: Share
    },
    {
      number: "3",
      title: "Client watches on your branded page", 
      description: "Clients view the video on a page that looks like it's yours—logo, colors, and all.",
      icon: Monitor
    },
    {
      number: "4",
      title: "Save time and money",
      description: "For you, your staff, and most importantly—your clients.",
      icon: Clock
    }
  ];

  return (
    <section className="bg-gray-50 py-16 sm:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-secondary max-w-3xl mx-auto">
            Create professional, compliant video communications in four simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            
            return (
              <div key={index} className="text-center">
                <div className="bg-white rounded-xl p-6 h-full shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="bg-primary bg-opacity-10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="text-primary font-bold text-lg">{step.number}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3" data-testid={`text-step-title-${index}`}>
                    {step.title}
                  </h3>
                  <p className="text-secondary text-sm leading-relaxed" data-testid={`text-step-description-${index}`}>
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
