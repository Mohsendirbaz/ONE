from replace_with_commentary import CommentaryGenerator
from pathlib import Path

# Generate commentary for server.py
file_path = Path("server.py")
generator = CommentaryGenerator(file_path)
commentary = generator.generate()

# Print the commentary
print(commentary)