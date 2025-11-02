import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HighScore {
  _id?: string;
  playerName: string;
  score: number;
  targetNumber: number;
  attempts: number;
  timestamp: Date;
  gameType: string;
}

@Injectable({
  providedIn: 'root'
})
export class HighScoresService {
  private readonly apiUrl = environment.production 
    ? environment.apiUrl 
    : environment.apiUrl;

  private highScoresSubject = new BehaviorSubject<HighScore[]>([]);
  public highScores$ = this.highScoresSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    console.log('HighScoresService initialized with API URL:', this.apiUrl);
    this.loadHighScores();
  }

  /**
   * Load high scores from the API
   */
  loadHighScores(): void {
    this.getHighScores().subscribe({
      next: (scores) => {
        this.highScoresSubject.next(scores);
      },
      error: (error) => {
        console.error('Failed to load high scores:', error);
        // Fallback to local storage if API fails
        this.loadLocalHighScores();
      }
    });
  }

  /**
   * Get high scores from the API
   */
  getHighScores(): Observable<HighScore[]> {
    console.log('Fetching high scores from:', `${this.apiUrl}/highscores`);
    return this.http.get<HighScore[]>(`${this.apiUrl}/highscores`);
  }

  /**
   * Submit a new high score
   */
  submitHighScore(score: Omit<HighScore, '_id' | 'timestamp'>): Observable<any> {
    const scoreData = {
      ...score,
      gameType: 'ice-fishing'
    };

    console.log('Submitting score to:', `${this.apiUrl}/highscores`, scoreData);
    return this.http.post(`${this.apiUrl}/highscores`, scoreData, this.httpOptions);
  }

  /**
   * Check if a score qualifies as a high score (top 10)
   */
  isHighScore(score: number): boolean {
    const currentScores = this.highScoresSubject.value;
    
    // If we have less than 10 scores, it's automatically a high score
    if (currentScores.length < 10) {
      return true;
    }

    // Check if the score is better than the lowest high score
    const lowestHighScore = Math.min(...currentScores.map(s => s.score));
    return score > lowestHighScore;
  }

  /**
   * Get the player's best score
   */
  getPlayerBestScore(playerName: string): number {
    const currentScores = this.highScoresSubject.value;
    const playerScores = currentScores.filter(s => 
      s.playerName.toLowerCase() === playerName.toLowerCase()
    );
    
    if (playerScores.length === 0) {
      return 0;
    }

    return Math.max(...playerScores.map(s => s.score));
  }

  /**
   * Calculate score based on game performance
   * Higher score for fewer attempts and higher target numbers
   */
  calculateScore(targetNumber: number, attempts: number, timeElapsed: number): number {
    // Base score from target number
    let score = targetNumber * 100;
    
    // Bonus for fewer attempts (exponential bonus)
    const attemptBonus = Math.max(0, 1000 - (attempts * 100));
    score += attemptBonus;
    
    // Time bonus (faster completion gets bonus)
    const timeBonus = Math.max(0, 500 - Math.floor(timeElapsed / 1000));
    score += timeBonus;
    
    // Difficulty multiplier based on target number
    if (targetNumber >= 90) {
      score *= 2; // Double score for hard targets
    } else if (targetNumber >= 70) {
      score *= 1.5; // 1.5x score for medium targets
    }
    
    return Math.floor(score);
  }

  /**
   * Fallback to local storage for offline functionality
   */
  private loadLocalHighScores(): void {
    try {
      const localScores = localStorage.getItem('icebreaker-highscores');
      if (localScores) {
        const scores = JSON.parse(localScores);
        this.highScoresSubject.next(scores);
      }
    } catch (error) {
      console.error('Failed to load local high scores:', error);
    }
  }

  /**
   * Save high scores to local storage as backup
   */
  private saveLocalHighScores(scores: HighScore[]): void {
    try {
      localStorage.setItem('icebreaker-highscores', JSON.stringify(scores));
    } catch (error) {
      console.error('Failed to save local high scores:', error);
    }
  }

  /**
   * Submit score with local backup
   */
  submitScoreWithBackup(scoreData: Omit<HighScore, '_id' | 'timestamp'>): void {
    this.submitHighScore(scoreData).subscribe({
      next: (response) => {
        console.log('High score submitted successfully:', response);
        this.loadHighScores(); // Refresh the list
      },
      error: (error) => {
        console.error('Failed to submit high score to API:', error);
        
        // Fallback to local storage
        const currentScores = this.highScoresSubject.value;
        const newScore: HighScore = {
          ...scoreData,
          timestamp: new Date(),
          _id: Date.now().toString() // Temporary ID
        };
        
        const updatedScores = [...currentScores, newScore]
          .sort((a, b) => b.score - a.score)
          .slice(0, 10); // Keep only top 10
        
        this.highScoresSubject.next(updatedScores);
        this.saveLocalHighScores(updatedScores);
      }
    });
  }
}