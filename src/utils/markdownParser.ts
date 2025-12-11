import { marked, Token, Tokens } from 'marked';
import {
	ParsedContent,
	ContentBlock,
	InlineContent,
	HeadingBlock,
	ParagraphBlock,
	CodeBlock,
	MermaidBlock,
	ListBlock,
	ListItem,
	TableBlock,
	BlockquoteBlock,
	HorizontalRuleBlock,
	ImageBlock,
	TextContent,
	BoldContent,
	ItalicContent,
	StrikethroughContent,
	CodeContent,
	LinkContent,
	PluginSettings
} from '../types';
import { MermaidEncoder } from './mermaidEncoder';

/**
 * MarkdownParser transforms markdown strings into structured ContentBlock trees.
 * Uses a two-pass approach: first extracts Mermaid blocks, then parses remaining markdown.
 */
export class MarkdownParser {
	private settings: PluginSettings;
	private mermaidBlocks: Map<string, MermaidBlock>;
	private mermaidCounter: number;

	constructor(settings: PluginSettings) {
		this.settings = settings;
		this.mermaidBlocks = new Map();
		this.mermaidCounter = 0;
	}

	/**
	 * Main parsing entry point. Orchestrates multi-pass parsing:
	 * 1. Strip YAML frontmatter
	 * 2. Extract Mermaid blocks and replace with placeholders
	 * 3. Convert Obsidian callouts to blockquotes
	 * 4. Fix empty code blocks before content
	 * 5. Strip trailing hashtags
	 * 6. Parse remaining markdown with marked library
	 * 7. Replace placeholders with MermaidBlock objects
	 *
	 * Requirements: 7.1, 7.2, 7.3
	 *
	 * @param markdown - The markdown content to parse
	 * @returns Structured ParsedContent with ContentBlock array
	 */
	parse(markdown: string | null | undefined): ParsedContent {
		try {
			// Requirement 7.1: Handle empty note gracefully
			if (!markdown || typeof markdown !== 'string' || markdown.trim().length === 0) {
				return { blocks: [] };
			}

			// Reset state for new parse
			this.mermaidBlocks = new Map();
			this.mermaidCounter = 0;

			// Requirement 7.3: Handle special characters and Unicode
			// The marked library handles Unicode correctly by default

			// Pre-processing: Strip YAML frontmatter
			let processedMarkdown = this.stripFrontmatter(markdown);

			// Pre-processing: Convert Obsidian callouts to styled blockquotes
			processedMarkdown = this.convertObsidianCallouts(processedMarkdown);

			// Pre-processing: Fix empty code blocks followed by content
			processedMarkdown = this.fixEmptyCodeBlocks(processedMarkdown);

			// Pre-processing: Strip trailing hashtags (Obsidian tags)
			processedMarkdown = this.stripTrailingTags(processedMarkdown);

			// First pass: extract Mermaid blocks (Requirement 7.2: handles malformed syntax)
			processedMarkdown = this.extractMermaidBlocks(processedMarkdown);

			// Second pass: parse markdown with marked
			const tokens = marked.lexer(processedMarkdown);

			// Convert tokens to ContentBlocks
			const blocks: ContentBlock[] = [];
			for (const token of tokens) {
				try {
					const block = this.tokenToBlock(token);
					if (block) {
						blocks.push(block);
					}
				} catch (error) {
					// Graceful degradation: log error and continue with next token
					console.error('Error parsing token:', error);
					console.error('Token type:', token.type);
				}
			}

			return { blocks };
			
		} catch (error) {
			// If parsing completely fails, log error and return empty content
			console.error('Markdown parsing error:', error);
			return { blocks: [] };
		}
	}

