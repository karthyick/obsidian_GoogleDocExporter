import {
	Document,
	Paragraph,
	TextRun,
	HeadingLevel,
	AlignmentType,
	Table,
	TableRow,
	TableCell,
	WidthType,
	BorderStyle,
	ShadingType,
	Packer,
	ExternalHyperlink
} from 'docx';
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
	HorizontalRuleBlock,
	ImageBlock,
	PluginSettings
} from '../types';
import { MarkdownParser } from '../utils/markdownParser';

/**
 * DocxExporter generates DOCX files from parsed markdown content.
 * Converts ContentBlocks to docx library elements and handles export.
 */
export class DocxExporter {
	/**
	 * Main export function that orchestrates the entire DOCX export process.
	 * Parses markdown, creates document, generates blob, and saves file.
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

			// Create DOCX document
			const document = this.createDocument(parsedContent, settings);

			// Generate blob
			const blob = await Packer.toBlob(document);

			// Save file
			const outputFilename = filename.endsWith('.docx') ? filename : `${filename}.docx`;
			saveAs(blob, outputFilename);
			
		} catch (error) {
			// Requirement 8.2: Log error details for debugging
			console.error('DOCX export error:', error);
			
			// Re-throw with more context
			if (error instanceof Error) {
				throw new Error(`Failed to export DOCX: ${error.message}`);
			} else {
				throw new Error('Failed to export DOCX: Unknown error');
			}
		}
	}

	/**
	 * Creates a docx Document from ParsedContent.
	 * Converts all ContentBlocks to docx elements.
	 * 
	 * @param content - The parsed content structure
	 * @param settings - Plugin settings for formatting
	 * @returns A docx Document object
	 */
	private static createDocument(
		content: ParsedContent,
		settings: PluginSettings
	): Document {
		const children: (Paragraph | Table)[] = [];

		// Convert each ContentBlock to docx elements
		for (const block of content.blocks) {
			const elements = this.blockToDocx(block, settings);
			children.push(...elements);
		}

		return new Document({
			numbering: {
				config: [
					{
						reference: 'unordered-list',
						levels: [
							{
								level: 0,
								format: 'bullet',
								text: '•',
								alignment: AlignmentType.LEFT,
								style: {
									paragraph: {
										indent: { left: 720, hanging: 360 }
									}
								}
							},
							{
								level: 1,
								format: 'bullet',
								text: '◦',
								alignment: AlignmentType.LEFT,
								style: {
									paragraph: {
										indent: { left: 1440, hanging: 360 }
									}
								}
							},
							{
								level: 2,
								format: 'bullet',
								text: '▪',
								alignment: AlignmentType.LEFT,
								style: {
									paragraph: {
										indent: { left: 2160, hanging: 360 }
									}
								}
							},
							{
								level: 3,
								format: 'bullet',
								text: '▫',
								alignment: AlignmentType.LEFT,
								style: {
									paragraph: {
										indent: { left: 2880, hanging: 360 }
									}
								}
							}
						]
					},
					{
						reference: 'ordered-list',
						levels: [
							{
								level: 0,
								format: 'decimal',
								text: '%1.',
								alignment: AlignmentType.LEFT,
								style: {
									paragraph: {
										indent: { left: 720, hanging: 360 }
									}
								}
							},
							{
								level: 1,
								format: 'lowerLetter',
								text: '%2.',
								alignment: AlignmentType.LEFT,
								style: {
									paragraph: {
										indent: { left: 1440, hanging: 360 }
									}
								}
							},
							{
								level: 2,
								format: 'lowerRoman',
								text: '%3.',
								alignment: AlignmentType.LEFT,
								style: {
									paragraph: {
										indent: { left: 2160, hanging: 360 }
									}
								}
							},
							{
								level: 3,
								format: 'decimal',
								text: '%4.',
								alignment: AlignmentType.LEFT,
								style: {
									paragraph: {
										indent: { left: 2880, hanging: 360 }
									}
								}
							}
						]
					}
				]
			},
			sections: [
				{
					properties: {},
					children: children
				}
			]
		});
	}

