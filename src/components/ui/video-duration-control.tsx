import React from 'react';
import { Button } from './button';

interface VideoDurationControlProps {
  selectedDuration: number;
  onDurationChange: (duration: number) => void;
  availableDurations?: number[];
}

export function VideoDurationControl({ 
  selectedDuration, 
  onDurationChange,
  availableDurations = [4, 5, 6]
}: VideoDurationControlProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {availableDurations.map((seconds) => (
        <Button
          key={seconds}
          variant={selectedDuration === seconds ? "default" : "outline"}
          size="sm"
          onClick={() => onDurationChange(seconds)}
          className="text-sm"
        >
          {seconds}초
        </Button>
      ))}
    </div>
  );
}