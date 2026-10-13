// -------------------------------------------------
// | https://github.com/tree-sitter/tree-sitter-html/blob/master/src/scanner.c
// | The Following is imported from tree-sitter-html
// | and modified to make it compatible with blade
// -------------------------------------------------
#include "tag.h"
#include "tree_sitter/parser.h"

#include <wctype.h>

enum TokenType {
    START_TAG_NAME,
    SCRIPT_START_TAG_NAME,
    STYLE_START_TAG_NAME,
    END_TAG_NAME,
    ERRONEOUS_END_TAG_NAME,
    SELF_CLOSING_TAG_DELIMITER,
    IMPLICIT_END_TAG,
    RAW_TEXT,
    COMMENT,
    // blade
    CUSTOM_DIRECTIVE,
    CUSTOM_DIRECTIVE_START,
    CUSTOM_DIRECTIVE_END,
};

typedef Array(String) NameList;

typedef struct {
    Array(Tag) tags;
    // Names of the open custom if directives, innermost last.
    // e.g. `disk` for both `@disk(...)` and `@unlessdisk(...)`
    NameList custom_directives;
    // Names with no `@end…` anywhere after the current position. Any later
    // position is a suffix of that one, so it saves looking ahead again.
    NameList inline_directives;
} Scanner;

// Longest directive name handled, so it fits in one byte when serialized
#define MAX_DIRECTIVE_NAME_LENGTH 255

// Directives handled by the grammar itself, so they are never treated as
// custom directives. Names starting with `end` or `else` are excluded too.
// main/tests/scanner_test.ts keeps this list in sync with the grammar.
static const char *const BUILTIN_DIRECTIVES[] = {
    "after", "asset", "assets", "auth", "aware", "before", "break", "can", "canany", "cannot", "case",
    "checked", "class", "content", "continue", "csrf", "default", "disabled", "discord", "each", "empty",
    "env", "error", "excerpt", "extends", "extract", "feature", "field", "finished", "for", "foreach",
    "forelse", "fragment", "guest", "hasSection", "if", "import", "include", "includeFirst",
    "includeIf", "includeUnless", "includeWhen", "inertia", "inertiaHead", "inject", "isset", "js",
    "json", "livewire", "livewireScriptConfig", "livewireScripts", "livewireStyles", "method",
    "microsoftTeams", "once", "options", "parent", "permalink", "persist", "php", "prepend",
    "prependOnce", "production", "props", "push", "pushIf", "pushOnce", "readonly", "required",
    "routes", "script", "section", "sectionMissing", "selected", "servers", "set", "setup", "show",
    "slack", "stack", "story", "style", "success", "svg", "switch", "task", "telegram", "teleport",
    "thumbnail", "title", "unless", "use", "verbatim", "vite", "viteReactRefresh", "volt", "while",
    "wireUiScripts", "yield",
};

#define MAX(a, b) ((a) > (b) ? (a) : (b))

static inline void advance(TSLexer *lexer) { lexer->advance(lexer, false); }

static inline void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

// Layout: [count: u16][serialized count: u16] then [length: u8][name] per
// name, as long as they fit before `limit`.
static unsigned serialize_names(NameList *names, char *buffer, unsigned size, unsigned limit) {
    unsigned start = size;
    uint16_t count = names->size > UINT16_MAX ? UINT16_MAX : names->size;
    uint16_t serialized_count = 0;

    size += sizeof(serialized_count);
    memcpy(&buffer[size], &count, sizeof(count));
    size += sizeof(count);

    for (; serialized_count < count; serialized_count++) {
        String *name = &names->contents[serialized_count];
        if (size + 1 + name->size >= limit) {
            break;
        }
        buffer[size++] = (char)name->size;
        memcpy(&buffer[size], name->contents, name->size);
        size += name->size;
    }

    memcpy(&buffer[start], &serialized_count, sizeof(serialized_count));
    return size;
}

