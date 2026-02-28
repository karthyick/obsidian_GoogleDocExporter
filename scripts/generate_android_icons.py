#!/usr/bin/env python
"""
Generate Android PNG icons at all required densities from SVG source.
Densities: mdpi (48x48), hdpi (72x72), xhdpi (96x96), xxhdpi (144x144), xxxhdpi (192x192)

Uses pure Pillow for Windows compatibility (no Cairo dependency).
Re-renders the KR logo SVG design using Pillow drawing operations.
"""

import os
import math
from PIL import Image, ImageDraw

# Android icon density specifications
ANDROID_DENSITIES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

# For adaptive icons, foreground is 108dp (1.5x the final size for safe zone)
ADAPTIVE_FOREGROUND_SIZES = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432,
}

# Colors from the SVG
BACKGROUND_COLOR = (13, 13, 15, 255)  # #0D0D0F
CYAN = (0, 217, 255, 255)  # #00D9FF
PURPLE = (124, 58, 237, 255)  # #7C3AED


def interpolate_color(color1: tuple, color2: tuple, t: float) -> tuple:
    """Interpolate between two colors."""
    return tuple(int(c1 + (c2 - c1) * t) for c1, c2 in zip(color1, color2))


def render_kr_logo(size: int) -> Image.Image:
    """
    Render the KR logo at the specified size using Pillow.

    This recreates the SVG design programmatically.
    Original SVG viewBox is 200x200, so scale = size/200.

    Args:
        size: Target size in pixels

    Returns:
        PIL Image of the rendered logo
    """
    scale = size / 200.0

    # Create image with background
    img = Image.new('RGBA', (size, size), BACKGROUND_COLOR)
    draw = ImageDraw.Draw(img)

    def s(v):
        """Scale a coordinate value."""
        return int(v * scale)

    def sp(coords):
        """Scale a list of coordinate pairs."""
        return [(s(x), s(y)) for x, y in coords]

    # Get gradient color based on position (top-left to bottom-right diagonal)
    def gradient_color(x, y):
        """Get gradient color from cyan to purple based on position."""
        # Normalize position along diagonal
        t = ((x / 200) + (y / 200)) / 2
        return interpolate_color(CYAN[:3], PURPLE[:3], t) + (255,)

    # Draw K - Main vertical stroke
    k_vert = [(35, 40), (49, 40), (49, 160), (35, 160)]
    draw.polygon(sp(k_vert), fill=gradient_color(42, 100))

    # K - Upper diagonal
    k_upper = [(49, 100), (90, 50), (90, 40), (85, 40), (85, 48), (49, 95)]
    draw.polygon(sp(k_upper), fill=gradient_color(70, 70))

    # K - Lower diagonal
    k_lower = [(49, 105), (90, 155), (90, 160), (85, 160), (85, 152), (49, 100)]
    draw.polygon(sp(k_lower), fill=gradient_color(70, 130))

    # K - Circuit node top
    draw.ellipse([s(84), s(38), s(96), s(50)], fill=gradient_color(90, 44))

    # K - Circuit node bottom
    draw.ellipse([s(84), s(150), s(96), s(162)], fill=gradient_color(90, 156))

    # K - Connection dots along diagonals
    draw.ellipse([s(62), s(72), s(68), s(78)], fill=CYAN)
    draw.ellipse([s(72), s(59), s(78), s(65)], fill=CYAN)
    draw.ellipse([s(62), s(122), s(68), s(128)], fill=PURPLE)
    draw.ellipse([s(72), s(135), s(78), s(141)], fill=PURPLE)

    # R - Main vertical stroke
    r_vert = [(110, 40), (124, 40), (124, 160), (110, 160)]
    draw.polygon(sp(r_vert), fill=gradient_color(117, 100))

    # R - Bowl (top curved part) - simplified as rectangles
    # Top bar of bowl
    draw.rectangle([s(124), s(40), s(165), s(52)], fill=gradient_color(145, 46))
    # Right side of bowl
    draw.rectangle([s(163), s(52), s(175), s(78)], fill=gradient_color(169, 65))
    # Bottom bar of bowl
    draw.rectangle([s(124), s(78), s(163), s(90)], fill=gradient_color(143, 84))
    # Rounded corners for bowl
    draw.ellipse([s(155), s(40), s(175), s(60)], fill=gradient_color(165, 50))
    draw.ellipse([s(155), s(70), s(175), s(90)], fill=gradient_color(165, 80))

    # R - Leg (diagonal)
    r_leg = [(124, 90), (160, 160), (148, 160), (118, 100)]
    draw.polygon(sp(r_leg), fill=gradient_color(139, 125))

    # R - Circuit node at leg end
    draw.ellipse([s(148), s(154), s(160), s(166)], fill=gradient_color(154, 160))

    # R - Connection dots along leg
    draw.ellipse([s(132), s(112), s(138), s(118)], fill=CYAN)
    draw.ellipse([s(142), s(132), s(148), s(138)], fill=PURPLE)

    # Circuit trace line connecting K and R (with reduced opacity)
    # Create a separate layer for the trace
    trace_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    trace_draw = ImageDraw.Draw(trace_layer)
    trace_color = interpolate_color(CYAN[:3], PURPLE[:3], 0.5)[:3] + (100,)
    trace_draw.line([sp([(49, 100), (110, 100)])[0], sp([(49, 100), (110, 100)])[1]],
                    fill=trace_color, width=max(1, s(1)))
    # Small circuit dots on trace
    trace_draw.ellipse([s(68), s(98), s(72), s(102)], fill=CYAN[:3] + (100,))
    trace_draw.ellipse([s(88), s(98), s(92), s(102)], fill=trace_color)
    img = Image.alpha_composite(img, trace_layer)

    # Outer circuit frame (subtle)
    frame_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame_layer)
    frame_color = interpolate_color(CYAN[:3], PURPLE[:3], 0.5)[:3] + (75,)
    frame_draw.rounded_rectangle([s(20), s(25), s(180), s(175)], radius=s(8),
                                  outline=frame_color, width=max(1, s(1)))
    img = Image.alpha_composite(img, frame_layer)

    # Corner circuit nodes
    corner_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    corner_draw = ImageDraw.Draw(corner_layer)
    corner_draw.ellipse([s(17), s(22), s(23), s(28)], fill=CYAN[:3] + (128,))
    corner_draw.ellipse([s(177), s(22), s(183), s(28)], fill=CYAN[:3] + (128,))
    corner_draw.ellipse([s(17), s(172), s(23), s(178)], fill=PURPLE[:3] + (128,))
    corner_draw.ellipse([s(177), s(172), s(183), s(178)], fill=PURPLE[:3] + (128,))
    img = Image.alpha_composite(img, corner_layer)

    return img


