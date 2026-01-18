import { HtmlExporter } from './htmlExporter';
import { ParsedContent, PluginSettings } from '../types';
import { DEFAULT_SETTINGS } from '../settings';

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

describe('HtmlExporter', () => {
  let settings: PluginSettings;

  beforeEach(() => {
    settings = { ...DEFAULT_SETTINGS };
    jest.clearAllMocks();
  });

  describe('contentToHtml', () => {
    it('should generate valid HTML document structure', () => {
      const content: ParsedContent = { blocks: [] };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('<head>');
      expect(html).toContain('<meta charset="utf-8">');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
      expect(html).toContain('</html>');
    });

    it('should include embedded styles', () => {
      const content: ParsedContent = { blocks: [] };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
      expect(html).toContain('font-family');
    });

    it('should convert heading blocks to HTML headings', () => {
      const content: ParsedContent = {
        blocks: [
          { type: 'heading', level: 1, content: [{ type: 'text', content: 'Title' }] },
          { type: 'heading', level: 2, content: [{ type: 'text', content: 'Subtitle' }] },
          { type: 'heading', level: 3, content: [{ type: 'text', content: 'Section' }] },
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<h1>Title</h1>');
      expect(html).toContain('<h2>Subtitle</h2>');
      expect(html).toContain('<h3>Section</h3>');
    });

    it('should convert paragraph blocks to HTML paragraphs', () => {
      const content: ParsedContent = {
        blocks: [
          { type: 'paragraph', content: [{ type: 'text', content: 'Some text' }] }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<p>Some text</p>');
    });

    it('should convert code blocks with language label', () => {
      settings.includeLanguageLabel = true;
      const content: ParsedContent = {
        blocks: [
          { type: 'code', language: 'python', content: 'print("hello")' }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('class="code-language-label"');
      expect(html).toContain('python');
      expect(html).toContain('<pre><code>print(&quot;hello&quot;)</code></pre>');
    });

    it('should convert code blocks without language label when disabled', () => {
      settings.includeLanguageLabel = false;
      const content: ParsedContent = {
        blocks: [
          { type: 'code', language: 'python', content: 'print("hello")' }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      // CSS class definition is in styles, but no language label div should be in content
      expect(html).not.toContain('<div class="code-language-label">');
      expect(html).toContain('<pre><code>');
    });

    it('should convert mermaid blocks to links', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'mermaid',
            diagramType: 'Flowchart',
            code: 'graph TD\n  A --> B',
            url: 'https://mermaid.live/edit#pako:abc123'
          }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('class="mermaid-link"');
      expect(html).toContain('href="https://mermaid.live/edit#pako:abc123"');
      expect(html).toContain(settings.mermaidLinkText);
    });

    it('should include diagram type in mermaid links when enabled', () => {
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
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('(Flowchart)');
    });

    it('should convert unordered lists', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'list',
            ordered: false,
            items: [
              { content: [{ type: 'text', content: 'Item 1' }] },
              { content: [{ type: 'text', content: 'Item 2' }] }
            ]
          }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<ul>');
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
      expect(html).toContain('</ul>');
    });

    it('should convert ordered lists', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'list',
            ordered: true,
            items: [
              { content: [{ type: 'text', content: 'First' }] },
              { content: [{ type: 'text', content: 'Second' }] }
            ]
          }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<ol>');
      expect(html).toContain('<li>First</li>');
      expect(html).toContain('<li>Second</li>');
      expect(html).toContain('</ol>');
    });

    it('should convert nested lists', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'list',
            ordered: false,
            items: [
              {
                content: [{ type: 'text', content: 'Parent' }],
                children: {
                  type: 'list',
                  ordered: false,
                  items: [
                    { content: [{ type: 'text', content: 'Child' }] }
                  ]
                }
              }
            ]
          }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('Parent');
      expect(html).toContain('Child');
      expect((html.match(/<ul>/g) || []).length).toBe(2);
    });

    it('should convert tables', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'table',
            headers: [
              [{ type: 'text', content: 'Col1' }],
              [{ type: 'text', content: 'Col2' }]
            ],
            rows: [
              [
                [{ type: 'text', content: 'A' }],
                [{ type: 'text', content: 'B' }]
              ]
            ]
          }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<table>');
      expect(html).toContain('<thead>');
      expect(html).toContain('<th>Col1</th>');
      expect(html).toContain('<th>Col2</th>');
      expect(html).toContain('<tbody>');
      expect(html).toContain('<td>A</td>');
      expect(html).toContain('<td>B</td>');
      expect(html).toContain('</table>');
    });

    it('should convert blockquotes', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'blockquote',
            content: [
              { type: 'paragraph', content: [{ type: 'text', content: 'Quote text' }] }
            ]
          }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<blockquote>');
      expect(html).toContain('Quote text');
      expect(html).toContain('</blockquote>');
    });

    it('should convert horizontal rules', () => {
      const content: ParsedContent = {
        blocks: [{ type: 'hr' }]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<hr>');
    });

    it('should convert images in embed mode', () => {
      settings.imageHandling = 'embed';
      const content: ParsedContent = {
        blocks: [
          { type: 'image', alt: 'My Image', url: 'https://example.com/img.png' }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<img src="https://example.com/img.png" alt="My Image">');
    });

    it('should convert images in link mode', () => {
      settings.imageHandling = 'link';
      const content: ParsedContent = {
        blocks: [
          { type: 'image', alt: 'My Image', url: 'https://example.com/img.png' }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<a href="https://example.com/img.png">My Image</a>');
    });

    it('should skip images in skip mode', () => {
      settings.imageHandling = 'skip';
      const content: ParsedContent = {
        blocks: [
          { type: 'image', alt: 'My Image', url: 'https://example.com/img.png' }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).not.toContain('<img');
      expect(html).not.toContain('My Image');
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
      const html = HtmlExporter.contentToHtml(content, settings);

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
      const html = HtmlExporter.contentToHtml(content, settings);

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
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<del>struck</del>');
    });

    it('should convert inline code', () => {
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
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<code>code</code>');
    });

    it('should convert links', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'link',
                text: [{ type: 'text', content: 'Click here' }],
                url: 'https://example.com'
              }
            ]
          }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('<a href="https://example.com">Click here</a>');
    });

    it('should escape HTML special characters', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', content: '<script>alert("xss")</script>' }
            ]
          }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });

    it('should escape quotes in attributes', () => {
      const content: ParsedContent = {
        blocks: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'link',
                text: [{ type: 'text', content: 'Link' }],
                url: 'https://example.com?a="test"'
              }
            ]
          }
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('&quot;test&quot;');
    });
  });

  describe('code block styling', () => {
    it('should use codeBlockFont from settings in styles', () => {
      settings.codeBlockFont = 'Monaco';
      const content: ParsedContent = { blocks: [] };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('Monaco');
    });

    it('should use codeBlockBackground from settings in styles', () => {
      settings.codeBlockBackground = '#282c34';
      const content: ParsedContent = { blocks: [] };
      const html = HtmlExporter.contentToHtml(content, settings);

      expect(html).toContain('#282c34');
    });
  });

  describe('graceful degradation', () => {
    it('should handle unknown block types gracefully', () => {
      const content: ParsedContent = {
        blocks: [
          { type: 'unknown' } as any
        ]
      };
      const html = HtmlExporter.contentToHtml(content, settings);

      // Should not throw and should produce valid HTML
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });
  });
});