static unsigned deserialize_names(NameList *names, const char *buffer, unsigned size, unsigned length) {
    uint16_t count = 0;
    uint16_t serialized_count = 0;

    if (size + sizeof(serialized_count) + sizeof(count) > length) {
        return length;
    }

    memcpy(&serialized_count, &buffer[size], sizeof(serialized_count));
    size += sizeof(serialized_count);
    memcpy(&count, &buffer[size], sizeof(count));
    size += sizeof(count);

    array_reserve(names, count);
    unsigned iter = 0;
    for (; iter < serialized_count; iter++) {
        String name = array_new();
        uint8_t name_length = (uint8_t)buffer[size++];
        array_extend(&name, name_length, &buffer[size]);
        size += name_length;
        array_push(names, name);
    }
    // Keep the count if the buffer ran out of room, an empty name never
    // matches a directive.
    for (; iter < count; iter++) {
        array_push(names, (String)array_new());
    }

    return size;
}

static void clear_names(NameList *names) {
    for (unsigned i = 0; i < names->size; i++) {
        array_delete(&names->contents[i]);
    }
    array_clear(names);
}

static unsigned serialize(Scanner *scanner, char *buffer) {
    // The html tags always keep at least a quarter of the buffer
    unsigned tags_start = serialize_names(&scanner->custom_directives, buffer, 0, TREE_SITTER_SERIALIZATION_BUFFER_SIZE / 2);
    tags_start = serialize_names(&scanner->inline_directives, buffer, tags_start, TREE_SITTER_SERIALIZATION_BUFFER_SIZE * 3 / 4);

    uint16_t tag_count = scanner->tags.size > UINT16_MAX ? UINT16_MAX : scanner->tags.size;
    uint16_t serialized_tag_count = 0;

    unsigned size = tags_start + sizeof(tag_count);
    memcpy(&buffer[size], &tag_count, sizeof(tag_count));
    size += sizeof(tag_count);

    for (; serialized_tag_count < tag_count; serialized_tag_count++) {
        Tag tag = scanner->tags.contents[serialized_tag_count];
        if (tag.type == CUSTOM || tag.type == X_SLOT) {
            unsigned name_length = tag.custom_tag_name.size;
            if (name_length > UINT8_MAX) {
                name_length = UINT8_MAX;
            }
            if (size + 2 + name_length >= TREE_SITTER_SERIALIZATION_BUFFER_SIZE) {
                break;
            }
            buffer[size++] = (char)tag.type;
            buffer[size++] = (char)name_length;
            strncpy(&buffer[size], tag.custom_tag_name.contents, name_length);
            size += name_length;
        } else {
            if (size + 1 >= TREE_SITTER_SERIALIZATION_BUFFER_SIZE) {
                break;
            }
            buffer[size++] = (char)tag.type;
        }
    }

    memcpy(&buffer[tags_start], &serialized_tag_count, sizeof(serialized_tag_count));
    return size;
}

static void deserialize(Scanner *scanner, const char *buffer, unsigned length) {
    for (unsigned i = 0; i < scanner->tags.size; i++) {
        tag_free(&scanner->tags.contents[i]);
    }
    array_clear(&scanner->tags);
    clear_names(&scanner->custom_directives);
    clear_names(&scanner->inline_directives);

    if (length > 0) {
        unsigned size = deserialize_names(&scanner->custom_directives, buffer, 0, length);
        size = deserialize_names(&scanner->inline_directives, buffer, size, length);
        uint16_t tag_count = 0;
        uint16_t serialized_tag_count = 0;

        memcpy(&serialized_tag_count, &buffer[size], sizeof(serialized_tag_count));
        size += sizeof(serialized_tag_count);

        memcpy(&tag_count, &buffer[size], sizeof(tag_count));
        size += sizeof(tag_count);

        array_reserve(&scanner->tags, tag_count);
        if (tag_count > 0) {
            unsigned iter = 0;
            for (iter = 0; iter < serialized_tag_count; iter++) {
                Tag tag = tag_new();
                tag.type = (TagType)buffer[size++];
                if (tag.type == CUSTOM || tag.type == X_SLOT) {
                    uint16_t name_length = (uint8_t)buffer[size++];
                    array_reserve(&tag.custom_tag_name, name_length);
                    tag.custom_tag_name.size = name_length;
                    memcpy(tag.custom_tag_name.contents, &buffer[size], name_length);
                    size += name_length;
                }
                array_push(&scanner->tags, tag);
            }
            // add zero tags if we didn't read enough, this is because the
            // buffer had no more room but we held more tags.
            for (; iter < tag_count; iter++) {
                array_push(&scanner->tags, tag_new());
            }
        }
    }
}

