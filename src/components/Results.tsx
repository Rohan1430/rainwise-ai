import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Droplets, TrendingUp, CheckCircle2, AlertTriangle } from "lucide-react";

interface ResultsProps {
  data: {
    location: string;
    roofArea: string;
    soilType: string;
    slope: string;
  };
}

const Results = ({ data }: ResultsProps) => {
  // Mock AI predictions (in production, this would come from your AI model)
  const harvestPotential = Math.floor(parseFloat(data.roofArea) * 0.8 * 12); // Rough estimate
  const efficiency = data.soilType === 'sandy' ? 85 : data.soilType === 'clay' ? 65 : 75;
  
  const getRecommendedStructure = () => {
    if (data.soilType === 'sandy') return 'Percolation Pit';
    if (data.soilType === 'clay') return 'Storage Tank with Filtration';
    if (data.slope.startsWith('0-5')) return 'Recharge Well';
    return 'Recharge Trench';
  };

  const recommendedStructure = getRecommendedStructure();

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            AI Analysis Results
          </h2>
          <p className="text-lg text-muted-foreground">
            Based on your inputs for {data.location}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Water Harvesting Potential */}
          <Card className="p-6 shadow-card border-border bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Annual Water Harvesting Potential
                </h3>
                <p className="text-sm text-muted-foreground">
                  Based on average rainfall in your region
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Droplets className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="text-4xl font-bold text-primary mb-2">
              {harvestPotential.toLocaleString()} L
            </div>
            <div className="text-sm text-muted-foreground">
              ~{Math.floor(harvestPotential / 12).toLocaleString()} liters per month
            </div>
          </Card>

          {/* Recharge Efficiency */}
          <Card className="p-6 shadow-card border-border bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Recharge Efficiency Score
                </h3>
                <p className="text-sm text-muted-foreground">
                  Soil infiltration capacity
                </p>
              </div>
              <div className="p-3 rounded-full bg-secondary/10">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <div className="mb-3">
              <div className="text-4xl font-bold text-secondary mb-2">
                {efficiency}%
              </div>
              <Progress value={efficiency} className="h-3" />
            </div>
            <div className="text-sm text-muted-foreground">
              {data.soilType.charAt(0).toUpperCase() + data.soilType.slice(1)} soil type
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="p-8 shadow-card border-border bg-card">
          <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-secondary" />
            Recommended Recharge Structure
          </h3>

          <div className="bg-gradient-primary rounded-xl p-6 mb-6">
            <div className="text-2xl font-bold text-white mb-2">
              {recommendedStructure}
            </div>
            <p className="text-white/90">
              Optimal for your soil type and terrain slope
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Key Benefits:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <span>Maximizes groundwater recharge for your soil conditions</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <span>Reduces surface runoff and erosion</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                  <span>Cost-effective implementation and maintenance</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Implementation Notes:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Regular maintenance required for optimal performance</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Install pre-filtration to prevent clogging</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span>Monitor water quality periodically</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Results;