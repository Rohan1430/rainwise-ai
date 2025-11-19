import { Button } from "@/components/ui/button";
import { Droplets, TrendingUp, Leaf } from "lucide-react";
import heroImage from "@/assets/hero-water.jpg";

const Hero = () => {
  const scrollToForm = () => {
    document.getElementById('input-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 bg-gradient-hero">
        <img 
          src={heroImage} 
          alt="Rainwater harvesting and sustainable water management"
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Droplets className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Water Conservation</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
            Optimize Rainwater
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Harvesting with AI
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Data-driven predictions for water harvesting potential. Get personalized recommendations for optimal recharge structures based on your location, soil type, and rainfall patterns.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto pt-8">
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-card">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-3">
                <Droplets className="w-6 h-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">95%</div>
              <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-card">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10 mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">40%</div>
              <div className="text-sm text-muted-foreground">Water Savings</div>
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-card">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mx-auto mb-3">
                <Leaf className="w-6 h-6 text-accent" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">100+</div>
              <div className="text-sm text-muted-foreground">Sites Optimized</div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              className="text-lg px-8 shadow-glow hover:shadow-xl transition-all"
              onClick={scrollToForm}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
    </section>
  );
};

export default Hero;