static String scan_tag_name(TSLexer *lexer) {
    String tag_name = array_new();
    while (iswalnum(lexer->lookahead) || lexer->lookahead == '-' || lexer->lookahead == ':' || lexer->lookahead == '.') {
        array_push(&tag_name, towupper(lexer->lookahead));
        advance(lexer);
    }
    return tag_name;
}

static bool scan_comment(TSLexer *lexer) {
    if (lexer->lookahead != '-') {
        return false;
    }
    advance(lexer);
    if (lexer->lookahead != '-') {
        return false;
    }
    advance(lexer);

    unsigned dashes = 0;
    while (lexer->lookahead) {
        switch (lexer->lookahead) {
            case '-':
                ++dashes;
                break;
            case '>':
                if (dashes >= 2) {
                    lexer->result_symbol = COMMENT;
                    advance(lexer);
                    lexer->mark_end(lexer);
                    return true;
                }
            default:
                dashes = 0;
        }
        advance(lexer);
    }
    return false;
}

static bool scan_raw_text(Scanner *scanner, TSLexer *lexer) {
    if (scanner->tags.size == 0) {
        return false;
    }

    lexer->mark_end(lexer);

    const char *end_delimiter = array_back(&scanner->tags)->type == SCRIPT ? "</SCRIPT" : "</STYLE";

    unsigned delimiter_index = 0;
    while (lexer->lookahead) {
        if (towupper(lexer->lookahead) == end_delimiter[delimiter_index]) {
            delimiter_index++;
            if (delimiter_index == strlen(end_delimiter)) {
                break;
            }
            advance(lexer);
        } else {
            delimiter_index = 0;
            advance(lexer);
            lexer->mark_end(lexer);
        }
    }

    lexer->result_symbol = RAW_TEXT;
    return true;
}

static void pop_tag(Scanner *scanner) {
    Tag popped_tag = array_pop(&scanner->tags);
    tag_free(&popped_tag);
}

static bool scan_implicit_end_tag(Scanner *scanner, TSLexer *lexer) {
    Tag *parent = scanner->tags.size == 0 ? NULL : array_back(&scanner->tags);

    bool is_closing_tag = false;
    if (lexer->lookahead == '/') {
        is_closing_tag = true;
        advance(lexer);
    } else {
        if (parent && tag_is_void(parent)) {
            pop_tag(scanner);
            lexer->result_symbol = IMPLICIT_END_TAG;
            return true;
        }
    }

    String tag_name = scan_tag_name(lexer);
    if (tag_name.size == 0 && !lexer->eof(lexer)) {
        array_delete(&tag_name);
        return false;
    }

    Tag next_tag = tag_for_name(tag_name);

    if (is_closing_tag) {
        // The tag correctly closes the topmost element on the stack
        if (scanner->tags.size > 0 && tag_eq(array_back(&scanner->tags), &next_tag)) {
            tag_free(&next_tag);
            return false;
        }

        // Otherwise, dig deeper and queue implicit end tags (to be nice in
        // the case of malformed HTML)
        for (unsigned i = scanner->tags.size; i > 0; i--) {
            if (scanner->tags.contents[i - 1].type == next_tag.type) {
                pop_tag(scanner);
                lexer->result_symbol = IMPLICIT_END_TAG;
                tag_free(&next_tag);
                return true;
            }
        }
    } else if (
        parent &&
        (
            !tag_can_contain(parent, &next_tag) ||
            ((parent->type == HTML || parent->type == HEAD || parent->type == BODY) && lexer->eof(lexer))
        )
    ) {
        pop_tag(scanner);
        lexer->result_symbol = IMPLICIT_END_TAG;
        tag_free(&next_tag);
        return true;
    }

    tag_free(&next_tag);
    return false;
}

