import { Injectable } from '@angular/core';

export type MagnitudeType =
  | 'mw'
  | 'ml'
  | 'mb'
  | 'ms'
  | 'md'
  | 'unknown';

export interface EarthquakePerception {
  level: 'imperceptible' | 'very-weak' | 'weak' | 'light' | 'moderate' | 'strong' | 'very-strong';
  description: string;
  magnitude: number;
  magnitudeType: MagnitudeType;
  depthKm: number;
}

@Injectable({
  providedIn: 'root',
})
export class SeismicMetricsService {

  static magTypesDescs: {mType: MagnitudeType, desc: string}[] = [
    {mType: 'ml', desc: '[Local Magnitude] : Richter-type magnitude, calculated from seismic wave amplitudes recorded locally.'},
    {mType: 'mb', desc: '[Body-wave Magnitude] : Calculated using the amplitude of P-waves travelling through the Earth\'s interior.'},
    {mType: 'ms', desc: '[Surface-wave Magnitude] : Calculated from the amplitude of seismic surface waves.'},
    {mType: 'mw', desc: '[Moment Magnitude] : Based on seismic moment, which measures the physical size of the earthquake rupture.'},
    {mType: 'md', desc: '[Duration Magnitude] : Estimated from the duration of the recorded seismic signal.'},
    {mType: 'unknown', desc: 'Unknown magnitude type'}
  ];

  getPerception(
    magnitude: number,
    magnitudeType: MagnitudeType,
    depthKm: number
  ): EarthquakePerception {

    // Basic validation
    if (
      !Number.isFinite(magnitude) ||
      !Number.isFinite(depthKm) ||
      magnitude < 0 ||
      depthKm < 0
    ) {
      throw new Error('Invalid earthquake magnitude or depth.');
    }

    // Depth adjustment (heuristic, not a physical intensity calculation)
    let depthAdjustment = 0;

    if (depthKm <= 10) {
      depthAdjustment = 0.5;
    } else if (depthKm <= 30) {
      depthAdjustment = 0.25;
    } else if (depthKm <= 70) {
      depthAdjustment = 0;
    } else if (depthKm <= 150) {
      depthAdjustment = -0.25;
    } else {
      depthAdjustment = -0.5;
    }

    // Approximate magnitude normalization.
    // Do not assume all scales are exactly equivalent.
    const normalizedMagnitude =
      this.normalizeMagnitude(magnitude, magnitudeType);

    const effectiveMagnitude =
      normalizedMagnitude + depthAdjustment;

    let level: EarthquakePerception['level'];
    let description: string;

    if (effectiveMagnitude < 2) {
      level = 'imperceptible';
      description = 'Normally imperceptible to people.';
    } else if (effectiveMagnitude < 3) {
      level = 'very-weak';
      description = 'May be noticed by some people, especially indoors and in quiet environments.';
    } else if (effectiveMagnitude < 4) {
      level = 'weak';
      description = 'Can be felt indoors, particularly near the epicentre.';
    } else if (effectiveMagnitude < 5) {
      level = 'light';
      description = 'Generally perceptible. Windows, doors and small objects may vibrate.';
    } else if (effectiveMagnitude < 6) {
      level = 'moderate';
      description = 'Clearly felt. Objects may move and minor damage is possible.';
    } else if (effectiveMagnitude < 7) {
      level = 'strong';
      description = 'Strong shaking. Structural damage may occur.';
    } else {
      level = 'very-strong';
      description = 'Very strong earthquake with potential for significant damage.';
    }

    return {
      level,
      description,
      magnitude,
      magnitudeType,
      depthKm
    };
  }

  private normalizeMagnitude(
    magnitude: number,
    type: MagnitudeType
  ): number {

    // These are deliberately neutral approximations.
    // Different magnitude scales require event-specific
    // calibration to convert reliably to Mw.

    switch (type) {
      case 'mw':
        return magnitude;

      case 'ml':
      case 'mb':
      case 'ms':
      case 'md':
      case 'unknown':
      default:
        return magnitude;
    }
  }
}
