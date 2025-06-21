
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

/**
 * TABLET-FRIENDLY: Interface for palm rejection configuration
 * @description Configuration options for palm rejection algorithm sensitivity
 */
interface PalmRejectionConfig {
  /** Maximum contact area for valid touch (larger areas assumed to be palm) */
  maxContactSize: number;
  /** Minimum pressure for valid input (lighter touches may be accidental) */
  minPressure: number;
  /** Time to ignore touches after palm detection in milliseconds */
  palmTimeoutMs: number;
  /** Distance threshold for detecting clustered touches (palm + fingers) */
  clusterDistance: number;
  /** Always prefer stylus over touch input */
  preferStylus: boolean;
  /** Enable or disable palm rejection algorithm */
  enabled: boolean;
}

interface PalmRejectionSettingsProps {
  config: PalmRejectionConfig;
  onChange: (config: PalmRejectionConfig) => void;
}

/**
 * TABLET-FRIENDLY: Settings component for configuring palm rejection
 * @description Provides real-time adjustment of palm rejection sensitivity for optimal stylus experience
 */
export const PalmRejectionSettings: React.FC<PalmRejectionSettingsProps> = ({
  config,
  onChange
}) => {
  // TABLET-FRIENDLY: Update configuration helper
  const updateConfig = (key: keyof PalmRejectionConfig, value: number | boolean) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="absolute top-3 left-20 z-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Palm Rejection Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* TABLET-FRIENDLY: Master enable/disable switch */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Palm Rejection</Label>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig('enabled', checked)}
            />
          </div>

          {/* TABLET-FRIENDLY: Configuration options shown only when enabled */}
          {config.enabled && (
            <>
              {/* TABLET-FRIENDLY: Contact size threshold for palm detection */}
              <div className="space-y-2">
                <Label>Contact Size Threshold: {config.maxContactSize}px</Label>
                <Slider
                  value={[config.maxContactSize]}
                  onValueChange={([value]) => updateConfig('maxContactSize', value)}
                  min={20}
                  max={80}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* TABLET-FRIENDLY: Timeout duration after palm detection */}
              <div className="space-y-2">
                <Label>Rejection Timeout: {config.palmTimeoutMs}ms</Label>
                <Slider
                  value={[config.palmTimeoutMs]}
                  onValueChange={([value]) => updateConfig('palmTimeoutMs', value)}
                  min={100}
                  max={1000}
                  step={100}
                  className="w-full"
                />
              </div>

              {/* TABLET-FRIENDLY: Cluster distance for multi-touch palm detection */}
              <div className="space-y-2">
                <Label>Cluster Distance: {config.clusterDistance}px</Label>
                <Slider
                  value={[config.clusterDistance]}
                  onValueChange={([value]) => updateConfig('clusterDistance', value)}
                  min={50}
                  max={200}
                  step={25}
                  className="w-full"
                />
              </div>

              {/* TABLET-FRIENDLY: Stylus preference setting */}
              <div className="flex items-center justify-between">
                <Label htmlFor="preferStylus">Prefer Stylus Input</Label>
                <Switch
                  id="preferStylus"
                  checked={config.preferStylus}
                  onCheckedChange={(checked) => updateConfig('preferStylus', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
