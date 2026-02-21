import React from 'react';
import { Image } from 'react-native';

// Logo original dimensions: 1000 × 1138 px
const LOGO_ASPECT = 1000 / 1138;

export interface AppLogoProps {
  /** Height in pixels — width is computed from the original aspect ratio */
  size?: number;
}

/**
 * App logo component.
 * Renders the Granja Avícola San Vicente de Paúl logo using the
 * adaptive-icon asset (transparent background) at the requested height.
 */
export function AppLogo({ size = 80 }: AppLogoProps) {
  return (
    <Image
      source={require('../../../assets/adaptive-icon.png')}
      style={{ width: size * LOGO_ASPECT, height: size }}
      resizeMode="contain"
    />
  );
}
