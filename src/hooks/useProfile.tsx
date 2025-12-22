import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

// Profile data interface matching RainIQ requirements
export interface ProfileData {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  location: string | null;
  roof_area: number | null;
  tank_capacity: number | null;
  harvesting_method: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Profile update payload
export interface ProfileUpdatePayload {
  full_name?: string;
  location?: string;
  roof_area?: number;
  tank_capacity?: number;
  harvesting_method?: string;
}

// Available harvesting methods
export const HARVESTING_METHODS = [
  { value: "rooftop_collection", label: "Rooftop Collection" },
  { value: "surface_runoff", label: "Surface Runoff" },
  { value: "percolation_pit", label: "Percolation Pit" },
  { value: "recharge_well", label: "Recharge Well" },
  { value: "storage_tank", label: "Storage Tank" },
  { value: "combined_system", label: "Combined System" },
] as const;

export function useProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setProfile(data as ProfileData);
      } else {
        // Create a default profile if none exists
        const newProfile = {
          user_id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          // Profile might already exist due to trigger
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (existingProfile) {
            setProfile(existingProfile as ProfileData);
          }
        } else {
          setProfile(createdProfile as ProfileData);
        }
      }
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update profile
  const updateProfile = useCallback(
    async (updates: ProfileUpdatePayload): Promise<boolean> => {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update your profile",
          variant: "destructive",
        });
        return false;
      }

      try {
        setSaving(true);
        setError(null);

        const { data, error: updateError } = await supabase
          .from("profiles")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        setProfile(data as ProfileData);
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        return true;
      } catch (err: any) {
        console.error("Error updating profile:", err);
        setError(err.message || "Failed to update profile");
        toast({
          title: "Error",
          description: err.message || "Failed to update profile",
          variant: "destructive",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [user, toast]
  );

  // Load profile when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    saving,
    error,
    updateProfile,
    refreshProfile: fetchProfile,
  };
}
