"""Code verification and validation module."""

from __future__ import annotations

import ast
import json
import logging
import subprocess
import tempfile
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class CodeVerifier:
    """Verifies and validates generated code."""

    # Language-specific verification configurations
    VERIFIERS = {
        "python": "verify_python",
        "javascript": "verify_javascript",
        "typescript": "verify_typescript",
        "cpp": "verify_cpp",
        "c": "verify_c",
        "java": "verify_java",
        "go": "verify_go",
        "rust": "verify_rust",
        "html": "verify_html",
        "css": "verify_css",
    }

    def verify(
        self, code: str, language: str, execute: bool = False, timeout: int = 10
    ) -> dict[str, Any]:
        """
        Verify code correctness.

        Args:
            code: Source code to verify
            language: Programming language
            execute: Whether to attempt execution (use caution!)
            timeout: Execution timeout in seconds

        Returns:
            Dictionary with verification results:
            {
                "is_valid": bool,
                "language": str,
                "errors": list[str],
                "warnings": list[str],
                "execution_result": dict or None,
                "summary": str
            }
        """
        language = language.strip().lower()
        verifier_method = getattr(self, self.VERIFIERS.get(language, "verify_generic"), None)

        if verifier_method:
            result = verifier_method(code)
        else:
            result = self.verify_generic(code)

        result["language"] = language
        result.setdefault("is_valid", not result.get("errors"))
        result.setdefault("execution_result", None)

        # Optional execution
        if execute and result["is_valid"]:
            executor = getattr(self, f"execute_{language}", None)
            if executor:
                try:
                    result["execution_result"] = executor(code, timeout)
                except Exception as e:
                    result["execution_result"] = {
                        "success": False,
                        "output": "",
                        "error": str(e),
                    }

        # Generate summary
        result["summary"] = self._generate_summary(result)
        return result

    # ============ Syntax Verification Methods ============

    def verify_python(self, code: str) -> dict[str, Any]:
        """Verify Python code syntax."""
        errors = []
        warnings = []

        try:
            ast.parse(code)
        except SyntaxError as e:
            errors.append(f"Syntax Error at line {e.lineno}: {e.msg}")
        except Exception as e:
            errors.append(f"Parse Error: {str(e)}")

        # Check for common issues
        if "import os" in code or "import subprocess" in code:
            warnings.append("Code contains OS/subprocess imports - potential security risk")
        if "__import__" in code:
            warnings.append("Code uses dynamic imports - verify source")

        return {"errors": errors, "warnings": warnings}

    def verify_javascript(self, code: str) -> dict[str, Any]:
        """Verify JavaScript code syntax."""
        errors = []
        warnings = []

        # Use node to check syntax
        try:
            result = subprocess.run(
                ["node", "--check"],
                input=code.encode(),
                capture_output=True,
                timeout=5,
            )
            if result.returncode != 0:
                error_msg = result.stderr.decode().strip()
                errors.append(f"Syntax Error: {error_msg}")
        except subprocess.TimeoutExpired:
            errors.append("Syntax check timed out")
        except FileNotFoundError:
            warnings.append("Node.js not found - skipping syntax check")
        except Exception as e:
            errors.append(f"Verification error: {str(e)}")

        # Basic linting
        if "eval(" in code:
            warnings.append("Code uses eval() - security risk")
        if "innerHTML" in code:
            warnings.append("Code modifies innerHTML directly - XSS risk")

        return {"errors": errors, "warnings": warnings}

    def verify_typescript(self, code: str) -> dict[str, Any]:
        """Verify TypeScript code syntax."""
        errors = []
        warnings = []

        # Basic TypeScript syntax validation via node/tsc if available
        with tempfile.NamedTemporaryFile(suffix=".ts", mode="w", delete=False) as f:
            f.write(code)
            temp_file = f.name

        try:
            result = subprocess.run(
                ["tsc", "--noEmit", "--skipLibCheck", temp_file],
                capture_output=True,
                timeout=5,
            )
            if result.returncode != 0:
                error_msg = result.stderr.decode().strip()
                if error_msg:
                    errors.append(f"Type Error: {error_msg}")
        except FileNotFoundError:
            warnings.append("TypeScript compiler not found - skipping type check")
        except Exception as e:
            errors.append(f"Verification error: {str(e)}")
        finally:
            Path(temp_file).unlink(missing_ok=True)

        return {"errors": errors, "warnings": warnings}

    def verify_cpp(self, code: str) -> dict[str, Any]:
        """Verify C++ code syntax."""
        errors = []
        warnings = []

        with tempfile.NamedTemporaryFile(suffix=".cpp", mode="w", delete=False) as f:
            f.write(code)
            temp_file = f.name

        try:
            # Use g++ to check syntax (compile check only, no output)
            result = subprocess.run(
                ["g++", "-fsyntax-only", temp_file],
                capture_output=True,
                timeout=10,
            )
            if result.returncode != 0:
                error_msg = result.stderr.decode().strip()
                errors.append(f"Compilation Error: {error_msg}")
        except FileNotFoundError:
            warnings.append("G++ compiler not found - skipping syntax check")
        except subprocess.TimeoutExpired:
            errors.append("Compilation check timed out")
        except Exception as e:
            errors.append(f"Verification error: {str(e)}")
        finally:
            Path(temp_file).unlink(missing_ok=True)

        # Check common C++ issues
        if code.count("{") != code.count("}"):
            errors.append("Mismatched braces")
        if "strcpy" in code or "sprintf" in code:
            warnings.append("Code uses unsafe functions (strcpy/sprintf) - use safe alternatives")

        return {"errors": errors, "warnings": warnings}

    def verify_c(self, code: str) -> dict[str, Any]:
        """Verify C code syntax."""
        errors = []
        warnings = []

        with tempfile.NamedTemporaryFile(suffix=".c", mode="w", delete=False) as f:
            f.write(code)
            temp_file = f.name

        try:
            result = subprocess.run(
                ["gcc", "-fsyntax-only", temp_file],
                capture_output=True,
                timeout=10,
            )
            if result.returncode != 0:
                error_msg = result.stderr.decode().strip()
                errors.append(f"Compilation Error: {error_msg}")
        except FileNotFoundError:
            warnings.append("GCC compiler not found - skipping syntax check")
        except subprocess.TimeoutExpired:
            errors.append("Compilation check timed out")
        except Exception as e:
            errors.append(f"Verification error: {str(e)}")
        finally:
            Path(temp_file).unlink(missing_ok=True)

        if code.count("{") != code.count("}"):
            errors.append("Mismatched braces")

        return {"errors": errors, "warnings": warnings}

    def verify_java(self, code: str) -> dict[str, Any]:
        """Verify Java code syntax."""
        errors = []
        warnings = []

        # Extract class name from code
        import re

        match = re.search(r"public\s+class\s+(\w+)", code)
        class_name = match.group(1) if match else "Temp"

        with tempfile.TemporaryDirectory() as tmpdir:
            temp_file = Path(tmpdir) / f"{class_name}.java"
            temp_file.write_text(code)

            try:
                result = subprocess.run(
                    ["javac", str(temp_file)],
                    capture_output=True,
                    timeout=10,
                )
                if result.returncode != 0:
                    error_msg = result.stderr.decode().strip()
                    errors.append(f"Compilation Error: {error_msg}")
            except FileNotFoundError:
                warnings.append("Java compiler not found - skipping check")
            except subprocess.TimeoutExpired:
                errors.append("Compilation timed out")
            except Exception as e:
                errors.append(f"Verification error: {str(e)}")

        return {"errors": errors, "warnings": warnings}

    def verify_go(self, code: str) -> dict[str, Any]:
        """Verify Go code syntax."""
        errors = []
        warnings = []

        with tempfile.NamedTemporaryFile(suffix=".go", mode="w", delete=False) as f:
            f.write(code)
            temp_file = f.name

        try:
            result = subprocess.run(
                ["go", "fmt", temp_file],
                capture_output=True,
                timeout=10,
            )
            if result.returncode != 0:
                error_msg = result.stderr.decode().strip()
                errors.append(f"Format/Syntax Error: {error_msg}")
        except FileNotFoundError:
            warnings.append("Go compiler not found - skipping check")
        except subprocess.TimeoutExpired:
            errors.append("Verification timed out")
        except Exception as e:
            errors.append(f"Verification error: {str(e)}")
        finally:
            Path(temp_file).unlink(missing_ok=True)

        return {"errors": errors, "warnings": warnings}

    def verify_rust(self, code: str) -> dict[str, Any]:
        """Verify Rust code syntax."""
        errors = []
        warnings = []

        with tempfile.NamedTemporaryFile(suffix=".rs", mode="w", delete=False) as f:
            f.write(code)
            temp_file = f.name

        try:
            result = subprocess.run(
                ["rustc", "--crate-type", "lib", "--edition", "2021", temp_file],
                capture_output=True,
                timeout=10,
            )
            if result.returncode != 0:
                error_msg = result.stderr.decode().strip()
                errors.append(f"Compilation Error: {error_msg}")
        except FileNotFoundError:
            warnings.append("Rust compiler not found - skipping check")
        except subprocess.TimeoutExpired:
            errors.append("Compilation timed out")
        except Exception as e:
            errors.append(f"Verification error: {str(e)}")
        finally:
            Path(temp_file).unlink(missing_ok=True)

        return {"errors": errors, "warnings": warnings}

    def verify_html(self, code: str) -> dict[str, Any]:
        """Verify HTML code."""
        errors = []
        warnings = []

        # Basic HTML structure checks
        opening_tags = code.count("<")
        closing_tags = code.count(">")

        if opening_tags != closing_tags:
            errors.append("Mismatched HTML tags")

        if "<html>" not in code.lower() and "<!doctype" not in code.lower():
            warnings.append("Missing HTML doctype declaration")

        if "<head>" not in code.lower():
            warnings.append("Missing <head> element")

        if "<body>" not in code.lower():
            warnings.append("Missing <body> element")

        # Security checks
        if "onclick=" in code or "onload=" in code:
            warnings.append("Inline event handlers detected - consider using event listeners")

        return {"errors": errors, "warnings": warnings}

    def verify_css(self, code: str) -> dict[str, Any]:
        """Verify CSS code."""
        errors = []
        warnings = []

        # Basic CSS validation
        brace_count = code.count("{") - code.count("}")
        if brace_count != 0:
            errors.append("Mismatched braces in CSS")

        # Check for common CSS issues
        lines = code.split("\n")
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if line.endswith(";") and "{" not in line and "}" not in line:
                if not any(x in line for x in [":", "@"]):
                    warnings.append(f"Line {i}: Possible CSS syntax issue")

        return {"errors": errors, "warnings": warnings}

    def verify_generic(self, code: str) -> dict[str, Any]:
        """Generic verification for unknown languages."""
        errors = []
        warnings = []

        # Basic checks
        if not code.strip():
            errors.append("Code is empty")

        # Check for matching delimiters
        delimiters = {"(": ")", "[": "]", "{": "}"}
        for open_del, close_del in delimiters.items():
            if code.count(open_del) != code.count(close_del):
                errors.append(f"Mismatched {open_del}/{close_del}")

        warnings.append("Language not recognized - basic verification only")

        return {"errors": errors, "warnings": warnings}

    # ============ Execution Methods ============

    def execute_python(self, code: str, timeout: int) -> dict[str, Any]:
        """Execute Python code safely."""
        try:
            result = subprocess.run(
                ["python", "-c", code],
                capture_output=True,
                timeout=timeout,
                text=True,
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr,
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "output": "", "error": "Execution timed out"}
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def execute_javascript(self, code: str, timeout: int) -> dict[str, Any]:
        """Execute JavaScript code safely."""
        try:
            result = subprocess.run(
                ["node", "-e", code],
                capture_output=True,
                timeout=timeout,
                text=True,
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout,
                "error": result.stderr,
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "output": "", "error": "Execution timed out"}
        except FileNotFoundError:
            return {"success": False, "output": "", "error": "Node.js not found"}
        except Exception as e:
            return {"success": False, "output": "", "error": str(e)}

    def _generate_summary(self, result: dict[str, Any]) -> str:
        """Generate a human-readable verification summary."""
        if result["errors"]:
            error_str = "; ".join(result["errors"][:2])
            return f"❌ Invalid - {error_str}"

        if result["warnings"]:
            warning_str = "; ".join(result["warnings"][:2])
            return f"⚠️  Valid with warnings - {warning_str}"

        if result["execution_result"]:
            if result["execution_result"]["success"]:
                return "✅ Valid and executed successfully"
            else:
                return f"✅ Syntax valid but execution failed: {result['execution_result']['error']}"

        return "✅ Valid"
