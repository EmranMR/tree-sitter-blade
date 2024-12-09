package tree_sitter_blade

// #cgo CPPFLAGS: -I../../src
// #include "../../src/parser.c"
import "C"

import (
	"unsafe"
)

func Language() unsafe.Pointer {
	return unsafe.Pointer(C.tree_sitter_blade())
}
