import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface VisibilityConditions {
  devices?: {
    desktop?: boolean;
    tablet?: boolean;
    mobile?: boolean;
  };
  auth?: {
    loggedIn?: boolean;
    loggedOut?: boolean;
    adminOnly?: boolean;
  };
  schedule?: {
    startDate?: string;
    endDate?: string;
  };
}

interface VisibilitySettingsProps {
  value: string; // JSON string
  onChange: (value: string) => void;
}

export function VisibilitySettings({ value, onChange }: VisibilitySettingsProps) {
  const [conditions, setConditions] = useState<VisibilityConditions>(() => {
    try {
      return value ? JSON.parse(value) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    onChange(JSON.stringify(conditions));
  }, [conditions, onChange]);

  const updateDevices = (device: "desktop" | "tablet" | "mobile", checked: boolean) => {
    setConditions((prev) => ({
      ...prev,
      devices: {
        ...prev.devices,
        [device]: checked,
      },
    }));
  };

  const updateAuth = (condition: "loggedIn" | "loggedOut" | "adminOnly", checked: boolean) => {
    setConditions((prev) => ({
      ...prev,
      auth: {
        ...prev.auth,
        [condition]: checked,
      },
    }));
  };

  const updateSchedule = (field: "startDate" | "endDate", value: string) => {
    setConditions((prev) => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value || undefined,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-3 block">Device Visibility</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="device-desktop"
              checked={conditions.devices?.desktop ?? true}
              onCheckedChange={(checked) => updateDevices("desktop", checked as boolean)}
            />
            <label htmlFor="device-desktop" className="text-sm cursor-pointer">
              Show on Desktop
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="device-tablet"
              checked={conditions.devices?.tablet ?? true}
              onCheckedChange={(checked) => updateDevices("tablet", checked as boolean)}
            />
            <label htmlFor="device-tablet" className="text-sm cursor-pointer">
              Show on Tablet
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="device-mobile"
              checked={conditions.devices?.mobile ?? true}
              onCheckedChange={(checked) => updateDevices("mobile", checked as boolean)}
            />
            <label htmlFor="device-mobile" className="text-sm cursor-pointer">
              Show on Mobile
            </label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Authentication</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="auth-logged-in"
              checked={conditions.auth?.loggedIn ?? false}
              onCheckedChange={(checked) => updateAuth("loggedIn", checked as boolean)}
            />
            <label htmlFor="auth-logged-in" className="text-sm cursor-pointer">
              Only show to logged-in users
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="auth-logged-out"
              checked={conditions.auth?.loggedOut ?? false}
              onCheckedChange={(checked) => updateAuth("loggedOut", checked as boolean)}
            />
            <label htmlFor="auth-logged-out" className="text-sm cursor-pointer">
              Only show to logged-out users
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="auth-admin"
              checked={conditions.auth?.adminOnly ?? false}
              onCheckedChange={(checked) => updateAuth("adminOnly", checked as boolean)}
            />
            <label htmlFor="auth-admin" className="text-sm cursor-pointer">
              Admin only
            </label>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-3 block">Schedule (Optional)</Label>
        <div className="space-y-3">
          <div>
            <Label htmlFor="start-date" className="text-sm">Start Date & Time</Label>
            <Input
              id="start-date"
              type="datetime-local"
              value={conditions.schedule?.startDate || ""}
              onChange={(e) => updateSchedule("startDate", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-sm">End Date & Time</Label>
            <Input
              id="end-date"
              type="datetime-local"
              value={conditions.schedule?.endDate || ""}
              onChange={(e) => updateSchedule("endDate", e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Leave empty to show indefinitely
        </p>
      </div>
    </div>
  );
}
