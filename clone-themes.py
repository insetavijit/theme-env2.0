import os
import shutil
import subprocess
from pathlib import Path

# Constants
WP_REPO = "https://github.com/WordPress/WordPress.git"
TEMP_DIR = Path("temp-wp")
THEMES_TARGET = Path("themes")


def clone_wordpress_repo():
    """
    Clone the official WordPress repository into a temporary folder.
    """
    print("🚀 Cloning WordPress repo...")
    subprocess.run(["git", "clone", "--depth=1", WP_REPO, str(TEMP_DIR)], check=True)


def copy_themes():
    """
    Copy default themes from the cloned repo into ./themes, skipping existing.
    """
    source_themes = TEMP_DIR / "wp-content" / "themes"
    THEMES_TARGET.mkdir(parents=True, exist_ok=True)

    print("📂 Copying themes to ./themes...")
    for item in source_themes.iterdir():
        dest = THEMES_TARGET / item.name
        if dest.exists():
            print(f"⚠️ Skipping existing: {item.name}")
        else:
            if item.is_dir():
                shutil.copytree(item, dest)
            else:
                shutil.copy2(item, dest)


def clean_temp():
    """
    Delete the temporary cloned WordPress folder.
    """
    print("🧹 Removing temp folder...")
    shutil.rmtree(TEMP_DIR)


def fix_theme_permissions():
    """
    Fix ownership and permissions on the ./themes folder using Zsh and sudo.
    """
    command = "sudo chown -R $USER:$USER themes && chmod -R 775 themes"
    print("🔧 Fixing ownership and permissions on ./themes ...")
    subprocess.run(command, shell=True, check=True, executable="/bin/zsh")
    print("✅ Permissions fixed.")


def main():
    try:
        clone_wordpress_repo()
        copy_themes()
        clean_temp()
        fix_theme_permissions()
        print("✅ All done!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Command failed: {e}")
    except FileNotFoundError as e:
        print("❌ Missing required tool (e.g., git):", e)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    main()
