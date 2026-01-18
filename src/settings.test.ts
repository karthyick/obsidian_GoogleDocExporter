import { DEFAULT_SETTINGS } from './settings';
import { PluginSettings } from './types';

describe('DEFAULT_SETTINGS', () => {
  it('should have all required properties', () => {
    const settings = DEFAULT_SETTINGS;

    expect(settings).toHaveProperty('defaultFormat');
    expect(settings).toHaveProperty('exportLocation');
    expect(settings).toHaveProperty('mermaidLinkText');
    expect(settings).toHaveProperty('includeMermaidType');
    expect(settings).toHaveProperty('codeBlockFont');
    expect(settings).toHaveProperty('codeBlockBackground');
    expect(settings).toHaveProperty('includeLanguageLabel');
    expect(settings).toHaveProperty('imageHandling');
    expect(settings).toHaveProperty('removeObsidianLinks');
    expect(settings).toHaveProperty('openAfterExport');
  });

  describe('Requirement 6.1: Default export format', () => {
    it('should have docx as default format', () => {
      expect(DEFAULT_SETTINGS.defaultFormat).toBe('docx');
    });

    it('should have a valid format value', () => {
      expect(['docx', 'clipboard', 'html']).toContain(DEFAULT_SETTINGS.defaultFormat);
    });
  });

  describe('Requirement 6.2: Mermaid link text', () => {
    it('should have a default mermaid link text', () => {
      expect(DEFAULT_SETTINGS.mermaidLinkText).toBe('📊 View Diagram');
    });

    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_SETTINGS.mermaidLinkText).toBe('string');
      expect(DEFAULT_SETTINGS.mermaidLinkText.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 6.3: Include Mermaid type', () => {
    it('should have includeMermaidType enabled by default', () => {
      expect(DEFAULT_SETTINGS.includeMermaidType).toBe(true);
    });

    it('should be a boolean', () => {
      expect(typeof DEFAULT_SETTINGS.includeMermaidType).toBe('boolean');
    });
  });

  describe('Requirement 6.4: Code block font', () => {
    it('should have Consolas as default code font', () => {
      expect(DEFAULT_SETTINGS.codeBlockFont).toBe('Consolas');
    });

    it('should be a non-empty string', () => {
      expect(typeof DEFAULT_SETTINGS.codeBlockFont).toBe('string');
      expect(DEFAULT_SETTINGS.codeBlockFont.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 6.5: Code block background color', () => {
    it('should have a default background color', () => {
      expect(DEFAULT_SETTINGS.codeBlockBackground).toBe('#f5f5f5');
    });

    it('should be a valid hex color format', () => {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      expect(hexRegex.test(DEFAULT_SETTINGS.codeBlockBackground)).toBe(true);
    });
  });

  describe('Requirement 6.6: Include language label', () => {
    it('should have includeLanguageLabel enabled by default', () => {
      expect(DEFAULT_SETTINGS.includeLanguageLabel).toBe(true);
    });

    it('should be a boolean', () => {
      expect(typeof DEFAULT_SETTINGS.includeLanguageLabel).toBe('boolean');
    });
  });

  describe('Requirement 6.7: Image handling mode', () => {
    it('should have embed as default image handling', () => {
      expect(DEFAULT_SETTINGS.imageHandling).toBe('embed');
    });

    it('should have a valid image handling value', () => {
      expect(['embed', 'link', 'skip']).toContain(DEFAULT_SETTINGS.imageHandling);
    });
  });

  describe('Requirement 6.8: Remove Obsidian links', () => {
    it('should have removeObsidianLinks enabled by default', () => {
      expect(DEFAULT_SETTINGS.removeObsidianLinks).toBe(true);
    });

    it('should be a boolean', () => {
      expect(typeof DEFAULT_SETTINGS.removeObsidianLinks).toBe('boolean');
    });
  });

  describe('Requirement 6.9: Open after export', () => {
    it('should have openAfterExport disabled by default', () => {
      expect(DEFAULT_SETTINGS.openAfterExport).toBe(false);
    });

    it('should be a boolean', () => {
      expect(typeof DEFAULT_SETTINGS.openAfterExport).toBe('boolean');
    });
  });

  describe('Type compatibility', () => {
    it('should satisfy PluginSettings interface', () => {
      const checkType = (settings: PluginSettings): boolean => {
        return (
          typeof settings.defaultFormat === 'string' &&
          typeof settings.exportLocation === 'string' &&
          typeof settings.mermaidLinkText === 'string' &&
          typeof settings.includeMermaidType === 'boolean' &&
          typeof settings.codeBlockFont === 'string' &&
          typeof settings.codeBlockBackground === 'string' &&
          typeof settings.includeLanguageLabel === 'boolean' &&
          typeof settings.imageHandling === 'string' &&
          typeof settings.removeObsidianLinks === 'boolean' &&
          typeof settings.openAfterExport === 'boolean'
        );
      };

      expect(checkType(DEFAULT_SETTINGS)).toBe(true);
    });

    it('should be spreadable without errors', () => {
      const customSettings = { ...DEFAULT_SETTINGS, codeBlockFont: 'Monaco' };
      expect(customSettings.codeBlockFont).toBe('Monaco');
      expect(customSettings.defaultFormat).toBe('docx');
    });

    it('should merge with custom settings correctly', () => {
      const loadedData = { codeBlockFont: 'Monaco', includeLanguageLabel: false };
      const merged = Object.assign({}, DEFAULT_SETTINGS, loadedData);

      expect(merged.codeBlockFont).toBe('Monaco');
      expect(merged.includeLanguageLabel).toBe(false);
      expect(merged.defaultFormat).toBe('docx');
      expect(merged.mermaidLinkText).toBe('📊 View Diagram');
    });
  });
});