static bool scan_start_tag_name(Scanner *scanner, TSLexer *lexer) {
    String tag_name = scan_tag_name(lexer);
    if (tag_name.size == 0) {
        array_delete(&tag_name);
        return false;
    }

    Tag tag = tag_for_name(tag_name);
    array_push(&scanner->tags, tag);
    switch (tag.type) {
        case SCRIPT:
            lexer->result_symbol = SCRIPT_START_TAG_NAME;
            break;
        case STYLE:
            lexer->result_symbol = STYLE_START_TAG_NAME;
            break;
        default:
            lexer->result_symbol = START_TAG_NAME;
            break;
    }
    return true;
}

static bool scan_end_tag_name(Scanner *scanner, TSLexer *lexer) {
    String tag_name = scan_tag_name(lexer);

    if (tag_name.size == 0) {
        array_delete(&tag_name);
        return false;
    }

    Tag tag = tag_for_name(tag_name);
    if (scanner->tags.size > 0 && tag_eq(array_back(&scanner->tags), &tag)) {
        pop_tag(scanner);
        lexer->result_symbol = END_TAG_NAME;
    } else {
        lexer->result_symbol = ERRONEOUS_END_TAG_NAME;
    }

    tag_free(&tag);
    return true;
}

static bool scan_self_closing_tag_delimiter(Scanner *scanner, TSLexer *lexer) {
    advance(lexer);
    if (lexer->lookahead == '>') {
        advance(lexer);
        if (scanner->tags.size > 0) {
            pop_tag(scanner);
            lexer->result_symbol = SELF_CLOSING_TAG_DELIMITER;
        }
        return true;
    }
    return false;
}

static inline bool is_directive_char(int32_t c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9');
}

static inline bool has_prefix(const char *name, unsigned length, const char *prefix) {
    unsigned prefix_length = strlen(prefix);
    return length >= prefix_length && memcmp(name, prefix, prefix_length) == 0;
}

static inline bool name_eq(const char *name, unsigned length, const char *other, unsigned other_length) {
    return length == other_length && memcmp(name, other, length) == 0;
}

static bool is_builtin_directive(const char *name, unsigned length) {
    for (unsigned i = 0; i < sizeof(BUILTIN_DIRECTIVES) / sizeof(BUILTIN_DIRECTIVES[0]); i++) {
        if (name_eq(name, length, BUILTIN_DIRECTIVES[i], strlen(BUILTIN_DIRECTIVES[i]))) {
            return true;
        }
    }
    return false;
}

// `@disk` or `@unlessdisk` opening a `disk` custom directive
static bool opens_custom_directive(const char *name, unsigned length, const char *base, unsigned base_length) {
    return name_eq(name, length, base, base_length) ||
           (has_prefix(name, length, "unless") && name_eq(name + 6, length - 6, base, base_length));
}

// `@enddisk` closing a `disk` custom directive
static bool closes_custom_directive(const char *name, unsigned length, const char *base, unsigned base_length) {
    return has_prefix(name, length, "end") && name_eq(name + 3, length - 3, base, base_length);
}

// Reads the directive name following an `@`. Fails if it is empty or longer
// than MAX_DIRECTIVE_NAME_LENGTH, in which case the whole name is consumed.
static bool scan_directive_name(TSLexer *lexer, char *name, unsigned *length) {
    *length = 0;
    while (is_directive_char(lexer->lookahead)) {
        if (*length == MAX_DIRECTIVE_NAME_LENGTH) {
            while (is_directive_char(lexer->lookahead)) {
                advance(lexer);
            }
            return false;
        }
        name[(*length)++] = (char)lexer->lookahead;
        advance(lexer);
    }
    return *length > 0;
}

