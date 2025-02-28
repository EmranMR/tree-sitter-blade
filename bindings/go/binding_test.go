package tree_sitter_blade_test

import (
	"testing"

	tree_sitter_blade "github.com/EmranMR/tree-sitter-blade/bindings/go"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_blade.Language())
	if language == nil {
		t.Errorf("Error loading blade grammar")
	}
}
