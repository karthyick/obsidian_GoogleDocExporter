import { ClipboardExporter } from './clipboardExporter';
import { ParsedContent, PluginSettings } from '../types';
import { DEFAULT_SETTINGS } from '../settings';

describe('ClipboardExporter', () => {
  let settings: PluginSettings;

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS };
  });

  describe('contentToHtml', () => {
    it('should generate minimal HTML structure for clipboard', () => {
      const content: ParsedContent = { blocks: [] };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<meta charset="utf-8">');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
      expect(html).toContain('</html>');
    });

    it('should convert heading blocks', () => {
      const content: ParsedContent = {
        blocks: [
          { type: 'heading', level: 1, content: [{ type: 'text', content: 'Title' }] },
          { type: 'heading', level: 2, content: [{ type: 'text', content: 'Subtitle' }] },
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<h1>Title</h1>');
      expect(html).toContain('<h2>Subtitle</h2>');
    });

    it('should convert paragraph blocks', () => {
      const content: ParsedContent = {
        blocks: [
          { type: 'paragraph', content: [{ type: 'text', content: 'Content' }] }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<p>Content</p>');
    });

    it('should convert code blocks with inline styling', () => {
      settings.codeBlockFont = 'Monaco';
      settings.codeBlockBackground = '#282c34';
      const content: ParsedContent = {
        blocks: [
          { type: 'code', language: 'javascript', content: 'const x = 1;' }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('font-family: Monaco');
      expect(html).toContain('background-color: #282c34');
      expect(html).toContain('<pre');
      expect(html).toContain('<code>');
    });

    it('should include language label in code blocks when enabled', () => {
      settings.includeLanguageLabel = true;
      const content: ParsedContent = {
        blocks: [
          { type: 'code', language: 'python', content: 'print()' }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<strong>python</strong>');
    });

    it('should not include language label when disabled', () => {
      settings.includeLanguageLabel = false;
      const content: ParsedContent = {
        blocks: [
          { type: 'code', language: 'python', content: 'print()' }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).not.toContain('<strong>python</strong>');
    });

    it('should convert mermaid blocks to links', () => {
      settings.mermaidLinkText = 'View Diagram';
      settings.includeMermaidType = true;
      const content: ParsedContent = {
        blocks: [
          {
            type: 'mermaid',
            diagramType: 'Flowchart',
            code: 'graph TD',
            url: 'https://mermaid.live/edit#test'
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('href="https://mermaid.live/edit#test"');
      expect(html).toContain('View Diagram (Flowchart)');
    });

    it('should convert unordered lists', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'list',
            ordered: false,
            items: [
              { content: [{ type: 'text', content: 'A' }] },
              { content: [{ type: 'text', content: 'B' }] }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>A</li>');
      expect(html).toContain('<li>B</li>');
      expect(html).toContain('</ul>');
    });

    it('should convert ordered lists', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              { content: [{ type: 'text', content: '1st' }] },
              { content: [{ type: 'text', content: '2nd' }] }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<ol>');
      expect(html).toContain('<li>1st</li>');
      expect(html).toContain('<li>2nd</li>');
      expect(html).toContain('</ol>');
    });

    it('should convert tables with inline styling', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'table',
            headers: [
              [{ type: 'text', content: 'H1' }],
              [{ type: 'text', content: 'H2' }]
            ],
            rows: [
              [
                [{ type: 'text', content: 'R1C1' }],
                [{ type: 'text', content: 'R1C2' }]
              ]
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<table border="1"');
      expect(html).toContain('border-collapse: collapse');
      expect(html).toContain('<th style="background-color:');
      expect(html).toContain('<td style="padding:');
    });

    it('should convert blockquotes with inline styling', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'blockquote',
            content: [
              { type: 'paragraph', content: [{ type: 'text', content: 'Quote' }] }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<blockquote style="border-left:');
      expect(html).toContain('Quote');
    });

    it('should convert horizontal rules', () => {
      const content: ParsedContent = {
        blocks: [{ type: 'hr' }]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<hr>');
    });

    it('should convert images in embed mode', () => {
      settings.imageHandling = 'embed';
      const content: ParsedContent = {
        blocks: [
          { type: 'image', alt: 'Alt', url: 'https://img.com/a.png' }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<img src="https://img.com/a.png" alt="Alt">');
    });

    it('should convert images in link mode', () => {
      settings.imageHandling = 'link';
      const content: ParsedContent = {
        blocks: [
          { type: 'image', alt: 'Alt', url: 'https://img.com/a.png' }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<a href="https://img.com/a.png">Alt</a>');
    });

    it('should skip images in skip mode', () => {
      settings.imageHandling = 'skip';
      const content: ParsedContent = {
        blocks: [
          { type: 'image', alt: 'Alt', url: 'https://img.com/a.png' }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).not.toContain('<img');
      expect(html).not.toContain('Alt');
    });
  });

  describe('inline content conversion', () => {
    it('should convert bold text', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              { type: 'bold', content: [{ type: 'text', content: 'bold' }] }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<strong>bold</strong>');
    });

    it('should convert italic text', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              { type: 'italic', content: [{ type: 'text', content: 'italic' }] }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<em>italic</em>');
    });

    it('should convert strikethrough text', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              { type: 'strikethrough', content: [{ type: 'text', content: 'struck' }] }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<del>struck</del>');
    });

    it('should convert inline code with font styling', () => {
      settings.codeBlockFont = 'Consolas';
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              { type: 'code', content: 'code' }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<code style="font-family: Consolas');
      expect(html).toContain('code</code>');
    });

    it('should convert links', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'link',
                text: [{ type: 'text', content: 'Google' }],
                url: 'https://google.com'
              }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<a href="https://google.com">Google</a>');
    });

    it('should handle nested formatting', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'bold',
                content: [
                  { type: 'italic', content: [{ type: 'text', content: 'bold italic' }] }
                ]
              }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<strong><em>bold italic</em></strong>');
    });
  });

  describe('HTML escaping', () => {
    it('should escape HTML special characters in text', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', content: '<script>evil()</script>' }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>evil');
    });

    it('should escape ampersands', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', content: 'A & B' }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('A &amp; B');
    });

    it('should escape quotes in URLs', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'link',
                text: [{ type: 'text', content: 'Link' }],
                url: 'https://example.com?q="test"'
              }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('&quot;test&quot;');
    });

    it('should escape single quotes', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', content: "It's a test" }
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('&#039;');
    });
  });

  describe('graceful degradation', () => {
    it('should handle unknown block types gracefully', () => {
      const content: ParsedContent = {
        blocks: [
          { type: 'unknownType' } as any
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('should handle unknown inline types gracefully', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              { type: 'unknownInline' } as any
            ]
          }
        ]
      };
      const html = ClipboardExporter.contentToHtml(content, settings);

      expect(html).toContain('<p></p>');
    });
  });
});
