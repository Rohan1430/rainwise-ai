import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { ProfileForm } from "@/components/ProfileForm";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

function ProfileContent() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile, loading, saving, updateProfile } = useProfile();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto pt-20 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Unable to load profile</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-transparent h-24" />
          <CardContent className="-mt-12 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <ProfileAvatar
                name={profile.full_name}
                email={profile.email}
                size="xl"
                className="ring-4 ring-background shadow-lg"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {profile.full_name || profile.email?.split("@")[0] || "User"}
                </h1>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
                  <Shield className="w-3 h-3" />
                  Verified
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Member since{" "}
                  {profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })
                    : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <ProfileForm profile={profile} onSave={updateProfile} saving={saving} />

        {/* Security Note */}
        <div className="text-center text-xs text-muted-foreground">
          <Shield className="w-4 h-4 inline-block mr-1" />
          Your data is securely stored and only accessible by you
        </div>
      </main>
    </div>
  );
}

// Wrap with ProtectedRoute
const Profile = () => (
  <ProtectedRoute>
    <ProfileContent />
  </ProtectedRoute>
);

export default Profile;
