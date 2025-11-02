/// <reference types="jasmine" />

import { TestBed } from '@angular/core/testing';

import { GameStateService } from './game-state.service';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default game state', () => {
    const gameState = service.getCurrentGameState();
    expect(gameState.currentLevel).toBe(1);
    expect(gameState.score).toBe(0);
    expect(gameState.isGameActive).toBe(false);
  });

  it('should start a new game', () => {
    service.startNewGame();
    const gameState = service.getCurrentGameState();
    expect(gameState.isGameActive).toBe(true);
    expect(gameState.currentLevel).toBe(1);
    expect(gameState.score).toBe(0);
  });

  it('should pause and resume game', () => {
    service.startNewGame();
    service.pauseGame();
    expect(service.getCurrentGameState().isGameActive).toBe(false);
    
    service.resumeGame();
    expect(service.getCurrentGameState().isGameActive).toBe(true);
  });

  it('should select and deselect tiles', () => {
    service.startNewGame();
    service.selectTile(5);
    expect(service.getCurrentGameState().selectedTiles[5]).toBe(true);
    
    service.deselectTile(5);
    expect(service.getCurrentGameState().selectedTiles[5]).toBe(false);
  });

  it('should clear all selections', () => {
    service.startNewGame();
    service.selectTile(3);
    service.selectTile(7);
    service.clearAllSelections();
    
    const gameState = service.getCurrentGameState();
    const hasAnySelection = gameState.selectedTiles.some(selected => selected);
    expect(hasAnySelection).toBe(false);
  });

  it('should advance to next level', () => {
    service.startNewGame();
    const initialLevel = service.getCurrentGameState().currentLevel;
    service.advanceToNextLevel();
    expect(service.getCurrentGameState().currentLevel).toBe(initialLevel + 1);
  });

  it('should get level data', () => {
    const levelData = service.getLevelData(1);
    expect(levelData).toBeDefined();
    expect(levelData?.level).toBe(1);
    expect(levelData?.minimumRows).toBeDefined();
    expect(levelData?.maxSymbol).toBeDefined();
  });

  it('should return undefined for invalid level', () => {
    const levelData = service.getLevelData(999);
    expect(levelData).toBeUndefined();
  });

  it('should manage grid configuration', () => {
    const gridConfig = service.getGridConfig();
    expect(gridConfig).toBeDefined();
    expect(gridConfig.rowCount).toBe(8);
    expect(gridConfig.columnCount).toBe(10);
  });

  it('should calculate total tile count', () => {
    const totalTiles = service.getTotalTileCount();
    expect(totalTiles).toBe(80); // 8 rows * 10 columns
  });
});
