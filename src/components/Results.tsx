import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Droplets, TrendingUp, CheckCircle2, AlertTriangle, IndianRupee, Clock } from "lucide-react";

interface PredictionData {
  annualHarvestPotential: number;
  monthlyAverage: number;
  rechargeEfficiency: number;
  recommendedStructure: string;
  structureDescription: string;
  benefits: string[];
  implementationNotes: string[];
  estimatedCost?: string;
  paybackPeriod?: string;
  environmentalImpact?: string;
}

interface ResultsProps {
  data: {
    location: string;
    roofArea: string;
    soilType: string;
    slope: string;
  };
  prediction: PredictionData | null;
  isLoading: boolean;
}

const Results = ({ data, prediction, isLoading }: ResultsProps) => {
  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="animate-pulse">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Analyzing Your Data...
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our AI is calculating optimal water harvesting potential for {data.location}
            </p>
            <div className="flex justify-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!prediction) {
    return null;
  }

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
              {prediction.annualHarvestPotential.toLocaleString()} L
            </div>
            <div className="text-sm text-muted-foreground">
              ~{prediction.monthlyAverage.toLocaleString()} liters per month
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
                {prediction.rechargeEfficiency}%
              </div>
              <Progress value={prediction.rechargeEfficiency} className="h-3" />
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
              {prediction.recommendedStructure}
            </div>
            <p className="text-white/90">
              {prediction.structureDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Key Benefits:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {prediction.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Implementation Notes:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {prediction.implementationNotes.map((note, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Additional insights */}
          {(prediction.estimatedCost || prediction.paybackPeriod || prediction.environmentalImpact) && (
            <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-border">
              {prediction.estimatedCost && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <IndianRupee className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Estimated Cost</div>
                    <div className="font-semibold text-foreground">{prediction.estimatedCost}</div>
                  </div>
                </div>
              )}
              
              {prediction.paybackPeriod && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <Clock className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Payback Period</div>
                    <div className="font-semibold text-foreground">{prediction.paybackPeriod}</div>
                  </div>
                </div>
              )}

              {prediction.environmentalImpact && (
                <div className="md:col-span-3">
                  <div className="p-4 rounded-lg bg-accent/10">
                    <h4 className="font-semibold text-foreground mb-2">Environmental Impact</h4>
                    <p className="text-sm text-muted-foreground">{prediction.environmentalImpact}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default Results;