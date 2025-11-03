import { Injectable } from '@angular/core';

interface BrowserCapabilities {
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  isEdge: boolean;
  isMobile: boolean;
  maxTextureSize: number;
  maxRenderbufferSize: number;
  maxViewportDims: number[];
}

@Injectable({
  providedIn: 'root'
})
export class BrowserPerformanceService {
  private capabilities: BrowserCapabilities;

  constructor() {
    this.capabilities = this.detectCapabilities();
  }

  /**
   * Detect browser capabilities for performance optimization
   */
  private detectCapabilities(): BrowserCapabilities {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') as WebGLRenderingContext || 
               canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    const gl2 = canvas.getContext('webgl2') as WebGL2RenderingContext;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const isEdge = userAgent.includes('edge') || userAgent.includes('edg/');
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

    let maxTextureSize = 512; // Conservative default
    let maxRenderbufferSize = 512;
    let maxViewportDims = [512, 512];

    if (gl) {
      try {
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
        maxRenderbufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
        maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as number[];
      } catch (e) {
        console.warn('Error detecting WebGL capabilities:', e);
      }
    }

    canvas.remove();

    return {
      supportsWebGL: !!gl,
      supportsWebGL2: !!gl2,
      isEdge,
      isMobile,
      maxTextureSize: Math.min(maxTextureSize, isEdge ? 1024 : 2048), // Limit for Edge
      maxRenderbufferSize,
      maxViewportDims
    };
  }

  /**
   * Get optimized performance settings based on browser
   */
  getPerformanceSettings() {
    const { isEdge, isMobile, supportsWebGL, maxTextureSize } = this.capabilities;

    return {
      // Reduce complexity for Edge and mobile
      maxParticles: isEdge ? 50 : isMobile ? 30 : 100,
      
      // Animation frame rate
      targetFPS: isEdge ? 30 : 60,
      
      // Three.js settings
      antialias: !isEdge && !isMobile, // Disable anti-aliasing for Edge
      shadows: !isEdge && !isMobile,   // Disable shadows for Edge
      textureSize: Math.min(maxTextureSize, isEdge ? 512 : 1024),
      
      // p5.js settings
      enableP5: !isEdge || this.isHighEndDevice(), // Disable p5 on low-end Edge
      p5FrameRate: isEdge ? 15 : 30,
      
      // WebGL settings
      useWebGL: supportsWebGL && (!isEdge || this.isHighEndDevice()),
      webGLContextAttributes: {
        alpha: false,
        antialias: false,
        depth: true,
        failIfMajorPerformanceCaveat: isEdge, // Fail gracefully on Edge
        powerPreference: isEdge ? 'default' : 'high-performance',
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        stencil: false
      },

      // General optimizations
      enableAnimations: !this.isLowEndDevice(),
      reduceMotion: isEdge && this.isLowEndDevice(),
      lazyLoad: true,
      preloadAssets: !isEdge, // Don't preload on Edge to reduce initial load
      
      // Rendering optimizations
      useRAF: true, // Use requestAnimationFrame
      enableGPUAcceleration: !isEdge,
      
      // Debug info
      browserInfo: {
        isEdge,
        isMobile,
        supportsWebGL,
        userAgent: navigator.userAgent
      }
    };
  }

  /**
   * Check if device is high-end based on available features
   */
  private isHighEndDevice(): boolean {
    const { maxTextureSize, maxRenderbufferSize } = this.capabilities;
    
    const textureSize = typeof maxTextureSize === 'number' ? maxTextureSize : 512;
    const bufferSize = typeof maxRenderbufferSize === 'number' ? maxRenderbufferSize : 512;
    
    // Consider device high-end if it supports large textures
    const hasLargeTextures = textureSize >= 2048 && bufferSize >= 2048;
    const hasMultipleCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency >= 4;
    
    return hasLargeTextures && !!hasMultipleCores;
  }

  /**
   * Check if device is low-end
   */
  private isLowEndDevice(): boolean {
    const { maxTextureSize, isMobile } = this.capabilities;
    
    const textureSize = typeof maxTextureSize === 'number' ? maxTextureSize : 512;
    const hasSmallTextures = textureSize < 1024;
    const hasLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2;
    
    return isMobile || hasSmallTextures || !!hasLowCores;
  }

  /**
   * Get browser-specific recommendations
   */
  getBrowserRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.capabilities.isEdge) {
      recommendations.push('For better performance in Edge, consider using Chrome or Firefox');
      recommendations.push('Enable hardware acceleration in Edge settings');
      recommendations.push('Close other browser tabs to free up memory');
      recommendations.push('Update to the latest version of Edge');
    }

    if (this.isLowEndDevice()) {
      recommendations.push('Consider reducing game quality settings for better performance');
      recommendations.push('Close unnecessary applications to free up system resources');
    }

    if (!this.capabilities.supportsWebGL) {
      recommendations.push('Your browser does not support WebGL - some features may be limited');
    }

    return recommendations;
  }

  /**
   * Performance monitor for debugging
   */
  startPerformanceMonitoring() {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('game-start');
      
      // Monitor frame rate
      let frameCount = 0;
      let lastTime = performance.now();
      
      const measureFPS = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          console.log(`Current FPS: ${fps} (Edge: ${this.capabilities.isEdge})`);
          
          if (fps < 20 && this.capabilities.isEdge) {
            console.warn('Low FPS detected in Edge - consider reducing graphics quality');
          }
          
          frameCount = 0;
          lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
      };
      
      requestAnimationFrame(measureFPS);
    }
  }

  /**
   * Get current capabilities for debugging
   */
  getCapabilities(): BrowserCapabilities {
    return { ...this.capabilities };
  }
}