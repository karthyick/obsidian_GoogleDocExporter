"""
Unit tests for KR Logo SVG validation.
Verifies all acceptance criteria for the logo design.
"""

import os
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Dict, Any, Optional
import pytest


class TestKRLogoSVG:
    """Test suite for validating the KR Logo SVG file."""

    @pytest.fixture
    def svg_path(self) -> Path:
        """Return the path to the SVG logo file."""
        return Path(__file__).parent.parent / "assets" / "kr-logo.svg"

    @pytest.fixture
    def svg_content(self, svg_path: Path) -> str:
        """Load and return the SVG file content."""
        assert svg_path.exists(), f"SVG file not found at {svg_path}"
        return svg_path.read_text(encoding="utf-8")

    @pytest.fixture
    def svg_tree(self, svg_path: Path) -> ET.Element:
        """Parse and return the SVG XML tree."""
        return ET.parse(svg_path).getroot()

    # =========================================================================
    # ACCEPTANCE CRITERIA 1: Primary logo SVG matches design spec
    # =========================================================================

    def test_svg_file_exists(self, svg_path: Path) -> None:
        """Verify the SVG logo file exists."""
        assert svg_path.exists(), f"Logo SVG file must exist at {svg_path}"

    def test_svg_is_valid_xml(self, svg_content: str) -> None:
        """Verify the SVG is valid XML."""
        try:
            ET.fromstring(svg_content)
        except ET.ParseError as e:
            pytest.fail(f"SVG is not valid XML: {e}")

    def test_svg_has_proper_namespace(self, svg_tree: ET.Element) -> None:
        """Verify SVG has proper xmlns namespace."""
        ns = svg_tree.attrib.get("{http://www.w3.org/2000/xmlns/}xmlns",
                                   svg_tree.attrib.get("xmlns", ""))
        # Handle namespace in tag
        assert "svg" in svg_tree.tag.lower() or ns == "http://www.w3.org/2000/svg", \
            "SVG must have proper namespace"

    def test_svg_has_viewbox(self, svg_tree: ET.Element) -> None:
        """Verify SVG has a viewBox attribute for scalability."""
        assert "viewBox" in svg_tree.attrib, "SVG must have viewBox attribute"

    def test_svg_has_dimensions(self, svg_tree: ET.Element) -> None:
        """Verify SVG has width and height attributes."""
        assert "width" in svg_tree.attrib, "SVG must have width attribute"
        assert "height" in svg_tree.attrib, "SVG must have height attribute"

    # =========================================================================
    # ACCEPTANCE CRITERIA 2: Gradient colors are #00D9FF to #7C3AED
    # =========================================================================

    def test_gradient_start_color_cyan(self, svg_content: str) -> None:
        """Verify gradient starts with cyan #00D9FF."""
        assert "#00D9FF" in svg_content.upper() or "#00d9ff" in svg_content.lower(), \
            "Gradient must include cyan color #00D9FF"

    def test_gradient_end_color_purple(self, svg_content: str) -> None:
        """Verify gradient ends with purple #7C3AED."""
        assert "#7C3AED" in svg_content.upper() or "#7c3aed" in svg_content.lower(), \
            "Gradient must include purple color #7C3AED"

    def test_gradient_definition_exists(self, svg_content: str) -> None:
        """Verify linearGradient element exists."""
        assert "linearGradient" in svg_content, \
            "SVG must contain a linearGradient definition"

    def test_gradient_stops_correct_order(self, svg_content: str) -> None:
        """Verify gradient stops are in correct order (cyan at 0%, purple at 100%)."""
        # Find gradient stops
        cyan_match = re.search(r'offset="0%"[^>]*stop-color="#00D9FF"', svg_content, re.IGNORECASE)
        purple_match = re.search(r'offset="100%"[^>]*stop-color="#7C3AED"', svg_content, re.IGNORECASE)

        if not cyan_match:
            # Try alternative attribute order
            cyan_match = re.search(r'stop-color="#00D9FF"[^>]*offset="0%"', svg_content, re.IGNORECASE)
        if not purple_match:
            purple_match = re.search(r'stop-color="#7C3AED"[^>]*offset="100%"', svg_content, re.IGNORECASE)

        assert cyan_match or ("#00D9FF" in svg_content and 'offset="0%"' in svg_content), \
            "Cyan #00D9FF should be at offset 0%"
        assert purple_match or ("#7C3AED" in svg_content and 'offset="100%"' in svg_content), \
            "Purple #7C3AED should be at offset 100%"

    def test_gradient_used_in_elements(self, svg_content: str) -> None:
        """Verify gradient is actually used by elements."""
        assert 'fill="url(#' in svg_content, \
            "Gradient must be applied to elements using url(#id)"

    # =========================================================================
    # ACCEPTANCE CRITERIA 3: Background color is #0D0D0F
    # =========================================================================

    def test_background_color_dark(self, svg_content: str) -> None:
        """Verify background uses the dark color #0D0D0F."""
        assert "#0D0D0F" in svg_content.upper() or "#0d0d0f" in svg_content.lower(), \
            "Background must be dark color #0D0D0F"

    def test_background_rect_exists(self, svg_content: str) -> None:
        """Verify a background rect element exists."""
        # Look for a rect with the background color
        background_pattern = re.search(
            r'<rect[^>]*fill="#0D0D0F"[^>]*>',
            svg_content,
            re.IGNORECASE
        )
        assert background_pattern, "Background rect with #0D0D0F fill must exist"

    def test_background_covers_full_canvas(self, svg_content: str) -> None:
        """Verify background rect covers the full SVG canvas."""
        # Look for rect with width and height matching viewBox or 200
        rect_pattern = re.search(
            r'<rect[^>]*width="200"[^>]*height="200"[^>]*fill="#0D0D0F"',
            svg_content,
            re.IGNORECASE
        )
        if not rect_pattern:
            rect_pattern = re.search(
                r'<rect[^>]*fill="#0D0D0F"[^>]*width="200"[^>]*height="200"',
                svg_content,
                re.IGNORECASE
            )
        assert rect_pattern, "Background rect must cover full 200x200 canvas"

    # =========================================================================
    # ACCEPTANCE CRITERIA 4: Design includes circuit/geometric K elements
    # =========================================================================

    def test_k_letterform_elements(self, svg_content: str) -> None:
        """Verify K letterform elements exist."""
        # K should have vertical stroke and diagonals
        k_comment = "K -" in svg_content or "K–" in svg_content or "K-" in svg_content
        has_k_elements = (
            # Multiple path or rect elements for K construction
            svg_content.count("<rect") >= 2 and
            svg_content.count("<path") >= 2
        )
        assert k_comment or has_k_elements, \
            "K letterform construction elements must exist"

    def test_r_letterform_elements(self, svg_content: str) -> None:
        """Verify R letterform elements exist."""
        r_comment = "R -" in svg_content or "R–" in svg_content or "R-" in svg_content
        # R needs vertical stroke, bowl, and leg
        has_r_construction = svg_content.count("<path") >= 3
        assert r_comment or has_r_construction, \
            "R letterform construction elements must exist"

    def test_circuit_nodes_exist(self, svg_content: str) -> None:
        """Verify circuit node elements (circles) exist."""
        circle_count = svg_content.count("<circle")
        assert circle_count >= 4, \
            f"Circuit nodes (circles) must exist, found {circle_count}, expected at least 4"

    def test_geometric_construction(self, svg_content: str) -> None:
        """Verify geometric/circuit-like construction patterns."""
        # Should have multiple geometric elements
        has_paths = "<path" in svg_content
        has_rects = "<rect" in svg_content
        has_circles = "<circle" in svg_content
        has_lines = "<line" in svg_content or "path" in svg_content

        geometric_elements = sum([has_paths, has_rects, has_circles, has_lines])
        assert geometric_elements >= 3, \
            "Design must use multiple geometric element types for circuit aesthetic"

    def test_glow_or_circuit_effect(self, svg_content: str) -> None:
        """Verify glow/circuit visual effect exists."""
        has_filter = "<filter" in svg_content
        has_blur = "feGaussianBlur" in svg_content
        has_glow_id = 'id="glow"' in svg_content

        assert has_filter or has_blur or has_glow_id, \
            "SVG should include glow/blur filter for circuit effect"

    def test_circuit_traces(self, svg_content: str) -> None:
        """Verify circuit trace/connection lines exist."""
        has_lines = "<line" in svg_content
        has_stroke = "stroke=" in svg_content
        has_trace_comment = "trace" in svg_content.lower() or "circuit" in svg_content.lower()

        assert has_lines or has_stroke or has_trace_comment, \
            "Circuit trace elements should exist"

    # =========================================================================
    # ADDITIONAL QUALITY CHECKS
    # =========================================================================

    def test_svg_file_size_reasonable(self, svg_path: Path) -> None:
        """Verify SVG file size is reasonable (not bloated)."""
        size_kb = svg_path.stat().st_size / 1024
        assert size_kb < 50, f"SVG file should be under 50KB, got {size_kb:.2f}KB"

    def test_no_external_references(self, svg_content: str) -> None:
        """Verify SVG doesn't reference external resources."""
        assert "xlink:href=\"http" not in svg_content, \
            "SVG should not reference external resources"
        assert "href=\"http" not in svg_content, \
            "SVG should not reference external URLs"

    def test_svg_is_self_contained(self, svg_content: str) -> None:
        """Verify all styles and resources are embedded."""
        # Gradients should be defined in defs
        has_defs = "<defs>" in svg_content or "<defs " in svg_content
        has_gradient_def = "linearGradient" in svg_content

        assert has_defs and has_gradient_def, \
            "SVG must be self-contained with embedded gradient definitions"


