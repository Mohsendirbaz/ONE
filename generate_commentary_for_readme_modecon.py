from replace_with_commentary import CommentaryGenerator
from pathlib import Path
import os

# Generate commentary for README_MODECON_MATRIX.md
file_path = Path("README_MODECON_MATRIX.md")
generator = CommentaryGenerator(file_path)
commentary = generator.generate()

# Write to target file with explicit overwrite
target_path = Path("116/README_MODECON_MATRIX116.md")
os.makedirs(os.path.dirname(target_path), exist_ok=True)

# Force overwrite by opening in write mode
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(commentary)

print(f"Generated commentary for {file_path} and saved to {target_path}")