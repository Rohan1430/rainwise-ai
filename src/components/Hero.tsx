import { Button } from "@/components/ui/button";
import { Droplets, TrendingUp, Leaf, ArrowDown } from "lucide-react";
import heroImage from "@/assets/hero-water.jpg";

const Hero = () => {
  const scrollToForm = () => {
    document.getElementById('input-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Rainwater harvesting and sustainable water management"
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/8 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-accent/10 rounded-full blur-2xl" />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 animate-fade-in">
            <Droplets className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Water Conservation</span>
          </div>
          
          {/* Headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight animate-fade-in stagger-1">
            Smart Rainwater
            <span className="block mt-2 bg-gradient-primary bg-clip-text text-transparent">
              Harvesting Analysis
            </span>
          </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in stagger-2">
            Get data-driven predictions for water harvesting potential. Receive personalized recommendations for optimal recharge structures based on your location, soil type, and building specifications.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto pt-6 animate-fade-in stagger-3">
            <div className="group bg-card rounded-xl p-6 border border-border shadow-card card-hover">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mx-auto mb-4 group-hover:bg-primary/15 transition-colors">
                <Droplets className="w-6 h-6 text-primary" />
              </div>
              <div className="font-display text-3xl font-bold text-foreground mb-1">95%</div>
              <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
            </div>
            
            <div className="group bg-card rounded-xl p-6 border border-border shadow-card card-hover">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/10 mx-auto mb-4 group-hover:bg-secondary/15 transition-colors">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <div className="font-display text-3xl font-bold text-foreground mb-1">40%</div>
              <div className="text-sm text-muted-foreground">Average Water Savings</div>
            </div>
            
            <div className="group bg-card rounded-xl p-6 border border-border shadow-card card-hover">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-earth-light mx-auto mb-4 group-hover:bg-earth-medium/15 transition-colors">
                <Leaf className="w-6 h-6 text-earth-medium" />
              </div>
              <div className="font-display text-3xl font-bold text-foreground mb-1">100+</div>
              <div className="text-sm text-muted-foreground">Sites Optimized</div>
            </div>
          </div>
          
          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-fade-in stagger-4">
            <Button 
              size="lg" 
              className="text-base px-8 h-12 shadow-glow btn-animate bg-gradient-primary hover:opacity-90"
              onClick={scrollToForm}
            >
              Start Analysis
              <ArrowDown className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-base px-8 h-12 btn-animate border-2"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center pt-2">
          <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
