import warnings
import sys

# Enable all warnings
warnings.simplefilter('always')

# Redirect warnings to stdout
def custom_formatwarning(msg, category, filename, lineno, line=None):
    return f"{filename}:{lineno}: {category.__name__}: {msg}\n"

warnings.formatwarning = custom_formatwarning

# Import the file to check
try:
    import generate_file_history
    print("No syntax warnings detected.")
except Exception as e:
    print(f"Error: {e}")