	/**
	 * First-pass extraction of Mermaid blocks.
	 * Uses regex to find all ```mermaid blocks, replaces with placeholders,
	 * and stores MermaidBlock objects in a map.
	 * 
	 * Requirement 7.2: Handle malformed Mermaid syntax (encode as-is)
	 * 
	 * @param content - The markdown content
	 * @returns Markdown with Mermaid blocks replaced by placeholders
	 */
	private extractMermaidBlocks(content: string): string {
		// Regex to match ```mermaid code blocks (handles optional trailing spaces after mermaid)
		const mermaidRegex = /```mermaid\s*\n([\s\S]*?)```/g;

		return content.replace(mermaidRegex, (_match, code) => {
			try {
				// Generate unique placeholder
				const placeholder = `__MERMAID_BLOCK_${this.mermaidCounter}__`;
				this.mermaidCounter++;

				// Requirement 7.2: Extract diagram type (handles malformed syntax gracefully)
				const diagramType = MermaidEncoder.getDiagramType(code);
				const formattedType = MermaidEncoder.formatDiagramType(diagramType);

				// Requirement 7.2: Generate Mermaid Live URL (encodes malformed syntax as-is)
				const url = MermaidEncoder.encode(code);

				// Store MermaidBlock
				const mermaidBlock: MermaidBlock = {
					type: 'mermaid',
					diagramType: formattedType,
					code: code.trim(),
					url: url
				};

				this.mermaidBlocks.set(placeholder, mermaidBlock);

				// Return placeholder wrapped in paragraph to preserve structure
				return `\n${placeholder}\n`;
				
			} catch (error) {
				// If Mermaid encoding fails, log error and return code block as-is
				console.error('Error encoding Mermaid block:', error);
				console.error('Mermaid code:', code);
				
				// Return as regular code block
				return `\n\`\`\`mermaid\n${code}\`\`\`\n`;
			}
		});
	}

	/**
	 * Converts a Token to a ContentBlock.
	 * Handles all ContentBlock types: heading, paragraph, code, list, table, blockquote, hr, image.
	 * 
	 * @param token - The marked token to convert
	 * @returns ContentBlock or null if token type not supported
	 */
	private tokenToBlock(token: Token): ContentBlock | null {
		switch (token.type) {
			case 'heading':
				return this.parseHeading(token as Tokens.Heading);
			
			case 'paragraph':
				return this.parseParagraph(token as Tokens.Paragraph);
			
			case 'code':
				return this.parseCode(token as Tokens.Code);
			
			case 'list':
				return this.parseList(token as Tokens.List);
			
			case 'table':
				return this.parseTable(token as Tokens.Table);
			
			case 'blockquote':
				return this.parseBlockquote(token as Tokens.Blockquote);
			
			case 'hr':
				return this.parseHr();
			
			case 'space':
				// Skip space tokens
				return null;
			
			default:
				// For unsupported types, try to extract text if available
				if ('text' in token) {
					return {
						type: 'paragraph',
						content: this.parseInlineContent((token as any).text)
					};
				}
				return null;
		}
	}

	/**
	 * Parses a heading token into a HeadingBlock.
	 */
	private parseHeading(token: Tokens.Heading): HeadingBlock {
		return {
			type: 'heading',
			level: token.depth as 1 | 2 | 3 | 4 | 5 | 6,
			content: this.parseInlineContent(token.text)
		};
	}

	/**
	 * Parses a paragraph token into a ParagraphBlock, MermaidBlock, or ImageBlock.
	 * Checks if paragraph contains a Mermaid placeholder or standalone image.
	 */
	private parseParagraph(token: Tokens.Paragraph): ContentBlock {
		const text = token.text.trim();
		
		// Check if this is a Mermaid placeholder
		if (this.mermaidBlocks.has(text)) {
			return this.mermaidBlocks.get(text)!;
		}

		// Check if this paragraph contains a single image token
		if (token.tokens && token.tokens.length === 1 && token.tokens[0].type === 'image') {
			const imageToken = token.tokens[0] as Tokens.Image;
			return this.parseImage(imageToken);
		}

		return {
			type: 'paragraph',
			content: this.parseInlineContent(token.text)
		};
	}

	/**
	 * Parses a code token into a CodeBlock.
	 */
	private parseCode(token: Tokens.Code): CodeBlock {
		return {
			type: 'code',
			language: token.lang || null,
			content: token.text
		};
	}

	/**
	 * Parses a list token into a ListBlock.
	 */
	private parseList(token: Tokens.List): ListBlock {
		const items: ListItem[] = token.items.map((item: Tokens.ListItem) => {
			const listItem: ListItem = {
				content: this.parseInlineContent(item.text)
			};

			// Handle nested lists
			if (item.tokens && item.tokens.length > 0) {
				for (const subToken of item.tokens) {
					if (subToken.type === 'list') {
						listItem.children = this.parseList(subToken as Tokens.List);
						break;
					}
				}
			}

			return listItem;
		});

		return {
			type: 'list',
			ordered: token.ordered,
			items: items
		};
	}

