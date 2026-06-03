"""
analyze_tileset.py — Analisis tile index dari tileset menggunakan Mimo API.

Usage:
    pip install requests pillow
    $env:MIMO_API_KEY="isi_api_key_mimo_kamu"
    python analyze_tileset.py
"""

import base64
import json
import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("Error: 'requests' package not installed. Run: pip install requests")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Error: 'pillow' package not installed. Run: pip install pillow")
    sys.exit(1)


# --- Config ---
TILESET_PATH = Path("public/assets/tilesets/limezu/SERENE_VILLAGE_REVAMPED/Serene_Village_16x16.png")
API_URL = "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions"
MODEL = "mimo-v2.5"


def get_base64_image(path: Path) -> str:
    """Read image file and return base64-encoded string."""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def get_image_info(path: Path) -> dict:
    """Get basic image dimensions."""
    with Image.open(path) as img:
        width, height = img.size
        tile_size = 16
        cols = width // tile_size
        rows = height // tile_size
        return {
            "width": width,
            "height": height,
            "tile_size": tile_size,
            "columns": cols,
            "rows": rows,
            "total_tiles": cols * rows,
        }


def analyze_tileset(api_key: str) -> dict:
    """Send tileset image to Mimo API and get tile index mapping."""
    if not TILESET_PATH.exists():
        print(f"Error: Tileset not found at {TILESET_PATH}")
        sys.exit(1)

    info = get_image_info(TILESET_PATH)
    print(f"Tileset: {TILESET_PATH.name}")
    print(f"Size: {info['width']}x{info['height']} px")
    print(f"Grid: {info['columns']} cols × {info['rows']} rows = {info['total_tiles']} tiles")
    print()

    # Encode image
    b64_image = get_base64_image(TILESET_PATH)
    print(f"Base64 encoded ({len(b64_image)} chars)")

    prompt = f"""This is a {info['tile_size']}x{info['tile_size']} pixel art tileset image.
The grid has {info['columns']} columns and {info['rows']} rows, totaling {info['total_tiles']} tiles.
Index starts at 0 from top-left, counting left-to-right then top-to-bottom.
Formula: index = (row × {info['columns']}) + column

Please identify the tile index for each of these terrain/objects:
- grass (plain grass tile)
- dirt path / dirt road
- water / river
- tree trunk / tree base
- flowers
- bush / shrub
- rock / stone
- fence
- house wall
- house roof
- door
- bridge

Return a JSON object with this exact format:
{{
  "grass": {{"index": <int>, "description": "<brief desc>"}},
  "dirt_path": {{"index": <int>, "description": "<brief desc>"}},
  "water": {{"index": <int>, "description": "<brief desc>"}},
  "tree_trunk": {{"index": <int>, "description": "<brief desc>"}},
  "flowers": {{"index": <int>, "description": "<brief desc>"}},
  "bush": {{"index": <int>, "description": "<brief desc>"}},
  "rock": {{"index": <int>, "description": "<brief desc>"}},
  "fence": {{"index": <int>, "description": "<brief desc>"}},
  "house_wall": {{"index": <int>, "description": "<brief desc>"}},
  "house_roof": {{"index": <int>, "description": "<brief desc>"}},
  "door": {{"index": <int>, "description": "<brief desc>"}},
  "bridge": {{"index": <int>, "description": "<brief desc>"}}
}}

Only return the JSON object, no extra text."""

    print("\nSending to Mimo API...")
    print(f"Model: {MODEL}")
    print("-" * 50)

    # Use requests directly with api-key header (not Authorization: Bearer)
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{b64_image}",
                        },
                    },
                ],
            }
        ],
        "max_tokens": 16000,
        "temperature": 0.1,
    }

    response = requests.post(API_URL, headers=headers, json=payload, timeout=120)

    if response.status_code != 200:
        print(f"\nError {response.status_code}: {response.text}")
        sys.exit(1)

    data = response.json()
    message = data["choices"][0]["message"]

    # Content might be in 'content' or 'reasoning_content'
    result_text = (message.get("content") or "").strip()
    reasoning_text = (message.get("reasoning_content") or "").strip()

    if not result_text and reasoning_text:
        # Model put the answer in reasoning_content — extract JSON from it
        print("\nResponse was in reasoning_content, extracting...")
        result_text = reasoning_text
    print("\nRaw response:")
    print(result_text)

    # Try to parse JSON from response
    import re

    # Method 1: Look for ```json ... ``` blocks
    if "```json" in result_text:
        blocks = result_text.split("```json")
        for block in blocks[1:]:
            if "```" in block:
                json_str = block.split("```")[0].strip()
                try:
                    return json.loads(json_str)
                except json.JSONDecodeError:
                    continue

    # Method 2: Look for any ``` ... ``` blocks
    if "```" in result_text:
        blocks = result_text.split("```")
        for i in range(1, len(blocks), 2):
            json_str = blocks[i].strip()
            if json_str.startswith("json"):
                json_str = json_str[4:]
            try:
                return json.loads(json_str.strip())
            except json.JSONDecodeError:
                continue

    # Method 3: Find JSON object with balanced braces
    def find_json_objects(text):
        """Find all potential JSON objects in text."""
        results = []
        depth = 0
        start = -1
        for i, c in enumerate(text):
            if c == '{':
                if depth == 0:
                    start = i
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0 and start >= 0:
                    results.append(text[start:i+1])
                    start = -1
        return results

    for json_str in find_json_objects(result_text):
        try:
            result = json.loads(json_str)
            if isinstance(result, dict) and len(result) >= 3:
                return result
        except json.JSONDecodeError:
            continue

    # Method 4: Extract from reasoning_content by parsing key-value patterns
    # e.g. "grass": {"index": 5, "description": "..."}
    pattern = r'"(\w+)"\s*:\s*\{\s*"index"\s*:\s*(\d+)\s*,\s*"description"\s*:\s*"([^"]+)"\s*\}'
    matches = re.findall(pattern, result_text)
    if matches:
        result = {}
        for key, index, desc in matches:
            result[key] = {"index": int(index), "description": desc}
        if len(result) >= 3:
            return result

    # Method 5: Parse from reasoning text patterns like "Index 5" or "index = 5"
    key_patterns = {
        "grass": r'[Gg]rass[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "dirt_path": r'[Dd]irt[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "water": r'[Ww]ater[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "tree_trunk": r'[Tt]ree[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "flowers": r'[Ff]lower[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "bush": r'[Bb]ush[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "rock": r'[Rr]ock[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "fence": r'[Ff]ence[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "house_wall": r'[Ww]all[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "house_roof": r'[Rr]oof[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "door": r'[Dd]oor[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
        "bridge": r'[Bb]ridge[^:]*?[:=]\s*(?:Index\s*)?(\d+)',
    }
    result = {}
    for key, pat in key_patterns.items():
        match = re.search(pat, result_text)
        if match:
            result[key] = {"index": int(match.group(1)), "description": f"parsed from reasoning"}
    if len(result) >= 3:
        return result

    print("\nWarning: Could not parse response as JSON.")
    print("Raw text returned above for manual inspection.")
    return {"raw": result_text}


def main():
    # Get API key
    api_key = os.environ.get("MIMO_API_KEY")
    if not api_key:
        print("Error: MIMO_API_KEY environment variable not set.")
        print()
        print("Set it with:")
        print('  PowerShell: $env:MIMO_API_KEY="your_api_key_here"')
        print('  CMD:        set MIMO_API_KEY=your_api_key_here')
        print('  Bash:       export MIMO_API_KEY="your_api_key_here"')
        sys.exit(1)

    result = analyze_tileset(api_key)

    print("\n" + "=" * 50)
    print("TILE INDEX MAPPING")
    print("=" * 50)
    print(json.dumps(result, indent=2))

    # Save to file
    output_path = Path("tileset_mapping.json")
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nSaved to {output_path}")


if __name__ == "__main__":
    main()
