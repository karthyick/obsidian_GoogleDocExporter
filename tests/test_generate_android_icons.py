"""
Unit tests for Android icon generation script.
Tests icon generation, dimension verification, and round icon creation.
"""

import os
import sys
import tempfile
import shutil
import pytest
from PIL import Image

# Add scripts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from generate_android_icons import (
    render_kr_logo,
    generate_png_from_svg,
    generate_round_icon,
    generate_adaptive_foreground,
    interpolate_color,
    ANDROID_DENSITIES,
    ADAPTIVE_FOREGROUND_SIZES,
    BACKGROUND_COLOR,
    CYAN,
    PURPLE,
)


class TestInterpolateColor:
    """Tests for color interpolation function."""

    def test_interpolate_same_color(self):
        """Test interpolation between identical colors returns same color."""
        color = (100, 150, 200, 255)
        result = interpolate_color(color, color, 0.5)
        assert result == color

    def test_interpolate_at_start(self):
        """Test t=0 returns first color."""
        color1 = (0, 0, 0, 255)
        color2 = (255, 255, 255, 255)
        result = interpolate_color(color1, color2, 0.0)
        assert result == color1

    def test_interpolate_at_end(self):
        """Test t=1 returns second color."""
        color1 = (0, 0, 0, 255)
        color2 = (255, 255, 255, 255)
        result = interpolate_color(color1, color2, 1.0)
        assert result == color2

    def test_interpolate_midpoint(self):
        """Test t=0.5 returns midpoint color."""
        color1 = (0, 0, 0, 255)
        color2 = (100, 200, 100, 255)
        result = interpolate_color(color1, color2, 0.5)
        # Alpha is also interpolated: (255 + 255) / 2 = 255
        assert result == (50, 100, 50, 255)

    def test_interpolate_cyan_to_purple(self):
        """Test interpolation from cyan to purple (as used in logo)."""
        result = interpolate_color(CYAN[:3], PURPLE[:3], 0.5)
        # Midpoint between cyan (0, 217, 255) and purple (124, 58, 237)
        assert result[0] == 62  # (0 + 124) / 2
        assert result[1] == 137  # (217 + 58) / 2 = 137.5 -> 137
        assert result[2] == 246  # (255 + 237) / 2


class TestRenderKrLogo:
    """Tests for KR logo rendering function."""

    def test_render_logo_returns_image(self):
        """Test that render_kr_logo returns a PIL Image."""
        img = render_kr_logo(100)
        assert isinstance(img, Image.Image)

    def test_render_logo_correct_size(self):
        """Test that rendered logo has correct dimensions."""
        for size in [48, 72, 96, 144, 192]:
            img = render_kr_logo(size)
            assert img.size == (size, size), f"Expected {size}x{size}, got {img.size}"

    def test_render_logo_rgba_mode(self):
        """Test that rendered logo is in RGBA mode."""
        img = render_kr_logo(100)
        assert img.mode == 'RGBA'

    def test_render_logo_has_background(self):
        """Test that logo has dark background in corners."""
        img = render_kr_logo(200)
        # Check corner pixel (should be close to background color)
        pixel = img.getpixel((0, 0))
        assert pixel[:3] == BACKGROUND_COLOR[:3]

    def test_render_logo_not_empty(self):
        """Test that logo is not just solid background."""
        img = render_kr_logo(200)
        # Get histogram and check for multiple colors
        histogram = img.histogram()
        non_zero_bins = sum(1 for h in histogram if h > 0)
        assert non_zero_bins > 10, "Logo appears to be single-color"

    def test_render_logo_all_android_sizes(self):
        """Test rendering at all Android density sizes."""
        for density, size in ANDROID_DENSITIES.items():
            img = render_kr_logo(size)
            assert img.size == (size, size), f"Failed for {density}"


