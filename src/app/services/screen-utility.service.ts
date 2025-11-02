import { Injectable } from '@angular/core';

export interface ScreenDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape';
}

export interface ViewportInfo {
  innerWidth: number;
  innerHeight: number;
  devicePixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ScreenUtilityService {
  
  constructor() {}

  /**
   * Gets the current screen dimensions safely
   */
  public getScreenDimensions(): ScreenDimensions {
    if (typeof window === 'undefined' || !window.screen) {
      return {
        width: 0,
        height: 0,
        aspectRatio: 1,
        orientation: 'landscape'
      };
    }

    const width = window.screen.width;
    const height = window.screen.height;
    const aspectRatio = width / height;
    const orientation = width > height ? 'landscape' : 'portrait';

    return {
      width,
      height,
      aspectRatio,
      orientation
    };
  }

  /**
   * Gets viewport information
   */
  public getViewportInfo(): ViewportInfo {
    if (typeof window === 'undefined') {
      return {
        innerWidth: 0,
        innerHeight: 0,
        devicePixelRatio: 1,
        isMobile: false,
        isTablet: false,
        isDesktop: true
      };
    }

    const innerWidth = window.innerWidth;
    const innerHeight = window.innerHeight;
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Device detection based on screen width
    const isMobile = innerWidth <= 768;
    const isTablet = innerWidth > 768 && innerWidth <= 1024;
    const isDesktop = innerWidth > 1024;

    return {
      innerWidth,
      innerHeight,
      devicePixelRatio,
      isMobile,
      isTablet,
      isDesktop
    };
  }

  /**
   * Calculates responsive dimensions based on container and desired aspect ratio
   */
  public calculateResponsiveDimensions(
    containerWidth: number,
    containerHeight: number,
    targetAspectRatio: number = 16/9
  ): { width: number; height: number } {
    const containerAspectRatio = containerWidth / containerHeight;

    if (containerAspectRatio > targetAspectRatio) {
      // Container is wider than target - constrain by height
      return {
        width: containerHeight * targetAspectRatio,
        height: containerHeight
      };
    } else {
      // Container is taller than target - constrain by width
      return {
        width: containerWidth,
        height: containerWidth / targetAspectRatio
      };
    }
  }

  /**
   * Checks if the user prefers reduced motion
   */
  public prefersReducedMotion(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Gets the current orientation
   */
  public getOrientation(): 'portrait' | 'landscape' {
    const dimensions = this.getScreenDimensions();
    return dimensions.orientation;
  }

  /**
   * Checks if the device supports touch
   */
  public supportsTouchInput(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Gets safe area insets for devices with notches
   */
  public getSafeAreaInsets(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    if (typeof window === 'undefined' || !CSS.supports) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const style = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(style.getPropertyValue('env(safe-area-inset-top)')) || 0,
      right: parseInt(style.getPropertyValue('env(safe-area-inset-right)')) || 0,
      bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: parseInt(style.getPropertyValue('env(safe-area-inset-left)')) || 0
    };
  }

  /**
   * Observes screen size changes
   */
  public observeScreenChanges(callback: (dimensions: ScreenDimensions) => void): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleResize = () => {
      callback(this.getScreenDimensions());
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Return cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }
}