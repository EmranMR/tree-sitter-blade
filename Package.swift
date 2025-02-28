// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterBlade",
    products: [
        .library(name: "TreeSitterBlade", targets: ["TreeSitterBlade"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterBlade",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
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
                "SwiftTreeSitter",
                "TreeSitterBlade",
            ],
            path: "bindings/swift/TreeSitterBladeTests"
        )
    ],
    cLanguageStandard: .c11
)
