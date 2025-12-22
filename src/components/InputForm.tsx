import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Home, Layers } from "lucide-react";

interface FormData {
  location: string;
  roofArea: string;
  soilType: string;
  slope: string;
}

interface InputFormProps {
  onSubmit: (data: FormData) => void;
  initialData?: Partial<FormData>;
}

const InputForm = ({ onSubmit, initialData }: InputFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    location: initialData?.location || "",
    roofArea: initialData?.roofArea || "",
    soilType: initialData?.soilType || "",
    slope: initialData?.slope || "",
  });

  // Update form when initialData changes (e.g., profile loads)
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        location: initialData.location || prev.location,
        roofArea: initialData.roofArea || prev.roofArea,
        soilType: initialData.soilType || prev.soilType,
        slope: initialData.slope || prev.slope,
      }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <section id="input-form" className="py-20 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Enter Your Building Details
          </h2>
          <p className="text-lg text-muted-foreground">
            Provide your location and roof specifications for accurate water harvesting predictions
          </p>
        </div>

        <Card className="p-8 shadow-card border-border bg-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 text-primary" />
                Location (City, State)
              </Label>
              <Input
                id="location"
                placeholder="e.g., Bangalore, Karnataka"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="text-base"
              />
            </div>

            {/* Roof Area */}
            <div className="space-y-2">
              <Label htmlFor="roofArea" className="flex items-center gap-2 text-base">
                <Home className="w-4 h-4 text-primary" />
                Roof Area (sq. meters)
              </Label>
              <Input
                id="roofArea"
                type="number"
                placeholder="e.g., 150"
                value={formData.roofArea}
                onChange={(e) => setFormData({ ...formData, roofArea: e.target.value })}
                required
                className="text-base"
              />
            </div>

            {/* Soil Type */}
            <div className="space-y-2">
              <Label htmlFor="soilType" className="flex items-center gap-2 text-base">
                <Layers className="w-4 h-4 text-primary" />
                Soil Type
              </Label>
              <Select
                value={formData.soilType}
                onValueChange={(value) => setFormData({ ...formData, soilType: value })}
              >
                <SelectTrigger id="soilType" className="text-base">
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clay">Clay</SelectItem>
                  <SelectItem value="sandy">Sandy</SelectItem>
                  <SelectItem value="loamy">Loamy</SelectItem>
                  <SelectItem value="silt">Silt</SelectItem>
                  <SelectItem value="rocky">Rocky</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Slope */}
            <div className="space-y-2">
              <Label htmlFor="slope" className="text-base">
                Land Slope (degrees)
              </Label>
              <Select
                value={formData.slope}
                onValueChange={(value) => setFormData({ ...formData, slope: value })}
              >
                <SelectTrigger id="slope" className="text-base">
                  <SelectValue placeholder="Select slope range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-5">0-5° (Flat)</SelectItem>
                  <SelectItem value="5-10">5-10° (Gentle)</SelectItem>
                  <SelectItem value="10-15">10-15° (Moderate)</SelectItem>
                  <SelectItem value="15-20">15-20° (Steep)</SelectItem>
                  <SelectItem value="20+">20°+ (Very Steep)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full text-lg shadow-glow"
            >
              Generate Predictions
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
};

export default InputForm;