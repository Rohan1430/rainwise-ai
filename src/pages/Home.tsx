import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Droplets,
  CloudRain,
  Leaf,
  ArrowRight,
  CheckCircle,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import heroImage from "@/assets/hero-water.jpg";

const features = [
  {
    icon: <CloudRain className="w-8 h-8" />,
    title: "Live Weather Data",
    description: "Real-time weather updates and rainfall forecasts for your location.",
  },
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "AI Predictions",
    description: "Smart analysis of your building's rainwater harvesting potential.",
  },
  {
    icon: <Leaf className="w-8 h-8" />,
    title: "Eco-Friendly",
    description: "Reduce water bills and contribute to environmental sustainability.",
  },
  {
    icon: <MessageCircle className="w-8 h-8" />,
    title: "AI Assistant",
    description: "Get instant answers about rainwater harvesting and weather.",
  },
];

const benefits = [
  "Personalized harvesting recommendations",
  "Real-time weather integration",
  "Historical analysis tracking",
  "Cost savings estimation",
  "Environmental impact metrics",
  "24/7 AI chatbot support",
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Droplets className="w-4 h-4" />
              Smart Water Conservation
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Harvest Rain,{" "}
              <span className="text-primary">Save Water</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              RainIQ uses AI-powered analysis to help you maximize rainwater harvesting potential.
              Get personalized recommendations based on your location, building, and local weather patterns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={handleGetStarted} className="btn-animate">
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/weather")}
                className="btn-animate"
              >
                <CloudRain className="w-5 h-5 mr-2" />
                Check Weather
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose RainIQ?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our platform combines real-time weather data with AI analysis to provide
              actionable insights for rainwater harvesting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="card-hover border-border/50 bg-card"
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Everything You Need for Smart Water Management
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                From analyzing your roof area to providing daily weather insights,
                RainIQ is your complete solution for rainwater harvesting.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
              <Card className="relative bg-card border-border/50 shadow-lg">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Droplets className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Annual Potential</p>
                        <p className="text-2xl font-bold text-foreground">50,000+ L</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CO₂ Reduction</p>
                        <p className="text-2xl font-bold text-foreground">120+ kg/year</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cost Savings</p>
                        <p className="text-2xl font-bold text-foreground">₹15,000+/year</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Start Harvesting Rain?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already saving water and money with RainIQ.
          </p>
          <Button size="lg" onClick={handleGetStarted} className="btn-animate">
            {isAuthenticated ? "Go to Dashboard" : "Create Free Account"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© {new Date().getFullYear()} RainIQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
