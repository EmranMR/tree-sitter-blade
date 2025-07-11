from unittest import TestCase

import tree_sitter_blade
from tree_sitter import Language, Parser

class TestLanguage(TestCase):
    def test_grammar(self):
        language = Language(tree_sitter_blade.language())
        parser = Parser(language)
        tree = parser.parse(b"@php echo 'Hello, World!'; @endphp")
        self.assertFalse(tree.root_node.has_error)
