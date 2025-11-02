# IceBreaker

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.16.

## 🎣 About IceBreaker

IceBreaker is an interactive ice fishing game built with Angular, featuring:
- **3D Environment**: Three.js powered ice fishing simulation
- **Dynamic Animations**: p5.js background effects
- **Smart High Scores**: PC username detection and leaderboard
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Cloud Integration**: AWS-hosted with real-time high scores API

## 🚀 Quick Start

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## 🎮 Game Features

### **PC Username Detection**
- Automatically detects your PC username for high scores
- Editable player name with save/reset functionality
- Persistent preferences across game sessions
- Friendly fallback names when detection fails

### **High Scores System**
- Cloud-based leaderboard with top 10 scores
- Real-time score submission and retrieval
- Player name management and customization
- Offline fallback using local storage

### **Ice Fishing Gameplay**
- Interactive 3D ice fishing environment
- Target number guessing mechanics
- Visual feedback and scoring system
- Progressive difficulty and time challenges

## 🛠️ Development Commands

### Angular Commands (from IceBreaker directory):
* `npm start` or `ng serve` - development server at http://localhost:4200
* `npm run build` - compile Angular application to dist/
* `npm run watch` - watch for changes and compile
* `npm test` - execute the unit tests via Karma

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## 🌐 Live Application

**Play the game**: https://d3rolhqkkeo9dk.cloudfront.net

## 🔗 Related Repositories

- **Infrastructure**: [IceBreaker-CDK](https://github.com/CompassRose/IceBreaker-CDK) - AWS CDK deployment code

## 🏆 High Scores API

The game integrates with a cloud API for high scores:
- **API Base URL**: https://d2alkxpkuk.execute-api.us-west-2.amazonaws.com/prod/
- **Endpoints**:
  - `GET /highscores` - Retrieve top 10 high scores
  - `POST /highscores` - Submit new high score

## 📊 Technical Stack

- **Frontend**: Angular 16.2.0 with TypeScript
- **3D Graphics**: Three.js for ice fishing environment
- **Animations**: p5.js for dynamic background effects
- **Styling**: SCSS with responsive design
- **Backend**: AWS Lambda + API Gateway
- **Database**: MongoDB Atlas (via AWS integration)
- **Hosting**: AWS S3 + CloudFront CDN
- **Build**: Angular CLI with production optimizations

## 🎯 Game Mechanics

### Scoring System
- Base score calculated from target number accuracy
- Bonus points for fewer attempts
- Time-based multipliers for quick completion
- Difficulty bonuses for higher target numbers

### Player Experience
- Automatic username detection for personalization
- Customizable player names with edit functionality
- Visual feedback for successful catches
- Progressive challenge levels

## 🚀 Deployment

This is the frontend application. For deployment:

1. **Build the Angular app**: `npm run build`
2. **Deploy infrastructure**: See [IceBreaker-CDK](https://github.com/CompassRose/IceBreaker-CDK) repository

The CDK deployment automatically uploads the built Angular application to AWS S3 and configures CloudFront for global distribution.

## 🆘 Troubleshooting

### Common Issues
- **Build errors**: Ensure Node.js 18+ and npm dependencies are installed
- **Development server issues**: Check that port 4200 is available
- **High scores not loading**: Verify API endpoints are accessible

### Performance
- Game optimized for 60fps on modern browsers
- Responsive design adapts to screen sizes
- Progressive loading for optimal user experience

## 🔧 Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
