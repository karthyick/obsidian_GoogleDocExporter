import { saveAs } from 'file-saver';
import {
	ParsedContent,
	ContentBlock,
	InlineContent,
	HeadingBlock,
	ParagraphBlock,
	CodeBlock,
	MermaidBlock,
	ListBlock,
	TableBlock,
	BlockquoteBlock,
	ImageBlock,
	PluginSettings
} from '../types';
import { MarkdownParser } from '../utils/markdownParser';

/**
 * HtmlExporter generates HTML files from parsed markdown content.
 * Converts ContentBlocks to HTML with proper styling and saves as .html file.
 */
export class HtmlExporter {
	/**
	 * Main export function that parses markdown, generates HTML, and saves file.
	 * 
	 * Requirements: 7.1, 7.2, 7.3, 8.1, 8.2
	 * 
	 * @param markdown - The markdown content to export
	 * @param filename - The output filename (without extension)
	 * @param settings - Plugin settings for formatting preferences
	 */
	static async export(
		markdown: string,
		filename: string,
		settings: PluginSettings
	): Promise<void> {
		try {
			// Requirement 7.1: Handle empty note gracefully
			const content = markdown || '';
			
			// Parse markdown into structured content
			const parser = new MarkdownParser(settings);
			const parsedContent = parser.parse(content);

			// Convert to HTML with proper styling
			const html = this.contentToHtml(parsedContent, settings);

			// Create blob and save file
			const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
			const outputFilename = filename.endsWith('.html') ? filename : `${filename}.html`;
			saveAs(blob, outputFilename);
			
		} catch (error) {
			// Re-throw with more context
			if (error instanceof Error) {
				throw new Error(`Failed to export HTML: ${error.message}`);
			} else {
				throw new Error('Failed to export HTML: Unknown error');
			}
		}
	}

	/**
	 * Converts ParsedContent to HTML string with proper styling.
	 * Includes DOCTYPE, meta tags, and embedded CSS for proper rendering.
	 * 
	 * @param content - The parsed content structure
	 * @param settings - Plugin settings for formatting
	 * @returns Complete HTML document string
	 */
	static contentToHtml(
		content: ParsedContent,
		settings: PluginSettings
	): string {
		// Build HTML with proper document structure and styling
		let html = '<!DOCTYPE html>\n';
		html += '<html lang="en">\n';
		html += '<head>\n';
		html += '  <meta charset="utf-8">\n';
		html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
		html += '  <title>Exported Document</title>\n';
		html += '  <style>\n';
		html += this.getEmbeddedStyles(settings);
		html += '  </style>\n';
		html += '</head>\n';
		html += '<body>\n';

		// Convert each block to HTML
		for (const block of content.blocks) {
			html += this.blockToHtml(block, settings);
		}

		html += '</body>\n';
		html += '</html>';
		return html;
	}