	/**
	 * Converts a ContentBlock to docx elements (Paragraph or Table).
	 * Handles all ContentBlock types with graceful degradation for failures.
	 * 
	 * Requirements: 7.1, 7.2, 7.3, 8.2
	 * 
	 * @param block - The ContentBlock to convert
	 * @param settings - Plugin settings for formatting
	 * @returns Array of docx elements
	 */
	private static blockToDocx(
		block: ContentBlock,
		settings: PluginSettings
	): (Paragraph | Table)[] {
		try {
			switch (block.type) {
				case 'heading':
					return [this.createHeading(block, settings)];
				
				case 'paragraph':
					return [this.createParagraph(block, settings)];
				
				case 'code':
					return this.createCodeBlock(block, settings);
				
				case 'mermaid':
					return [this.createMermaidLink(block, settings)];
				
				case 'list':
					return this.createList(block, settings);
				
				case 'table':
					return this.createTable(block, settings);
				
				case 'blockquote':
					return this.createBlockquote(block, settings);
				
				case 'hr':
					return [this.createHorizontalRule()];
				
				case 'image':
					// Image handling based on settings.imageHandling (Requirement 3.12)
					const imageParagraph = this.createImagePlaceholder(block, settings);
					// Skip empty paragraphs when imageHandling is 'skip'
					if (settings.imageHandling === 'skip') {
						return [];
					}
					return [imageParagraph];
				
				default:
					// Unknown block type - skip
					console.warn('Unknown block type encountered:', (block as any).type);
					return [];
			}
		} catch (error) {
			// Requirement 8.2: Log error for individual element failure
			console.error('Error converting block to DOCX:', error);
			console.error('Block type:', block.type);
			
			// Graceful degradation: return a paragraph with error message
			return [
				new Paragraph({
					children: [
						new TextRun({
							text: `[Error rendering ${block.type} block]`,
							italics: true,
							color: '999999'
						})
					]
				})
			];
		}
	}

	/**
	 * Creates a heading paragraph with appropriate heading level.
	 */
	private static createHeading(
		block: HeadingBlock,
		settings: PluginSettings
	): Paragraph {
		const textRuns = this.inlineToTextRuns(block.content, settings);
		const headingLevel = this.getHeadingLevel(block.level);

		return new Paragraph({
			text: '',
			heading: headingLevel,
			children: textRuns
		});
	}

	/**
	 * Creates a standard paragraph.
	 */
	private static createParagraph(
		block: ParagraphBlock,
		settings: PluginSettings
	): Paragraph {
		const textRuns = this.inlineToTextRuns(block.content, settings);

		return new Paragraph({
			children: textRuns
		});
	}

	/**
	 * Creates a horizontal rule using a paragraph with bottom border.
	 */
	private static createHorizontalRule(): Paragraph {
		return new Paragraph({
			text: '',
			border: {
				bottom: {
					color: '000000',
					space: 1,
					style: BorderStyle.SINGLE,
					size: 6
				}
			},
			spacing: {
				before: 200,
				after: 200
			}
		});
	}

	/**
	 * Converts InlineContent array to TextRun array with formatting.
	 * Handles bold, italic, strikethrough, inline code, and links.
	 * 
	 * Requirements: 3.4, 3.5, 3.6, 3.9, 3.14
	 * 
	 * @param content - Array of InlineContent to convert
	 * @param settings - Plugin settings
	 * @returns Array of TextRun objects or hyperlinks
	 */
	private static inlineToTextRuns(
		content: InlineContent[],
		settings: PluginSettings
	): (TextRun | ExternalHyperlink)[] {
		const runs: (TextRun | ExternalHyperlink)[] = [];

		for (const item of content) {
			runs.push(...this.inlineContentToTextRuns(item, settings));
		}

		return runs;
	}