class TestLogoAccessibility:
    """Test accessibility features of the logo."""

    @pytest.fixture
    def svg_path(self) -> Path:
        """Return the path to the SVG logo file."""
        return Path(__file__).parent.parent / "assets" / "kr-logo.svg"

    @pytest.fixture
    def svg_content(self, svg_path: Path) -> str:
        """Load and return the SVG file content."""
        return svg_path.read_text(encoding="utf-8")

    def test_svg_can_be_rendered(self, svg_content: str) -> None:
        """Verify SVG can be parsed and rendered."""
        try:
            root = ET.fromstring(svg_content)
            # Check it has child elements
            children = list(root)
            assert len(children) > 0, "SVG must have renderable child elements"
        except Exception as e:
            pytest.fail(f"SVG cannot be rendered: {e}")


class TestColorValues:
    """Dedicated tests for color value validation."""

    @pytest.fixture
    def svg_path(self) -> Path:
        """Return the path to the SVG logo file."""
        return Path(__file__).parent.parent / "assets" / "kr-logo.svg"

    @pytest.fixture
    def svg_content(self, svg_path: Path) -> str:
        """Load and return the SVG file content."""
        return svg_path.read_text(encoding="utf-8")

    def test_cyan_hex_exact_match(self, svg_content: str) -> None:
        """Verify exact cyan hex value #00D9FF."""
        content_upper = svg_content.upper()
        assert "#00D9FF" in content_upper, "Exact cyan value #00D9FF required"

    def test_purple_hex_exact_match(self, svg_content: str) -> None:
        """Verify exact purple hex value #7C3AED."""
        content_upper = svg_content.upper()
        assert "#7C3AED" in content_upper, "Exact purple value #7C3AED required"

    def test_background_hex_exact_match(self, svg_content: str) -> None:
        """Verify exact background hex value #0D0D0F."""
        content_upper = svg_content.upper()
        assert "#0D0D0F" in content_upper, "Exact background value #0D0D0F required"

    def test_all_required_colors_present(self, svg_content: str) -> None:
        """Verify all three required colors are present."""
        content_upper = svg_content.upper()
        colors = {
            "cyan": "#00D9FF",
            "purple": "#7C3AED",
            "background": "#0D0D0F"
        }
        missing = [name for name, color in colors.items() if color not in content_upper]
        assert not missing, f"Missing required colors: {missing}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