static inline void skip_blanks(TSLexer *lexer) {
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
        advance(lexer);
    }
}

static bool contains_name(NameList *names, const char *name, unsigned length) {
    for (unsigned i = 0; i < names->size; i++) {
        if (name_eq(name, length, names->contents[i].contents, names->contents[i].size)) {
            return true;
        }
    }
    return false;
}

typedef enum {
    CUSTOM_END_FOUND,
    // no `@end…` with this name at all, so none after any later position either
    CUSTOM_END_NONE,
    // only `@end…` closing other directives with the same name
    CUSTOM_END_UNBALANCED,
} CustomEnd;

// Looks ahead for the `@end…` closing the custom directive that was just read,
// skipping over nested directives with the same name.
static CustomEnd find_custom_directive_end(TSLexer *lexer, const char *base, unsigned base_length) {
    char name[MAX_DIRECTIVE_NAME_LENGTH];
    unsigned length = 0;
    unsigned depth = 1;
    bool has_end = false;

    while (!lexer->eof(lexer)) {
        if (lexer->lookahead != '@') {
            advance(lexer);
            continue;
        }
        advance(lexer);

        // escaped directive e.g. @@enddisk
        if (lexer->lookahead == '@') {
            advance(lexer);
            scan_directive_name(lexer, name, &length);
            continue;
        }

        if (!scan_directive_name(lexer, name, &length)) {
            continue;
        }

        if (closes_custom_directive(name, length, base, base_length)) {
            has_end = true;
            if (--depth == 0) {
                return CUSTOM_END_FOUND;
            }
        } else if (opens_custom_directive(name, length, base, base_length)) {
            skip_blanks(lexer);
            if (lexer->lookahead == '(') {
                depth++;
            }
        }
    }

    return has_end ? CUSTOM_END_UNBALANCED : CUSTOM_END_NONE;
}

// Custom directives come in two forms:
// - if statements registered via Blade::if(), e.g. `@disk('local') ... @enddisk`
//   or `@unlessdisk('local') ... @enddisk`, emitted as CUSTOM_DIRECTIVE_START
//   and CUSTOM_DIRECTIVE_END
// - inline ones registered via Blade::directive(), e.g. `@datetime($now)`,
//   emitted as CUSTOM_DIRECTIVE
// The only way to tell them apart is whether a matching `@end…` follows.
static bool scan_custom_directive(Scanner *scanner, TSLexer *lexer, const bool *valid_symbols) {
    char name[MAX_DIRECTIVE_NAME_LENGTH];
    unsigned length = 0;

    advance(lexer);
    if (!scan_directive_name(lexer, name, &length)) {
        return false;
    }

    if (valid_symbols[CUSTOM_DIRECTIVE_END] && scanner->custom_directives.size > 0) {
        String *open = array_back(&scanner->custom_directives);
        if (closes_custom_directive(name, length, open->contents, open->size)) {
            String closed = array_pop(&scanner->custom_directives);
            array_delete(&closed);
            lexer->mark_end(lexer);
            lexer->result_symbol = CUSTOM_DIRECTIVE_END;
            return true;
        }
    }

    if ((!valid_symbols[CUSTOM_DIRECTIVE_START] && !valid_symbols[CUSTOM_DIRECTIVE]) ||
        has_prefix(name, length, "end") || has_prefix(name, length, "else") ||
        is_builtin_directive(name, length)) {
        return false;
    }

    const char *base = name;
    unsigned base_length = length;
    if (length > 6 && has_prefix(name, length, "unless")) {
        base += 6;
        base_length -= 6;
        if (is_builtin_directive(base, base_length)) {
            return false;
        }
    }

    lexer->mark_end(lexer);

    // both forms need a parameter, only if statements allow blanks before it
    // as inline ones would clash with text such as `@john (admin)`
    bool has_parameter = lexer->lookahead == '(';
    skip_blanks(lexer);
    if (lexer->lookahead != '(') {
        return false;
    }

    if (valid_symbols[CUSTOM_DIRECTIVE_START] && !contains_name(&scanner->inline_directives, base, base_length)) {
        switch (find_custom_directive_end(lexer, base, base_length)) {
            case CUSTOM_END_FOUND: {
                String open = array_new();
                array_extend(&open, base_length, base);
                array_push(&scanner->custom_directives, open);
                lexer->result_symbol = CUSTOM_DIRECTIVE_START;
                return true;
            }
            case CUSTOM_END_NONE: {
                String inline_name = array_new();
                array_extend(&inline_name, base_length, base);
                array_push(&scanner->inline_directives, inline_name);
                break;
            }
            case CUSTOM_END_UNBALANCED:
                break;
        }
    }

    if (!valid_symbols[CUSTOM_DIRECTIVE] || !has_parameter) {
        return false;
    }

    lexer->result_symbol = CUSTOM_DIRECTIVE;
    return true;
}

