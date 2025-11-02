import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GameLevel {
  level: number;
  minimumRows: number;
  maxSymbol: number;
}

export interface GameGrid {
  rowCount: number;
  columnCount: number;
  tileSize: [number, number];
  position: [number, number];
}

export interface GameState {
  currentLevel: number;
  score: number;
  isGameActive: boolean;
  selectedTiles: boolean[];
  tileValues: number[];
  animationDelays: number[];
}

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private readonly defaultGrid: GameGrid = {
    rowCount: 8,
    columnCount: 10,
    tileSize: [64, 64],
    position: [0, 0]
  };

  private readonly levelData: GameLevel[] = [
    { level: 1, minimumRows: 1, maxSymbol: 2 },
    { level: 2, minimumRows: 2, maxSymbol: 2 },
    { level: 3, minimumRows: 2, maxSymbol: 3 },
    // Add more levels as needed
  ];

  private gameStateSubject = new BehaviorSubject<GameState>({
    currentLevel: 1,
    score: 0,
    isGameActive: false,
    selectedTiles: [],
    tileValues: [],
    animationDelays: []
  });

  private gridConfigSubject = new BehaviorSubject<GameGrid>(this.defaultGrid);

  constructor() {}

  // Public observables
  public gameState$: Observable<GameState> = this.gameStateSubject.asObservable();
  public gridConfig$: Observable<GameGrid> = this.gridConfigSubject.asObservable();

  // Game state management methods
  public getCurrentGameState(): GameState {
    return this.gameStateSubject.value;
  }

  public updateGameState(partialState: Partial<GameState>): void {
    const currentState = this.gameStateSubject.value;
    this.gameStateSubject.next({ ...currentState, ...partialState });
  }

  public startNewGame(): void {
    this.updateGameState({
      currentLevel: 1,
      score: 0,
      isGameActive: true,
      selectedTiles: new Array(this.getTotalTileCount()).fill(false),
      tileValues: [],
      animationDelays: []
    });
  }

  public pauseGame(): void {
    this.updateGameState({ isGameActive: false });
  }

  public resumeGame(): void {
    this.updateGameState({ isGameActive: true });
  }

  // Level management
  public getLevelData(level: number): GameLevel | undefined {
    return this.levelData.find(l => l.level === level);
  }

  public advanceToNextLevel(): void {
    const currentState = this.getCurrentGameState();
    this.updateGameState({ currentLevel: currentState.currentLevel + 1 });
  }

  // Grid management
  public getGridConfig(): GameGrid {
    return this.gridConfigSubject.value;
  }

  public updateGridConfig(config: Partial<GameGrid>): void {
    const currentConfig = this.gridConfigSubject.value;
    this.gridConfigSubject.next({ ...currentConfig, ...config });
  }

  public getTotalTileCount(): number {
    const grid = this.getGridConfig();
    return grid.rowCount * grid.columnCount;
  }

  // Tile management
  public selectTile(index: number): void {
    const currentState = this.getCurrentGameState();
    const newSelectedTiles = [...currentState.selectedTiles];
    newSelectedTiles[index] = true;
    this.updateGameState({ selectedTiles: newSelectedTiles });
  }

  public deselectTile(index: number): void {
    const currentState = this.getCurrentGameState();
    const newSelectedTiles = [...currentState.selectedTiles];
    newSelectedTiles[index] = false;
    this.updateGameState({ selectedTiles: newSelectedTiles });
  }

  public clearAllSelections(): void {
    const currentState = this.getCurrentGameState();
    this.updateGameState({ 
      selectedTiles: new Array(currentState.selectedTiles.length).fill(false) 
    });
  }
}