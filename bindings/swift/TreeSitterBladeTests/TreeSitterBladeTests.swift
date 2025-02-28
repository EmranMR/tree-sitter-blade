import XCTest
import SwiftTreeSitter
import TreeSitterBlade

final class TreeSitterBladeTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_blade())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Blade grammar")
    }
}
