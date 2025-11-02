import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ConfigurationService } from './services/configuration.service';
import { ApiEndpointsService } from './services/api-endpoints.service';
import * as THREE from 'three';
import * as p5 from 'p5';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'IceBreaker';

  @ViewChild('p5FullscreenContainer', { static: false }) p5FullscreenContainer!: ElementRef;

  screenWidth: number = 0;
  screenHeight: number = 0;
  
  // Tile-specific Three.js instances
  private tileRenderers: THREE.WebGLRenderer[] = [];
  private tileScenes: THREE.Scene[] = [];
  private tileCameras: THREE.PerspectiveCamera[] = [];
  private tileSnowflakeMeshes: THREE.Mesh[][] = [];
  
  constructor(
    public configService: ConfigurationService,
    private apiEndpointsService: ApiEndpointsService
  ) {}

  LEVEL_MINIMUM_ROWS = [
    1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 7, 7,
    7, 7, 7, 8, 8, 8, 8, 8, 9,
  ];
  LEVEL_MAX_SYMBOL: any = [
    2, 2, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6,
  ];

  ROW_COUNT: number = 8;
  COLUMN_COUNT: number = 10;
  TILE_SIZE: number[] = [64, 64];
  GRID_POSITION: number[] = [0, 0];
  GRID_POSITION_X: number = 0;
  GRID_POSITION_Y: number = 0;
  TILE_PLACEMENT: number[][] = [];
  TILE_VALUES: number[] = [];
  TILE_SELECTED: boolean[] = [];
  TILE_ANIMATION_DELAYS: number[] = [];
  
  // Selection tracking properties
  selectedTileIndices: number[] = [];
  selectedTileValues: number[] = [];
  totalSelectedValue: number = 0;
  
  // Target number game properties
  targetNumber: number = 0;
  showCorrectFlash: boolean = false;
  TILE_HIDDEN: boolean[] = [];
  
  // Timer properties
  timeRemaining: number = 120;
  gameState: 'waiting' | 'playing' | 'won' | 'lost' | 'levelup' = 'waiting';
  gameStarted: boolean = false;
  private gameTimer: any = null;
  
  // Level up mode properties
  isLevelUpMode: boolean = false;
  currentLevel: number = 1;
  levelUpDropSpeed: number = 1000; // Initial drop speed in ms
  private levelUpTimer: any = null;
  showLevelUpBanner: boolean = false;
  
  // Score properties
  currentScore: number = 0;
  
  // High score properties
  highScores: {name: string, score: number}[] = [];
  showHighScores: boolean = true; // Show high scores by default
  
  // Norse names for high scores
  private norseNames: string[] = [
    'Ragnar Frostbeard', 'Astrid Icewalker', 'Bjorn Ironside', 'Freydis Snowheart',
    'Gunnar Stormborn', 'Ingrid Wintermoon', 'Leif Frostbane', 'Sigrid Iceshield',
    'Erik Bloodaxe', 'Helga Frostborn', 'Olaf Icebreaker', 'Thora Snowblade',
    'Magnus Coldsteel', 'Brynhild Frostfire', 'Thorin Iceforge', 'Solveig Winterborn',
    'Hjalmar Frostclaw', 'Ragnhild Snowstorm', 'Ulf Iceheart', 'Valdis Frostwind',
    'Rollo Icebreaker', 'Gudrun Snowfall', 'Sven Frostguard', 'Erika Icewalker',
    'Ivar Boneless', 'Lagertha Shieldmaiden', 'Torstein Frostborn', 'Ylva Iceborn'
  ];
  
  // Progressive tile drop properties
  currentRowCount: number = 0;
  maxRowCount: number = 8;
  private rowDropTimer: any = null;
  
  // Audio for tile drop sounds
  private clunkAudio: HTMLAudioElement | null = null;
  private iceBreakAudio: HTMLAudioElement | null = null;
  private dingAudio: HTMLAudioElement | null = null;
  private whooshAudio: HTMLAudioElement | null = null;
  
  SPECIAL_BOLTS: Array<number[]> = [
    [2],
    [3],
    [4],
    [2, 4, 6],
    [1, 3, 5],
    [5],
    [6],
    [2, 3, 5],
  ];
  TILE_FLOOR: String = 'floor';

  public ngOnInit(): void {
    this.screenWidth = this.configService.getScreenWidth();
    this.screenHeight = this.configService.getScreenHeight();
    
    // Load high scores from localStorage
    this.loadHighScores();
    
    // Initialize clunk sound for tile drops
    this.initializeClunkSound();
    
    // Initialize ice break sound for successful matches
    this.initializeIceBreakSound();
    
    // Initialize ding sound for successful matches
    this.initializeDingSound();
    
    // Initialize whoosh sound for row drops
    this.initializeWhooshSound();
    
    // Calculate optimal column count based on screen width
    // Tile size is 64px, add some padding between tiles (10px gap from CSS)
    const tileWidthWithGap = this.TILE_SIZE[0] + 10;
    const availableWidth = this.screenWidth - 80; // Account for more margins
    this.COLUMN_COUNT = Math.floor(availableWidth / tileWidthWithGap) - 1;
    
    // Ensure minimum columns for gameplay
    this.COLUMN_COUNT = Math.max(this.COLUMN_COUNT, 6);
    // Cap maximum columns for performance
    this.COLUMN_COUNT = Math.min(this.COLUMN_COUNT, 18);
    
    this.initializeLevel(0);
    // Don't start timer automatically - wait for start button
  }

  public ngAfterViewInit(): void {
    // Initialize p5.js full-screen snowfall
    this.initP5Fullscreen();
  }

  /**
   * Load high scores from localStorage
   */
  private loadHighScores(): void {
    const savedScores = localStorage.getItem('iceBreaker-highScores');
    if (savedScores) {
      try {
        this.highScores = JSON.parse(savedScores);
      } catch (e) {
        this.highScores = [];
      }
    }
  }

  /**
   * Initialize clunk sound for tile drops
   */
  private initializeClunkSound(): void {
    try {
      this.clunkAudio = new Audio();
      // Use the actual IceDropSfx.mp3 file from assets
      this.clunkAudio.src = 'assets/sounds/IceDropSfx.mp3';
      this.clunkAudio.preload = 'auto';
      this.clunkAudio.volume = 0.4; // Set volume to 40%
    } catch (error) {
      console.warn('Could not initialize clunk sound:', error);
      this.clunkAudio = null;
    }
  }

  /**
   * Initialize ice break sound for successful matches
   */
  private initializeIceBreakSound(): void {
    try {
      this.iceBreakAudio = new Audio();
      // Use the actual IceBreak.mp3 file from assets
      this.iceBreakAudio.src = 'assets/sounds/IceBreak.mp3';
      this.iceBreakAudio.preload = 'auto';
      this.iceBreakAudio.volume = 0.5; // Set volume to 50%
    } catch (error) {
      console.warn('Could not initialize ice break sound:', error);
      this.iceBreakAudio = null;
    }
  }

  /**
   * Initialize ding sound for successful matches
   */
  private initializeDingSound(): void {
    try {
      this.dingAudio = new Audio();
      // Use the actual Ding.mp3 file from assets
      this.dingAudio.src = 'assets/sounds/Ding.mp3';
      this.dingAudio.preload = 'auto';
      this.dingAudio.volume = 0.6; // Set volume to 60%
    } catch (error) {
      console.warn('Could not initialize ding sound:', error);
      this.dingAudio = null;
    }
  }

  /**
   * Initialize whoosh sound for row drops
   */
  private initializeWhooshSound(): void {
    try {
      this.whooshAudio = new Audio();
      // Use the actual whoosh-hit02.mp3 file from assets
      this.whooshAudio.src = 'assets/sounds/whoosh-hit02.mp3';
      this.whooshAudio.preload = 'auto';
      this.whooshAudio.volume = 0.7; // Set volume to 70%
    } catch (error) {
      console.warn('Could not initialize whoosh sound:', error);
      this.whooshAudio = null;
    }
  }

  /**
   * Play clunk sound when tiles drop
   */
  private playClunkSound(): void {
    if (this.clunkAudio) {
      try {
        // Reset audio to beginning and play
        this.clunkAudio.currentTime = 0;
        this.clunkAudio.play().catch(error => {
          console.warn('Could not play IceDropSfx sound:', error);
        });
      } catch (error) {
        console.warn('Error playing IceDropSfx sound:', error);
      }
    }
  }

  /**
   * Play ice break sound when target is satisfied
   */
  private playIceBreakSound(): void {
    if (this.iceBreakAudio) {
      try {
        // Reset audio to beginning and play
        this.iceBreakAudio.currentTime = 0;
        this.iceBreakAudio.play().catch(error => {
          console.warn('Could not play IceBreak sound:', error);
        });
      } catch (error) {
        console.warn('Error playing IceBreak sound:', error);
      }
    }
  }

  /**
   * Play ding sound when target is satisfied
   */
  private playDingSound(): void {
    if (this.dingAudio) {
      try {
        // Reset audio to beginning and play
        this.dingAudio.currentTime = 0;
        this.dingAudio.play().catch(error => {
          console.warn('Could not play ding sound:', error);
        });
      } catch (error) {
        console.warn('Error playing ding sound:', error);
      }
    }
  }

  /**
   * Play whoosh sound when rows drop
   */
  private playWhooshSound(): void {
    if (this.whooshAudio) {
      try {
        // Reset audio to beginning and play
        this.whooshAudio.currentTime = 0;
        this.whooshAudio.play().catch(error => {
          console.warn('Could not play whoosh sound:', error);
        });
      } catch (error) {
        console.warn('Error playing whoosh sound:', error);
      }
    }
  }

  /**
   * Save high scores to localStorage
   */
  private saveHighScores(): void {
    localStorage.setItem('iceBreaker-highScores', JSON.stringify(this.highScores));
  }

  /**
   * Add a new score to the high scores list
   */
  private addHighScore(score: number): void {
    // Don't add scores of 0 or less
    if (score <= 0) {
      return;
    }
    
    // Get a random Norse name
    const randomName = this.norseNames[Math.floor(Math.random() * this.norseNames.length)];
    
    this.highScores.push({ name: randomName, score: score });
    this.highScores.sort((a, b) => b.score - a.score); // Sort by score descending
    this.highScores = this.highScores.slice(0, 10); // Keep only top 10
    this.saveHighScores();
  }

  /**
   * Check if the current score qualifies as a high score
   */
  public isHighScore(score: number): boolean {
    return this.highScores.length < 10 || score > this.highScores[this.highScores.length - 1].score;
  }

  /**
   * Get high scores that have a score greater than 0
   */
  public getValidHighScores(): {name: string, score: number}[] {
    return this.highScores.filter(entry => entry.score > 0);
  }

  /**
   * Get high scores with proper ranking (1-based indexing)
   */
  public getValidHighScoresWithRanking(): {name: string, score: number, rank: number}[] {
    return this.getValidHighScores().map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
  }

  /**
   * Get score entry at specific rank (1-based), returns null if no score at that rank
   */
  public getScoreEntryAtRank(rank: number): {name: string, score: number, rank: number} | null {
    const validScores = this.getValidHighScores();
    if (rank <= validScores.length) {
      return {
        ...validScores[rank - 1],
        rank: rank
      };
    }
    return null;
  }

  private initP5Fullscreen(): void {
    try {
      
      // Create full-screen snowfall sketch
      const fullscreenSketch = (p: any) => {
        let snowflakes: any[] = [];
        
        p.setup = () => {
          p.createCanvas(p.windowWidth, p.windowHeight);
          
          // Initialize snowflakes
          for (let i = 0; i < 200; i++) {
            snowflakes.push({
              x: p.random(p.width),
              y: p.random(p.height),
              size: p.random(3, 8), // Larger snowflakes
              speed: p.random(1, 3), // Slower falling speed for realistic flutter
              angle: p.random(p.TWO_PI), // Angle for flutter motion
              amplitude: p.random(10, 30), // How wide the flutter is
              frequency: p.random(0.02, 0.05), // How fast the flutter oscillates
              opacity: p.random(150, 255) // Varying opacity
            });
          }
        };

        p.draw = () => {
          // Clear canvas to be transparent - let CSS background show through
          p.clear();
          
          // Update and draw snowflakes
          p.fill(255);
          p.noStroke();
          
          for (let flake of snowflakes) {
            // Update flutter angle
            flake.angle += flake.frequency;
            
            // Calculate flutter offset (side-to-side motion)
            let flutterX = Math.sin(flake.angle) * flake.amplitude;
            
            // Update position - fall straight down with flutter
            flake.y += flake.speed;
            flake.x += flutterX * 0.02; // Apply flutter as horizontal drift
            
            // Wrap around screen
            if (flake.y > p.height + flake.size) {
              flake.y = -flake.size;
              flake.x = p.random(p.width);
              flake.angle = p.random(p.TWO_PI); // Reset flutter angle
            }
            if (flake.x > p.width + flake.size) {
              flake.x = -flake.size;
            } else if (flake.x < -flake.size) {
              flake.x = p.width + flake.size;
            }
            
            // Draw snowflake with full opacity
            p.fill(255, flake.opacity);
            p.circle(flake.x, flake.y, flake.size);
            
            // Add sparkle lines
            p.stroke(255, flake.opacity);
            p.strokeWeight(1);
            let lineSize = flake.size * 0.8;
            p.line(flake.x - lineSize, flake.y, flake.x + lineSize, flake.y);
            p.line(flake.x, flake.y - lineSize, flake.x, flake.y + lineSize);
            p.noStroke();
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
      };

      // Create full-screen p5 instance
      if (this.p5FullscreenContainer) {
        const p5Instance = new p5(fullscreenSketch, this.p5FullscreenContainer.nativeElement);
      } else {
        console.error('p5FullscreenContainer is not available');
      }

    } catch (error) {
      console.error('Full-screen p5.js initialization failed:', error);
    }
  }

  public initializeLevel(levelID: number): void {
    levelID =
      levelID < this.LEVEL_MINIMUM_ROWS.length
        ? levelID
        : this.LEVEL_MINIMUM_ROWS.length - 1;

    // Clear existing data
    this.TILE_PLACEMENT = [];
    this.TILE_VALUES = [];
    this.TILE_SELECTED = [];
    this.TILE_ANIMATION_DELAYS = [];
    this.TILE_HIDDEN = [];
    
    // Clear selection tracking
    this.selectedTileIndices = [];
    this.selectedTileValues = [];
    this.totalSelectedValue = 0;

    // Create grid with proper column x row layout
    for (let col = 0; col < this.COLUMN_COUNT; col++) {
      for (let row = 0; row < this.ROW_COUNT; row++) {
        let GRID_POSITION = [col * this.TILE_SIZE[0], row * this.TILE_SIZE[1]];

        this.TILE_PLACEMENT.push(GRID_POSITION);
        
        // Generate a random value for this tile and store it
        this.TILE_VALUES.push(this.getRandomTileValue());
        
        // Initialize all tiles as unselected
        this.TILE_SELECTED.push(false);
        
        // Initially hide tiles that haven't been dropped yet
        // Show tiles from bottom rows first (higher row numbers)
        const showTile = row >= (this.ROW_COUNT - this.currentRowCount);
        this.TILE_HIDDEN.push(!showTile);
        
        // Generate random animation delay with bottom-first priority
        // Bottom rows start earlier, but with random variation within each row
        const baseDelay = (this.ROW_COUNT - 1 - row) * 150; // Bottom rows first
        const randomVariation = Math.random() * 100; // Add 0-100ms random variation
        this.TILE_ANIMATION_DELAYS.push(baseDelay + randomVariation);
      }
    }
    
    // Generate the first target number
    this.generateTargetNumber();
  }

  /**
   * Generates a random number between 1 and 4 (inclusive)
   * @returns A random integer from 1 to 4
   */
  public getRandomTileValue(): number {
    return Math.floor(Math.random() * 4) + 1;
  }

  /**
   * Creates an array with the specified number of elements for snowflakes
   * @param count The number of snowflakes to display
   * @returns An array with the specified length
   */
  public getSnowflakeArray(count: number): number[] {
    return new Array(count).fill(0);
  }

  /**
   * Debug method to track when tile values are accessed
   */
  public getTileValue(index: number): number {
    const value = this.TILE_VALUES[index] || 1;
    return value;
  }

  /**
   * Get the calculated width of the game grid based on tile dimensions
   */
  public getGameGridWidth(): number {
    return this.COLUMN_COUNT * this.TILE_SIZE[0];
  }

  /**
   * Get the calculated height of the game grid based on tile dimensions
   */
  public getGameGridHeight(): number {
    return this.ROW_COUNT * this.TILE_SIZE[1];
  }

  /**
   * Toggles the selected state of a tile
   * @param index The index of the tile to toggle
   */
  public toggleTileSelection(index: number): void {
    // Prevent tile selection if game hasn't started or is over
    if (this.gameState !== 'playing' || !this.gameStarted) {
      return;
    }
    
    if (index >= 0 && index < this.TILE_SELECTED.length && !this.TILE_HIDDEN[index]) {
      this.TILE_SELECTED[index] = !this.TILE_SELECTED[index];
      
      if (this.TILE_SELECTED[index]) {
        // Tile was selected
        this.selectedTileIndices.push(index);
        this.selectedTileValues.push(this.TILE_VALUES[index]);
      } else {
        // Tile was deselected
        const tileIndex = this.selectedTileIndices.indexOf(index);
        if (tileIndex > -1) {
          this.selectedTileIndices.splice(tileIndex, 1);
          this.selectedTileValues.splice(tileIndex, 1);
        }
      }
      
      // Recalculate total
      this.updateSelectedTotal();
    }
  }

  /**
   * Updates the total value of selected tiles
   */
  private updateSelectedTotal(): void {
    this.totalSelectedValue = this.selectedTileValues.reduce((sum, value) => sum + value, 0);
    
    // Check if total matches target number
    if (this.totalSelectedValue === this.targetNumber && this.selectedTileIndices.length > 0) {
      this.handleTargetMatch();
    }
  }

  /**
   * Generates a new target number between 1 and 16, or sum of remaining tiles if less than 5 remain
   */
  private generateTargetNumber(): void {
    // Count remaining (non-hidden) tiles
    const remainingTileCount = this.TILE_HIDDEN.filter(hidden => !hidden).length;
    
    // If less than 5 tiles remain, set target to sum of all remaining tile values
    if (remainingTileCount < 5 && remainingTileCount > 0) {
      let totalRemainingValue = 0;
      for (let i = 0; i < this.TILE_VALUES.length; i++) {
        if (!this.TILE_HIDDEN[i]) {
          totalRemainingValue += this.TILE_VALUES[i];
        }
      }
      this.targetNumber = totalRemainingValue;
    } else {
      // Normal random target generation
      this.targetNumber = Math.floor(Math.random() * 16) + 1; // 1 to 16
    }
  }

  /**
   * Handles when selected tiles match the target number
   */
  private handleTargetMatch(): void {
    // Trigger the red flash animation on target number
    this.showCorrectFlash = true;
    setTimeout(() => {
      this.showCorrectFlash = false;
    }, 800); // Match animation duration
    
    // Play ice break sound when target is satisfied
    this.playIceBreakSound();
    
    // Play ding sound at the same time
    this.playDingSound();
    
    // Add the target number value to the score
    this.currentScore += this.targetNumber;
    
    // Add disappearing animation to selected tiles
    this.selectedTileIndices.forEach(index => {
      const tileElement = document.querySelector(`[data-index="${index}"]`) as HTMLElement;
      if (tileElement) {
        tileElement.classList.add('disappearing');
      }
    });
    
    // Hide the tiles after animation completes and then drop remaining tiles
    setTimeout(() => {
      this.selectedTileIndices.forEach(index => {
        this.TILE_HIDDEN[index] = true;
      });
      
      // Clear the selection
      this.clearSelection();
      
      // Drop tiles to fill gaps immediately after tiles are hidden
      this.dropTilesToFillGaps();
      
      // Generate new target number
      this.generateTargetNumber();
      
      // Check if all tiles are hidden (level complete condition)
      const allHidden = this.TILE_HIDDEN.every(hidden => hidden);
      if (allHidden) {
        this.startLevelUpMode();
      }
    }, 800); // Updated to match dropOut animation duration (0.8s)
  }

  /**
   * Drops tiles to fill gaps after tiles are hidden
   */
  private dropTilesToFillGaps(): void {
    // For each column, move tiles above hidden tiles down
    for (let col = 0; col < this.COLUMN_COUNT; col++) {
      this.dropTilesInColumn(col);
    }
  }

  /**
   * Simple method to drop tiles in a specific column
   */
  private dropTilesInColumn(columnIndex: number): void {
    // Get all tiles in this column
    const columnTiles: {index: number, row: number}[] = [];
    
    for (let i = 0; i < this.TILE_PLACEMENT.length; i++) {
      const tileCol = this.TILE_PLACEMENT[i][0] / this.TILE_SIZE[0]; // Convert pixel to grid column
      if (Math.round(tileCol) === columnIndex) {
        const tileRow = this.TILE_PLACEMENT[i][1] / this.TILE_SIZE[1]; // Convert pixel to grid row
        columnTiles.push({index: i, row: Math.round(tileRow)});
      }
    }
    
    // Sort by row (top to bottom)
    columnTiles.sort((a, b) => a.row - b.row);
    
    // Find visible tiles and move them down to fill gaps
    const visibleTiles = columnTiles.filter(tile => !this.TILE_HIDDEN[tile.index]);
    
    // Assign visible tiles to bottom rows - they should settle at the bottom
    // If we have 3 visible tiles and 10 total rows, they go to rows 7, 8, 9 (bottom 3 rows)
    const startRow = this.ROW_COUNT - visibleTiles.length;
    
    for (let i = 0; i < visibleTiles.length; i++) {
      const tileIndex = visibleTiles[i].index;
      const newRow = startRow + i; // Bottom-most available rows
      const newYPosition = newRow * this.TILE_SIZE[1];
      
      // Update position if it changed
      if (this.TILE_PLACEMENT[tileIndex][1] !== newYPosition) {
        this.TILE_PLACEMENT[tileIndex][1] = newYPosition;
      }
    }
  }

  /**
   * Animates a tile dropping to its new position
   */
  private animateTileDrop(tileIndex: number): void {
    // Simple method for other uses - just add the dropping class
    const tileElement = document.querySelector(`[data-index="${tileIndex}"]`) as HTMLElement;
    if (tileElement) {
      tileElement.classList.add('dropping');
      
      setTimeout(() => {
        tileElement.classList.remove('dropping');
      }, 800);
    }
  }

  /**
   * Initialize Three.js snowflakes for each tile
   */
  private initializeTileSnowflakes(): void {
    console.log('Initializing tile snowflakes...');
    
    // Clear existing tile renderers
    this.tileRenderers.forEach(renderer => {
      if (renderer) renderer.dispose();
    });
    this.tileRenderers = [];
    this.tileScenes = [];
    this.tileCameras = [];
    this.tileSnowflakeMeshes = [];

    for (let i = 0; i < this.TILE_PLACEMENT.length; i++) {
      if (!this.TILE_HIDDEN[i]) {
        this.createTileSnowflake(i);
      } else {
        // Add placeholders for hidden tiles
        this.tileRenderers.push(null as any);
        this.tileScenes.push(null as any);
        this.tileCameras.push(null as any);
        this.tileSnowflakeMeshes.push([]);
      }
    }
    
    console.log(`Initialized snowflakes for ${this.tileRenderers.filter(r => r !== null).length} tiles`);
  }

  /**
   * Create a Three.js snowflake scene for a specific tile
   */
  private createTileSnowflake(tileIndex: number): void {
    try {
      const tileElement = document.querySelector(`[data-index="${tileIndex}"]`) as HTMLElement;
      if (!tileElement) {
        console.warn(`Tile element not found for index ${tileIndex}`);
        // Add placeholders if tile element not found
        this.tileRenderers.push(null as any);
        this.tileScenes.push(null as any);
        this.tileCameras.push(null as any);
        this.tileSnowflakeMeshes.push([]);
        return;
      }

      console.log(`Creating snowflake for tile ${tileIndex}`);

      // Create scene
      const scene = new THREE.Scene();

      // Create camera
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 3;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(60, 60); // Slightly smaller than tile size (64x64)
      renderer.setClearColor(0x000000, 0); // Transparent background
      
      // Add canvas to tile
      const canvas = renderer.domElement;
      canvas.style.position = 'absolute';
      canvas.style.top = '2px';
      canvas.style.left = '2px';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '1';
      canvas.style.borderRadius = '4px';
      
      // Clear any existing canvases in this tile
      const existingCanvases = tileElement.querySelectorAll('canvas');
      existingCanvases.forEach(c => c.remove());
      
      tileElement.appendChild(canvas);

      // Create snowflake meshes based on tile value
      const snowflakeMeshes: THREE.Mesh[] = [];
      const snowflakeCount = this.TILE_VALUES[tileIndex];
      
      console.log(`Creating ${snowflakeCount} snowflakes for tile ${tileIndex}`);
      
      for (let j = 0; j < snowflakeCount; j++) {
        const snowflake = this.createSnowflakeMesh();
        
        // Position snowflakes in a grid pattern within the tile
        if (snowflakeCount === 1) {
          snowflake.position.set(0, 0, 0);
        } else if (snowflakeCount === 2) {
          const x = j === 0 ? -0.3 : 0.3;
          snowflake.position.set(x, 0, 0);
        } else if (snowflakeCount === 3) {
          const positions = [[-0.3, 0.2], [0.3, 0.2], [0, -0.2]];
          snowflake.position.set(positions[j][0], positions[j][1], 0);
        } else { // 4 snowflakes
          const positions = [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25]];
          snowflake.position.set(positions[j][0], positions[j][1], 0);
        }
        
        snowflakeMeshes.push(snowflake);
        scene.add(snowflake);
      }

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, 1, 2);
      scene.add(directionalLight);

      // Store references
      this.tileRenderers.push(renderer);
      this.tileScenes.push(scene);
      this.tileCameras.push(camera);
      this.tileSnowflakeMeshes.push(snowflakeMeshes);

      // Render once to show the snowflakes
      renderer.render(scene, camera);

      // Start animation loop for this tile
      this.animateTileSnowflake(tileIndex);
      
      console.log(`Successfully created snowflake for tile ${tileIndex}`);
      
    } catch (error) {
      console.error(`Error creating snowflake for tile ${tileIndex}:`, error);
      // Fallback to text snowflakes
      this.createTextSnowflakeFallback(tileIndex);
      // Add placeholders for arrays
      this.tileRenderers.push(null as any);
      this.tileScenes.push(null as any);
      this.tileCameras.push(null as any);
      this.tileSnowflakeMeshes.push([]);
    }
  }

  /**
   * Fallback method to create text snowflakes if Three.js fails
   */
  private createTextSnowflakeFallback(tileIndex: number): void {
    const tileElement = document.querySelector(`[data-index="${tileIndex}"]`) as HTMLElement;
    if (!tileElement) return;

    console.log(`Creating text snowflake fallback for tile ${tileIndex}`);
    
    const snowflakeCount = this.TILE_VALUES[tileIndex];
    for (let i = 0; i < snowflakeCount; i++) {
      const snowflakeSpan = document.createElement('span');
      snowflakeSpan.textContent = '❄';
      snowflakeSpan.className = 'snowflake fallback-snowflake';
      snowflakeSpan.style.color = 'white';
      snowflakeSpan.style.fontSize = '16px';
      snowflakeSpan.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
      snowflakeSpan.style.margin = '1px';
      snowflakeSpan.style.animation = 'sparkle 2s infinite alternate';
      tileElement.appendChild(snowflakeSpan);
    }
  }

  /**
   * Create a 3D snowflake mesh
   */
  private createSnowflakeMesh(): THREE.Mesh {
    // Create a simpler star-like geometry for the snowflake
    const geometry = new THREE.ConeGeometry(0.1, 0.02, 6);
    
    // Create material
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Add some random rotation for variety
    mesh.rotation.x = Math.random() * Math.PI;
    mesh.rotation.y = Math.random() * Math.PI;
    mesh.rotation.z = Math.random() * Math.PI;
    
    return mesh;
  }

  /**
   * Animate the Three.js snowflakes in a specific tile
   */
  private animateTileSnowflake(tileIndex: number): void {
    const animate = () => {
      if (this.TILE_HIDDEN[tileIndex] || !this.tileRenderers[tileIndex]) {
        return; // Stop animation if tile is hidden
      }

      // Rotate snowflakes
      this.tileSnowflakeMeshes[tileIndex]?.forEach((mesh, index) => {
        if (mesh) {
          mesh.rotation.z += 0.02 + index * 0.005;
          mesh.rotation.x += 0.01;
        }
      });

      // Render the scene
      if (this.tileRenderers[tileIndex] && this.tileScenes[tileIndex] && this.tileCameras[tileIndex]) {
        this.tileRenderers[tileIndex].render(this.tileScenes[tileIndex], this.tileCameras[tileIndex]);
      }

      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Clean up Three.js resources for a specific tile
   */
  private cleanupTileSnowflake(tileIndex: number): void {
    if (this.tileRenderers[tileIndex]) {
      // Remove canvas from DOM
      const canvas = this.tileRenderers[tileIndex].domElement;
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
      
      // Dispose of Three.js resources
      this.tileRenderers[tileIndex].dispose();
      
      // Clean up geometries and materials
      this.tileSnowflakeMeshes[tileIndex]?.forEach(mesh => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(mat => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      
      // Clear references
      this.tileRenderers[tileIndex] = null as any;
      this.tileScenes[tileIndex] = null as any;
      this.tileCameras[tileIndex] = null as any;
      this.tileSnowflakeMeshes[tileIndex] = [];
    }
  }

  /**
   * Update snowflakes after tiles have dropped
   */
  private updateTileSnowflakesAfterDrop(): void {
    // Clean up all existing snowflakes
    for (let i = 0; i < this.tileRenderers.length; i++) {
      if (this.tileRenderers[i] && !this.TILE_HIDDEN[i]) {
        this.cleanupTileSnowflake(i);
      }
    }
    
    // Reinitialize snowflakes for visible tiles
    setTimeout(() => {
      this.initializeTileSnowflakes();
    }, 100);
  }

  /**
   * Gets a formatted string of selected tile values
   */
  public getSelectedValuesString(): string {
    if (this.selectedTileValues.length === 0) {
      return 'No tiles selected';
    }
    return this.selectedTileValues.join(' + ');
  }

  /**
   * Clears all selected tiles
   */
  public clearSelection(): void {
    this.selectedTileIndices = [];
    this.selectedTileValues = [];
    this.totalSelectedValue = 0;
    this.TILE_SELECTED.fill(false);
  }

  /**
   * Starts the game when the start button is clicked
   */
  public startGame(): void {
    this.currentScore = 0; // Reset score when starting a new game
    this.showHighScores = false; // Hide high scores when starting
    this.startGameTimer();
  }

  /**
   * Close the high scores display
   */
  public closeHighScores(): void {
    this.showHighScores = false;
  }

  /**
   * Starts the 120-second game timer
   */
  // Add a new row of tiles during gameplay
  addNewRow(): void {
    if (this.currentRowCount >= this.maxRowCount) {
      return; // Already at maximum rows
    }

    // Play whoosh sound when new rows drop
    this.playWhooshSound();

    // Reveal tiles from the bottom row that corresponds to currentRowCount
    const targetRow = this.ROW_COUNT - 1 - this.currentRowCount; // Bottom-up: 7, 6, 5, etc.
    
    for (let col = 0; col < this.COLUMN_COUNT; col++) {
      const tileIndex = col * this.ROW_COUNT + targetRow;
      
      if (tileIndex < this.TILE_HIDDEN.length && this.TILE_HIDDEN[tileIndex]) {
        // Reveal the tile
        this.TILE_HIDDEN[tileIndex] = false;
      }
    }
    
    // Drop all tiles to fill gaps after revealing new ones
    this.dropTilesToFillGaps();
    
    // Animate the newly revealed tiles after they've been repositioned
    setTimeout(() => {
      for (let col = 0; col < this.COLUMN_COUNT; col++) {
        const tileIndex = col * this.ROW_COUNT + targetRow;
        
        if (tileIndex < this.TILE_HIDDEN.length && !this.TILE_HIDDEN[tileIndex]) {
          const tileElement = document.querySelector(`[data-index="${tileIndex}"]`) as HTMLElement;
          if (tileElement) {
            // Remove any existing styles that might interfere
            tileElement.style.removeProperty('opacity');
            tileElement.style.removeProperty('transform');
            tileElement.style.removeProperty('animation');
            
            // Trigger reflow to ensure the reset takes effect
            tileElement.offsetHeight;
            
            // Add a class to trigger the drop animation with a stagger
            setTimeout(() => {
              tileElement.classList.add('newly-dropped');
              
              // Remove the class after animation completes
              setTimeout(() => {
                tileElement.classList.remove('newly-dropped');
              }, 600); // Animation duration is 0.6s
            }, col * 100); // Stagger animation by 100ms per column
          }
        }
      }
    }, 50);
    
    // Increment the row count
    this.currentRowCount++;
  }

  private startGameTimer(): void {
    this.timeRemaining = 120;
    this.gameState = 'playing';
    this.gameStarted = true;
    
    // Drop the first 2 rows immediately when game starts
    this.addNewRow(); // Add first row
    setTimeout(() => {
      this.addNewRow(); // Add second row after a short delay
    }, 500);
    
    this.gameTimer = setInterval(() => {
      this.timeRemaining--;
      
      if (this.timeRemaining <= 0) {
        this.endGame('lost');
      }
    }, 1000);

    // Start the row drop timer for progressive tile revelation
    this.rowDropTimer = setInterval(() => {
      this.addNewRow();
    }, 65000); // 35 seconds
  }

  /**
   * Ends the game with the specified result
   */
  private endGame(result: 'won' | 'lost'): void {
    this.gameState = result;
    
    // Add current score to high scores if it qualifies
    if (this.currentScore > 0) {
      this.addHighScore(this.currentScore);
    }
    
    // Show high scores display
    this.showHighScores = true;
    
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }

    if (this.rowDropTimer) {
      clearInterval(this.rowDropTimer);
      this.rowDropTimer = null;
    }
  }

  /**
   * Starts level up mode with faster dropping ice rows
   */
  private startLevelUpMode(): void {
    this.isLevelUpMode = true;
    this.gameState = 'levelup';
    this.currentLevel++;
    
    // Pause the game timer during level up
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    
    
    // Show the level up banner
    this.showLevelUpBanner = true;
    
    // Increase drop speed (decrease interval) for each level
    this.levelUpDropSpeed = Math.max(200, 1000 - (this.currentLevel * 100));
    
    console.log(`Level ${this.currentLevel} ready! Drop speed will be: ${this.levelUpDropSpeed}ms`);
  }

  /**
   * Continues to the next level after level up banner
   */
  public continueToNextLevel(): void {
    this.showLevelUpBanner = false;
    
    // Reset the game board for the new level
    this.resetBoardForLevelUp();
    
    // Restart the game timer for the new level
    this.startGameTimer();
    
    // Manually reveal exactly 2 rows instead of using addNewRow()
    this.currentRowCount = 2;
    
    // Reveal bottom 2 rows directly
    for (let col = 0; col < this.COLUMN_COUNT; col++) {
      // Bottom row (row 7 in 0-7 indexing)
      const bottomRowIndex = col * this.ROW_COUNT + (this.ROW_COUNT - 1);
      if (bottomRowIndex < this.TILE_HIDDEN.length) {
        this.TILE_HIDDEN[bottomRowIndex] = false;
      }
      
      // Second from bottom row (row 6)
      const secondRowIndex = col * this.ROW_COUNT + (this.ROW_COUNT - 2);
      if (secondRowIndex < this.TILE_HIDDEN.length) {
        this.TILE_HIDDEN[secondRowIndex] = false;
      }
    }
    
    console.log(`Level ${this.currentLevel} started! Revealed exactly 2 rows.`);
  }

  /**
   * Resets the board for level up mode
   */
  private resetBoardForLevelUp(): void {
    // Clear existing timers
    if (this.rowDropTimer) {
      clearInterval(this.rowDropTimer);
      this.rowDropTimer = null;
    }
    
    // Clear existing data
    this.TILE_PLACEMENT = [];
    this.TILE_VALUES = [];
    this.TILE_SELECTED = [];
    this.TILE_ANIMATION_DELAYS = [];
    this.TILE_HIDDEN = [];
    
    // Clear selection tracking
    this.selectedTileIndices = [];
    this.selectedTileValues = [];
    this.totalSelectedValue = 0;

    // Create full grid like normal game initialization, but start with NO visible rows
    this.currentRowCount = 0; // Start with 0 rows, then add exactly 2
    
    // Create grid with proper column x row layout (full grid)
    for (let col = 0; col < this.COLUMN_COUNT; col++) {
      for (let row = 0; row < this.ROW_COUNT; row++) {
        let GRID_POSITION = [col * this.TILE_SIZE[0], row * this.TILE_SIZE[1]];

        this.TILE_PLACEMENT.push(GRID_POSITION);
        this.TILE_VALUES.push(this.getRandomTileValue());
        this.TILE_SELECTED.push(false);
        
        // Hide ALL tiles initially - we'll reveal exactly 2 rows after reset
        this.TILE_HIDDEN.push(true);
        
        // Generate random animation delay with bottom-first priority
        const baseDelay = (this.ROW_COUNT - 1 - row) * 150;
        const randomVariation = Math.random() * 100;
        this.TILE_ANIMATION_DELAYS.push(baseDelay + randomVariation);
      }
    }
    
    this.generateTargetNumber();
    
    // Continue the game
    this.gameState = 'playing';
  }

  /**
   * Starts the faster row dropping for level up mode
   */
  private startLevelUpRowDropping(): void {
    if (this.levelUpTimer) {
      clearInterval(this.levelUpTimer);
    }
    
    this.levelUpTimer = setInterval(() => {
      if (this.gameState === 'playing' && this.isLevelUpMode) {
        this.addNewRow();
      }
    }, this.levelUpDropSpeed);
  }

  /**
   * Restarts the game
   */
  public restartGame(): void {
    // Add current score to high scores if game was in progress
    if (this.gameState === 'playing' && this.currentScore > 0) {
      this.addHighScore(this.currentScore);
    }
    
    // Always show high scores when restart is pressed
    this.showHighScores = true;
    
    // Clear existing timers
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    if (this.rowDropTimer) {
      clearInterval(this.rowDropTimer);
      this.rowDropTimer = null;
    }
    if (this.levelUpTimer) {
      clearInterval(this.levelUpTimer);
      this.levelUpTimer = null;
    }
    
    // Reset game state
    this.gameState = 'waiting';
    this.gameStarted = false;
    this.timeRemaining = 120;
    
    // Reset level up mode properties
    this.isLevelUpMode = false;
    this.currentLevel = 1;
    this.levelUpDropSpeed = 1000;
    this.showLevelUpBanner = false;
    this.currentScore = 0; // Reset score when restarting
    
    // Reset progressive tile properties
    this.currentRowCount = 0;
    
    // Reinitialize the game
    this.initializeLevel(0);
    // Don't start timer automatically - wait for start button
  }

  /**
   * Play again - resets the game and starts immediately (used from high scores modal)
   */
  public playAgain(): void {
    // Close high scores modal
    this.closeHighScores();
    
    // Clear existing timers
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
    }
    if (this.rowDropTimer) {
      clearInterval(this.rowDropTimer);
      this.rowDropTimer = null;
    }
    
    // Reset game state
    this.gameState = 'waiting';
    this.gameStarted = false;
    this.timeRemaining = 120;
    this.currentScore = 0; // Reset score when starting new game
    
    // Reset progressive tile properties
    this.currentRowCount = 0;
    
    // Reinitialize the game - this will hide all tiles properly
    this.initializeLevel(0);
    
    // Start the game immediately
    this.startGame();
  }
}
