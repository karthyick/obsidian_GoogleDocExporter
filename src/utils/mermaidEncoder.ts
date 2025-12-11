import * as pako from 'pako';

/**
 * MermaidEncoder handles encoding Mermaid diagram code into Mermaid Live URLs.
 * It compresses the diagram code using pako and generates shareable links.
 */
export class MermaidEncoder {
  /**
   * Encodes Mermaid diagram code into a Mermaid Live URL.
   * Creates JSON payload, UTF-8 encodes, compresses with pako, converts to base64,
   * and generates the final Mermaid Live URL.
   * 
   * Requirements: 7.2, 7.3
   * 
   * @param code - The Mermaid diagram code to encode
   * @param theme - Optional theme parameter (default: 'default')
   * @returns The complete Mermaid Live URL with encoded diagram
   */
  static encode(code: string, theme: string = 'default'): string {
    try {
      // Requirement 7.2: Handle malformed Mermaid syntax (encode as-is)
      // Requirement 7.3: Handle special characters and Unicode (preserve correctly)
      
      // Create JSON payload with code and theme
      const payload = {
        code: code || '',  // Handle empty code
        mermaid: { theme: theme }
      };

      // Convert payload to JSON string
      const jsonString = JSON.stringify(payload);

      // Convert string to UTF-8 bytes (handles Unicode correctly)
      const utf8Bytes = new TextEncoder().encode(jsonString);

      // Compress using pako deflate
      const compressed = pako.deflate(utf8Bytes);

      // Convert compressed bytes to base64
      const base64 = this.uint8ArrayToBase64(compressed);

      // Generate Mermaid Live URL
      return `https://mermaid.live/edit#pako:${base64}`;
      
    } catch (error) {
      // If encoding fails, log error and return a fallback URL
      console.error('Mermaid encoding error:', error);
      console.error('Code:', code);
      
      // Return a basic Mermaid Live URL without encoding
      return 'https://mermaid.live/edit';
    }
  }

  /**
   * Extracts the diagram type from the first line of Mermaid code.
   * 
   * Requirements: 7.2, 7.3
   * 
   * @param code - The Mermaid diagram code
   * @returns The extracted diagram type identifier (e.g., 'flowchart', 'sequenceDiagram')
   */
  static getDiagramType(code: string): string {
    try {
      // Requirement 7.2: Handle malformed Mermaid syntax
      if (!code || code.trim().length === 0) {
        return 'diagram';
      }

      // Get the first line of the code
      const firstLine = code.trim().split('\n')[0].trim();

      // Extract the diagram type (first word, including hyphens)
      const match = firstLine.match(/^([\w-]+)/);
      
      if (match) {
        return match[1];
      }

      return 'diagram';
      
    } catch (error) {
      // If extraction fails, return default
      console.error('Error extracting diagram type:', error);
      return 'diagram';
    }
  }

  /**
   * Formats the diagram type identifier into a human-readable name.
   * Maps technical identifiers to properly formatted display names.
   * 
   * @param diagramType - The raw diagram type identifier
   * @returns The formatted diagram type name
   */
  static formatDiagramType(diagramType: string): string {
    const typeMap: Record<string, string> = {
      'flowchart': 'Flowchart',
      'flowchart-v2': 'Flowchart',
      'graph': 'Flowchart',
      'sequenceDiagram': 'Sequence Diagram',
      'classDiagram': 'Class Diagram',
      'stateDiagram': 'State Diagram',
      'stateDiagram-v2': 'State Diagram',
      'erDiagram': 'ER Diagram',
      'journey': 'User Journey',
      'gantt': 'Gantt Chart',
      'pie': 'Pie Chart',
      'quadrantChart': 'Quadrant Chart',
      'requirementDiagram': 'Requirement Diagram',
      'gitGraph': 'Git Graph',
      'mindmap': 'Mindmap',
      'timeline': 'Timeline',
      'zenuml': 'ZenUML',
      'sankey': 'Sankey Diagram',
      'block': 'Block Diagram',
      'packet': 'Packet Diagram'
    };

    return typeMap[diagramType] || 'Diagram';
  }

  /**
   * Converts a Uint8Array to a base64 string.
   * 
   * Requirements: 7.2, 7.3
   * 
   * @param bytes - The byte array to convert
   * @returns The base64-encoded string
   */
  static uint8ArrayToBase64(bytes: Uint8Array): string {
    try {
      // Requirement 7.3: Handle special characters correctly
      if (!bytes || bytes.length === 0) {
        return '';
      }

      // Convert Uint8Array to binary string
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }

      // Convert binary string to base64
      return btoa(binaryString);
      
    } catch (error) {
      // If conversion fails, log error and return empty string
      console.error('Base64 encoding error:', error);
      return '';
    }
  }
}
