import { Injectable } from '@angular/core';
import * as p5 from 'p5';

export interface P5Config {
  backgroundColor: string;
  frameRate: number;
  enableDebug: boolean;
}

export interface P5Instance {
  sketch: p5;
  container: HTMLElement;
  config: P5Config;
}

@Injectable({
  providedIn: 'root'
})
export class P5RenderService {
  private p5Instances: P5Instance[] = [];

  constructor() {}

  /**
   * Creates a new p5.js instance
   */
  public createP5Instance(
    container: HTMLElement,
    config: P5Config,
    sketchFunction: (p: p5) => void
  ): P5Instance {
    const sketch = new p5(sketchFunction, container);
    
    const instance: P5Instance = {
      sketch,
      container,
      config
    };

    this.p5Instances.push(instance);
    return instance;
  }

  /**
   * Creates a fullscreen background p5 instance
   */
  public createFullscreenBackground(
    container: HTMLElement,
    config: P5Config = {
      backgroundColor: '#000033',
      frameRate: 60,
      enableDebug: false
    }
  ): P5Instance {
    const sketchFunction = (p: p5) => {
      let particles: BackgroundParticle[] = [];

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.frameRate(config.frameRate);
        
        // Initialize particles
        for (let i = 0; i < 100; i++) {
          particles.push(new BackgroundParticle(p));
        }
      };

      p.draw = () => {
        p.background(config.backgroundColor);
        
        // Update and draw particles
        particles.forEach(particle => {
          particle.update();
          particle.draw(p);
        });

        // Debug info
        if (config.enableDebug) {
          this.drawDebugInfo(p);
        }
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };
    };

    return this.createP5Instance(container, config, sketchFunction);
  }

  /**
   * Draws debug information
   */
  private drawDebugInfo(p: p5): void {
    p.fill(255);
    p.textSize(12);
    p.text(`FPS: ${p.frameRate().toFixed(1)}`, 10, 20);
    p.text(`Canvas: ${p.width} x ${p.height}`, 10, 35);
  }

  /**
   * Resizes a p5 instance
   */
  public resizeP5Instance(instance: P5Instance): void {
    if (instance.sketch.windowResized) {
      instance.sketch.windowResized();
    }
  }

  /**
   * Updates config for a p5 instance
   */
  public updateP5Config(instance: P5Instance, newConfig: Partial<P5Config>): void {
    instance.config = { ...instance.config, ...newConfig };
    
    if (newConfig.frameRate) {
      instance.sketch.frameRate(newConfig.frameRate);
    }
  }

  /**
   * Removes and cleans up a p5 instance
   */
  public disposeP5Instance(instance: P5Instance): void {
    const index = this.p5Instances.indexOf(instance);
    if (index > -1) {
      this.p5Instances.splice(index, 1);
    }

    instance.sketch.remove();
  }

  /**
   * Disposes of all p5 instances
   */
  public disposeAll(): void {
    [...this.p5Instances].forEach(instance => {
      this.disposeP5Instance(instance);
    });
  }

  /**
   * Gets all active p5 instances
   */
  public getActiveInstances(): P5Instance[] {
    return [...this.p5Instances];
  }
}

/**
 * Helper class for background particles
 */
class BackgroundParticle {
  private x: number;
  private y: number;
  private vx: number;
  private vy: number;
  private size: number;
  private opacity: number;

  constructor(private p: p5) {
    this.x = this.p.random(this.p.width);
    this.y = this.p.random(this.p.height);
    this.vx = this.p.random(-0.5, 0.5);
    this.vy = this.p.random(-0.5, 0.5);
    this.size = this.p.random(1, 3);
    this.opacity = this.p.random(50, 150);
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;

    // Wrap around screen edges
    if (this.x < 0) this.x = this.p.width;
    if (this.x > this.p.width) this.x = 0;
    if (this.y < 0) this.y = this.p.height;
    if (this.y > this.p.height) this.y = 0;
  }

  draw(p: p5): void {
    p.fill(255, this.opacity);
    p.noStroke();
    p.ellipse(this.x, this.y, this.size);
  }
}