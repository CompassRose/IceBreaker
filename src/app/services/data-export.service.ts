import { Injectable } from '@angular/core';

export interface ExportOptions {
  format: 'csv' | 'json' | 'xml';
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
}

export interface CsvOptions {
  delimiter?: string;
  quote?: string;
  escapeQuote?: string;
  includeHeaders?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataExportService {

  constructor() {}

  /**
   * Converts array of objects to CSV string with advanced options
   */
  public convertToCsv(data: any[], options: CsvOptions = {}): string {
    if (!data || data.length === 0) {
      return '';
    }

    const {
      delimiter = ',',
      quote = '"',
      escapeQuote = '""',
      includeHeaders = true
    } = options;

    console.log('convertToCsv called with data:', data);
    
    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Add headers if requested
    if (includeHeaders) {
      csvRows.push(headers.join(delimiter));
    }

    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return this.formatCsvValue(value, delimiter, quote, escapeQuote);
      });
      csvRows.push(values.join(delimiter));
    }

    return csvRows.join('\n');
  }

  /**
   * Formats a single CSV value with proper escaping
   */
  private formatCsvValue(
    value: any, 
    delimiter: string, 
    quote: string, 
    escapeQuote: string
  ): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // Check if value needs quoting
    const needsQuoting = stringValue.includes(delimiter) || 
                        stringValue.includes(quote) || 
                        stringValue.includes('\n') || 
                        stringValue.includes('\r');

    if (needsQuoting) {
      // Escape existing quotes and wrap in quotes
      const escapedValue = stringValue.replace(new RegExp(quote, 'g'), escapeQuote);
      return `${quote}${escapedValue}${quote}`;
    }

    return stringValue;
  }

  /**
   * Converts array of objects to JSON string
   */
  public convertToJson(data: any[], pretty: boolean = true): string {
    if (!data || data.length === 0) {
      return '[]';
    }

    return JSON.stringify(data, null, pretty ? 2 : 0);
  }

  /**
   * Converts array of objects to XML string
   */
  public convertToXml(data: any[], rootElement: string = 'data', itemElement: string = 'item'): string {
    if (!data || data.length === 0) {
      return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}></${rootElement}>`;
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;

    data.forEach(item => {
      xml += `  <${itemElement}>\n`;
      
      Object.entries(item).forEach(([key, value]) => {
        const sanitizedKey = this.sanitizeXmlKey(key);
        const sanitizedValue = this.sanitizeXmlValue(value);
        xml += `    <${sanitizedKey}>${sanitizedValue}</${sanitizedKey}>\n`;
      });
      
      xml += `  </${itemElement}>\n`;
    });

    xml += `</${rootElement}>`;
    return xml;
  }

  /**
   * Sanitizes XML element names
   */
  private sanitizeXmlKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Sanitizes XML values
   */
  private sanitizeXmlValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Exports data with the specified format and triggers download
   */
  public exportData(data: any[], options: ExportOptions): void {
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (options.format) {
      case 'csv':
        content = this.convertToCsv(data, options as CsvOptions);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      
      case 'json':
        content = this.convertToJson(data);
        mimeType = 'application/json';
        extension = 'json';
        break;
      
      case 'xml':
        content = this.convertToXml(data);
        mimeType = 'application/xml';
        extension = 'xml';
        break;
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    const filename = options.filename || `export_${new Date().toISOString().slice(0, 10)}.${extension}`;
    this.downloadFile(content, filename, mimeType);
  }

  /**
   * Triggers file download in the browser
   */
  private downloadFile(content: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') {
      console.warn('File download not supported in this environment');
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Validates data before export
   */
  public validateExportData(data: any[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
    }

    if (data.length === 0) {
      errors.push('Data array is empty');
    }

    if (data.length > 0 && typeof data[0] !== 'object') {
      errors.push('Data items must be objects');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}