	/**
	 * Converts a single InlineContent item to TextRun(s) or hyperlinks.
	 * Handles nested formatting by accumulating formatting properties.
	 */
	private static inlineContentToTextRuns(
		item: InlineContent,
		settings: PluginSettings,
		inheritedFormatting: {
			bold?: boolean;
			italics?: boolean;
			strike?: boolean;
		} = {}
	): (TextRun | ExternalHyperlink)[] {
		switch (item.type) {
			case 'text':
				return [
					new TextRun({
						text: item.content,
						bold: inheritedFormatting.bold,
						italics: inheritedFormatting.italics,
						strike: inheritedFormatting.strike
					})
				];
			
			case 'bold':
				// Recursively process nested content with bold formatting (Requirement 3.4)
				const boldRuns: (TextRun | ExternalHyperlink)[] = [];
				for (const nestedItem of item.content) {
					boldRuns.push(...this.inlineContentToTextRuns(nestedItem, settings, {
						...inheritedFormatting,
						bold: true
					}));
				}
				return boldRuns;
			
			case 'italic':
				// Recursively process nested content with italic formatting (Requirement 3.5)
				const italicRuns: (TextRun | ExternalHyperlink)[] = [];
				for (const nestedItem of item.content) {
					italicRuns.push(...this.inlineContentToTextRuns(nestedItem, settings, {
						...inheritedFormatting,
						italics: true
					}));
				}
				return italicRuns;
			
			case 'strikethrough':
				// Recursively process nested content with strikethrough formatting (Requirement 3.6)
				const strikeRuns: (TextRun | ExternalHyperlink)[] = [];
				for (const nestedItem of item.content) {
					strikeRuns.push(...this.inlineContentToTextRuns(nestedItem, settings, {
						...inheritedFormatting,
						strike: true
					}));
				}
				return strikeRuns;
			
			case 'code':
				// Inline code with monospace font (Requirement 3.14)
				return [
					new TextRun({
						text: item.content,
						font: settings.codeBlockFont,
						bold: inheritedFormatting.bold,
						italics: inheritedFormatting.italics,
						strike: inheritedFormatting.strike
					})
				];
			
			case 'link':
				// Create hyperlink with formatted text (Requirement 3.9)
				const linkTextRuns: TextRun[] = [];
				for (const textItem of item.text) {
					const runs = this.inlineContentToTextRuns(textItem, settings, inheritedFormatting);
					// Filter to only TextRuns for hyperlink children
					for (const run of runs) {
						if (run instanceof TextRun) {
							linkTextRuns.push(run);
						}
					}
				}
				
				return [
					new ExternalHyperlink({
						children: linkTextRuns,
						link: item.url
					})
				];
			
			default:
				return [];
		}
	}

	/**
	 * Maps heading level (1-6) to docx HeadingLevel enum.
	 * 
	 * @param level - Heading level from 1 to 6
	 * @returns Corresponding HeadingLevel enum value
	 */
	private static getHeadingLevel(level: 1 | 2 | 3 | 4 | 5 | 6): typeof HeadingLevel[keyof typeof HeadingLevel] {
		switch (level) {
			case 1:
				return HeadingLevel.HEADING_1;
			case 2:
				return HeadingLevel.HEADING_2;
			case 3:
				return HeadingLevel.HEADING_3;
			case 4:
				return HeadingLevel.HEADING_4;
			case 5:
				return HeadingLevel.HEADING_5;
			case 6:
				return HeadingLevel.HEADING_6;
		}
	}

	// ========================================================================
	// Placeholder methods for features to be implemented in later tasks
	// ========================================================================

