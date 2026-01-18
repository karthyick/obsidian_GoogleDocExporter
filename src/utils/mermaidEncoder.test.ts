import { MermaidEncoder } from './mermaidEncoder';

describe('MermaidEncoder', () => {
  describe('encode', () => {
    it('should encode simple Mermaid code into a valid URL', () => {
      const code = 'graph TD\n  A --> B';
      const result = MermaidEncoder.encode(code);

      expect(result).toContain('https://mermaid.live/edit#pako:');
      expect(result.length).toBeGreaterThan('https://mermaid.live/edit#pako:'.length);
    });

    it('should handle empty code gracefully', () => {
      const result = MermaidEncoder.encode('');

      expect(result).toContain('https://mermaid.live/edit');
    });

    it('should handle special characters correctly', () => {
      const code = 'graph TD\n  A["Special 日本語 chars"] --> B["More chars äöü"]';
      const result = MermaidEncoder.encode(code);

      expect(result).toContain('https://mermaid.live/edit#pako:');
    });

    it('should handle multiline complex diagrams', () => {
      const code = `sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hi Alice!`;
      const result = MermaidEncoder.encode(code);

      expect(result).toContain('https://mermaid.live/edit#pako:');
    });

    it('should apply default theme when not specified', () => {
      const code = 'graph TD\n  A --> B';
      const result = MermaidEncoder.encode(code);

      expect(result).toContain('https://mermaid.live/edit#pako:');
    });

    it('should apply custom theme when specified', () => {
      const code = 'graph TD\n  A --> B';
      const result = MermaidEncoder.encode(code, 'dark');

      expect(result).toContain('https://mermaid.live/edit#pako:');
    });
  });

  describe('getDiagramType', () => {
    it('should extract flowchart type', () => {
      const code = 'flowchart LR\n  A --> B';
      expect(MermaidEncoder.getDiagramType(code)).toBe('flowchart');
    });

    it('should extract graph type', () => {
      const code = 'graph TD\n  A --> B';
      expect(MermaidEncoder.getDiagramType(code)).toBe('graph');
    });

    it('should extract sequenceDiagram type', () => {
      const code = 'sequenceDiagram\n  A->>B: Hello';
      expect(MermaidEncoder.getDiagramType(code)).toBe('sequenceDiagram');
    });

    it('should extract classDiagram type', () => {
      const code = 'classDiagram\n  class Animal';
      expect(MermaidEncoder.getDiagramType(code)).toBe('classDiagram');
    });

    it('should extract stateDiagram type', () => {
      const code = 'stateDiagram-v2\n  [*] --> State1';
      expect(MermaidEncoder.getDiagramType(code)).toBe('stateDiagram-v2');
    });

    it('should extract erDiagram type', () => {
      const code = 'erDiagram\n  CUSTOMER ||--o{ ORDER : places';
      expect(MermaidEncoder.getDiagramType(code)).toBe('erDiagram');
    });

    it('should extract gantt type', () => {
      const code = 'gantt\n  title A Gantt Diagram';
      expect(MermaidEncoder.getDiagramType(code)).toBe('gantt');
    });

    it('should extract pie type', () => {
      const code = 'pie\n  title Key Elements';
      expect(MermaidEncoder.getDiagramType(code)).toBe('pie');
    });

    it('should extract journey type', () => {
      const code = 'journey\n  title My Journey';
      expect(MermaidEncoder.getDiagramType(code)).toBe('journey');
    });

    it('should extract gitGraph type', () => {
      const code = 'gitGraph\n  commit';
      expect(MermaidEncoder.getDiagramType(code)).toBe('gitGraph');
    });

    it('should extract mindmap type', () => {
      const code = 'mindmap\n  root((mindmap))';
      expect(MermaidEncoder.getDiagramType(code)).toBe('mindmap');
    });

    it('should extract timeline type', () => {
      const code = 'timeline\n  title Timeline';
      expect(MermaidEncoder.getDiagramType(code)).toBe('timeline');
    });

    it('should return "diagram" for empty code', () => {
      expect(MermaidEncoder.getDiagramType('')).toBe('diagram');
    });

    it('should return "diagram" for whitespace-only code', () => {
      expect(MermaidEncoder.getDiagramType('   \n  \t  ')).toBe('diagram');
    });

    it('should handle code with leading whitespace', () => {
      const code = '  \n  flowchart TD\n  A --> B';
      expect(MermaidEncoder.getDiagramType(code)).toBe('flowchart');
    });
  });

  describe('formatDiagramType', () => {
    it('should format flowchart correctly', () => {
      expect(MermaidEncoder.formatDiagramType('flowchart')).toBe('Flowchart');
    });

    it('should format flowchart-v2 correctly', () => {
      expect(MermaidEncoder.formatDiagramType('flowchart-v2')).toBe('Flowchart');
    });

    it('should format graph correctly', () => {
      expect(MermaidEncoder.formatDiagramType('graph')).toBe('Flowchart');
    });

    it('should format sequenceDiagram correctly', () => {
      expect(MermaidEncoder.formatDiagramType('sequenceDiagram')).toBe('Sequence Diagram');
    });

    it('should format classDiagram correctly', () => {
      expect(MermaidEncoder.formatDiagramType('classDiagram')).toBe('Class Diagram');
    });

    it('should format stateDiagram correctly', () => {
      expect(MermaidEncoder.formatDiagramType('stateDiagram')).toBe('State Diagram');
    });

    it('should format stateDiagram-v2 correctly', () => {
      expect(MermaidEncoder.formatDiagramType('stateDiagram-v2')).toBe('State Diagram');
    });

    it('should format erDiagram correctly', () => {
      expect(MermaidEncoder.formatDiagramType('erDiagram')).toBe('ER Diagram');
    });

    it('should format gantt correctly', () => {
      expect(MermaidEncoder.formatDiagramType('gantt')).toBe('Gantt Chart');
    });

    it('should format pie correctly', () => {
      expect(MermaidEncoder.formatDiagramType('pie')).toBe('Pie Chart');
    });

    it('should format journey correctly', () => {
      expect(MermaidEncoder.formatDiagramType('journey')).toBe('User Journey');
    });

    it('should format gitGraph correctly', () => {
      expect(MermaidEncoder.formatDiagramType('gitGraph')).toBe('Git Graph');
    });

    it('should format mindmap correctly', () => {
      expect(MermaidEncoder.formatDiagramType('mindmap')).toBe('Mindmap');
    });

    it('should format timeline correctly', () => {
      expect(MermaidEncoder.formatDiagramType('timeline')).toBe('Timeline');
    });

    it('should format quadrantChart correctly', () => {
      expect(MermaidEncoder.formatDiagramType('quadrantChart')).toBe('Quadrant Chart');
    });

    it('should format requirementDiagram correctly', () => {
      expect(MermaidEncoder.formatDiagramType('requirementDiagram')).toBe('Requirement Diagram');
    });

    it('should return "Diagram" for unknown types', () => {
      expect(MermaidEncoder.formatDiagramType('unknownType')).toBe('Diagram');
    });

    it('should return "Diagram" for empty string', () => {
      expect(MermaidEncoder.formatDiagramType('')).toBe('Diagram');
    });
  });

  describe('uint8ArrayToBase64', () => {
    it('should convert Uint8Array to base64', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const result = MermaidEncoder.uint8ArrayToBase64(bytes);

      expect(result).toBe('SGVsbG8=');
    });

    it('should handle empty Uint8Array', () => {
      const bytes = new Uint8Array([]);
      const result = MermaidEncoder.uint8ArrayToBase64(bytes);

      expect(result).toBe('');
    });

    it('should handle binary data correctly', () => {
      const bytes = new Uint8Array([0, 255, 128, 64, 32]);
      const result = MermaidEncoder.uint8ArrayToBase64(bytes);

      expect(result.length).toBeGreaterThan(0);
      // Verify it's valid base64
      expect(() => atob(result)).not.toThrow();
    });
  });
});
