import { Injectable } from '@angular/core';
import * as THREE from 'three';

export interface SnowflakeConfig {
  count: number;
  speed: number;
  size: number;
  color: number;
}

export interface RenderTile {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  snowflakes: THREE.Mesh[];
}

@Injectable({
  providedIn: 'root'
})
export class ThreeJsRenderService {
  private renderTiles: RenderTile[] = [];
  private animationId?: number;

  constructor() {}

  /**
   * Creates a new render tile with Three.js scene
   */
  public createRenderTile(
    container: HTMLElement,
    width: number,
    height: number,
    config: SnowflakeConfig
  ): RenderTile {
    // Create scene
    const scene = new THREE.Scene();

    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Create lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create snowflakes
    const snowflakes = this.createSnowflakes(scene, config);

    const renderTile: RenderTile = {
      renderer,
      scene,
      camera,
      snowflakes
    };

    this.renderTiles.push(renderTile);
    return renderTile;
  }

  /**
   * Creates snowflake meshes for a scene
   */
  private createSnowflakes(scene: THREE.Scene, config: SnowflakeConfig): THREE.Mesh[] {
    const snowflakes: THREE.Mesh[] = [];

    for (let i = 0; i < config.count; i++) {
      const snowflake = this.createSnowflakeMesh(config);
      
      // Random positioning
      snowflake.position.x = (Math.random() - 0.5) * 10;
      snowflake.position.y = Math.random() * 10 + 5;
      snowflake.position.z = (Math.random() - 0.5) * 5;

      scene.add(snowflake);
      snowflakes.push(snowflake);
    }

    return snowflakes;
  }

  /**
   * Creates a single snowflake mesh
   */
  private createSnowflakeMesh(config: SnowflakeConfig): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(config.size, 8, 8);
    const material = new THREE.MeshPhongMaterial({
      color: config.color,
      transparent: true,
      opacity: 0.8
    });

    return new THREE.Mesh(geometry, material);
  }

  /**
   * Updates snowflake animations
   */
  public updateSnowflakes(renderTile: RenderTile, deltaTime: number): void {
    renderTile.snowflakes.forEach(snowflake => {
      snowflake.position.y -= 0.01 * deltaTime;
      snowflake.rotation.x += 0.01 * deltaTime;
      snowflake.rotation.y += 0.01 * deltaTime;

      // Reset position when snowflake goes below screen
      if (snowflake.position.y < -5) {
        snowflake.position.y = 10;
        snowflake.position.x = (Math.random() - 0.5) * 10;
      }
    });
  }

  /**
   * Renders a specific tile
   */
  public renderTile(renderTile: RenderTile): void {
    renderTile.renderer.render(renderTile.scene, renderTile.camera);
  }

  /**
   * Renders all tiles
   */
  public renderAllTiles(): void {
    this.renderTiles.forEach(tile => {
      this.renderTile(tile);
    });
  }

  /**
   * Starts animation loop
   */
  public startAnimation(): void {
    if (this.animationId) return;

    const animate = (timestamp: number) => {
      this.renderTiles.forEach(tile => {
        this.updateSnowflakes(tile, 16.67); // ~60fps
        this.renderTile(tile);
      });

      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Stops animation loop
   */
  public stopAnimation(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = undefined;
    }
  }

  /**
   * Resizes a render tile
   */
  public resizeRenderTile(renderTile: RenderTile, width: number, height: number): void {
    renderTile.camera.aspect = width / height;
    renderTile.camera.updateProjectionMatrix();
    renderTile.renderer.setSize(width, height);
  }

  /**
   * Cleans up a render tile
   */
  public disposeRenderTile(renderTile: RenderTile): void {
    // Remove from tracking array
    const index = this.renderTiles.indexOf(renderTile);
    if (index > -1) {
      this.renderTiles.splice(index, 1);
    }

    // Dispose of Three.js resources
    renderTile.snowflakes.forEach(snowflake => {
      renderTile.scene.remove(snowflake);
      snowflake.geometry.dispose();
      if (Array.isArray(snowflake.material)) {
        snowflake.material.forEach(mat => mat.dispose());
      } else {
        snowflake.material.dispose();
      }
    });

    renderTile.renderer.dispose();
  }

  /**
   * Disposes of all render tiles
   */
  public disposeAll(): void {
    this.stopAnimation();
    [...this.renderTiles].forEach(tile => {
      this.disposeRenderTile(tile);
    });
  }
}