	/**
	 * Parses a table token into a TableBlock.
	 */
	private parseTable(token: Tokens.Table): TableBlock {
		// Parse headers
		const headers: InlineContent[][] = token.header.map((cell: Tokens.TableCell) => {
			return this.parseInlineContent(cell.text);
		});

		// Parse rows
		const rows: InlineContent[][][] = token.rows.map((row: Tokens.TableCell[]) => {
			return row.map((cell: Tokens.TableCell) => {
				return this.parseInlineContent(cell.text);
			});
		});

		return {
			type: 'table',
			headers: headers,
			rows: rows
		};
	}

	/**
	 * Parses a blockquote token into a BlockquoteBlock.
	 */
	private parseBlockquote(token: Tokens.Blockquote): BlockquoteBlock {
		const blocks: ContentBlock[] = [];
		
		for (const subToken of token.tokens) {
			const block = this.tokenToBlock(subToken);
			if (block) {
				blocks.push(block);
			}
		}

		return {
			type: 'blockquote',
			content: blocks
		};
	}

	/**
	 * Parses a horizontal rule token into a HorizontalRuleBlock.
	 */
	private parseHr(): HorizontalRuleBlock {
		return {
			type: 'hr'
		};
	}

	/**
	 * Parses an image token into an ImageBlock.
	 * Requirement 3.12: Handle markdown image syntax
	 */
	private parseImage(token: Tokens.Image): ImageBlock {
		return {
			type: 'image',
			alt: token.text || '',
			url: token.href
		};
	}

	/**
	 * Parses inline content, handling Obsidian internal links and inline formatting.
	 * Processes bold, italic, strikethrough, inline code, and links.
	 * 
	 * @param text - The text content to parse
	 * @returns Array of InlineContent objects
	 */
	parseInlineContent(text: string): InlineContent[] {
		// First, handle Obsidian internal links if setting is enabled
		if (this.settings.removeObsidianLinks) {
			text = this.convertObsidianLinks(text);
		}

		// Parse inline tokens using marked
		const tokens = marked.lexer(text, { breaks: false });
		
		// If we have a single paragraph token, use its tokens
		if (tokens.length === 1 && tokens[0].type === 'paragraph') {
			const paragraphToken = tokens[0] as Tokens.Paragraph;
			if (paragraphToken.tokens) {
				return this.parseInlineTokens(paragraphToken.tokens);
			}
		}

		// Fallback: treat as plain text
		return [{ type: 'text', content: text }];
	}

