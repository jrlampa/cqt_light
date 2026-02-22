import os
import subprocess
import shutil

# This script assumes it's being run from the root of the PROJECT or the scripts directory.
# We will use absolute paths to be safe.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = BASE_DIR
DIST_DIR = os.path.join(SCRIPTS_DIR, "dist")

scripts_to_package = [
    "audit_engine.py",
    "bom_generator.py",
    "dxf_auditor.py"
]

def package():
    if os.path.exists(DIST_DIR):
        print(f"Cleaning existing dist: {DIST_DIR}")
        shutil.rmtree(DIST_DIR)
    os.makedirs(DIST_DIR)

    for script in scripts_to_package:
        script_path = os.path.join(SCRIPTS_DIR, script)
        print(f"--- Packaging {script} from {script_path} ---")
        
        if not os.path.exists(script_path):
            print(f"ERROR: Script not found: {script_path}")
            continue

        cmd = [
            "python", "-m", "PyInstaller",
            "--onefile",
            "--distpath", DIST_DIR,
            "--workpath", os.path.join(BASE_DIR, "build"),
            "--specpath", BASE_DIR,
            script_path
        ]
        
        try:
            subprocess.run(cmd, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Failed to package {script}: {e}")

    print("--- Python Packaging Complete ---")

if __name__ == "__main__":
    package()
