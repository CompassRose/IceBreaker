# Service Organization Guide

## ✅ **Current Project Structure**

```
src/
├── app/
│   ├── services/                          # 🎯 ALL SERVICES GO HERE
│   │   ├── api-endpoints.service.ts       # Data export and API functionality
│   │   ├── api-endpoints.service.spec.ts  # Tests for API service
│   │   ├── configuration.service.ts       # App configuration (legacy)
│   │   ├── configuration.service.spec.ts  # Tests for configuration
│   │   ├── data-export.service.ts         # CSV/JSON/XML export functionality
│   │   ├── game-state.service.ts          # Game state management
│   │   ├── game-state.service.spec.ts     # Tests for game state
│   │   ├── p5-render.service.ts           # p5.js rendering service
│   │   ├── screen-utility.service.ts      # Screen/viewport utilities
│   │   ├── threejs-render.service.ts      # Three.js rendering service
│   │   └── index.ts                       # Service barrel for easy imports
│   ├── components/                        # Future: Move large components here
│   ├── models/                           # Future: TypeScript interfaces/types
│   ├── utils/                            # Future: Utility functions
│   ├── app-routing.module.ts
│   ├── app.component.ts                  # Main app component
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.component.spec.ts
│   ├── app.module.ts
│   └── app-refactored.component.ts       # Example refactored component
├── assets/
└── ...
```

## 🎯 **Benefits of This Organization**

### **1. Centralized Service Management**
- All services in one location (`src/app/services/`)
- Easy to find and maintain
- Clear separation from components

### **2. Service Barrel Pattern**
- Single import point: `import { GameStateService, ThreeJsRenderService } from './services';`
- Easier refactoring when services move
- Cleaner import statements

### **3. Co-located Tests**
- Service tests next to service files
- Easy to find related test files
- Consistent naming convention

### **4. Scalable Structure**
- Easy to add new services
- Clear patterns for team members
- Future-proof organization

## 📚 **Import Patterns**

### **Before (Scattered)**
```typescript
import { ConfigurationService } from './configuration.service';
import { ApiEndpointsService } from './api-endpoints.service';
import { SomeOtherService } from '../shared/some-other.service';
```

### **After (Organized)**
```typescript
import { 
  ConfigurationService, 
  ApiEndpointsService, 
  GameStateService 
} from './services';
```

## 🚀 **Next Steps for Further Organization**

### **1. Component Organization**
```
src/app/components/
├── game-board/
│   ├── game-board.component.ts
│   ├── game-board.component.html
│   ├── game-board.component.scss
│   └── game-board.component.spec.ts
├── tile/
│   ├── tile.component.ts
│   ├── tile.component.html
│   ├── tile.component.scss
│   └── tile.component.spec.ts
└── index.ts  # Component barrel
```

### **2. Model/Interface Organization**
```
src/app/models/
├── game.models.ts
├── render.models.ts
├── export.models.ts
└── index.ts  # Model barrel
```

### **3. Feature Module Organization**
```
src/app/features/
├── game/
│   ├── components/
│   ├── services/
│   ├── models/
│   └── game.module.ts
├── export/
│   ├── components/
│   ├── services/
│   └── export.module.ts
└── ...
```

## 🔧 **Maintenance Best Practices**

### **1. Service Naming Convention**
- Always end with `.service.ts`
- Use kebab-case for file names
- Use PascalCase for class names

### **2. Import Order**
```typescript
// 1. Angular imports
import { Injectable } from '@angular/core';

// 2. Third-party imports
import { Observable } from 'rxjs';

// 3. Local service imports
import { OtherService } from './other.service';

// 4. Model imports
import { GameState } from '../models';
```

### **3. Service Documentation**
- Use JSDoc comments for public methods
- Include @param and @returns tags
- Document service purpose in class comment

## ✨ **Current Status: COMPLETE**

✅ All services moved to `/services` directory
✅ Import paths updated in all components
✅ Service barrel created for easy imports
✅ Test files co-located with services
✅ Build working correctly

Your project now follows Angular best practices for service organization!