	/**
	 * Converts Obsidian internal links [[link]] to plain text.
	 * Handles both [[link]] and [[link|display text]] formats.
	 */
	private convertObsidianLinks(text: string): string {
		// Match [[link]] or [[link|display text]]
		return text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (match, link, displayText) => {
			// Use display text if available, otherwise use link target
			return displayText || link;
		});
	}

	/**
	 * Parses an array of marked inline tokens into InlineContent array.
	 */
	private parseInlineTokens(tokens: Token[]): InlineContent[] {
		const result: InlineContent[] = [];

		for (const token of tokens) {
			const content = this.parseInlineToken(token);
			if (content) {
				if (Array.isArray(content)) {
					result.push(...content);
				} else {
					result.push(content);
				}
			}
		}

		return result;
	}

	/**
	 * Parses a single inline token into InlineContent.
	 */
	private parseInlineToken(token: Token): InlineContent | InlineContent[] | null {
		switch (token.type) {
			case 'text':
				const textToken = token as Tokens.Text;
				return { type: 'text', content: textToken.text };
			
			case 'strong':
				const strongToken = token as Tokens.Strong;
				return {
					type: 'bold',
					content: strongToken.tokens ? this.parseInlineTokens(strongToken.tokens) : []
				};
			
			case 'em':
				const emToken = token as Tokens.Em;
				return {
					type: 'italic',
					content: emToken.tokens ? this.parseInlineTokens(emToken.tokens) : []
				};
			
			case 'del':
				const delToken = token as Tokens.Del;
				return {
					type: 'strikethrough',
					content: delToken.tokens ? this.parseInlineTokens(delToken.tokens) : []
				};
			
			case 'codespan':
				const codeToken = token as Tokens.Codespan;
				return { type: 'code', content: codeToken.text };
			
			case 'link':
				const linkToken = token as Tokens.Link;
				return {
					type: 'link',
					text: linkToken.tokens ? this.parseInlineTokens(linkToken.tokens) : [{ type: 'text', content: linkToken.text }],
					url: linkToken.href
				};
			
			case 'image':
				// Images in inline context - we'll handle them as text for now
				// Full image handling will be in a separate task
				const imageToken = token as Tokens.Image;
				return { type: 'text', content: imageToken.text || '' };
			
			case 'br':
				// Line break - represent as text with newline
				return { type: 'text', content: '\n' };
			
			case 'escape':
				const escapeToken = token as Tokens.Escape;
				return { type: 'text', content: escapeToken.text };
			
			default:
				// For unknown types, try to extract text
				if ('text' in token) {
					return { type: 'text', content: (token as any).text };
				}
				return null;
		}
	}

	/**
	 * Strips YAML frontmatter from the beginning of markdown content.
	 * Frontmatter is enclosed between --- markers at the start of the document.
	 *
	 * @param content - The markdown content
	 * @returns Content with frontmatter removed
	 */
	private stripFrontmatter(content: string): string {
		// Match YAML frontmatter at the start of the document
		const frontmatterRegex = /^---\n[\s\S]*?\n---\n?/;
		return content.replace(frontmatterRegex, '');
	}

	/**
	 * Converts Obsidian callouts to formatted blockquotes.
	 * Handles [!info], [!tip], [!warning], [!note], [!danger], [!example], etc.
	 *
	 * @param content - The markdown content
	 * @returns Content with callouts converted to blockquotes with headers
	 */
	private convertObsidianCallouts(content: string): string {
		// Match Obsidian callout syntax: > [!type] Title
		// Captures the type and optional title, then the content
		const calloutRegex = /^> \[!(\w+)\]\s*(.*)$/gm;

		// Map callout types to emojis/labels
		const calloutMap: Record<string, string> = {
			'info': 'ℹ️ INFO',
			'tip': '💡 TIP',
			'warning': '⚠️ WARNING',
			'danger': '🚨 DANGER',
			'note': '📝 NOTE',
			'example': '📋 EXAMPLE',
			'question': '❓ QUESTION',
			'success': '✅ SUCCESS',
			'failure': '❌ FAILURE',
			'bug': '🐛 BUG',
			'quote': '💬 QUOTE',
			'abstract': '📄 ABSTRACT',
			'todo': '☑️ TODO'
		};

		return content.replace(calloutRegex, (match, type, title) => {
			const label = calloutMap[type.toLowerCase()] || `📌 ${type.toUpperCase()}`;
			const headerText = title ? `**${label}: ${title}**` : `**${label}**`;
			return `> ${headerText}`;
		});
	}

	/**
	 * Fixes empty code blocks that appear before actual content.
	 * Pattern: ```\n```\nContent becomes just Content in a code block.
	 *
	 * @param content - The markdown content
	 * @returns Content with empty code blocks merged with following content
	 */
	private fixEmptyCodeBlocks(content: string): string {
		// Match empty code blocks (```\n```) followed by content that looks like a folder structure
		// This handles the case where the user has an empty code block before a file tree
		const emptyCodeBlockRegex = /```\n```\n([\s\S]*?)(?=\n```|$)/g;

		return content.replace(emptyCodeBlockRegex, (match, followingContent) => {
			// Check if the following content looks like a file/folder structure
			if (followingContent.trim().match(/^[\w./├│└─\s]+$/m)) {
				return '```\n' + followingContent.trim() + '\n```';
			}
			return match;
		});
	}

	/**
	 * Strips trailing Obsidian tags (hashtags) from the end of the document.
	 * Tags like #python #backend-api #documentation are removed.
	 *
	 * @param content - The markdown content
	 * @returns Content with trailing tags removed
	 */
	private stripTrailingTags(content: string): string {
		// Match lines that contain only hashtags at the end of document
		// Pattern: line with only #word patterns, possibly multiple
		const trailingTagsRegex = /\n+#[\w-]+(?:\s+#[\w-]+)*\s*$/;
		return content.replace(trailingTagsRegex, '');
	}
}
