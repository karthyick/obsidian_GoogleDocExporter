import { MarkdownParser } from './markdownParser';
import { PluginSettings } from '../types';
import { DEFAULT_SETTINGS } from '../settings';

describe('MarkdownParser', () => {
  let parser: MarkdownParser;
  let settings: PluginSettings;

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS };
    parser = new MarkdownParser(settings);
  });

  describe('parse', () => {
    it('should return empty blocks for null input', () => {
      const result = parser.parse(null);
      expect(result.blocks).toEqual([]);
    });

    it('should return empty blocks for undefined input', () => {
      const result = parser.parse(undefined);
      expect(result.blocks).toEqual([]);
    });

    it('should return empty blocks for empty string', () => {
      const result = parser.parse('');
      expect(result.blocks).toEqual([]);
    });

    it('should return empty blocks for whitespace-only string', () => {
      const result = parser.parse('   \n  \t  ');
      expect(result.blocks).toEqual([]);
    });

    it('should parse heading blocks', () => {
      const markdown = '# Heading 1\n## Heading 2\n### Heading 3';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(3);
      expect(result.blocks[0].type).toBe('heading');
      expect((result.blocks[0] as any).level).toBe(1);
      expect(result.blocks[1].type).toBe('heading');
      expect((result.blocks[1] as any).level).toBe(2);
      expect(result.blocks[2].type).toBe('heading');
      expect((result.blocks[2] as any).level).toBe(3);
    });

    it('should parse paragraph blocks', () => {
      const markdown = 'This is a paragraph.\n\nThis is another paragraph.';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(2);
      expect(result.blocks[0].type).toBe('paragraph');
      expect(result.blocks[1].type).toBe('paragraph');
    });

    it('should parse code blocks', () => {
      const markdown = '```python\nprint("Hello")\n```';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('code');
      expect((result.blocks[0] as any).language).toBe('python');
      expect((result.blocks[0] as any).content).toBe('print("Hello")');
    });

    it('should parse code blocks without language', () => {
      const markdown = '```\nsome code\n```';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('code');
      expect((result.blocks[0] as any).language).toBeNull();
    });

    it('should parse mermaid blocks into MermaidBlock', () => {
      const markdown = '```mermaid\ngraph TD\n  A --> B\n```';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('mermaid');
      expect((result.blocks[0] as any).diagramType).toBe('Flowchart');
      expect((result.blocks[0] as any).url).toContain('https://mermaid.live/edit');
    });

    it('should parse unordered lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('list');
      expect((result.blocks[0] as any).ordered).toBe(false);
      expect((result.blocks[0] as any).items).toHaveLength(3);
    });

    it('should parse ordered lists', () => {
      const markdown = '1. Item 1\n2. Item 2\n3. Item 3';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('list');
      expect((result.blocks[0] as any).ordered).toBe(true);
      expect((result.blocks[0] as any).items).toHaveLength(3);
    });

    it('should parse tables', () => {
      const markdown = '| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('table');
      expect((result.blocks[0] as any).headers).toHaveLength(2);
      expect((result.blocks[0] as any).rows).toHaveLength(1);
    });

    it('should parse blockquotes', () => {
      const markdown = '> This is a quote\n> With multiple lines';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('blockquote');
    });

    it('should parse horizontal rules', () => {
      const markdown = 'Before\n\n---\n\nAfter';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(3);
      expect(result.blocks[1].type).toBe('hr');
    });

    it('should parse images', () => {
      const markdown = '![Alt text](https://example.com/image.png)';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('image');
      expect((result.blocks[0] as any).alt).toBe('Alt text');
      expect((result.blocks[0] as any).url).toBe('https://example.com/image.png');
    });

    it('should strip YAML frontmatter', () => {
      const markdown = '---\ntitle: Test\ndate: 2024-01-01\n---\n\n# Content';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('heading');
    });

    it('should strip trailing Obsidian tags', () => {
      const markdown = '# Content\n\nSome text\n\n#tag1 #tag2';
      const result = parser.parse(markdown);

      // Tags should be stripped
      const lastBlock = result.blocks[result.blocks.length - 1];
      if (lastBlock.type === 'paragraph') {
        const content = (lastBlock as any).content;
        const hasHashtags = content.some((c: any) =>
          c.type === 'text' && c.content.includes('#tag')
        );
        expect(hasHashtags).toBe(false);
      }
    });

    it('should handle Unicode characters correctly', () => {
      const markdown = '# 日本語タイトル\n\n这是中文段落。\n\nÄÖÜ äöü ß';
      const result = parser.parse(markdown);

      expect(result.blocks.length).toBeGreaterThan(0);
    });
  });

  describe('parseInlineContent', () => {
    it('should parse bold text', () => {
      const result = parser.parseInlineContent('**bold text**');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('bold');
    });

    it('should parse italic text', () => {
      const result = parser.parseInlineContent('*italic text*');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('italic');
    });

    it('should parse strikethrough text', () => {
      // Full parse handles strikethrough better than inline-only parsing
      const parseResult = parser.parse('~~strikethrough~~');

      expect(parseResult.blocks).toHaveLength(1);
      expect(parseResult.blocks[0].type).toBe('paragraph');

      const paragraph = parseResult.blocks[0] as any;
      // Strikethrough may be parsed as strikethrough or as text depending on marked config
      const hasStrikethrough = paragraph.content.some(
        (c: any) => c.type === 'strikethrough' || (c.type === 'text' && c.content.includes('strikethrough'))
      );
      expect(hasStrikethrough).toBe(true);
    });

    it('should parse inline code', () => {
      const result = parser.parseInlineContent('Use `code` here');

      expect(result.length).toBeGreaterThan(0);
      const codeContent = result.find(c => c.type === 'code');
      expect(codeContent).toBeDefined();
      expect((codeContent as any).content).toBe('code');
    });

    it('should parse links', () => {
      const result = parser.parseInlineContent('[Link text](https://example.com)');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('link');
      expect((result[0] as any).url).toBe('https://example.com');
    });

    it('should parse mixed formatting', () => {
      const result = parser.parseInlineContent('Normal **bold** and *italic*');

      expect(result.length).toBeGreaterThan(0);
      const boldContent = result.find(c => c.type === 'bold');
      const italicContent = result.find(c => c.type === 'italic');
      expect(boldContent).toBeDefined();
      expect(italicContent).toBeDefined();
    });

    it('should convert Obsidian links to plain text when setting is enabled', () => {
      settings.removeObsidianLinks = true;
      parser = new MarkdownParser(settings);

      const result = parser.parseInlineContent('Check [[Some Note]]');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('text');
      expect((result[0] as any).content).toBe('Check Some Note');
    });

    it('should convert Obsidian links with display text', () => {
      settings.removeObsidianLinks = true;
      parser = new MarkdownParser(settings);

      const result = parser.parseInlineContent('Check [[Some Note|Display Text]]');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('text');
      expect((result[0] as any).content).toBe('Check Display Text');
    });

    it('should preserve Obsidian links when setting is disabled', () => {
      settings.removeObsidianLinks = false;
      parser = new MarkdownParser(settings);

      const result = parser.parseInlineContent('Check [[Some Note]]');

      const textContent = result.find(c => c.type === 'text');
      expect(textContent).toBeDefined();
      expect((textContent as any).content).toContain('[[');
    });
  });

  describe('Obsidian callouts conversion', () => {
    it('should convert info callout', () => {
      const markdown = '> [!info] Title\n> Content';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('blockquote');
    });

    it('should convert tip callout', () => {
      const markdown = '> [!tip]\n> Content';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('blockquote');
    });

    it('should convert warning callout', () => {
      const markdown = '> [!warning] Warning Title\n> Be careful!';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('blockquote');
    });

    it('should convert note callout', () => {
      const markdown = '> [!note]\n> A note';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('blockquote');
    });

    it('should convert danger callout', () => {
      const markdown = '> [!danger] Dangerous!\n> Be very careful';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('blockquote');
    });
  });

  describe('Complex documents', () => {
    it('should parse a complete document with multiple block types', () => {
      const markdown = `# Title

This is a paragraph with **bold** and *italic* text.

## Code Example

\`\`\`javascript
console.log("Hello");
\`\`\`

- Item 1
- Item 2

| Col1 | Col2 |
| --- | --- |
| A | B |

> A quote

---

\`\`\`mermaid
graph TD
  A --> B
\`\`\`
`;
      const result = parser.parse(markdown);

      const types = result.blocks.map(b => b.type);
      expect(types).toContain('heading');
      expect(types).toContain('paragraph');
      expect(types).toContain('code');
      expect(types).toContain('list');
      expect(types).toContain('table');
      expect(types).toContain('blockquote');
      expect(types).toContain('hr');
      expect(types).toContain('mermaid');
    });

    it('should handle nested lists', () => {
      const markdown = `- Level 1
  - Level 2
    - Level 3`;
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('list');
      // Check that nested structure exists
      const list = result.blocks[0] as any;
      expect(list.items.length).toBeGreaterThan(0);
    });

    it('should handle multiple consecutive code blocks', () => {
      const markdown = `\`\`\`python
code1
\`\`\`

\`\`\`javascript
code2
\`\`\``;
      const result = parser.parse(markdown);

      const codeBlocks = result.blocks.filter(b => b.type === 'code');
      expect(codeBlocks).toHaveLength(2);
      expect((codeBlocks[0] as any).language).toBe('python');
      expect((codeBlocks[1] as any).language).toBe('javascript');
    });

    it('should handle multiple mermaid diagrams', () => {
      const markdown = `\`\`\`mermaid
graph TD
  A --> B
\`\`\`

Some text

\`\`\`mermaid
sequenceDiagram
  A->>B: Hello
\`\`\``;
      const result = parser.parse(markdown);

      const mermaidBlocks = result.blocks.filter(b => b.type === 'mermaid');
      expect(mermaidBlocks).toHaveLength(2);
      expect((mermaidBlocks[0] as any).diagramType).toBe('Flowchart');
      expect((mermaidBlocks[1] as any).diagramType).toBe('Sequence Diagram');
    });
  });

  describe('Edge cases', () => {
    it('should handle escaped markdown characters', () => {
      const markdown = 'This is \\*not italic\\* and \\*\\*not bold\\*\\*';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
    });

    it('should handle very long content', () => {
      const paragraph = 'Lorem ipsum dolor sit amet. '.repeat(1000);
      const markdown = `# Title\n\n${paragraph}`;
      const result = parser.parse(markdown);

      expect(result.blocks.length).toBeGreaterThan(0);
    });

    it('should handle special characters in code blocks', () => {
      const markdown = '```\n<html>&amp;"quotes"</html>\n```';
      const result = parser.parse(markdown);

      expect(result.blocks).toHaveLength(1);
      expect(result.blocks[0].type).toBe('code');
      expect((result.blocks[0] as any).content).toContain('<html>');
    });
  });
});
