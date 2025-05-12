from replace_with_commentary import CommentaryGenerator
from pathlib import Path

# Generate commentary for server.py
file_path = Path("server.py")
generator = CommentaryGenerator(file_path)
commentary = generator.generate()

# Write to target file
target_path = Path("116") / "server116.py"
with open(target_path, 'w', encoding='utf-8') as f:
    f.write(commentary)

print(f"Generated commentary for {file_path} and saved to {target_path}")