#!/usr/bin/env python3
"""
Codebase Reducer

This script creates a concise representation of a codebase, reducing each file to approximately
1/16th of its original size while preserving essential information about purpose and structure.

The reduced files are stored in a "116" directory with the original filename + "116" suffix.
"""

import os
import sys
import json
import re
import math
from pathlib import Path
from collections import Counter, defaultdict

# Configuration
TARGET_RATIO = 1/16  # Target size ratio (reduced/original) = 6.25%
ALLOWED_EXTENSIONS = ['.py', '.js', '.css', '.json', '.md']  # Only process these file types

class FileAnalyzer:
    """Analyzes code files and extracts essential information."""

    def __init__(self, file_path):
        """Initialize with a file path."""
        self.file_path = Path(file_path)
        self.extension = self.file_path.suffix.lower()
        self.content = self._read_file()
        self.file_size = len(self.content)
        self.line_count = self.content.count('\n') + 1

    def _read_file(self):
        """Read file content with UTF-8 encoding."""
        try:
            with open(self.file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except Exception as e:
            print(f"Error reading {self.file_path}: {e}")
            return ""

    def get_docstrings(self):
        """Extract docstrings from the file."""
        docstrings = {
            'file': '',
            'functions': {}
        }

        if self.extension == '.py':
            # Python file docstring
            file_match = re.search(r'^"""(.*?)"""', self.content, re.DOTALL | re.MULTILINE)
            if file_match:
                docstrings['file'] = file_match.group(1).strip()

            # Function docstrings
            func_pattern = re.compile(r'def\s+([^\s\(]+)\s*\([^\)]*\)(?:\s*->.*?)?:\s*(?:"""(.*?)""")?', re.DOTALL)
            for match in func_pattern.finditer(self.content):
                func_name = match.group(1)
                if match.group(2):
                    docstrings['functions'][func_name] = match.group(2).strip()

        elif self.extension == '.js':
            # JavaScript file JSDoc
            file_match = re.search(r'^/\*\*(.*?)\*/', self.content, re.DOTALL)
            if file_match:
                docstrings['file'] = file_match.group(1).strip()

            # Function JSDoc
            func_pattern = re.compile(r'/\*\*(.*?)\*/\s*(?:function|const|let|var)\s+([^\s=\(]+)', re.DOTALL)
            for match in func_pattern.finditer(self.content):
                func_name = match.group(2)
                docstrings['functions'][func_name] = match.group(1).strip()

        elif self.extension == '.json':
            try:
                data = json.loads(self.content)
                if isinstance(data, dict) and 'description' in data:
                    docstrings['file'] = data['description']
            except:
                pass

        elif self.extension == '.md':
            # Extract title (first heading)
            title_match = re.search(r'^#\s+(.+)$', self.content, re.MULTILINE)
            if title_match:
                docstrings['file'] = title_match.group(1).strip()

        return docstrings

    def extract_functions_and_classes(self):
        """Extract functions and classes from the file."""
        result = {
            'functions': [],
            'classes': [],
            'imports': [],
            'complexity': 0
        }

        if self.extension == '.py':
            # Python imports
            for match in re.finditer(r'^(?:from|import)\s+([^\s#]+)', self.content, re.MULTILINE):
                result['imports'].append(match.group(1))

            # Python functions
            for match in re.finditer(r'def\s+([^\s\(]+)', self.content, re.MULTILINE):
                result['functions'].append(match.group(1))

            # Python classes
            for match in re.finditer(r'class\s+([^\s\(]+)', self.content, re.MULTILINE):
                result['classes'].append(match.group(1))

        elif self.extension == '.js':
            # JavaScript imports
            for match in re.finditer(r'(?:import|require)\s*\(?[\'"]([^\'"]+)', self.content, re.MULTILINE):
                result['imports'].append(match.group(1))

            # JavaScript functions
            func_patterns = [
                r'function\s+([^\s\(]+)',
                r'(?:const|let|var)\s+([^\s=]+)\s*=\s*(?:async\s*)?\(',
                r'(?:const|let|var)\s+([^\s=]+)\s*=\s*function'
            ]
            for pattern in func_patterns:
                for match in re.finditer(pattern, self.content, re.MULTILINE):
                    result['functions'].append(match.group(1))

            # JavaScript classes
            for match in re.finditer(r'class\s+([^\s\{]+)', self.content, re.MULTILINE):
                result['classes'].append(match.group(1))

        elif self.extension == '.json':
            try:
                data = json.loads(self.content)
                if isinstance(data, dict):
                    # Top-level keys as "functions"
                    result['functions'] = list(data.keys())[:10]  # Limit to first 10
            except:
                pass

        # Calculate complexity (simple heuristic based on nesting)
        if self.extension in ['.py', '.js']:
            # Count indentation levels as proxy for complexity
            indents = [len(line) - len(line.lstrip()) for line in self.content.split('\n')]
            if indents:
                result['complexity'] = max(indents) // 2  # Assuming 2-space or 4-space indentation

        return result

    def extract_keywords(self):
        """Extract meaningful keywords from the content."""
        # Remove common stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'else', 'for', 'in', 'to', 'with'}

        # Extract words (ignoring syntax elements)
        if self.extension in ['.py', '.js']:
            # Remove comments and strings
            cleaned = re.sub(r'(#.*$|//.*$|/\*.*?\*/|\'.*?\'|".*?")', '', self.content, flags=re.MULTILINE|re.DOTALL)
            words = re.findall(r'\b([a-zA-Z][a-zA-Z0-9_]*)\b', cleaned)
        elif self.extension == '.json':
            try:
                data = json.loads(self.content)
                if isinstance(data, dict):
                    words = list(data.keys())
                else:
                    words = []
            except:
                words = []
        else:
            words = re.findall(r'\b([a-zA-Z][a-zA-Z0-9_]*)\b', self.content)

        # Filter and count
        filtered_words = [w.lower() for w in words if w.lower() not in stop_words and len(w) > 2]
        word_count = Counter(filtered_words)

        # Return most common keywords
        return [word for word, _ in word_count.most_common(10)]

    def get_primary_purpose(self):
        """Determine the primary purpose of the file."""
        # Purpose indicators
        purpose_indicators = {
            'data_processing': ['process', 'data', 'transform', 'convert', 'parse'],
            'api_client': ['api', 'client', 'request', 'fetch', 'http'],
            'ui_component': ['component', 'render', 'ui', 'view', 'display'],
            'utility': ['util', 'helper', 'common', 'shared', 'tool'],
            'config': ['config', 'setting', 'option', 'preference', 'setup'],
            'database': ['database', 'db', 'sql', 'query', 'model'],
            'test': ['test', 'spec', 'assert', 'expect', 'mock']
        }

        # Score each purpose
        scores = {purpose: 0 for purpose in purpose_indicators}
        content_lower = self.content.lower()

        for purpose, indicators in purpose_indicators.items():
            for indicator in indicators:
                scores[purpose] += content_lower.count(indicator)

        # Adjust based on file extension
        if self.extension == '.css':
            return 'styling'
        elif self.extension == '.md':
            return 'documentation'
        elif self.extension == '.json':
            return 'configuration'

        # Return the highest scoring purpose
        if not scores:
            return 'utility'  # Default
        highest_purpose = max(scores, key=scores.get)
        return highest_purpose if scores[highest_purpose] > 0 else 'utility'

class CommentaryGenerator:
    """Generates concise commentary about a file."""

    def __init__(self, file_path, target_ratio=TARGET_RATIO):
        """Initialize with file path and target size ratio."""
        self.file_path = Path(file_path)
        self.target_ratio = target_ratio
        self.analyzer = FileAnalyzer(file_path)
        self.original_size = self.analyzer.file_size
        # Calculate target size - ensure it's at least 6.25% of original, with 400 char minimum
        self.target_size = max(int(self.original_size * self.target_ratio), 400)

        # Determine detail level based on file size
        if self.original_size < 1000:
            self.detail_level = 'minimal'  # Very small files
        elif self.original_size < 5000:
            self.detail_level = 'low'      # Small files
        elif self.original_size < 20000:
            self.detail_level = 'medium'   # Medium files
        else:
            self.detail_level = 'high'     # Large files

    def _extract_important_code_sections(self):
        """Extract important code sections based on detail level."""
        extracted = []

        if self.analyzer.extension in ['.py', '.js']:
            # Extract imports for higher detail levels
            if self.detail_level in ['medium', 'high']:
                import_pattern = r'^(?:import|from|require).*$'
                imports = re.findall(import_pattern, self.analyzer.content, re.MULTILINE)
                if imports:
                    imports_sample = '\n'.join(imports[:5])
                    if len(imports) > 5:
                        imports_sample += f"\n# ...and {len(imports) - 5} more imports"
                    extracted.append(('imports', imports_sample))

            # Extract key functions for medium and high detail
            if self.detail_level in ['medium', 'high']:
                structure = self.analyzer.extract_functions_and_classes()
                docstrings = self.analyzer.get_docstrings()

                # Prioritize functions with docstrings
                priority_functions = [f for f in structure['functions'] if f in docstrings['functions']]

                # Add a few more functions if needed
                selected_functions = priority_functions[:3]
                if len(selected_functions) < 2 and structure['functions']:
                    additional = [f for f in structure['functions'] if f not in selected_functions]
                    selected_functions.extend(additional[:2 - len(selected_functions)])

                # Extract code for each selected function
                for func_name in selected_functions:
                    if self.analyzer.extension == '.py':
                        func_pattern = re.compile(rf'def\s+{re.escape(func_name)}\s*\([^)]*\)(?:\s*->.*?)?:\s*(?:""".*?""")?.*?(?=\n\S|$)', re.DOTALL)
                    else:  # JavaScript
                        func_pattern = re.compile(rf'(?:function\s+{re.escape(func_name)}|const\s+{re.escape(func_name)}\s*=\s*(?:function|\([^)]*\)\s*=>)).*?(?=\n\S|$)', re.DOTALL)

                    match = func_pattern.search(self.analyzer.content)
                    if match:
                        func_code = match.group(0)

                        # Truncate if too long
                        if len(func_code) > 300:
                            lines = func_code.split('\n')
                            func_code = '\n'.join(lines[:5])
                            func_code += '\n    # ... more lines ...'

                        extracted.append((f'function_{func_name}', func_code))

                # Extract class information for high detail
                if self.detail_level == 'high' and structure['classes']:
                    class_name = structure['classes'][0]  # First class

                    if self.analyzer.extension == '.py':
                        class_pattern = re.compile(rf'class\s+{re.escape(class_name)}[^:]*:.*?(?=\n\S|$)', re.DOTALL)
                    else:  # JavaScript
                        class_pattern = re.compile(rf'class\s+{re.escape(class_name)}.*?{{.*?}}', re.DOTALL)

                    match = class_pattern.search(self.analyzer.content)
                    if match:
                        class_code = match.group(0)

                        # Truncate if too long
                        if len(class_code) > 400:
                            lines = class_code.split('\n')
                            class_code = '\n'.join(lines[:7])
                            class_code += '\n    # ... more lines ...'

                        extracted.append((f'class_{class_name}', class_code))

        elif self.analyzer.extension == '.json':
            try:
                data = json.loads(self.analyzer.content)
                if isinstance(data, dict):
                    # Format a sample of the JSON
                    json_sample = "{\n"
                    for i, (key, value) in enumerate(list(data.items())[:5]):
                        if isinstance(value, (dict, list)):
                            value_str = f"{type(value).__name__} with {len(value)} items"
                        elif isinstance(value, str) and len(value) > 30:
                            value_str = f'"{value[:30]}..."'
                        else:
                            value_str = json.dumps(value)

                        json_sample += f'  "{key}": {value_str}'
                        if i < min(4, len(data) - 1):
                            json_sample += ","
                        json_sample += "\n"

                    if len(data) > 5:
                        json_sample += f"  // ...{len(data) - 5} more fields...\n"
                    json_sample += "}"

                    extracted.append(('json_sample', json_sample))
            except:
                pass

        elif self.analyzer.extension == '.md':
            # For markdown, extract headings
            headings = re.findall(r'^(#+)\s+(.+)$', self.analyzer.content, re.MULTILINE)
            if headings:
                heading_sample = '\n'.join([f"{h[0]} {h[1]}" for h in headings[:5]])
                if len(headings) > 5:
                    heading_sample += f"\n# ...and {len(headings) - 5} more sections"
                extracted.append(('headings', heading_sample))

        elif self.analyzer.extension == '.css':
            # Extract CSS selectors
            selectors = re.findall(r'([^{]+){([^}]*)}', self.analyzer.content)
            if selectors:
                selectors_sample = '\n'.join([f"{s[0].strip()} {{ ... }}" for s in selectors[:5]])
                if len(selectors) > 5:
                    selectors_sample += f"\n/* ...and {len(selectors) - 5} more selectors... */"
                extracted.append(('selectors', selectors_sample))

        return extracted

    def generate(self):
        """Generate commentary about the file."""
        result = f"# {self.file_path.name}\n\n"

        # Start with essential information
        purpose = self.analyzer.get_primary_purpose().replace('_', ' ').title()
        result += f"**Purpose**: {purpose}\n\n"

        # Add docstring if available
        docstrings = self.analyzer.get_docstrings()
        if docstrings['file']:
            # Truncate if too long
            max_docstring_len = min(200, self.target_size // 5)
            doc = docstrings['file']
            if len(doc) > max_docstring_len:
                doc = doc[:max_docstring_len] + "..."
            result += f"**Description**: {doc}\n\n"

        # Add code structure information
        structure = self.analyzer.extract_functions_and_classes()

        # Adjust content based on detail level
        if self.detail_level != 'minimal':
            if structure['functions']:
                result += f"**Functions**: {', '.join(structure['functions'][:5])}"
                if len(structure['functions']) > 5:
                    result += f" and {len(structure['functions']) - 5} more"
                result += "\n\n"

            if structure['classes']:
                result += f"**Classes**: {', '.join(structure['classes'][:5])}"
                if len(structure['classes']) > 5:
                    result += f" and {len(structure['classes']) - 5} more"
                result += "\n\n"

            if structure['imports'] and self.detail_level in ['medium', 'high']:
                result += f"**Dependencies**: {', '.join(structure['imports'][:5])}"
                if len(structure['imports']) > 5:
                    result += f" and {len(structure['imports']) - 5} more"
                result += "\n\n"

        # Add keywords for medium and high detail
        if self.detail_level in ['medium', 'high']:
            keywords = self.analyzer.extract_keywords()
            if keywords:
                result += f"**Keywords**: {', '.join(keywords[:7])}\n\n"

        # Add code sections based on detail level
        code_sections = self._extract_important_code_sections()
        if code_sections:
            result += "## Key Code Sections\n\n"

            for section_name, code in code_sections:
                if section_name == 'imports':
                    result += "### Imports\n\n```\n" + code + "\n```\n\n"
                elif section_name.startswith('function_'):
                    func_name = section_name[9:]
                    result += f"### Function: {func_name}\n\n```\n" + code + "\n```\n\n"
                elif section_name.startswith('class_'):
                    class_name = section_name[6:]
                    result += f"### Class: {class_name}\n\n```\n" + code + "\n```\n\n"
                elif section_name == 'json_sample':
                    result += "### JSON Structure\n\n```json\n" + code + "\n```\n\n"
                elif section_name == 'headings':
                    result += "### Document Structure\n\n```markdown\n" + code + "\n```\n\n"
                elif section_name == 'selectors':
                    result += "### CSS Selectors\n\n```css\n" + code + "\n```\n\n"

                # Check if we're approaching the target size
                if len(result) >= self.target_size * 0.8:
                    break

        # Add file info footer
        result += "## File Info\n\n"

        # Calculate file size string
        size_bytes = os.path.getsize(self.file_path)
        if size_bytes < 1024:
            size_str = f"{size_bytes} bytes"
        elif size_bytes < 1024 * 1024:
            size_str = f"{size_bytes / 1024:.1f} KB"
        else:
            size_str = f"{size_bytes / (1024 * 1024):.1f} MB"

        result += f"- **Size**: {size_str}\n"
        result += f"- **Lines**: {self.analyzer.line_count}\n"

        if self.detail_level != 'minimal':
            result += f"- **Complexity**: {structure['complexity'] if structure['complexity'] else 'Low'}\n"

        # Ensure we meet the target size
        current_size = len(result)

        if current_size > self.target_size:
            # If over target, truncate to fit
            result = result[:self.target_size - 50] + "\n\n... (truncated to meet size target) ...\n"
        elif current_size < self.target_size * 0.9:
            # If under target, add padding with file details to reach target size
            padding_needed = self.target_size - current_size - 50  # Leave some margin

            if padding_needed > 0:
                # Add more detailed information to reach target size
                result += "\n## Additional Details\n\n"

                # Add line-by-line statistics if needed
                if padding_needed > 100:
                    result += "### Line Statistics\n\n"
                    lines = self.analyzer.content.split('\n')
                    line_stats = {}

                    # Calculate line length distribution
                    for line in lines:
                        length = len(line)
                        if length in line_stats:
                            line_stats[length] += 1
                        else:
                            line_stats[length] = 1

                    # Add line statistics
                    result += f"- Average line length: {sum(len(line) for line in lines) / max(1, len(lines)):.1f} characters\n"
                    result += f"- Longest line: {max(len(line) for line in lines)} characters\n"
                    result += f"- Number of blank lines: {sum(1 for line in lines if not line.strip())}\n\n"

                # If still under target, add raw content samples
                if len(result) < self.target_size * 0.9:
                    result += "### Content Samples\n\n"

                    # Sample from beginning, middle, and end
                    content = self.analyzer.content
                    if len(content) > 300:
                        start_sample = content[:100]
                        mid_point = len(content) // 2
                        mid_sample = content[mid_point - 50:mid_point + 50]
                        end_sample = content[-100:]

                        result += "Beginning:\n```\n" + start_sample + "\n```\n\n"
                        result += "Middle:\n```\n" + mid_sample + "\n```\n\n"
                        result += "End:\n```\n" + end_sample + "\n```\n\n"
                    else:
                        # For small files, add more of the content
                        sample_size = min(len(content), padding_needed // 2)
                        result += "Sample:\n```\n" + content[:sample_size] + "\n```\n\n"

                # Final padding if still needed
                current_size = len(result)
                if current_size < self.target_size * 0.95:
                    padding = "=" * min(80, (self.target_size - current_size) // 2)
                    result += f"\n{padding}\nEnd of file summary\n{padding}\n"

        return result

class CodebaseReducer:
    """Reduces an entire codebase to 1/16th of its size."""

    def __init__(self, source_dir, target_dir=None):
        """Initialize with source and target directories."""
        self.source_dir = Path(source_dir)
        if target_dir:
            self.target_dir = Path(target_dir)
        else:
            self.target_dir = self.source_dir / "116"

        self.stats = {
            'processed': 0,
            'skipped': 0,
            'errors': 0,
            'original_size': 0,
            'reduced_size': 0
        }

    def ensure_directory_exists(self, directory):
        """Create directory if it doesn't exist."""
        Path(directory).mkdir(parents=True, exist_ok=True)

    def should_skip_file(self, file_path):
        """Determine if a file should be skipped."""
        # Skip directories to avoid
        skip_dirs = ['.git', 'node_modules', '116', 'venv', '__pycache__', 'dist', 'build']
        for skip_dir in skip_dirs:
            if skip_dir in str(file_path):
                return True

        # Skip binary files and non-allowed extensions
        extension = file_path.suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            return True

        # Skip the script itself
        if file_path.name == Path(__file__).name:
            return True

        # Skip README.md
        if file_path.name.lower() == "readme.md":
            return True

        # Skip small files (under 100 bytes)
        try:
            if os.path.getsize(file_path) < 100:
                return True
        except:
            return True

        return False

    def process_file(self, file_path):
        """Process a single file."""
        try:
            # Skip files that should not be processed
            if self.should_skip_file(file_path):
                self.stats['skipped'] += 1
                return False

            # Calculate the target path
            rel_path = file_path.relative_to(self.source_dir)
            file_name = file_path.stem + "116" + file_path.suffix
            target_path = self.target_dir / rel_path.parent / file_name

            # Ensure target directory exists
            self.ensure_directory_exists(target_path.parent)

            # Generate commentary
            generator = CommentaryGenerator(file_path)
            commentary = generator.generate()

            # Write to target file
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(commentary)

            # Update statistics
            original_size = os.path.getsize(file_path)
            reduced_size = os.path.getsize(target_path)

            self.stats['processed'] += 1
            self.stats['original_size'] += original_size
            self.stats['reduced_size'] += reduced_size

            # Calculate reduction ratio
            ratio = reduced_size / original_size

            print(f"Processed: {rel_path}")
            print(f"  → Size: {reduced_size} bytes ({ratio:.2%} of original) - Target: {TARGET_RATIO:.2%}")

            # Warn if outside the acceptable range (+/- 10% of target)
            if ratio < TARGET_RATIO * 0.9 or ratio > TARGET_RATIO * 1.1:
                direction = "ABOVE" if ratio > TARGET_RATIO * 1.1 else "BELOW"
                print(f"  → WARNING: {direction} acceptable range ({(TARGET_RATIO * 0.9):.2%} to {(TARGET_RATIO * 1.1):.2%})")

                # Reprocess the file if it's outside the acceptable range
                if self.stats['errors'] < 20:  # Limit retries to avoid infinite loops
                    print(f"  → Reprocessing file to hit target range...")

                    # Adjust target size based on first attempt
                    adjusted_target = original_size * TARGET_RATIO
                    if ratio < TARGET_RATIO * 0.9:
                        # If too small, increase target by 5%
                        adjusted_target *= 1.05
                    else:
                        # If too large, decrease target by 5%
                        adjusted_target *= 0.95

                    # Generate new commentary with adjusted target
                    generator = CommentaryGenerator(file_path, adjusted_target / original_size)
                    commentary = generator.generate()

                    # Write to target file
                    with open(target_path, 'w', encoding='utf-8') as f:
                        f.write(commentary)

                    # Update statistics with new file
                    new_reduced_size = os.path.getsize(target_path)
                    self.stats['reduced_size'] += (new_reduced_size - reduced_size)

                    # Calculate new ratio
                    new_ratio = new_reduced_size / original_size
                    print(f"  → After reprocessing: {new_ratio:.2%} of original")

            return True

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            self.stats['errors'] += 1
            return False

    def process_directory(self):
        """Process all files in the source directory."""
        # Find all files to process first
        all_files = []
        for root, dirs, files in os.walk(self.source_dir):
            # Skip certain directories
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '116', '__pycache__']]

            for file in files:
                file_path = Path(os.path.join(root, file))
                if not self.should_skip_file(file_path):
                    all_files.append(file_path)
                else:
                    self.stats['skipped'] += 1

        # Print summary before processing
        print("\n" + "="*80)
        print(f"SOURCE DIRECTORY: {self.source_dir.absolute()}")
        print(f"TARGET DIRECTORY: {self.target_dir.absolute()}")
        print(f"Found {len(all_files)} files to process")
        print("="*80 + "\n")

        # Process each file
        for i, file_path in enumerate(all_files, 1):
            print(f"[{i}/{len(all_files)}] ", end="")
            self.process_file(file_path)

        # Print final statistics
        self.print_stats()

    def print_stats(self):
        """Print processing statistics."""
        print("\n" + "="*80)
        print("PROCESSING COMPLETE")
        print("="*80)
        print(f"Files processed: {self.stats['processed']}")
        print(f"Files skipped: {self.stats['skipped']}")
        print(f"Errors encountered: {self.stats['errors']}")

        if self.stats['original_size'] > 0:
            original_kb = self.stats['original_size'] / 1024
            reduced_kb = self.stats['reduced_size'] / 1024
            overall_ratio = self.stats['reduced_size'] / self.stats['original_size']

            print(f"Original size: {original_kb:.2f} KB")
            print(f"Reduced size: {reduced_kb:.2f} KB")
            print(f"Overall reduction ratio: {overall_ratio:.2%} (target: {TARGET_RATIO:.2%})")

            # Check if outside the acceptable range (+/- 10% of target)
            is_outside_range = ratio < TARGET_RATIO * 0.9 or ratio > TARGET_RATIO * 1.1

            if abs(overall_ratio - TARGET_RATIO) <= 0.01 and not is_outside_range:
                print("\nSUCCESS: All files are within the acceptable size range!")
            else:
                print(f"\nNOTE: Overall reduction ratio is {overall_ratio:.2%} (target: {TARGET_RATIO:.2%})")
                if is_outside_range:
                    print(f"Some files are outside the acceptable range of {(TARGET_RATIO * 0.9):.2%} to {(TARGET_RATIO * 1.1):.2%}")


        print(f"\nReduced files saved to: {self.target_dir.absolute()}")
        print("="*80)

def main():
    """Main function."""
    try:
        # Get script directory as default source
        script_dir = Path(os.path.dirname(os.path.abspath(__file__)))

        # Use command line argument for source directory if provided
        if len(sys.argv) > 1:
            source_dir = Path(sys.argv[1])
        else:
            source_dir = script_dir

        # Create reducer and process directory
        reducer = CodebaseReducer(source_dir)
        reducer.process_directory()

    except Exception as e:
        print(f"ERROR: {e}")
        print("Stack trace:")
        import traceback
        traceback.print_exc()
        return 1

    return 0

if __name__ == "__main__":
    sys.exit(main())