	/**
	 * Creates formatted code block paragraphs with optional language label.
	 * Applies monospace font, background shading, and preserves all whitespace.
	 * 
	 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
	 * 
	 * @param block - The CodeBlock to format
	 * @param settings - Plugin settings for font, background, and label preferences
	 * @returns Array of Paragraph objects representing the code block
	 */
	private static createCodeBlock(
		block: CodeBlock,
		settings: PluginSettings
	): Paragraph[] {
		const paragraphs: Paragraph[] = [];

		// Add language label if enabled and language exists (Requirement 2.4)
		if (settings.includeLanguageLabel && block.language) {
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: block.language,
							bold: true,
							size: 20  // 10pt font size
						})
					],
					spacing: {
						before: 100,
						after: 50
					}
				})
			);
		}

		// Split content into lines to preserve line breaks (Requirement 2.1)
		const lines = block.content.split('\n');

		// Create a paragraph for each line with monospace font and background
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const isLastLine = i === lines.length - 1;
			
			paragraphs.push(
				new Paragraph({
					children: [
						new TextRun({
							text: line || ' ',  // Use space for empty lines to preserve them
							font: settings.codeBlockFont  // Requirement 2.2
						})
					],
					shading: {
						type: ShadingType.SOLID,
						color: settings.codeBlockBackground.replace('#', '')  // Requirement 2.3
					},
					spacing: {
						line: 240,  // Single line spacing
						lineRule: 'auto',
						after: isLastLine ? 100 : undefined  // Add spacing after last line
					}
				})
			);
		}

		return paragraphs;
	}

	/**
	 * Creates a Mermaid link paragraph with emoji and hyperlink.
	 * Formats the link text using settings.mermaidLinkText and optionally includes diagram type.
	 * Applies spacing before and after the paragraph.
	 * 
	 * @param block - The MermaidBlock containing diagram info and URL
	 * @param settings - Plugin settings for link text and diagram type inclusion
	 * @returns A Paragraph with formatted Mermaid link
	 */
	private static createMermaidLink(
		block: MermaidBlock,
		settings: PluginSettings
	): Paragraph {
		// Build link text: base text + optional diagram type
		let linkText = settings.mermaidLinkText;
		if (settings.includeMermaidType && block.diagramType) {
			linkText = `${linkText} (${block.diagramType})`;
		}

		// Create hyperlink with the formatted text
		const hyperlink = new ExternalHyperlink({
			children: [
				new TextRun({
					text: linkText,
					style: 'Hyperlink'
				})
			],
			link: block.url
		});

		// Create paragraph with spacing
		return new Paragraph({
			children: [hyperlink],
			spacing: {
				before: 200,  // 10pt spacing before
				after: 200    // 10pt spacing after
			}
		});
	}

	/**
	 * Creates list paragraphs with proper numbering/bullets and nesting.
	 * Handles both ordered and unordered lists with nested children.
	 * 
	 * Requirements: 3.7, 3.8
	 * 
	 * @param block - The ListBlock to convert
	 * @param settings - Plugin settings
	 * @param level - Current nesting level (0-based)
	 * @returns Array of Paragraph objects representing the list
	 */
	private static createList(
		block: ListBlock,
		settings: PluginSettings,
		level: number = 0
	): Paragraph[] {
		const paragraphs: Paragraph[] = [];

		for (const item of block.items) {
			// Create paragraph for this list item
			const textRuns = this.inlineToTextRuns(item.content, settings);
			
			paragraphs.push(
				new Paragraph({
					children: textRuns,
					numbering: {
						reference: block.ordered ? 'ordered-list' : 'unordered-list',
						level: level
					}
				})
			);

			// Recursively process nested lists
			if (item.children) {
				const nestedParagraphs = this.createList(item.children, settings, level + 1);
				paragraphs.push(...nestedParagraphs);
			}
		}

		return paragraphs;
	}

	/**
	 * Creates a table with header row (shaded) and data rows.
	 * 
	 * Requirements: 3.15
	 * 
	 * @param block - The TableBlock to convert
	 * @param settings - Plugin settings
	 * @returns Array containing the Table object
	 */
	private static createTable(
		block: TableBlock,
		settings: PluginSettings
	): Table[] {
		const rows: TableRow[] = [];

		// Create header row with shading
		const headerCells: TableCell[] = [];
		for (const headerContent of block.headers) {
			const textRuns = this.inlineToTextRuns(headerContent, settings);
			headerCells.push(
				new TableCell({
					children: [
						new Paragraph({
							children: textRuns
						})
					],
					shading: {
						type: ShadingType.SOLID,
						color: 'D3D3D3'  // Light gray for header
					}
				})
			);
		}
		rows.push(new TableRow({ children: headerCells }));

		// Create data rows
		for (const row of block.rows) {
			const dataCells: TableCell[] = [];
			for (const cellContent of row) {
				const textRuns = this.inlineToTextRuns(cellContent, settings);
				dataCells.push(
					new TableCell({
						children: [
							new Paragraph({
								children: textRuns
							})
						]
					})
				);
			}
			rows.push(new TableRow({ children: dataCells }));
		}

		return [
			new Table({
				rows: rows,
				width: {
					size: 100,
					type: WidthType.PERCENTAGE
				}
			})
		];
	}

	/**
	 * Creates blockquote paragraphs with indentation and left border.
	 * Recursively processes nested ContentBlocks within the blockquote.
	 * 
	 * Requirements: 3.10
	 * 
	 * @param block - The BlockquoteBlock to convert
	 * @param settings - Plugin settings
	 * @returns Array of Paragraph objects with blockquote formatting
	 */
	private static createBlockquote(
		block: BlockquoteBlock,
		settings: PluginSettings
	): Paragraph[] {
		const paragraphs: Paragraph[] = [];

		// Recursively process each ContentBlock in the blockquote
		for (const contentBlock of block.content) {
			const elements = this.blockToDocx(contentBlock, settings);
			
			// Apply blockquote formatting to each element
			for (const element of elements) {
				if (element instanceof Paragraph) {
					// Add indentation and left border to paragraphs
					const modifiedParagraph = new Paragraph({
						...element,
						indent: {
							left: 720  // 0.5 inch indentation
						},
						border: {
							left: {
								color: '999999',
								space: 1,
								style: BorderStyle.SINGLE,
								size: 12
							}
						}
					});
					paragraphs.push(modifiedParagraph);
				} else {
					// Tables can't have borders/indentation, so just add them as-is
					// This is a limitation of the docx format
					paragraphs.push(
						new Paragraph({
							text: '[Table in blockquote - formatting limited]'
						})
					);
				}
			}
		}

		return paragraphs;
	}

	/**
	 * Creates image representation based on imageHandling setting.
	 * Supports embed mode (placeholder text), link mode (hyperlink), and skip mode (omit).
	 * 
	 * Requirement 3.12: Handle markdown image syntax with configurable behavior
	 * 
	 * @param block - The ImageBlock to convert
	 * @param settings - Plugin settings for image handling mode
	 * @returns Paragraph with image representation or empty array if skipped
	 */
	private static createImagePlaceholder(
		block: ImageBlock,
		settings: PluginSettings
	): Paragraph {
		switch (settings.imageHandling) {
			case 'embed':
				// Embed mode: Create a placeholder paragraph with image info
				// Note: Actual image embedding would require fetching and encoding the image
				// For now, we provide a descriptive placeholder that indicates the image location
				return new Paragraph({
					children: [
						new TextRun({
							text: `[Image: ${block.alt || 'Untitled'}]`,
							italics: true,
							color: '666666'
						})
					],
					spacing: {
						before: 100,
						after: 100
					}
				});
			
			case 'link':
				// Link mode: Convert image to a hyperlink
				const linkText = block.alt || 'Image';
				return new Paragraph({
					children: [
						new ExternalHyperlink({
							children: [
								new TextRun({
									text: linkText,
									style: 'Hyperlink'
								})
							],
							link: block.url
						})
					],
					spacing: {
						before: 100,
						after: 100
					}
				});
			
			case 'skip':
				// Skip mode: Return empty paragraph (will be filtered out)
				return new Paragraph({
					text: ''
				});
			
			default:
				// Default to embed behavior
				return new Paragraph({
					children: [
						new TextRun({
							text: `[Image: ${block.alt || 'Untitled'}]`,
							italics: true,
							color: '666666'
						})
					]
				});
		}
	}
}
