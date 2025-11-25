// Fișier: declarations.d.ts

declare module '@react-native-community/blur' {
  import { Component } from 'react';
    import { ViewProps } from 'react-native';

  export interface BlurViewProps extends ViewProps {
    blurType: 'dark' | 'light' | 'xlight' | 'prominent' | 'regular' | 'extraLight';
    blurAmount?: number;
  }

  export class BlurView extends Component<BlurViewProps> {}
}