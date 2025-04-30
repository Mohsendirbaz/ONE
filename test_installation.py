"""
Test script to verify that the required packages are installed.
"""

import importlib.util
import subprocess
import sys
import os

def check_python_package(package_name):
    """Check if a Python package is installed."""
    spec = importlib.util.find_spec(package_name)
    return spec is not None

def check_node_package(package_name):
    """Check if a Node.js package is installed."""
    try:
        # Check if node_modules directory exists
        if not os.path.exists('node_modules'):
            return False

        # Check if the specific package directory exists
        if not os.path.exists(f'node_modules/{package_name}'):
            return False

        return True
    except Exception as e:
        print(f"Error checking Node.js package {package_name}: {str(e)}")
        return False

def check_symlink(package_name):
    """Check if a symlink exists and points to the correct location."""
    try:
        # Check if node_modules directory exists
        if not os.path.exists('node_modules'):
            return False

        # Check if the symlink exists
        symlink_path = f'node_modules/{package_name}'
        if not os.path.exists(symlink_path):
            return False

        # Check if it's a symlink (or junction on Windows)
        if not os.path.isdir(symlink_path):
            return False

        # On Windows, we can't easily check if it's a symlink, but we can check
        # if the directory exists in both locations
        target_path = os.path.join(os.getcwd(), package_name)
        if not os.path.exists(target_path):
            return False

        return True
    except Exception as e:
        print(f"Error checking symlink for {package_name}: {str(e)}")
        return False

def main():
    """Main function to check all required packages."""
    print("Testing installation of required packages...")

    # Python packages to check
    python_packages = [
        'flask',
        'psycopg2',  # We install psycopg2-binary but import it as psycopg2
        'clickhouse_driver',
        'dotenv',
        'numpy',
        'pandas',
        'scipy',
        'matplotlib',
        'pytest'
    ]

    # Node.js packages to check
    node_packages = [
        'react',
        'jotai',
        'react-dom',
        'react-router-dom'
    ]

    # Specialty packages that should be symlinked
    symlinked_packages = [
        'code-entity-analyzer',
        'financial-entity-analyzer'
    ]

    # Check Python packages
    print("\nChecking Python packages:")
    all_python_packages_installed = True
    for package in python_packages:
        is_installed = check_python_package(package)
        status = "Installed" if is_installed else "Not installed"
        print(f"  {package}: {status}")
        if not is_installed:
            all_python_packages_installed = False

    # Check Node.js packages
    print("\nChecking Node.js packages:")
    all_node_packages_installed = True
    for package in node_packages:
        is_installed = check_node_package(package)
        status = "Installed" if is_installed else "Not installed"
        print(f"  {package}: {status}")
        if not is_installed:
            all_node_packages_installed = False

    # Check symlinked packages
    print("\nChecking symlinked specialty packages:")
    all_symlinks_created = True
    for package in symlinked_packages:
        is_symlinked = check_symlink(package)
        status = "Symlinked" if is_symlinked else "Not symlinked"
        print(f"  {package}: {status}")
        if not is_symlinked:
            all_symlinks_created = False

    # Print summary
    print("\nInstallation summary:")
    if all_python_packages_installed:
        print("  ✓ All required Python packages are installed.")
    else:
        print("  ✗ Some Python packages are missing. Run 'pip install -r backend/requirements.txt' to install them.")

    if all_node_packages_installed:
        print("  ✓ All required Node.js packages are installed.")
    else:
        print("  ✗ Some Node.js packages are missing. Run 'npm install' to install them.")

    if all_symlinks_created:
        print("  ✓ All specialty packages are properly symlinked.")
    else:
        print("  ✗ Some specialty packages are not symlinked. Run 'install_packages.bat' to create the symlinks.")

    if all_python_packages_installed and all_node_packages_installed and all_symlinks_created:
        print("\nAll required packages are installed. You can proceed with the ModEcon Matrix System setup.")
    else:
        print("\nSome packages are missing or not properly configured. Please fix the issues before proceeding.")

if __name__ == "__main__":
    main()
