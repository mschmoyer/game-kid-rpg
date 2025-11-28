#!/bin/bash
# Convert all SVG sprites to PNG for game performance
# Uses librsvg's rsvg-convert

SPRITES_DIR="/Users/mike.schmoyer/Documents/GitHub/game-kid-rpg/sprites"
PNG_DIR="$SPRITES_DIR/png"

# Create output directories
mkdir -p "$PNG_DIR"/{monsters,heroes,gear,items,npcs,tiles/town,tiles/dungeon,ui,effects}

# Counter for progress
total=0
converted=0

# Count total files
total=$(find "$SPRITES_DIR" -name "*.svg" -not -path "*/png/*" | wc -l | tr -d ' ')
echo "Converting $total SVG files to PNG..."
echo ""

# Convert each SVG to PNG
find "$SPRITES_DIR" -name "*.svg" -not -path "*/png/*" | while read svg_file; do
    # Get relative path from sprites dir
    rel_path="${svg_file#$SPRITES_DIR/}"

    # Determine output path (replace .svg with .png, put in png/ folder)
    # Remove any leading directory that's not a category
    category_path=$(dirname "$rel_path")
    filename=$(basename "$rel_path" .svg)

    output_file="$PNG_DIR/$category_path/$filename.png"

    # Create output directory if needed
    mkdir -p "$(dirname "$output_file")"

    # Convert using rsvg-convert (renders at native viewBox size)
    if rsvg-convert "$svg_file" -o "$output_file" 2>/dev/null; then
        echo "✓ $rel_path"
        ((converted++))
    else
        echo "✗ FAILED: $rel_path"
    fi
done

echo ""
echo "Conversion complete!"
