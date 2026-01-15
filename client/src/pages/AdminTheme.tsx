import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import AdminSidebar from '@/components/AdminSidebar';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Palette, Type, Save, Loader2, Layout, FileText, Settings, FolderOpen, BarChart3, Files, LogOut, Image, Upload } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function AdminTheme() {
  const [location, setLocation] = useLocation();



  const [paletteDescription, setPaletteDescription] = useState("");
  const [fontStyle, setFontStyle] = useState("");
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);
  const [isGeneratingFonts, setIsGeneratingFonts] = useState(false);

  const themeQuery = trpc.admin.theme.get.useQuery();
  const updateMutation = trpc.admin.theme.update.useMutation();
  const generatePaletteMutation = trpc.admin.theme.generatePalette.useMutation();
  const suggestFontsMutation = trpc.admin.theme.suggestFonts.useMutation();

  const [formData, setFormData] = useState({
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    accentColor: "#1a1a1a",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    headingFont: "Playfair Display",
    bodyFont: "Inter",
    headingFontUrl: "",
    bodyFontUrl: "",
    containerMaxWidth: "1280px",
    sectionSpacing: "120px",
    borderRadius: "8px",
    enableAnimations: 1,
    heroBackgroundImage: "",
    heroBackgroundVideo: "",
    footerBackgroundImage: "",
    shopBackgroundImage: "",
    eventsBackgroundImage: "",
  });

  useEffect(() => {
    if (themeQuery.data) {
      setFormData({
        primaryColor: themeQuery.data.primaryColor || "#000000",
        secondaryColor: themeQuery.data.secondaryColor || "#ffffff",
        accentColor: themeQuery.data.accentColor || "#1a1a1a",
        backgroundColor: themeQuery.data.backgroundColor || "#ffffff",
        textColor: themeQuery.data.textColor || "#000000",
        headingFont: themeQuery.data.headingFont || "Playfair Display",
        bodyFont: themeQuery.data.bodyFont || "Inter",
        headingFontUrl: themeQuery.data.headingFontUrl || "",
        bodyFontUrl: themeQuery.data.bodyFontUrl || "",
        containerMaxWidth: themeQuery.data.containerMaxWidth || "1280px",
        sectionSpacing: themeQuery.data.sectionSpacing || "120px",
        borderRadius: themeQuery.data.borderRadius || "8px",
        enableAnimations: themeQuery.data.enableAnimations || 1,
        heroBackgroundImage: themeQuery.data.heroBackgroundImage || "",
        heroBackgroundVideo: themeQuery.data.heroBackgroundVideo || "",
        footerBackgroundImage: themeQuery.data.footerBackgroundImage || "",
        shopBackgroundImage: themeQuery.data.shopBackgroundImage || "",
        eventsBackgroundImage: themeQuery.data.eventsBackgroundImage || "",
      });
    }
  }, [themeQuery.data]);

  const handleGeneratePalette = async () => {
    if (!paletteDescription.trim()) {
      toast.error("Please describe your desired color palette");
      return;
    }

    setIsGeneratingPalette(true);
    try {
      const palette = await generatePaletteMutation.mutateAsync({
        description: paletteDescription,
      });

      setFormData((prev) => ({
        ...prev,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        accentColor: palette.accent,
        backgroundColor: palette.background,
        textColor: palette.text,
      }));

      toast.success("AI color palette generated!");
    } catch (error) {
      toast.error("Failed to generate palette");
      console.error(error);
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  const handleSuggestFonts = async () => {
    if (!fontStyle.trim()) {
      toast.error("Please describe your desired font style");
      return;
    }

    setIsGeneratingFonts(true);
    try {
      const fonts = await suggestFontsMutation.mutateAsync({
        style: fontStyle,
      });

      setFormData((prev) => ({
        ...prev,
        headingFont: fonts.heading,
        bodyFont: fonts.body,
      }));

      toast.success(`AI suggested: ${fonts.heading} + ${fonts.body}`, {
        description: fonts.reasoning,
      });
    } catch (error) {
      toast.error("Failed to suggest fonts");
      console.error(error);
    } finally {
      setIsGeneratingFonts(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Theme settings saved!");
      themeQuery.refetch();
    } catch (error) {
      toast.error("Failed to save theme settings");
      console.error(error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar variant="light" />

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-serif mb-2">Theme & Design System</h1>
            <p className="text-gray-600">
              Control your site's visual identity with AI-powered design assistance
            </p>
          </div>

          <div className="space-y-6">
            {/* AI Color Palette Generator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Color Palette Generator
                </CardTitle>
                <CardDescription>
                  Describe your desired aesthetic and let AI generate a cohesive color palette
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="e.g., warm earthy tones for wellness, elegant dark minimalism..."
                    value={paletteDescription}
                    onChange={(e) => setPaletteDescription(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleGeneratePalette()}
                  />
                  <Button
                    onClick={handleGeneratePalette}
                    disabled={isGeneratingPalette}
                  >
                    {isGeneratingPalette ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Palette className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <Label>Primary</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, primaryColor: e.target.value })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.primaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, primaryColor: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Secondary</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={formData.secondaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, secondaryColor: e.target.value })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.secondaryColor}
                        onChange={(e) =>
                          setFormData({ ...formData, secondaryColor: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Accent</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={formData.accentColor}
                        onChange={(e) =>
                          setFormData({ ...formData, accentColor: e.target.value })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.accentColor}
                        onChange={(e) =>
                          setFormData({ ...formData, accentColor: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Background</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={formData.backgroundColor}
                        onChange={(e) =>
                          setFormData({ ...formData, backgroundColor: e.target.value })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.backgroundColor}
                        onChange={(e) =>
                          setFormData({ ...formData, backgroundColor: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Text</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={formData.textColor}
                        onChange={(e) =>
                          setFormData({ ...formData, textColor: e.target.value })
                        }
                        className="w-16 h-10"
                      />
                      <Input
                        type="text"
                        value={formData.textColor}
                        onChange={(e) =>
                          setFormData({ ...formData, textColor: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Font Pairing Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Font Pairing Suggestions
                </CardTitle>
                <CardDescription>
                  Describe your brand style and get professional font pairing recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="e.g., elegant and sophisticated, modern and minimal, warm and approachable..."
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSuggestFonts()}
                  />
                  <Button onClick={handleSuggestFonts} disabled={isGeneratingFonts}>
                    {isGeneratingFonts ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Type className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Heading Font</Label>
                    <Input
                      value={formData.headingFont}
                      onChange={(e) =>
                        setFormData({ ...formData, headingFont: e.target.value })
                      }
                      placeholder="Playfair Display"
                    />
                  </div>

                  <div>
                    <Label>Body Font</Label>
                    <Input
                      value={formData.bodyFont}
                      onChange={(e) =>
                        setFormData({ ...formData, bodyFont: e.target.value })
                      }
                      placeholder="Inter"
                    />
                  </div>
                </div>

                <p className="text-sm text-gray-500 mt-3">
                  Using Google Fonts. Changes will apply after saving.
                </p>
              </CardContent>
            </Card>

            {/* Section Background Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Section Background Images
                </CardTitle>
                <CardDescription>
                  Upload or set URLs for background images on different sections of your site
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Hero Background Image URL</Label>
                    <Input
                      value={formData.heroBackgroundImage}
                      onChange={(e) =>
                        setFormData({ ...formData, heroBackgroundImage: e.target.value })
                      }
                      placeholder="https://example.com/hero-bg.jpg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to use default video background</p>
                  </div>

                  <div>
                    <Label>Hero Background Video URL</Label>
                    <Input
                      value={formData.heroBackgroundVideo}
                      onChange={(e) =>
                        setFormData({ ...formData, heroBackgroundVideo: e.target.value })
                      }
                      placeholder="/home-slide-1.mp4 or https://example.com/video.mp4"
                    />
                    <p className="text-xs text-gray-500 mt-1">Video will be used if no image is set</p>
                  </div>

                  <div>
                    <Label>Shop Page Background Image URL</Label>
                    <Input
                      value={formData.shopBackgroundImage}
                      onChange={(e) =>
                        setFormData({ ...formData, shopBackgroundImage: e.target.value })
                      }
                      placeholder="https://example.com/shop-bg.jpg"
                    />
                  </div>

                  <div>
                    <Label>Events Page Background Image URL</Label>
                    <Input
                      value={formData.eventsBackgroundImage}
                      onChange={(e) =>
                        setFormData({ ...formData, eventsBackgroundImage: e.target.value })
                      }
                      placeholder="https://example.com/events-bg.jpg"
                    />
                  </div>

                  <div>
                    <Label>Footer Background Image URL</Label>
                    <Input
                      value={formData.footerBackgroundImage}
                      onChange={(e) =>
                        setFormData({ ...formData, footerBackgroundImage: e.target.value })
                      }
                      placeholder="https://example.com/footer-bg.jpg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Layout & Spacing */}
            <Card>
              <CardHeader>
                <CardTitle>Layout & Spacing</CardTitle>
                <CardDescription>
                  Control container widths, spacing, and border radius
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Container Max Width</Label>
                    <Input
                      value={formData.containerMaxWidth}
                      onChange={(e) =>
                        setFormData({ ...formData, containerMaxWidth: e.target.value })
                      }
                      placeholder="1280px"
                    />
                  </div>

                  <div>
                    <Label>Section Spacing</Label>
                    <Input
                      value={formData.sectionSpacing}
                      onChange={(e) =>
                        setFormData({ ...formData, sectionSpacing: e.target.value })
                      }
                      placeholder="120px"
                    />
                  </div>

                  <div>
                    <Label>Border Radius</Label>
                    <Input
                      value={formData.borderRadius}
                      onChange={(e) =>
                        setFormData({ ...formData, borderRadius: e.target.value })
                      }
                      placeholder="8px"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                size="lg"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Theme Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
