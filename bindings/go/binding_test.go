package tree_sitter_blade_test

import (
	"testing"

	tree_sitter_blade "github.com/EmranMR/tree-sitter-blade/bindings/go"
	tree_sitter "github.com/tree-sitter/go-tree-sitter"
)

func TestGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_blade.Language())
	if language == nil {
		t.Errorf("Error loading Blade grammar")
	}

	sourceCode := []byte("@php echo 'Hello, World!'; @endphp")
	parser := tree_sitter.NewParser()
	defer parser.Close()
	parser.SetLanguage(language)

	tree := parser.Parse(sourceCode, nil)
	if tree == nil || tree.RootNode().HasError() {
		t.Errorf("Error parsing Blade")
	}
}