class TestGeneratePngFromSvg:
    """Tests for PNG generation from SVG."""

    def test_generate_png_creates_file(self):
        """Test that generate_png_from_svg creates a PNG file."""
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = os.path.join(tmpdir, 'test.png')
            svg_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'kr-logo.svg')

            result = generate_png_from_svg(svg_path, output_path, 100)

            assert result is True
            assert os.path.exists(output_path)

    def test_generate_png_correct_dimensions(self):
        """Test that generated PNG has correct dimensions."""
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = os.path.join(tmpdir, 'test.png')
            svg_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'kr-logo.svg')

            generate_png_from_svg(svg_path, output_path, 150)

            with Image.open(output_path) as img:
                assert img.size == (150, 150)

    def test_generate_png_is_valid_image(self):
        """Test that generated file is a valid PNG image."""
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = os.path.join(tmpdir, 'test.png')
            svg_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'kr-logo.svg')

            generate_png_from_svg(svg_path, output_path, 100)

            # Should not raise exception
            with Image.open(output_path) as img:
                img.verify()


class TestGenerateRoundIcon:
    """Tests for round icon generation."""

    def test_generate_round_icon_creates_file(self):
        """Test that round icon is created successfully."""
        with tempfile.TemporaryDirectory() as tmpdir:
            # First create a source PNG
            source_path = os.path.join(tmpdir, 'source.png')
            round_path = os.path.join(tmpdir, 'round.png')

            img = render_kr_logo(100)
            img.save(source_path, 'PNG')

            result = generate_round_icon(source_path, round_path)

            assert result is True
            assert os.path.exists(round_path)

    def test_generate_round_icon_same_dimensions(self):
        """Test that round icon has same dimensions as source."""
        with tempfile.TemporaryDirectory() as tmpdir:
            source_path = os.path.join(tmpdir, 'source.png')
            round_path = os.path.join(tmpdir, 'round.png')

            img = render_kr_logo(150)
            img.save(source_path, 'PNG')

            generate_round_icon(source_path, round_path)

            with Image.open(round_path) as round_img:
                assert round_img.size == (150, 150)

    def test_generate_round_icon_has_transparency(self):
        """Test that round icon has transparent corners."""
        with tempfile.TemporaryDirectory() as tmpdir:
            source_path = os.path.join(tmpdir, 'source.png')
            round_path = os.path.join(tmpdir, 'round.png')

            img = render_kr_logo(100)
            img.save(source_path, 'PNG')

            generate_round_icon(source_path, round_path)

            with Image.open(round_path) as round_img:
                # Corner pixel should be transparent
                corner_pixel = round_img.getpixel((0, 0))
                assert corner_pixel[3] == 0, "Corner should be transparent"

    def test_generate_round_icon_center_not_transparent(self):
        """Test that round icon center is not transparent."""
        with tempfile.TemporaryDirectory() as tmpdir:
            source_path = os.path.join(tmpdir, 'source.png')
            round_path = os.path.join(tmpdir, 'round.png')

            img = render_kr_logo(100)
            img.save(source_path, 'PNG')

            generate_round_icon(source_path, round_path)

            with Image.open(round_path) as round_img:
                # Center pixel should not be transparent
                center_pixel = round_img.getpixel((50, 50))
                assert center_pixel[3] > 0, "Center should not be transparent"


class TestGenerateAdaptiveForeground:
    """Tests for adaptive icon foreground generation."""

    def test_generate_foreground_creates_file(self):
        """Test that adaptive foreground is created successfully."""
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = os.path.join(tmpdir, 'foreground.png')
            svg_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'kr-logo.svg')

            result = generate_adaptive_foreground(svg_path, output_path, 108)

            assert result is True
            assert os.path.exists(output_path)

    def test_generate_foreground_correct_dimensions(self):
        """Test that adaptive foreground has correct dimensions."""
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = os.path.join(tmpdir, 'foreground.png')
            svg_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'kr-logo.svg')

            generate_adaptive_foreground(svg_path, output_path, 108)

            with Image.open(output_path) as img:
                assert img.size == (108, 108)

    def test_generate_foreground_has_padding(self):
        """Test that adaptive foreground has transparent padding."""
        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = os.path.join(tmpdir, 'foreground.png')
            svg_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'kr-logo.svg')

            generate_adaptive_foreground(svg_path, output_path, 108)

            with Image.open(output_path) as img:
                # Top-left corner should be transparent (padding area)
                corner_pixel = img.getpixel((5, 5))
                assert corner_pixel[3] == 0 or corner_pixel[:3] == (0, 0, 0), \
                    "Corner should be transparent or black padding"

    def test_generate_foreground_all_android_sizes(self):
        """Test foreground generation at all Android adaptive sizes."""
        with tempfile.TemporaryDirectory() as tmpdir:
            svg_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'kr-logo.svg')

            for density, size in ADAPTIVE_FOREGROUND_SIZES.items():
                output_path = os.path.join(tmpdir, f'{density}_foreground.png')
                result = generate_adaptive_foreground(svg_path, output_path, size)

                assert result is True, f"Failed for {density}"
                with Image.open(output_path) as img:
                    assert img.size == (size, size), f"Wrong size for {density}"