static bool scan(Scanner *scanner, TSLexer *lexer, const bool *valid_symbols) {
    if (valid_symbols[RAW_TEXT] && !valid_symbols[START_TAG_NAME] && !valid_symbols[END_TAG_NAME]) {
        return scan_raw_text(scanner, lexer);
    }

    while (iswspace(lexer->lookahead)) {
        skip(lexer);
    }

    switch (lexer->lookahead) {
        case '<':
            lexer->mark_end(lexer);
            advance(lexer);

            if (lexer->lookahead == '!') {
                advance(lexer);
                return scan_comment(lexer);
            }

            if (valid_symbols[IMPLICIT_END_TAG]) {
                return scan_implicit_end_tag(scanner, lexer);
            }
            break;

        case '\0':
            if (valid_symbols[IMPLICIT_END_TAG]) {
                return scan_implicit_end_tag(scanner, lexer);
            }
            break;

        case '/':
            if (valid_symbols[SELF_CLOSING_TAG_DELIMITER]) {
                return scan_self_closing_tag_delimiter(scanner, lexer);
            }
            break;

        case '@':
            if (valid_symbols[CUSTOM_DIRECTIVE] || valid_symbols[CUSTOM_DIRECTIVE_START] ||
                valid_symbols[CUSTOM_DIRECTIVE_END]) {
                return scan_custom_directive(scanner, lexer, valid_symbols);
            }
            break;

        default:
            if ((valid_symbols[START_TAG_NAME] || valid_symbols[END_TAG_NAME]) && !valid_symbols[RAW_TEXT]) {
                return valid_symbols[START_TAG_NAME] ? scan_start_tag_name(scanner, lexer)
                                                     : scan_end_tag_name(scanner, lexer);
            }
    }

    return false;
}

void *tree_sitter_blade_external_scanner_create() {
    Scanner *scanner = (Scanner *)ts_calloc(1, sizeof(Scanner));
    return scanner;
}

bool tree_sitter_blade_external_scanner_scan(void *payload, TSLexer *lexer, const bool *valid_symbols) {
    Scanner *scanner = (Scanner *)payload;
    return scan(scanner, lexer, valid_symbols);
}

unsigned tree_sitter_blade_external_scanner_serialize(void *payload, char *buffer) {
    Scanner *scanner = (Scanner *)payload;
    return serialize(scanner, buffer);
}

void tree_sitter_blade_external_scanner_deserialize(void *payload, const char *buffer, unsigned length) {
    Scanner *scanner = (Scanner *)payload;
    deserialize(scanner, buffer, length);
}

void tree_sitter_blade_external_scanner_destroy(void *payload) {
    Scanner *scanner = (Scanner *)payload;
    for (unsigned i = 0; i < scanner->tags.size; i++) {
        tag_free(&scanner->tags.contents[i]);
    }
    array_delete(&scanner->tags);
    clear_names(&scanner->custom_directives);
    array_delete(&scanner->custom_directives);
    clear_names(&scanner->inline_directives);
    array_delete(&scanner->inline_directives);
    ts_free(scanner);
}
