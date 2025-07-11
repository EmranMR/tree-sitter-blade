import XCTest
import SwiftTreeSitter
import TreeSitterBlade

final class TreeSitterPHPTests: XCTestCase {
    func testGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_blade())
        try parser.setLanguage(language);

        let source = "@php echo 'Hello, World!'; @endphp";

        let tree = try XCTUnwrap(parser.parse(source))
        let root = try XCTUnwrap(tree.rootNode)

        XCTAssertFalse(root.hasError)
    }
}
