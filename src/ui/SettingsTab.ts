import { App, PluginSettingTab, Setting } from 'obsidian';
import { PluginSettings } from '../types';

/**
 * Interface for the plugin that uses this settings tab.
 * This allows the settings tab to save settings back to the plugin.
 */
interface GoogleDocsExporterPlugin {
	settings: PluginSettings;
	saveSettings(): Promise<void>;
}

/**
 * SettingsTab provides a UI for configuring all plugin settings.
 * Each setting control calls plugin.saveSettings() on change to persist values.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10
 */
export class SettingsTab extends PluginSettingTab {
	plugin: GoogleDocsExporterPlugin;

	constructor(app: App, plugin: GoogleDocsExporterPlugin) {
		super(app, plugin as any);
		this.plugin = plugin;
	}

	/**
	 * Renders all settings controls with current values.
	 * Called when the settings tab is opened.
	 */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Google Docs Exporter Settings' });

		// Requirement 6.1: Default export format dropdown
		new Setting(containerEl)
			.setName('Default export format')
			.setDesc('Choose the default format when exporting notes')
			.addDropdown(dropdown => {
				dropdown
					.addOption('docx', 'DOCX (Word Document)')
					.addOption('clipboard', 'Clipboard (Rich Text)')
					.addOption('html', 'HTML (Web Page)')
					.setValue(this.plugin.settings.defaultFormat)
					.onChange(async (value) => {
						this.plugin.settings.defaultFormat = value as 'docx' | 'clipboard' | 'html';
						await this.plugin.saveSettings();
					});
			});

		// Mermaid Diagram Settings Section
		containerEl.createEl('h3', { text: 'Mermaid Diagram Settings' });

		// Requirement 6.2: Mermaid link text with validation
		new Setting(containerEl)
			.setName('Mermaid link text')
			.setDesc('Text to display for Mermaid diagram links (e.g., "📊 View Diagram")')
			.addText(text => {
				text
					.setPlaceholder('📊 View Diagram')
					.setValue(this.plugin.settings.mermaidLinkText)
					.onChange(async (value) => {
						// Validate: ensure non-empty
						if (value.trim().length > 0) {
							this.plugin.settings.mermaidLinkText = value;
							await this.plugin.saveSettings();
							text.inputEl.removeClass('is-invalid');
						} else {
							text.inputEl.addClass('is-invalid');
						}
					});
			});

		// Requirement 6.3: Include diagram type toggle
		new Setting(containerEl)
			.setName('Include diagram type')
			.setDesc('Add diagram type to Mermaid links (e.g., "📊 View Diagram (Flowchart)")')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.includeMermaidType)
					.onChange(async (value) => {
						this.plugin.settings.includeMermaidType = value;
						await this.plugin.saveSettings();
					});
			});

		// Code Block Settings Section
		containerEl.createEl('h3', { text: 'Code Block Settings' });

		// Requirement 6.4: Code block font dropdown
		new Setting(containerEl)
			.setName('Code block font')
			.setDesc('Font family for code blocks in exported documents')
			.addDropdown(dropdown => {
				dropdown
					.addOption('Consolas', 'Consolas')
					.addOption('Courier New', 'Courier New')
					.addOption('Monaco', 'Monaco')
					.addOption('Source Code Pro', 'Source Code Pro')
					.setValue(this.plugin.settings.codeBlockFont)
					.onChange(async (value) => {
						this.plugin.settings.codeBlockFont = value;
						await this.plugin.saveSettings();
					});
			});

		// Requirement 6.5: Code block background color with hex validation
		new Setting(containerEl)
			.setName('Code block background')
			.setDesc('Background color for code blocks (hex format, e.g., #f5f5f5)')
			.addText(text => {
				text
					.setPlaceholder('#f5f5f5')
					.setValue(this.plugin.settings.codeBlockBackground)
					.onChange(async (value) => {
						// Validate hex color format
						const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
						if (hexRegex.test(value)) {
							this.plugin.settings.codeBlockBackground = value;
							await this.plugin.saveSettings();
							text.inputEl.removeClass('is-invalid');
						} else {
							text.inputEl.addClass('is-invalid');
						}
					});
			});

		// Requirement 6.6: Include language label toggle
		new Setting(containerEl)
			.setName('Include language label')
			.setDesc('Show language name above code blocks')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.includeLanguageLabel)
					.onChange(async (value) => {
						this.plugin.settings.includeLanguageLabel = value;
						await this.plugin.saveSettings();
					});
			});

		// Image and Link Settings Section
		containerEl.createEl('h3', { text: 'Image and Link Settings' });

		// Requirement 6.7: Image handling dropdown
		new Setting(containerEl)
			.setName('Image handling')
			.setDesc('How to handle images in exported documents')
			.addDropdown(dropdown => {
				dropdown
					.addOption('embed', 'Embed (include image in document)')
					.addOption('link', 'Link (convert to hyperlink)')
					.addOption('skip', 'Skip (omit from export)')
					.setValue(this.plugin.settings.imageHandling)
					.onChange(async (value) => {
						this.plugin.settings.imageHandling = value as 'embed' | 'link' | 'skip';
						await this.plugin.saveSettings();
					});
			});

		// Requirement 6.8: Remove Obsidian links toggle
		new Setting(containerEl)
			.setName('Remove Obsidian links')
			.setDesc('Convert [[internal links]] to plain text')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.removeObsidianLinks)
					.onChange(async (value) => {
						this.plugin.settings.removeObsidianLinks = value;
						await this.plugin.saveSettings();
					});
			});

		// Export Behavior Settings Section
		containerEl.createEl('h3', { text: 'Export Behavior' });

		// Requirement 6.9: Open after export toggle
		new Setting(containerEl)
			.setName('Open after export')
			.setDesc('Automatically open exported files after creation')
			.addToggle(toggle => {
				toggle
					.setValue(this.plugin.settings.openAfterExport)
					.onChange(async (value) => {
						this.plugin.settings.openAfterExport = value;
						await this.plugin.saveSettings();
					});
			});
	}
}
