import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HighScoresService, HighScore } from '../services/high-scores.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-high-scores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="high-scores-container" [class.modal-open]="isModalOpen">
      <!-- High Scores Button -->
      <button class="high-scores-btn" (click)="toggleModal()" [disabled]="loading">
        🏆 High Scores
      </button>

      <!-- High Scores Modal -->
      <div class="modal-overlay" *ngIf="isModalOpen" (click)="toggleModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>🎣 Ice Fishing Champions</h2>
            <button class="close-btn" (click)="toggleModal()">×</button>
          </div>

          <div class="modal-body">
            <!-- Loading State -->
            <div *ngIf="loading" class="loading">
              <div class="spinner"></div>
              <p>Loading high scores...</p>
            </div>

            <!-- High Scores List -->
            <div *ngIf="!loading && (highScores$ | async) as scores" class="scores-list">
              <div *ngIf="scores.length === 0" class="no-scores">
                <p>🎯 No high scores yet!</p>
                <p>Be the first to make the leaderboard!</p>
              </div>

              <div *ngIf="scores.length > 0" class="scores-table">
                <div class="table-header">
                  <span class="rank">Rank</span>
                  <span class="player">Player</span>
                  <span class="score">Score</span>
                  <span class="details">Details</span>
                </div>

                <div 
                  *ngFor="let score of scores; let i = index" 
                  class="score-row"
                  [class.player-score]="isPlayerScore(score)"
                >
                  <span class="rank">
                    <span class="rank-number">{{ i + 1 }}</span>
                    <span class="rank-medal" *ngIf="i < 3">
                      {{ getMedal(i) }}
                    </span>
                  </span>
                  <span class="player">{{ score.playerName }}</span>
                  <span class="score">{{ score.score | number }}</span>
                  <span class="details">
                    <small>Target: {{ score.targetNumber }}</small><br>
                    <small>{{ score.attempts }} attempts</small><br>
                    <small>{{ formatDate(score.timestamp) }}</small>
                  </span>
                </div>
              </div>
            </div>

            <!-- Submit New Score Form -->
            <div *ngIf="showSubmitForm" class="submit-form">
              <h3>🎉 New High Score!</h3>
              <p>Score: <strong>{{ newScore?.score | number }}</strong></p>
              
              <div class="form-group">
                <label for="playerName">Enter your name:</label>
                <input 
                  id="playerName"
                  type="text" 
                  [(ngModel)]="playerName" 
                  placeholder="Your name"
                  maxlength="20"
                  class="player-input"
                  (keyup.enter)="submitScore()"
                >
              </div>

              <div class="form-actions">
                <button 
                  class="submit-btn" 
                  (click)="submitScore()"
                  [disabled]="!playerName || playerName.trim().length === 0 || submitting"
                >
                  {{ submitting ? 'Submitting...' : 'Submit Score' }}
                </button>
                <button class="cancel-btn" (click)="cancelSubmit()">
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .high-scores-container {
      position: relative;
    }

    .high-scores-btn {
      background: linear-gradient(45deg, #4a9eff, #0066cc);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 8px rgba(0, 102, 204, 0.3);
    }

    .high-scores-btn:hover:not(:disabled) {
      background: linear-gradient(45deg, #5ba3ff, #0052a3);
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 102, 204, 0.4);
    }

    .high-scores-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.3s ease;
    }

    .modal-content {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 2px solid #2196f3;
      background: linear-gradient(45deg, #2196f3, #1976d2);
      color: white;
      border-radius: 16px 16px 0 0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
      padding: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s ease;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .modal-body {
      padding: 20px;
    }

    .loading {
      text-align: center;
      padding: 40px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e3f2fd;
      border-top: 4px solid #2196f3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .no-scores {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .scores-table {
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .table-header {
      display: grid;
      grid-template-columns: 80px 1fr 100px 120px;
      gap: 10px;
      padding: 16px;
      background: #f5f5f5;
      font-weight: 600;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .score-row {
      display: grid;
      grid-template-columns: 80px 1fr 100px 120px;
      gap: 10px;
      padding: 16px;
      border-bottom: 1px solid #eee;
      transition: background 0.3s ease;
    }

    .score-row:hover {
      background: #f8f9fa;
    }

    .score-row.player-score {
      background: #e8f5e8;
      font-weight: 600;
    }

    .rank {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
    }

    .rank-number {
      color: #666;
    }

    .rank-medal {
      font-size: 20px;
    }

    .player {
      font-weight: 600;
      color: #333;
    }

    .score {
      font-weight: 700;
      color: #2196f3;
      font-size: 18px;
    }

    .details {
      font-size: 12px;
      color: #666;
      line-height: 1.4;
    }

    .submit-form {
      background: white;
      padding: 24px;
      border-radius: 8px;
      margin-top: 20px;
      text-align: center;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .submit-form h3 {
      color: #4caf50;
      margin-bottom: 16px;
    }

    .form-group {
      margin: 20px 0;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }

    .player-input {
      width: 100%;
      max-width: 300px;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 16px;
      text-align: center;
    }

    .player-input:focus {
      outline: none;
      border-color: #2196f3;
      box-shadow: 0 0 8px rgba(33, 150, 243, 0.3);
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      margin-top: 20px;
    }

    .submit-btn, .cancel-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .submit-btn {
      background: #4caf50;
      color: white;
    }

    .submit-btn:hover:not(:disabled) {
      background: #45a049;
      transform: translateY(-2px);
    }

    .submit-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .cancel-btn {
      background: #f44336;
      color: white;
    }

    .cancel-btn:hover {
      background: #d32f2f;
      transform: translateY(-2px);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from { 
        opacity: 0;
        transform: translateY(-50px) scale(0.9);
      }
      to { 
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 600px) {
      .modal-content {
        width: 95%;
        margin: 10px;
      }

      .table-header,
      .score-row {
        grid-template-columns: 60px 1fr 80px 100px;
        gap: 8px;
        padding: 12px;
        font-size: 14px;
      }

      .score {
        font-size: 16px;
      }
    }
  `]
})
export class HighScoresComponent implements OnInit {
  @Input() currentPlayerName: string = '';
  @Output() scoreSubmitted = new EventEmitter<void>();

  highScores$: Observable<HighScore[]>;
  isModalOpen = false;
  loading = false;
  
  // New score submission
  showSubmitForm = false;
  newScore: Partial<HighScore> | null = null;
  playerName = '';
  submitting = false;

  constructor(private highScoresService: HighScoresService) {
    this.highScores$ = this.highScoresService.highScores$;
  }

  ngOnInit() {
    this.playerName = this.currentPlayerName;
  }

  toggleModal() {
    this.isModalOpen = !this.isModalOpen;
    if (this.isModalOpen) {
      this.loading = true;
      this.highScoresService.loadHighScores();
      setTimeout(() => this.loading = false, 1000); // Simulate loading
    }
  }

  /**
   * Show form to submit a new high score
   */
  showSubmitScoreForm(scoreData: Omit<HighScore, '_id' | 'timestamp'>) {
    this.newScore = scoreData;
    this.showSubmitForm = true;
    this.isModalOpen = true;
    this.playerName = this.currentPlayerName || '';
  }

  /**
   * Submit the new high score
   */
  submitScore() {
    if (!this.playerName || !this.newScore) return;

    this.submitting = true;
    
    const scoreData = {
      ...this.newScore,
      playerName: this.playerName.trim()
    } as Omit<HighScore, '_id' | 'timestamp'>;

    this.highScoresService.submitScoreWithBackup(scoreData);
    
    setTimeout(() => {
      this.submitting = false;
      this.showSubmitForm = false;
      this.newScore = null;
      this.scoreSubmitted.emit();
    }, 1500);
  }

  /**
   * Cancel score submission
   */
  cancelSubmit() {
    this.showSubmitForm = false;
    this.newScore = null;
  }

  /**
   * Check if this score belongs to the current player
   */
  isPlayerScore(score: HighScore): boolean {
    return score.playerName.toLowerCase() === this.currentPlayerName.toLowerCase();
  }

  /**
   * Get medal emoji for top 3 positions
   */
  getMedal(rank: number): string {
    switch (rank) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return '';
    }
  }

  /**
   * Format timestamp for display
   */
  formatDate(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}