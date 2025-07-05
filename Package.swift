// swift-tools-version:5.3
import PackageDescription

let package = Package(
  name: "TreeSitterBlade",
  products: [
    .library(name: "TreeSitterBlade", targets: ["TreeSitterBlade"]),
  ],
  dependencies: [
    .package(url: "https://github.com/tree-sitter/swift-tree-sitter", from: "0.9.0"),
  ],
  targets: [
    .target(
      name: "TreeSitterBlade",
      path: ".",
      sources: [
        "src/parser.c",
        "src/scanner.c",
      ],
      resources: [
        .copy("queries")
      ],
      publicHeadersPath: "bindings/swift",
      cSettings: [.headerSearchPath("src")]
    ),
    .testTarget(
      name: "TreeSitterBladeTests",
      dependencies: [
        .product(name: "SwiftTreeSitter", package: "swift-tree-sitter"),
        "TreeSitterBlade",
      ],
      path: "bindings/swift/TreeSitterBladeTests"
    )
  ]
)
