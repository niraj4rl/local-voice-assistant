# Code Verification Feature Documentation

## Overview

The BozzoAI system now includes comprehensive code verification capabilities that automatically check the syntax and quality of all generated code. This ensures that generated code is correct and follows best practices before being saved.

## Components

### 1. **CodeVerifier Class** (`backend/verification.py`)

The core verification engine that provides multi-language support and syntax checking.

**Supported Languages:**
- Python
- JavaScript
- TypeScript
- C++
- C
- Java
- Go
- Rust
- HTML
- CSS

**Features:**
- **Syntax Validation:** Checks code for syntax errors using language-specific tools
- **Security Analysis:** Detects potentially dangerous patterns (e.g., `eval()`, `os.system()`)
- **Code Quality Warnings:** Identifies best-practice violations and unsafe functions
- **Code Execution** (Optional): Can safely execute code with timeout protection

### 2. **Automatic Verification During Code Generation**

When you ask BozzoAI to generate code, the system:
1. Generates code using the LLM (Mistral 7B)
2. Cleans and formats the code
3. **Automatically verifies** syntax and quality
4. Includes verification status in the response

**Example Response:**
```
[OK] Generated Python code
[FILE] Saved to: `/output/fibonacci_calculator.py`
[TASK] Fibonacci Calculator
[INFO] This Python code calculates Fibonacci numbers up to a specified limit
[VERIFY] ✅ Valid
```

## API Endpoints

### **POST /verify-code**

Verify code without generating it. Useful for validating external code or learning purposes.

**Parameters:**
- `code` (string, required): Source code to verify
- `language` (string, optional): Programming language (default: "python")
- `execute` (boolean, optional): Execute the code after verification (default: false, use with caution!)

**Example Request:**
```bash
curl -X POST http://localhost:8000/verify-code \
  -F "code=@mycode.py" \
  -F "language=python" \
  -F "execute=false"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "language": "python",
    "is_valid": true,
    "errors": [],
    "warnings": ["Code contains OS/subprocess imports - potential security risk"],
    "execution_result": null,
    "summary": "⚠️  Valid with warnings - Code contains OS/subprocess imports..."
  }
}
```

## Command-Line Tool

Use the included CLI tool to verify code files from the terminal:

**Installation:**
```bash
cd "d:\niraj\python programming\vc controlled ai agent"
```

**Usage:**
```bash
# Verify Python file (auto-detect)
python verify.py code.py

# Verify with explicit language
python verify.py script.js javascript

# Verify and execute
python verify.py test.py python --execute

# Verify C++ file
python verify.py program.cpp cpp
```

**Example Output:**
```
============================================================
CODE VERIFICATION REPORT
============================================================
File: output\fibonacci_calculator.py
Language: PYTHON
Status: ✅ Valid

✅ No issues found!

============================================================
```

## Verification Results Explained

### Status Indicators

- **✅ Valid** - Code passes all checks
- **✅ Valid and executed successfully** - Code runs without errors
- **⚠️  Valid with warnings** - Code is valid but has quality/security concerns
- **❌ Invalid** - Syntax errors or critical issues detected
- **❌ Syntax valid but execution failed** - Code is valid but fails when run

### Error Types

**Syntax Errors:**
- Missing colons, parentheses, or braces
- Invalid language constructs
- Compilation failures

**Security Warnings:**
- Unsafe functions: `strcpy()`, `sprintf()`, `eval()`
- OS/system access: `os.system()`, `subprocess`
- XSS risks: `innerHTML` modification without sanitization
- Dangerous imports

**Code Quality Issues:**
- Missing class/function documentation
- Unused imports
- Inconsistent formatting

## Integration with Code Generation

When you prompt BozzoAI to generate code:

```
User: "Generate a Python script to read a CSV file and calculate the average"

System Response:
[OK] Generated Python code
[FILE] Saved to: `/output/csv_average_calculator.py`
[TASK] Csv Average Calculator
[INFO] This Python code reads a CSV file and calculates the average of specified columns
[VERIFY] ✅ Valid
```

If there are issues:

```
[VERIFY] ❌ Invalid - Syntax Error at line 15: expected ':'
```

## Security Considerations

### Execution Safety

When using `execute=true`:
- Code runs in a sandboxed subprocess
- Timeout protection (default 10 seconds)
- Limited to safe operations only
- I/O operations are restricted

### Recommendations

1. **Always review generated code** before running it in production
2. **Use execute=true carefully** - only for trusted code
3. **Check security warnings** - address any flagged patterns
4. **Test code incrementally** - verify small sections first

## Examples

### Example 1: Valid Python Code

**Code:**
```python
def add_numbers(a, b):
    """Add two numbers and return the result."""
    return a + b

result = add_numbers(5, 3)
print(f"Sum: {result}")
```

**Verification Result:**
```
✅ Valid
No issues found!
```

### Example 2: Invalid Code (Missing Colon)

**Code:**
```python
def add_numbers(a, b)
    return a + b
```

**Verification Result:**
```
❌ Invalid - Syntax Error at line 1: expected ':'
```

### Example 3: Valid Code with Warnings

**Code:**
```python
import os
import subprocess

def run_system_command(cmd):
    os.system(cmd)
```

**Verification Result:**
```
⚠️  Valid with warnings
Warnings:
  1. Code contains OS/subprocess imports - potential security risk
```

## Troubleshooting

### "Language not found"
The verifier falls back to basic validation. Try specifying the correct language name:
- Use: `python`, not `py`
- Use: `javascript`, not `js`
- Use: `cpp`, not `c++`

### "Compiler not found"
For compiled languages (C++, C, Java), ensure the compiler is installed:
- **Windows**: Install MinGW for `g++`/`gcc`
- **macOS**: Install Xcode Command Line Tools
- **Linux**: `apt-get install build-essential`

### Execution errors
If code verifies but fails on execute:
1. Check the error message for specific issues
2. Verify input parameters are correct
3. Ensure required dependencies are installed

## Future Enhancements

Planned improvements:
- [ ] Type checking for TypeScript with tsc
- [ ] Integration with language linters (eslint, pylint, etc.)
- [ ] Code complexity analysis
- [ ] Performance profiling
- [ ] Test case validation
- [ ] Documentation compliance checks

## Performance Notes

- **Python verification:** < 100ms (AST parsing)
- **JavaScript verification:** ~200ms (Node.js subprocess)
- **C++ verification:** ~500ms (compilation check)
- **Code execution:** Varies by code (timeout 10s)

Verification is performed automatically for all generated code with minimal performance impact on the API response time.
