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
 * ClipboardExporter copies rich text to the system clipboard.
 * Converts ContentBlocks to HTML and uses the Clipboard API.
 */
export class ClipboardExporter {
	/**
	 * Main export function that parses markdown and copies rich text to clipboard.
	 * 
	 * Requirements: 7.1, 7.2, 7.3, 8.1, 8.2
	 * 
	 * @param markdown - The markdown content to export
	 * @param settings - Plugin settings for formatting preferences
	 */
	static async export(
		markdown: string,
		settings: PluginSettings
	): Promise<void> {
		try {
			// Requirement 7.1: Handle empty note gracefully
			const content = markdown || '';
			
			// Parse markdown into structured content
			const parser = new MarkdownParser(settings);
			const parsedContent = parser.parse(content);

			// Convert to HTML
			const html = this.contentToHtml(parsedContent, settings);

			// Copy to clipboard using Clipboard API
			const blob = new Blob([html], { type: 'text/html' });
			const clipboardItem = new ClipboardItem({ 'text/html': blob });
			await navigator.clipboard.write([clipboardItem]);
			
		} catch (error) {
			// Requirement 8.2: Log error details for debugging
			console.error('Clipboard export error:', error);
			
			// Re-throw with more context
			if (error instanceof Error) {
				throw new Error(`Failed to copy to clipboard: ${error.message}`);
			} else {
				throw new Error('Failed to copy to clipboard: Unknown error');
			}
		}
	}

	/**
	 * Converts ParsedContent to HTML string.
	 * 
	 * @param content - The parsed content structure
	 * @param settings - Plugin settings for formatting
	 * @returns HTML string representation
	 */
	static contentToHtml(
		content: ParsedContent,
		settings: PluginSettings
	): string {
		let html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>';

		for (const block of content.blocks) {
			html += this.blockToHtml(block, settings);
		}

		html += '</body></html>';
		return html;
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
					return '<hr>';
				
				case 'image':
					return this.imageToHtml(block, settings);
				
				default:
					console.warn('Unknown block type encountered:', (block as any).type);
					return '';
			}
		} catch (error) {
			// Requirement 8.2: Log error for individual element failure
			console.error('Error converting block to HTML:', error);
			console.error('Block type:', block.type);
			
			// Graceful degradation: return paragraph with error message
			return `<p style="color: #999; font-style: italic;">[Error rendering ${block.type} block]</p>`;
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
		return `<h${block.level}>${content}</h${block.level}>`;
	}

	/**
	 * Converts a ParagraphBlock to HTML.
	 */
	private static paragraphToHtml(
		block: ParagraphBlock,
		settings: PluginSettings
	): string {
		const content = this.inlineToHtml(block.content, settings);
		return `<p>${content}</p>`;
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
			html += `<p><strong>${this.escapeHtml(block.language)}</strong></p>`;
		}

		// Create pre/code block with styling
		const style = `font-family: ${settings.codeBlockFont}, monospace; background-color: ${settings.codeBlockBackground}; padding: 10px; white-space: pre-wrap; overflow-x: auto;`;
		html += `<pre style="${style}"><code>${this.escapeHtml(block.content)}</code></pre>`;

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

		return `<p><a href="${this.escapeHtml(block.url)}">${this.escapeHtml(linkText)}</a></p>`;
	}

	/**
	 * Converts a ListBlock to HTML (ul or ol).
	 */
	private static listToHtml(
		block: ListBlock,
		settings: PluginSettings
	): string {
		const tag = block.ordered ? 'ol' : 'ul';
		let html = `<${tag}>`;

		for (const item of block.items) {
			html += '<li>';
			html += this.inlineToHtml(item.content, settings);
			
			// Handle nested lists
			if (item.children) {
				html += this.listToHtml(item.children, settings);
			}
			
			html += '</li>';
		}

		html += `</${tag}>`;
		return html;
	}

	/**
	 * Converts a TableBlock to HTML table.
	 */
	private static tableToHtml(
		block: TableBlock,
		settings: PluginSettings
	): string {
		let html = '<table border="1" style="border-collapse: collapse; width: 100%;">';

		// Header row
		html += '<thead><tr>';
		for (const headerCell of block.headers) {
			html += '<th style="background-color: #d3d3d3; padding: 8px;">';
			html += this.inlineToHtml(headerCell, settings);
			html += '</th>';
		}
		html += '</tr></thead>';

		// Data rows
		html += '<tbody>';
		for (const row of block.rows) {
			html += '<tr>';
			for (const cell of row) {
				html += '<td style="padding: 8px;">';
				html += this.inlineToHtml(cell, settings);
				html += '</td>';
			}
			html += '</tr>';
		}
		html += '</tbody>';

		html += '</table>';
		return html;
	}

	/**
	 * Converts a BlockquoteBlock to HTML blockquote.
	 */
	private static blockquoteToHtml(
		block: BlockquoteBlock,
		settings: PluginSettings
	): string {
		let html = '<blockquote style="border-left: 3px solid #999; padding-left: 15px; margin-left: 0;">';

		for (const contentBlock of block.content) {
			html += this.blockToHtml(contentBlock, settings);
		}

		html += '</blockquote>';
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
				return `<img src="${this.escapeHtml(block.url)}" alt="${this.escapeHtml(block.alt)}">`;
			
			case 'link':
				return `<p><a href="${this.escapeHtml(block.url)}">${this.escapeHtml(block.alt || 'Image')}</a></p>`;
			
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
				return `<code style="font-family: ${settings.codeBlockFont}, monospace;">${this.escapeHtml(item.content)}</code>`;
			
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
