
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface PalmRejectionConfig {
  maxContactSize: number;
  minPressure: number;
  palmTimeoutMs: number;
  clusterDistance: number;
  preferStylus: boolean;
  enabled: boolean;
}

interface PalmRejectionSettingsProps {
  config: PalmRejectionConfig;
  onChange: (config: PalmRejectionConfig) => void;
}

export const PalmRejectionSettings: React.FC<PalmRejectionSettingsProps> = ({
  config,
  onChange
}) => {
  const updateConfig = (key: keyof PalmRejectionConfig, value: number | boolean) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="absolute top-3 left-80 z-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Palm Rejection Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Palm Rejection</Label>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig('enabled', checked)}
            />
          </div>

          {config.enabled && (
            <>
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
