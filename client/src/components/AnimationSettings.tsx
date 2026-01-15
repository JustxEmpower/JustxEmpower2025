import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface AnimationConfig {
  type?: "none" | "fade-in" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "zoom-in";
  trigger?: "on-load" | "on-scroll" | "on-hover";
  duration?: number; // in milliseconds
  delay?: number; // in milliseconds
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

interface AnimationSettingsProps {
  value: string; // JSON string
  onChange: (value: string) => void;
}

export function AnimationSettings({ value, onChange }: AnimationSettingsProps) {
  const [config, setConfig] = useState<AnimationConfig>(() => {
    try {
      return value ? JSON.parse(value) : { type: "none", trigger: "on-scroll", duration: 600, delay: 0, easing: "ease-out" };
    } catch {
      return { type: "none", trigger: "on-scroll", duration: 600, delay: 0, easing: "ease-out" };
    }
  });

  useEffect(() => {
    onChange(JSON.stringify(config));
  }, [config, onChange]);

  const updateConfig = (field: keyof AnimationConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="animation-type">Animation Type</Label>
        <Select
          value={config.type || "none"}
          onValueChange={(value) => updateConfig("type", value)}
        >
          <SelectTrigger id="animation-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="fade-in">Fade In</SelectItem>
            <SelectItem value="slide-up">Slide Up</SelectItem>
            <SelectItem value="slide-down">Slide Down</SelectItem>
            <SelectItem value="slide-left">Slide Left</SelectItem>
            <SelectItem value="slide-right">Slide Right</SelectItem>
            <SelectItem value="zoom-in">Zoom In</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.type !== "none" && (
        <>
          <div>
            <Label htmlFor="animation-trigger">Trigger</Label>
            <Select
              value={config.trigger || "on-scroll"}
              onValueChange={(value) => updateConfig("trigger", value)}
            >
              <SelectTrigger id="animation-trigger">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on-load">On Page Load</SelectItem>
                <SelectItem value="on-scroll">On Scroll Into View</SelectItem>
                <SelectItem value="on-hover">On Hover</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="animation-duration">Duration (ms)</Label>
            <Input
              id="animation-duration"
              type="number"
              min="100"
              max="3000"
              step="100"
              value={config.duration || 600}
              onChange={(e) => updateConfig("duration", parseInt(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="animation-delay">Delay (ms)</Label>
            <Input
              id="animation-delay"
              type="number"
              min="0"
              max="5000"
              step="100"
              value={config.delay || 0}
              onChange={(e) => updateConfig("delay", parseInt(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="animation-easing">Easing</Label>
            <Select
              value={config.easing || "ease-out"}
              onValueChange={(value) => updateConfig("easing", value)}
            >
              <SelectTrigger id="animation-easing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="ease-in">Ease In</SelectItem>
                <SelectItem value="ease-out">Ease Out</SelectItem>
                <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
}
