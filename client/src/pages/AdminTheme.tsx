import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Palette, Type, Save, Loader2, Layout, FileText, Settings, FolderOpen, BarChart3, Files, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

export default function AdminTheme() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { icon: Layout, label: "Content", path: "/admin/content" },
    { icon: FileText, label: "Articles", path: "/admin/articles" },
    { icon: FolderOpen, label: "Media", path: "/admin/media" },
    { icon: Palette, label: "Theme", path: "/admin/theme" },
    { icon: Files, label: "Pages", path: "/admin/pages" },
    { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 p-6">
        <Link href="/admin/dashboard">
          <img src="/media/logo-white.png" alt="Just Empower" className="w-32 mb-8 invert" />
        </Link>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                    : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-sm font-medium">JusticeEmpower</p>
          <p className="text-xs text-gray-500">Administrator</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
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
