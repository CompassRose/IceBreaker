import { Injectable } from '@angular/core';
import { DataExportService, CsvOptions } from './data-export.service';

@Injectable({
  providedIn: 'root',
})
export class ApiEndpointsService {
  constructor(private dataExport: DataExportService) {}
  
  public ngOnInit(): void {
    console.log('API Endpoints Service Initialized');
  }

  /**
   * Example function to convert array of objects to CSV string
   * @deprecated Use DataExportService.convertToCsv() instead
   */
  public convertToCsv(data: any[]): string {
    return this.dataExport.convertToCsv(data);
  }

  /**
   * Enhanced CSV conversion with options
   */
  public convertToCsvWithOptions(data: any[], options: CsvOptions): string {
    return this.dataExport.convertToCsv(data, options);
  }

  /**
   * Export data in multiple formats
   */
  public exportGameData(data: any[], format: 'csv' | 'json' | 'xml', filename?: string): void {
    this.dataExport.exportData(data, { format, filename });
  }
}