def generate_png_from_svg(svg_path: str, output_path: str, size: int) -> bool:
    """
    Generate PNG at specified size by rendering the KR logo.

    Args:
        svg_path: Path to source SVG file (used for verification)
        output_path: Path to output PNG file
        size: Target size in pixels (both width and height)

    Returns:
        True if successful, False otherwise
    """
    try:
        # Render the logo
        img = render_kr_logo(size)
        img.save(output_path, 'PNG')
        return True
    except Exception as e:
        print(f"  Error generating {output_path}: {e}")
        return False


def generate_round_icon(png_path: str, output_path: str) -> bool:
    """
    Generate a round version of the icon with circular mask.

    Args:
        png_path: Path to source PNG
        output_path: Path to output round PNG

    Returns:
        True if successful, False otherwise
    """
    try:
        # Open the source image
        with Image.open(png_path) as img:
            # Ensure RGBA mode
            img = img.convert('RGBA')
            size = img.size[0]

            # Create circular mask
            mask = Image.new('L', (size, size), 0)
            draw = ImageDraw.Draw(mask)
            draw.ellipse((0, 0, size - 1, size - 1), fill=255)

            # Apply mask to create round icon
            output = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            output.paste(img, mask=mask)
            output.save(output_path, 'PNG')

        return True
    except Exception as e:
        print(f"  Error creating round icon from {png_path}: {e}")
        return False


def generate_adaptive_foreground(svg_path: str, output_path: str, size: int) -> bool:
    """
    Generate adaptive icon foreground with proper padding.
    Adaptive icons have a 108dp canvas with 72dp safe zone centered.

    Args:
        svg_path: Path to source SVG
        output_path: Path to output PNG
        size: Target canvas size (108dp equivalent)

    Returns:
        True if successful, False otherwise
    """
    try:
        # The actual icon should be 2/3 of the canvas size (72dp out of 108dp)
        icon_size = int(size * 72 / 108)
        padding = (size - icon_size) // 2

        # Generate temp icon at smaller size
        temp_path = output_path + '.temp.png'
        if not generate_png_from_svg(svg_path, temp_path, icon_size):
            return False

        # Create the foreground canvas with the icon centered
        with Image.open(temp_path) as icon:
            icon = icon.convert('RGBA')
            canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
            canvas.paste(icon, (padding, padding))
            canvas.save(output_path, 'PNG')

        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        return True
    except Exception as e:
        print(f"  Error creating adaptive foreground: {e}")
        return False


def main():
    """Generate all Android icon variants."""
    # Paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(script_dir, '..', 'assets')
    svg_path = os.path.join(assets_dir, 'kr-logo.svg')
    android_dir = os.path.join(assets_dir, 'android')

    # Verify SVG exists
    if not os.path.exists(svg_path):
        print(f"Error: SVG not found at {svg_path}")
        return False

    print(f"Source SVG: {svg_path}")
    print(f"Output directory: {android_dir}")
    print()

    # Create android directory if it doesn't exist
    os.makedirs(android_dir, exist_ok=True)

    success_count = 0
    total_count = 0

    # Generate icons for each density
    for density, size in ANDROID_DENSITIES.items():
        density_dir = os.path.join(android_dir, density)
        os.makedirs(density_dir, exist_ok=True)

        # Standard launcher icon
        ic_launcher_path = os.path.join(density_dir, 'ic_launcher.png')
        print(f"Generating {density}/ic_launcher.png ({size}x{size}px)...")
        total_count += 1
        if generate_png_from_svg(svg_path, ic_launcher_path, size):
            success_count += 1
            print(f"  [OK] Created {ic_launcher_path}")

        # Round launcher icon
        ic_launcher_round_path = os.path.join(density_dir, 'ic_launcher_round.png')
        print(f"Generating {density}/ic_launcher_round.png ({size}x{size}px)...")
        total_count += 1
        if generate_round_icon(ic_launcher_path, ic_launcher_round_path):
            success_count += 1
            print(f"  [OK] Created {ic_launcher_round_path}")

    # Generate adaptive icon foregrounds
    print()
    print("Generating adaptive icon foregrounds...")
    for density, size in ADAPTIVE_FOREGROUND_SIZES.items():
        density_dir = os.path.join(android_dir, density)
        foreground_path = os.path.join(density_dir, 'ic_launcher_foreground.png')
        print(f"Generating {density}/ic_launcher_foreground.png ({size}x{size}px)...")
        total_count += 1
        if generate_adaptive_foreground(svg_path, foreground_path, size):
            success_count += 1
            print(f"  [OK] Created {foreground_path}")

    print()
    print(f"Generation complete: {success_count}/{total_count} icons created successfully")

    return success_count == total_count


if __name__ == '__main__':
    import sys
    sys.exit(0 if main() else 1)
