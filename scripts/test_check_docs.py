#!/usr/bin/env python3
"""Documentation checks against temporary repository fixtures."""
import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path


SPEC = importlib.util.spec_from_file_location("check_docs", Path(__file__).with_name("check-docs.py"))
checker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(checker)
GENERATOR_SPEC = importlib.util.spec_from_file_location("generate_docs", Path(__file__).with_name("generate-docs.py"))
generator = importlib.util.module_from_spec(GENERATOR_SPEC)
GENERATOR_SPEC.loader.exec_module(generator)


class DocumentationChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def write(self, name, text):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def test_installable_topic_requires_readme(self):
        self.write("terminal/install.sh", "#!/bin/sh\n")
        self.assertEqual(len(checker.documentation_errors(self.root, [])), 1)
        self.write("terminal/README.md", "# Terminal\n")
        self.assertEqual(checker.documentation_errors(self.root, []), [])

    def test_local_links_anchors_references_images_and_imports(self):
        self.write("topic/README.md", "# Topic\n## Usage\n## Usage\n## `Config`: macOS / Linux\n")
        self.write("image.svg", "<svg/>")
        source = self.write("README.md", """# Home
[Topic](topic/README.md#usage-1)
[Settings](topic/README.md#config-macos--linux)
[Reference][topic]
[topic]: topic/README.md#usage
![Image](image.svg)
@topic/README.md
[External](https://example.com/missing#remote)
""")
        self.assertEqual(checker.documentation_errors(self.root, [source]), [])
        source.write_text("[Missing](gone.md)\n[Anchor](topic/README.md#gone)\n@absent.md\n[ref]: absent.png\n")
        errors = checker.documentation_errors(self.root, [source])
        self.assertEqual(len(errors), 4)
        self.assertTrue(any("README.md:2: missing heading anchor" in error for error in errors))

    def test_code_and_comments_are_not_links_or_headings(self):
        source = self.write("README.md", """# Home
```md
# Fake
[Example](missing.md)
@absent.md
```
~~~md
[Example](missing.md)
~~~
`[example](missing.md)`
<!-- [Example](missing.md) -->
[Self](#home)
""")
        self.assertEqual(checker.documentation_errors(self.root, [source]), [])
        self.assertNotIn("fake", checker.heading_ids(source.read_text()))

    def test_unicode_setext_and_explicit_anchors(self):
        source = self.write("README.md", "# Café\nSetup\n=====\n<a id=\"custom\"></a>\n[One](#café)\n[Two](#setup)\n[Three](#custom)\n")
        self.assertEqual(checker.documentation_errors(self.root, [source]), [])

    def test_spaces_parentheses_and_reference_titles(self):
        self.write("topic (old).md", "# Old\n")
        self.write("topic(new).md", "# New\n")
        source = self.write("README.md", '[One](<topic (old).md>)\n[Two](topic(new).md "Title")\n[ref]: <topic (old).md> "Title"\n')
        self.assertEqual(checker.documentation_errors(self.root, [source]), [])

    def test_inventory_includes_unstaged_docs_excludes_ignored_and_deleted(self):
        subprocess.run(["git", "init", "-q", str(self.root)], check=True)
        tracked = self.write("tracked.md", "# Tracked\n")
        deleted = self.write("deleted.md", "# Deleted\n")
        subprocess.run(["git", "-C", str(self.root), "add", "tracked.md", "deleted.md"], check=True)
        deleted.unlink()
        new = self.write("new.md", "# New\n")
        self.write(".gitignore", "ignored.md\n")
        self.write("ignored.md", "# Ignored\n")
        self.assertEqual(set(checker.repository_markdown(self.root)), {tracked, new})

    def test_matrix_distinguishes_linux_only_guard_and_partial_git_install(self):
        linux = self.write("llama/install.sh", '''#!/bin/bash
if [[ "$(uname -s)" != "Linux" ]]; then
    echo "Linux-only, skipping." >&2
    exit 0
fi
''')
        git = self.write("git/install.sh", "#!/bin/bash\n")
        bootstrap = self.write("bootstrap-omarchy.sh", 'bash "$DOTFILES_ROOT/git/install-aliases.sh"\nbash "$DOTFILES_ROOT/llama/install.sh"\n')
        matrix = generator.build_platform_matrix([linux, git], bootstrap)
        rendered = generator.render_platform_matrix_markdown(matrix)
        self.assertIn("| `llama` | — Linux only | ✅ |", rendered)
        self.assertIn("| `git` | ✅ | ◐ aliases + optional delta |", rendered)


if __name__ == "__main__":
    unittest.main()
