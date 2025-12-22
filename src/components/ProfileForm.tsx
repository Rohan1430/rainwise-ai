import { useState, useEffect } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileData, ProfileUpdatePayload, HARVESTING_METHODS } from "@/hooks/useProfile";
import { Save, Loader2, MapPin, Home, Droplets, Settings2 } from "lucide-react";

// Validation schema
const profileSchema = z.object({
  full_name: z.string().max(100, "Name must be less than 100 characters").optional(),
  location: z.string().max(200, "Location must be less than 200 characters").optional(),
  roof_area: z.number().min(0, "Roof area must be positive").max(100000, "Roof area is too large").optional().nullable(),
  tank_capacity: z.number().min(0, "Tank capacity must be positive").max(10000000, "Tank capacity is too large").optional().nullable(),
  harvesting_method: z.string().optional().nullable(),
});

interface ProfileFormProps {
  profile: ProfileData;
  onSave: (updates: ProfileUpdatePayload) => Promise<boolean>;
  saving: boolean;
}

/**
 * ProfileForm - Reusable form component for editing user profile
 */
export function ProfileForm({ profile, onSave, saving }: ProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || "",
    location: profile.location || "",
    roof_area: profile.roof_area?.toString() || "",
    tank_capacity: profile.tank_capacity?.toString() || "",
    harvesting_method: profile.harvesting_method || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when profile changes
  useEffect(() => {
    setFormData({
      full_name: profile.full_name || "",
      location: profile.location || "",
      roof_area: profile.roof_area?.toString() || "",
      tank_capacity: profile.tank_capacity?.toString() || "",
      harvesting_method: profile.harvesting_method || "",
    });
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateAndSave = async () => {
    // Parse and validate
    const dataToValidate = {
      full_name: formData.full_name || undefined,
      location: formData.location || undefined,
      roof_area: formData.roof_area ? parseFloat(formData.roof_area) : undefined,
      tank_capacity: formData.tank_capacity ? parseFloat(formData.tank_capacity) : undefined,
      harvesting_method: formData.harvesting_method || undefined,
    };

    const result = profileSchema.safeParse(dataToValidate);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    // Save the profile
    const updatePayload: ProfileUpdatePayload = {
      full_name: formData.full_name || undefined,
      location: formData.location || undefined,
      roof_area: formData.roof_area ? parseFloat(formData.roof_area) : undefined,
      tank_capacity: formData.tank_capacity ? parseFloat(formData.tank_capacity) : undefined,
      harvesting_method: formData.harvesting_method || undefined,
    };

    const success = await onSave(updatePayload);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name || "",
      location: profile.location || "",
      roof_area: profile.roof_area?.toString() || "",
      tank_capacity: profile.tank_capacity?.toString() || "",
      harvesting_method: profile.harvesting_method || "",
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your RainIQ profile and preferences
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-muted-foreground">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={profile.email || ""}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email address cannot be changed
          </p>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="flex items-center gap-2">
            Full Name
          </Label>
          <Input
            id="full_name"
            type="text"
            placeholder="Enter your full name"
            value={formData.full_name}
            onChange={(e) => handleInputChange("full_name", e.target.value)}
            disabled={!isEditing || saving}
            className={errors.full_name ? "border-destructive" : ""}
          />
          {errors.full_name && (
            <p className="text-xs text-destructive">{errors.full_name}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location" className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Location (City / Region)
          </Label>
          <Input
            id="location"
            type="text"
            placeholder="e.g., Mumbai, Maharashtra"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            disabled={!isEditing || saving}
            className={errors.location ? "border-destructive" : ""}
          />
          {errors.location && (
            <p className="text-xs text-destructive">{errors.location}</p>
          )}
        </div>

        {/* Roof Area */}
        <div className="space-y-2">
          <Label htmlFor="roof_area" className="flex items-center gap-2">
            <Home className="w-4 h-4 text-muted-foreground" />
            Roof Area (sq. meters)
          </Label>
          <Input
            id="roof_area"
            type="number"
            placeholder="e.g., 150"
            value={formData.roof_area}
            onChange={(e) => handleInputChange("roof_area", e.target.value)}
            disabled={!isEditing || saving}
            min="0"
            step="0.1"
            className={errors.roof_area ? "border-destructive" : ""}
          />
          {errors.roof_area && (
            <p className="text-xs text-destructive">{errors.roof_area}</p>
          )}
        </div>

        {/* Tank Capacity */}
        <div className="space-y-2">
          <Label htmlFor="tank_capacity" className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-muted-foreground" />
            Water Tank Capacity (liters)
          </Label>
          <Input
            id="tank_capacity"
            type="number"
            placeholder="e.g., 5000"
            value={formData.tank_capacity}
            onChange={(e) => handleInputChange("tank_capacity", e.target.value)}
            disabled={!isEditing || saving}
            min="0"
            step="1"
            className={errors.tank_capacity ? "border-destructive" : ""}
          />
          {errors.tank_capacity && (
            <p className="text-xs text-destructive">{errors.tank_capacity}</p>
          )}
        </div>

        {/* Harvesting Method */}
        <div className="space-y-2">
          <Label htmlFor="harvesting_method" className="flex items-center gap-2">
            Preferred Harvesting Method
          </Label>
          <Select
            value={formData.harvesting_method}
            onValueChange={(value) => handleInputChange("harvesting_method", value)}
            disabled={!isEditing || saving}
          >
            <SelectTrigger className={errors.harvesting_method ? "border-destructive" : ""}>
              <SelectValue placeholder="Select a method" />
            </SelectTrigger>
            <SelectContent>
              {HARVESTING_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.harvesting_method && (
            <p className="text-xs text-destructive">{errors.harvesting_method}</p>
          )}
        </div>

        {/* Account Created Date */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Account Created</Label>
          <p className="text-sm text-foreground">
            {profile.created_at
              ? new Date(profile.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Unknown"}
          </p>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex gap-3 pt-4">
            <Button
              onClick={validateAndSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
