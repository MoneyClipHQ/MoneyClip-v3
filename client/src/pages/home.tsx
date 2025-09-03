import Header from "@/components/header";
import Hero from "@/components/hero";
import Process from "@/components/process";
import Features from "@/components/benefits";
import WhyChoose from "@/components/why-choose";
import CTA from "@/components/cta";
import Footer from "@/components/footer";
import { usePageTitle } from "@/hooks/usePageTitle";

export default function Home() {
  usePageTitle("MoneyClip - Home");
  
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Process />
        <Features />
        <WhyChoose />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