class TestAndroidDensityConstants:
    """Tests for Android density constant definitions."""

    def test_mdpi_size(self):
        """Test mdpi icon size is 48x48."""
        assert ANDROID_DENSITIES['mipmap-mdpi'] == 48

    def test_hdpi_size(self):
        """Test hdpi icon size is 72x72."""
        assert ANDROID_DENSITIES['mipmap-hdpi'] == 72

    def test_xhdpi_size(self):
        """Test xhdpi icon size is 96x96."""
        assert ANDROID_DENSITIES['mipmap-xhdpi'] == 96

    def test_xxhdpi_size(self):
        """Test xxhdpi icon size is 144x144."""
        assert ANDROID_DENSITIES['mipmap-xxhdpi'] == 144

    def test_xxxhdpi_size(self):
        """Test xxxhdpi icon size is 192x192."""
        assert ANDROID_DENSITIES['mipmap-xxxhdpi'] == 192

    def test_all_densities_present(self):
        """Test all required Android densities are defined."""
        required = ['mipmap-mdpi', 'mipmap-hdpi', 'mipmap-xhdpi', 'mipmap-xxhdpi', 'mipmap-xxxhdpi']
        for density in required:
            assert density in ANDROID_DENSITIES

    def test_adaptive_foreground_sizes_ratio(self):
        """Test adaptive foreground sizes are 1.5x launcher sizes."""
        for density in ANDROID_DENSITIES:
            launcher_size = ANDROID_DENSITIES[density]
            foreground_size = ADAPTIVE_FOREGROUND_SIZES[density]
            # 108/72 = 1.5 ratio
            expected = int(launcher_size * 108 / 48)
            assert foreground_size == expected, f"Wrong foreground size for {density}"


class TestColorConstants:
    """Tests for color constant definitions."""

    def test_background_color_dark(self):
        """Test background color is dark."""
        r, g, b, a = BACKGROUND_COLOR
        assert r < 50 and g < 50 and b < 50

    def test_cyan_color_valid(self):
        """Test cyan color is correctly defined."""
        assert CYAN == (0, 217, 255, 255)

    def test_purple_color_valid(self):
        """Test purple color is correctly defined."""
        assert PURPLE == (124, 58, 237, 255)

    def test_colors_are_rgba(self):
        """Test all colors have 4 components (RGBA)."""
        assert len(BACKGROUND_COLOR) == 4
        assert len(CYAN) == 4
        assert len(PURPLE) == 4


class TestGeneratedIconsIntegration:
    """Integration tests for the complete icon generation workflow."""

    def test_full_icon_set_generation(self):
        """Test generating a complete set of Android icons."""
        with tempfile.TemporaryDirectory() as tmpdir:
            svg_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'kr-logo.svg')

            for density, size in ANDROID_DENSITIES.items():
                density_dir = os.path.join(tmpdir, density)
                os.makedirs(density_dir, exist_ok=True)

                # Generate launcher icon
                launcher_path = os.path.join(density_dir, 'ic_launcher.png')
                assert generate_png_from_svg(svg_path, launcher_path, size)

                # Generate round icon
                round_path = os.path.join(density_dir, 'ic_launcher_round.png')
                assert generate_round_icon(launcher_path, round_path)

                # Verify files exist
                assert os.path.exists(launcher_path)
                assert os.path.exists(round_path)

                # Verify dimensions
                with Image.open(launcher_path) as img:
                    assert img.size == (size, size)
                with Image.open(round_path) as img:
                    assert img.size == (size, size)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
