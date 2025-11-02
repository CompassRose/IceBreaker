import { Injectable } from '@angular/core';
import { ScreenUtilityService, ScreenDimensions } from './screen-utility.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {

  constructor(private screenUtility: ScreenUtilityService) { }

  /**
   * Gets the current screen width in pixels
   * @returns The screen width or 0 if not available
   * @deprecated Use ScreenUtilityService.getScreenDimensions() instead
   */
  getScreenWidth(): number {
    return this.screenUtility.getScreenDimensions().width;
  }

  /**
   * Gets the current screen height in pixels
   * @returns The screen height or 0 if not available
   * @deprecated Use ScreenUtilityService.getScreenDimensions() instead
   */
  getScreenHeight(): number {
    return this.screenUtility.getScreenDimensions().height;
  }

  /**
   * Gets complete screen information
   * @returns ScreenDimensions object with width, height, aspect ratio, and orientation
   */
  getScreenInfo(): ScreenDimensions {
    return this.screenUtility.getScreenDimensions();
  }
}
