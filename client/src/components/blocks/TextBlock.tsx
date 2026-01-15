import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GripVertical, Trash2, Settings } from "lucide-react";

interface TextBlockProps {
  id: number;
  content: string;
  settings: {
    alignment?: "left" | "center" | "right";
    fontSize?: "small" | "medium" | "large";
  };
  onUpdate: (content: string, settings: any) => void;
  onDelete: () => void;
}

export function TextBlock({ id, content, settings, onUpdate, onDelete }: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onUpdate(localContent, localSettings);
    setIsEditing(false);
  };

  return (
    <Card className="p-4 relative group">
      <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="w-5 h-5 text-neutral-400" />
      </div>

      <div className="flex items-start justify-between gap-4 ml-8">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <Label>Content</Label>
                <Textarea
                  value={localContent}
                  onChange={(e) => setLocalContent(e.target.value)}
                  rows={6}
                  className="mt-2"
                  placeholder="Enter your text content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Alignment</Label>
                  <Select
                    value={localSettings.alignment || "left"}
                    onValueChange={(value: "left" | "center" | "right") =>
                      setLocalSettings({ ...localSettings, alignment: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Font Size</Label>
                  <Select
                    value={localSettings.fontSize || "medium"}
                    onValueChange={(value: "small" | "medium" | "large") =>
                      setLocalSettings({ ...localSettings, fontSize: value })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={`prose dark:prose-invert max-w-none text-${localSettings.alignment || "left"} ${
                localSettings.fontSize === "small"
                  ? "text-sm"
                  : localSettings.fontSize === "large"
                  ? "text-lg"
                  : "text-base"
              }`}
            >
              <p className="whitespace-pre-wrap">{content}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
