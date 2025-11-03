import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { 
  ConfigurationService,
  ApiEndpointsService,
  GameStateService, 
  ThreeJsRenderService, 
  P5RenderService, 
  ScreenUtilityService 
} from './services';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppRefactoredComponent implements OnInit, AfterViewInit, OnDestroy {
  title = 'IceBreaker';

  @ViewChild('p5FullscreenContainer', { static: false }) p5FullscreenContainer!: ElementRef;

  screenWidth: number = 0;
  screenHeight: number = 0;
  
  // Game properties to match the template
  targetNumber: number = 0;
  showCorrectFlash: boolean = false;
  timeRemaining: number = 120;
  gameStarted: boolean = false;
  gameState: 'waiting' | 'playing' | 'won' | 'lost' | 'levelup' = 'waiting';
  totalSelectedValue: number = 0;
  currentScore: number = 0;
  currentLevel: number = 1;
  levelUpDropSpeed: number = 1000;
  showHighScores: boolean = false;
  showLevelUpBanner: boolean = false;
  
  // Player name properties
  currentPlayerName: string = '';
  customPlayerName: string = '';
  showPlayerNameInput: boolean = false;
  
  // Arrays to match template
  TILE_PLACEMENT: number[][] = [];
  TILE_VALUES: number[] = [];
  TILE_SELECTED: boolean[] = [];
  TILE_HIDDEN: boolean[] = [];
  TILE_ANIMATION_DELAYS: number[] = [];
  
  private destroy$ = new Subject<void>();
  
  constructor(
    public configService: ConfigurationService,
    private apiEndpointsService: ApiEndpointsService,
    private gameStateService: GameStateService,
    private threeJsRenderer: ThreeJsRenderService,
    private p5Renderer: P5RenderService,
    private screenUtility: ScreenUtilityService
  ) {}

  ngOnInit(): void {
    this.initializeScreenDimensions();
    this.initializeGameState();
    this.setupScreenChangeObserver();
    this.initializePlayerName();
  }

  ngAfterViewInit(): void {
    this.initializeRenderers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupRenderers();
  }

  private initializeScreenDimensions(): void {
    const dimensions = this.screenUtility.getScreenDimensions();
    this.screenWidth = dimensions.width;
    this.screenHeight = dimensions.height;
  }

  private initializeGameState(): void {
    // Subscribe to game state changes
    this.gameStateService.gameState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        console.log('Game state changed:', state);
        // Handle game state changes here
      });

    // Start a new game
    this.gameStateService.startNewGame();
  }

  private initializePlayerName(): void {
    // Initialize with a default player name
    this.currentPlayerName = 'Player';
    this.customPlayerName = '';
  }

  private setupScreenChangeObserver(): void {
    this.screenUtility.observeScreenChanges((dimensions) => {
      this.screenWidth = dimensions.width;
      this.screenHeight = dimensions.height;
      this.handleScreenResize();
    });
  }

  private initializeRenderers(): void {
    if (this.p5FullscreenContainer) {
      // Initialize p5 background
      this.p5Renderer.createFullscreenBackground(
        this.p5FullscreenContainer.nativeElement,
        {
          backgroundColor: '#000033',
          frameRate: 60,
          enableDebug: false
        }
      );
    }

    // Initialize Three.js tiles based on game grid
    this.initializeThreeJsTiles();
  }

  private initializeThreeJsTiles(): void {
    const gridConfig = this.gameStateService.getGridConfig();
    const totalTiles = gridConfig.rowCount * gridConfig.columnCount;

    for (let i = 0; i < totalTiles; i++) {
      // Create container element for each tile
      const tileContainer = document.createElement('div');
      tileContainer.style.position = 'absolute';
      tileContainer.style.width = `${gridConfig.tileSize[0]}px`;
      tileContainer.style.height = `${gridConfig.tileSize[1]}px`;
      
      // Calculate tile position
      const row = Math.floor(i / gridConfig.columnCount);
      const col = i % gridConfig.columnCount;
      tileContainer.style.left = `${col * gridConfig.tileSize[0]}px`;
      tileContainer.style.top = `${row * gridConfig.tileSize[1]}px`;
      
      document.body.appendChild(tileContainer);

      // Create Three.js render tile
      this.threeJsRenderer.createRenderTile(
        tileContainer,
        gridConfig.tileSize[0],
        gridConfig.tileSize[1],
        {
          count: 10,
          speed: 1,
          size: 0.1,
          color: 0xffffff
        }
      );
    }

    // Start animation
    this.threeJsRenderer.startAnimation();
  }

  private handleScreenResize(): void {
    // Handle responsive behavior
    const p5Instances = this.p5Renderer.getActiveInstances();
    p5Instances.forEach(instance => {
      this.p5Renderer.resizeP5Instance(instance);
    });
  }

  private cleanupRenderers(): void {
    this.threeJsRenderer.disposeAll();
    this.p5Renderer.disposeAll();
  }

  // Game interaction methods
  public onTileClick(tileIndex: number): void {
    const currentState = this.gameStateService.getCurrentGameState();
    
    if (!currentState.isGameActive) {
      return;
    }

    if (currentState.selectedTiles[tileIndex]) {
      this.gameStateService.deselectTile(tileIndex);
    } else {
      this.gameStateService.selectTile(tileIndex);
    }
  }

  public startNewGame(): void {
    this.gameStateService.startNewGame();
  }

  public pauseGame(): void {
    this.gameStateService.pauseGame();
    this.threeJsRenderer.stopAnimation();
  }

  public resumeGame(): void {
    this.gameStateService.resumeGame();
    this.threeJsRenderer.startAnimation();
  }

  public exportGameData(): void {
    const gameData = this.gameStateService.getCurrentGameState();
    this.apiEndpointsService.exportGameData([gameData], 'json', 'game-state.json');
  }

  // Template methods - stub implementations for now
  public startGame(): void {
    this.gameStarted = true;
    this.gameState = 'playing';
    // TODO: Implement actual game start logic
  }

  public restartGame(): void {
    this.gameStarted = false;
    this.gameState = 'waiting';
    this.currentScore = 0;
    this.timeRemaining = 120;
    // TODO: Implement actual restart logic
  }

  public toggleTileSelection(index: number): void {
    // TODO: Implement tile selection logic
    this.onTileClick(index);
  }

  public getGameGridWidth(): number {
    return 640; // Placeholder
  }

  public getGameGridHeight(): number {
    return 512; // Placeholder
  }

  public getSnowflakeArray(count: number): any[] {
    return new Array(count).fill(null);
  }

  public isHighScore(score: number): boolean {
    // TODO: Implement high score checking logic
    return false;
  }

  public getScoreEntryAtRank(rank: number): any {
    // TODO: Implement score entry retrieval
    return null;
  }

  public getValidHighScores(): any[] {
    // TODO: Implement valid high scores retrieval
    return [];
  }

  public playAgain(): void {
    this.restartGame();
  }

  public closeHighScores(): void {
    this.showHighScores = false;
  }

  public continueToNextLevel(): void {
    this.currentLevel++;
    this.showLevelUpBanner = false;
    this.startGame();
  }

  // Player name methods
  public updatePlayerName(): void {
    if (this.customPlayerName.trim()) {
      this.currentPlayerName = this.customPlayerName.trim();
      this.showPlayerNameInput = false;
      // TODO: Save to localStorage or service
    }
  }

  public resetPlayerName(): void {
    this.currentPlayerName = 'Player'; // Default name
    this.customPlayerName = '';
    this.showPlayerNameInput = false;
  }
}