	/**
	 * Generates embedded CSS styles for the HTML document.
	 * Provides clean, readable styling for all content types.
	 * 
	 * @param settings - Plugin settings for code block styling
	 * @returns CSS string
	 */
	private static getEmbeddedStyles(settings: PluginSettings): string {
		return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1em; }
    h5 { font-size: 0.875em; }
    h6 { font-size: 0.85em; color: #6a737d; }
    p {
      margin-top: 0;
      margin-bottom: 16px;
    }
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    code {
      font-family: ${settings.codeBlockFont}, 'Courier New', monospace;
      background-color: rgba(27, 31, 35, 0.05);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 85%;
    }
    pre {
      font-family: ${settings.codeBlockFont}, 'Courier New', monospace;
      background-color: ${settings.codeBlockBackground};
      padding: 16px;
      overflow: auto;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      font-size: 100%;
    }
    .code-language-label {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 0.9em;
    }
    blockquote {
      border-left: 4px solid #dfe2e5;
      padding-left: 16px;
      margin-left: 0;
      color: #6a737d;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }
    table th,
    table td {
      border: 1px solid #dfe2e5;
      padding: 8px 13px;
    }
    table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    table tr:nth-child(even) {
      background-color: #f6f8fa;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 16px;
      padding-left: 2em;
    }
    li {
      margin-bottom: 4px;
    }
    hr {
      height: 0.25em;
      padding: 0;
      margin: 24px 0;
      background-color: #e1e4e8;
      border: 0;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 16px 0;
    }
    .mermaid-link {
      margin: 16px 0;
    }
`;
	}

	/**
	 * Converts a ContentBlock to HTML string with graceful degradation.
	 * 
	 * Requirements: 7.1, 7.2, 7.3, 8.2
	 * 
	 * @param block - The ContentBlock to convert
	 * @param settings - Plugin settings for formatting
	 * @returns HTML string
	 */
	private static blockToHtml(
		block: ContentBlock,
		settings: PluginSettings
	): string {
		try {
			switch (block.type) {
				case 'heading':
					return this.headingToHtml(block, settings);
				
				case 'paragraph':
					return this.paragraphToHtml(block, settings);
				
				case 'code':
					return this.codeBlockToHtml(block, settings);
				
				case 'mermaid':
					return this.mermaidToHtml(block, settings);
				
				case 'list':
					return this.listToHtml(block, settings);
				
				case 'table':
					return this.tableToHtml(block, settings);
				
				case 'blockquote':
					return this.blockquoteToHtml(block, settings);
				
				case 'hr':
					return '<hr>\n';
				
				case 'image':
					return this.imageToHtml(block, settings);
				
				default:
					// Unknown block type - skip silently
					return '';
			}
		} catch {
			// Graceful degradation: return paragraph with error message
			return `<p style="color: #999; font-style: italic;">[Error rendering ${block.type} block]</p>\n`;
		}
	}

	/**
	 * Converts a HeadingBlock to HTML.
	 */
	private static headingToHtml(
		block: HeadingBlock,
		settings: PluginSettings
	): string {
		const content = this.inlineToHtml(block.content, settings);
		return `<h${block.level}>${content}</h${block.level}>\n`;
	}

	/**
	 * Converts a ParagraphBlock to HTML.
	 */
	private static paragraphToHtml(
		block: ParagraphBlock,
		settings: PluginSettings
	): string {
		const content = this.inlineToHtml(block.content, settings);
		return `<p>${content}</p>\n`;
	}

	/**
	 * Converts a CodeBlock to HTML with styling.
	 */
	private static codeBlockToHtml(
		block: CodeBlock,
		settings: PluginSettings
	): string {
		let html = '';

		// Add language label if enabled and language exists
		if (settings.includeLanguageLabel && block.language) {
			html += `<div class="code-language-label">${this.escapeHtml(block.language)}</div>\n`;
		}

		// Create pre/code block
		html += `<pre><code>${this.escapeHtml(block.content)}</code></pre>\n`;

		return html;
	}

	/**
	 * Converts a MermaidBlock to HTML hyperlink.
	 */
	private static mermaidToHtml(
		block: MermaidBlock,
		settings: PluginSettings
	): string {
		// Build link text: base text + optional diagram type
		let linkText = settings.mermaidLinkText;
		if (settings.includeMermaidType && block.diagramType) {
			linkText = `${linkText} (${block.diagramType})`;
		}

		return `<p class="mermaid-link"><a href="${this.escapeHtml(block.url)}">${this.escapeHtml(linkText)}</a></p>\n`;
	}

	/**
	 * Converts a ListBlock to HTML (ul or ol).
	 */
	private static listToHtml(
		block: ListBlock,
		settings: PluginSettings
	): string {
		const tag = block.ordered ? 'ol' : 'ul';
		let html = `<${tag}>\n`;

		for (const item of block.items) {
			html += '<li>';
			html += this.inlineToHtml(item.content, settings);
			
			// Handle nested lists
			if (item.children) {
				html += '\n' + this.listToHtml(item.children, settings);
			}
			
			html += '</li>\n';
		}

		html += `</${tag}>\n`;
		return html;
	}

	/**
	 * Converts a TableBlock to HTML table.
	 */
	private static tableToHtml(
		block: TableBlock,
		settings: PluginSettings
	): string {
		let html = '<table>\n';

		// Header row
		html += '<thead>\n<tr>\n';
		for (const headerCell of block.headers) {
			html += '<th>';
			html += this.inlineToHtml(headerCell, settings);
			html += '</th>\n';
		}
		html += '</tr>\n</thead>\n';

		// Data rows
		html += '<tbody>\n';
		for (const row of block.rows) {
			html += '<tr>\n';
			for (const cell of row) {
				html += '<td>';
				html += this.inlineToHtml(cell, settings);
				html += '</td>\n';
			}
			html += '</tr>\n';
		}
		html += '</tbody>\n';

		html += '</table>\n';
		return html;
	}

	/**
	 * Converts a BlockquoteBlock to HTML blockquote.
	 */
	private static blockquoteToHtml(
		block: BlockquoteBlock,
		settings: PluginSettings
	): string {
		let html = '<blockquote>\n';

		for (const contentBlock of block.content) {
			html += this.blockToHtml(contentBlock, settings);
		}

		html += '</blockquote>\n';
		return html;
	}

	/**
	 * Converts an ImageBlock to HTML based on imageHandling setting.
	 */
	private static imageToHtml(
		block: ImageBlock,
		settings: PluginSettings
	): string {
		switch (settings.imageHandling) {
			case 'embed':
				return `<img src="${this.escapeHtml(block.url)}" alt="${this.escapeHtml(block.alt)}">\n`;
			
			case 'link':
				return `<p><a href="${this.escapeHtml(block.url)}">${this.escapeHtml(block.alt || 'Image')}</a></p>\n`;
			
			case 'skip':
				return '';
			
			default:
				return '';
		}
	}

	/**
	 * Converts InlineContent array to HTML string.
	 */
	private static inlineToHtml(
		content: InlineContent[],
		settings: PluginSettings
	): string {
		let html = '';

		for (const item of content) {
			html += this.inlineContentToHtml(item, settings);
		}

		return html;
	}

	/**
	 * Converts a single InlineContent item to HTML.
	 */
	private static inlineContentToHtml(
		item: InlineContent,
		settings: PluginSettings
	): string {
		switch (item.type) {
			case 'text':
				return this.escapeHtml(item.content);
			
			case 'bold':
				return `<strong>${this.inlineToHtml(item.content, settings)}</strong>`;
			
			case 'italic':
				return `<em>${this.inlineToHtml(item.content, settings)}</em>`;
			
			case 'strikethrough':
				return `<del>${this.inlineToHtml(item.content, settings)}</del>`;
			
			case 'code':
				return `<code>${this.escapeHtml(item.content)}</code>`;
			
			case 'link':
				const linkText = this.inlineToHtml(item.text, settings);
				return `<a href="${this.escapeHtml(item.url)}">${linkText}</a>`;
			
			default:
				return '';
		}
	}

	/**
	 * Escapes HTML special characters to prevent injection.
	 */
	private static escapeHtml(text: string): string {
		const map: { [key: string]: string } = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return text.replace(/[&<>"']/g, (char) => map[char]);
	}
}
