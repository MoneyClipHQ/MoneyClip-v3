import Header from "@/components/header";
import Hero from "@/components/hero";
import Process from "@/components/process";
import Features from "@/components/benefits";
import WhyChoose from "@/components/why-choose";
import CTA from "@/components/cta";
import Footer from "@/components/footer";

export default function Home() {
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
