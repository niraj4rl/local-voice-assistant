#!/usr/bin/env python3
"""Command-line code verification tool."""

from pathlib import Path
import sys
import json
from backend.verification import CodeVerifier


def main():
    """CLI entry point for code verification."""
    
    if len(sys.argv) < 2:
        print("Usage: python verify.py <file> [language] [--execute]")
        print("\nExamples:")
        print("  python verify.py code.py python")
        print("  python verify.py script.js javascript --execute")
        print("  python verify.py add.cpp cpp")
        sys.exit(1)
    
    file_path = Path(sys.argv[1])
    execute = "--execute" in sys.argv
    
    # Determine language
    if len(sys.argv) > 2 and not sys.argv[2].startswith("--"):
        language = sys.argv[2]
    else:
        # Auto-detect from file extension
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".cpp": "cpp",
            ".c": "c",
            ".java": "java",
            ".go": "go",
            ".rs": "rust",
            ".html": "html",
            ".css": "css",
        }
        language = ext_map.get(file_path.suffix, "python")
    
    # Read file
    if not file_path.exists():
        print(f"❌ Error: File '{file_path}' not found")
        sys.exit(1)
    
    try:
        code = file_path.read_text()
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        sys.exit(1)
    
    # Verify code
    verifier = CodeVerifier()
    result = verifier.verify(code, language, execute=execute, timeout=15)
    
    # Display results
    print("\n" + "=" * 60)
    print(f"CODE VERIFICATION REPORT")
    print("=" * 60)
    print(f"File: {file_path}")
    print(f"Language: {result['language'].upper()}")
    print(f"Status: {result['summary']}")
    print()
    
    if result['errors']:
        print("❌ ERRORS:")
        for i, error in enumerate(result['errors'], 1):
            print(f"  {i}. {error}")
        print()
    
    if result['warnings']:
        print("⚠️  WARNINGS:")
        for i, warning in enumerate(result['warnings'], 1):
            print(f"  {i}. {warning}")
        print()
    
    if not result['errors'] and not result['warnings']:
        print("✅ No issues found!")
        print()
    
    if result['execution_result']:
        exec_result = result['execution_result']
        print("EXECUTION RESULT:")
        print(f"  Success: {exec_result['success']}")
        if exec_result['output']:
            print(f"  Output:\n{exec_result['output']}")
        if exec_result['error']:
            print(f"  Error:\n{exec_result['error']}")
        print()
    
    print("=" * 60)
    
    # Return appropriate exit code
    sys.exit(0 if result['is_valid'] else 1)


if __name__ == "__main__":
    main()
