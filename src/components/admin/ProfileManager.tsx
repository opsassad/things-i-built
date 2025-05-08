import { useState, useEffect } from "react";
import { User, Settings, Upload, Trash2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useContent } from "../../context/ContentContext";
import { toast } from "../../hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { supabase } from "../../lib/supabaseClient";
import type { AuthorProfile } from "../../context/ContentContext";

const ProfileManager = () => {
  const { isEditMode, authorProfiles, saveAuthorProfile } = useContent();
  const [formData, setFormData] = useState<Partial<AuthorProfile>>({
    name: "",
    role: "",
    bio: "",
    avatar: "",
    email: "",
    social: {
      twitter: "",
      linkedin: "",
      github: "",
      website: ""
    }
  });

  // Load admin profile on mount
  useEffect(() => {
    const loadAdminProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_profile')  // Updated table name
          .select('*')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
          throw error;
        }

        if (data) {
          setFormData(data);
        }
      } catch (error) {
        console.error('Error loading admin profile:', error);
        toast({
          title: "Error",
          description: "Failed to load admin profile",
          variant: "destructive",
        });
      }
    };

    loadAdminProfile();
  }, []);

  // Update form when authorProfiles changes
  useEffect(() => {
    if (authorProfiles.length > 0) {
      setFormData(authorProfiles[0]);
    }
  }, [authorProfiles]);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("social.")) {
      const socialField = field.split(".")[1];
      setFormData(prev => ({
        ...prev,
        social: {
          ...prev.social,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name) {
        toast({
          title: "Error",
          description: "Name is required",
          variant: "destructive",
        });
        return;
      }

      await saveAuthorProfile(formData);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 2MB",
          variant: "destructive",
        });
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Update form data with new avatar URL
      setFormData(prev => ({
        ...prev,
        avatar: publicUrl
      }));

      toast({
        title: "Success",
        description: "Avatar uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
          <CardDescription>Manage your personal information and social links</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatar} alt={formData.name} />
                <AvatarFallback>{formData.name?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              {isEditMode && (
                <Button variant="outline" onClick={() => document.getElementById('avatar-upload')?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Avatar
                </Button>
              )}
            </div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={!isEditMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  disabled={!isEditMode}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditMode}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditMode}
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Social Links</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    value={formData.social?.twitter}
                    onChange={(e) => handleInputChange("social.twitter", e.target.value)}
                    disabled={!isEditMode}
                    placeholder="https://twitter.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.social?.linkedin}
                    onChange={(e) => handleInputChange("social.linkedin", e.target.value)}
                    disabled={!isEditMode}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub</Label>
                  <Input
                    id="github"
                    value={formData.social?.github}
                    onChange={(e) => handleInputChange("social.github", e.target.value)}
                    disabled={!isEditMode}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.social?.website}
                    onChange={(e) => handleInputChange("social.website", e.target.value)}
                    disabled={!isEditMode}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        {isEditMode && (
          <CardFooter className="flex justify-end space-x-2">
            <Button onClick={handleSave}>
              Save Profile
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ProfileManager; 