import Header from "@/components/header";
import Hero from "@/components/hero";
import Process from "@/components/process";
import Benefits from "@/components/benefits";
import CTA from "@/components/cta";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Process />
        <Benefits />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
