"""Launch the URBANAi demo services from a double-clickable executable."""

from pathlib import Path
import subprocess
import sys


def main() -> None:
    project_root = Path(sys.executable if getattr(sys, "frozen", False) else __file__).resolve().parent
    startup_script = project_root / "scripts" / "start.ps1"

    if not startup_script.exists():
        raise FileNotFoundError(f"Startup script not found: {startup_script}")

    subprocess.Popen(
        [
            "powershell.exe",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            str(startup_script),
        ],
        cwd=project_root,
    )


if __name__ == "__main__":
    main()