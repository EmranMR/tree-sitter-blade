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

// A directive name stored as a hash, so every entry serializes to the same
// size no matter how long the name is
typedef struct {
    uint32_t hash;
    // 0 for an open custom directive whose name did not fit in the
    // serialized state, it is closed by any custom `@end…`
    uint8_t length;
} DirectiveName;

typedef Array(DirectiveName) DirectiveNames;

typedef struct {
    Array(Tag) tags;
    // The open custom if directives, innermost last.
    // e.g. `disk` for both `@disk(...)` and `@unlessdisk(...)`
    DirectiveNames custom_directives;
    // Names with no `@end…` anywhere after the current position, most
    // recently used last. Any later position is a suffix of that one, so it
    // saves looking ahead again.
    DirectiveNames inline_directives;
} Scanner;

// Bounds of the serialized state, so the html tags always keep more than
// half of the buffer
#define MAX_SERIALIZED_CUSTOM_DIRECTIVES 64
#define MAX_INLINE_DIRECTIVES 32

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

// Layout: [count: u16][serialized count: u16] then [hash: u32][length: u8]
// for each of the innermost `serialized count` names
static unsigned serialize_directive_names(DirectiveNames *names, char *buffer, unsigned size, uint16_t max) {
    uint16_t count = names->size > UINT16_MAX ? UINT16_MAX : names->size;
    uint16_t serialized_count = count > max ? max : count;

    memcpy(&buffer[size], &count, sizeof(count));
    size += sizeof(count);
    memcpy(&buffer[size], &serialized_count, sizeof(serialized_count));
    size += sizeof(serialized_count);

    for (unsigned i = names->size - serialized_count; i < names->size; i++) {
        DirectiveName *name = &names->contents[i];
        memcpy(&buffer[size], &name->hash, sizeof(name->hash));
        size += sizeof(name->hash);
        buffer[size++] = (char)name->length;
    }

    return size;
}

static unsigned deserialize_directive_names(DirectiveNames *names, const char *buffer, unsigned size, unsigned length) {
    uint16_t count = 0;
    uint16_t serialized_count = 0;

    if (size + sizeof(count) + sizeof(serialized_count) > length) {
        return length;
    }

    memcpy(&count, &buffer[size], sizeof(count));
    size += sizeof(count);
    memcpy(&serialized_count, &buffer[size], sizeof(serialized_count));
    size += sizeof(serialized_count);

    array_reserve(names, count);
    // the outermost names that did not fit are unknown
    DirectiveName unknown = {.hash = 0, .length = 0};
    for (unsigned i = serialized_count; i < count; i++) {
        array_push(names, unknown);
    }
    for (unsigned i = 0; i < serialized_count; i++) {
        DirectiveName name;
        memcpy(&name.hash, &buffer[size], sizeof(name.hash));
        size += sizeof(name.hash);
        name.length = (uint8_t)buffer[size++];
        array_push(names, name);
    }

    return size;
}

static unsigned serialize(Scanner *scanner, char *buffer) {
    unsigned tags_start = serialize_directive_names(&scanner->custom_directives, buffer, 0, MAX_SERIALIZED_CUSTOM_DIRECTIVES);
    tags_start = serialize_directive_names(&scanner->inline_directives, buffer, tags_start, MAX_INLINE_DIRECTIVES);

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
    array_clear(&scanner->custom_directives);
    array_clear(&scanner->inline_directives);

    if (length > 0) {
        unsigned size = deserialize_directive_names(&scanner->custom_directives, buffer, 0, length);
        size = deserialize_directive_names(&scanner->inline_directives, buffer, size, length);
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

// FNV-1a
static uint32_t hash_name(const char *name, unsigned length) {
    uint32_t hash = 2166136261u;
    for (unsigned i = 0; i < length; i++) {
        hash ^= (uint8_t)name[i];
        hash *= 16777619u;
    }
    return hash;
}

static inline DirectiveName directive_name(const char *name, unsigned length) {
    DirectiveName directive = {.hash = hash_name(name, length), .length = (uint8_t)length};
    return directive;
}

static inline bool directive_name_eq(DirectiveName a, DirectiveName b) {
    return a.hash == b.hash && a.length == b.length;
}

// `@enddisk` closing the innermost open custom directive
static bool closes_open_custom_directive(Scanner *scanner, const char *name, unsigned length) {
    if (scanner->custom_directives.size == 0 || length <= 3 || !has_prefix(name, length, "end")) {
        return false;
    }
    DirectiveName *open = array_back(&scanner->custom_directives);
    if (open->length == 0) {
        return !is_builtin_directive(name + 3, length - 3);
    }
    return directive_name_eq(*open, directive_name(name + 3, length - 3));
}

// Returns the index of the cached inline directive, or -1
static int find_inline_directive(Scanner *scanner, DirectiveName name) {
    for (unsigned i = scanner->inline_directives.size; i > 0; i--) {
        if (directive_name_eq(scanner->inline_directives.contents[i - 1], name)) {
            return (int)(i - 1);
        }
    }
    return -1;
}

// Moves the name to the most recently used end of the cache, evicting the
// least recently used name when it is full
static void remember_inline_directive(Scanner *scanner, DirectiveName name) {
    int index = find_inline_directive(scanner, name);
    if (index == (int)scanner->inline_directives.size - 1 && index >= 0) {
        return;
    }
    if (index >= 0) {
        array_erase(&scanner->inline_directives, (uint32_t)index);
    } else if (scanner->inline_directives.size >= MAX_INLINE_DIRECTIVES) {
        array_erase(&scanner->inline_directives, 0);
    }
    array_push(&scanner->inline_directives, name);
}

// Advances past `delimiter`, or to the end of the file
static void skip_past(TSLexer *lexer, const char *delimiter, bool case_insensitive) {
    unsigned length = strlen(delimiter);
    char window[16] = {0};
    unsigned seen = 0;

    while (!lexer->eof(lexer)) {
        int32_t c = lexer->lookahead;
        if (case_insensitive && c >= 'A' && c <= 'Z') {
            c += 'a' - 'A';
        }
        memmove(window, window + 1, length - 1);
        window[length - 1] = c < 128 ? (char)c : 0;
        advance(lexer);
        if (++seen >= length && memcmp(window, delimiter, length) == 0) {
            return;
        }
    }
}

// Advances past a directive parameter, balancing parentheses the same way as
// the parameter rule of the grammar
static void skip_parameter(TSLexer *lexer) {
    unsigned depth = 0;
    while (!lexer->eof(lexer)) {
        if (lexer->lookahead == '(') {
            depth++;
        } else if (lexer->lookahead == ')' && --depth == 0) {
            advance(lexer);
            return;
        }
        advance(lexer);
    }
}

// Advances past what follows a `<` when its content is never parsed as
// blade: html comments, php tags and the raw text of script and style elements
static void skip_after_open_angle(TSLexer *lexer) {
    if (lexer->lookahead == '!') {
        advance(lexer);
        if (lexer->lookahead == '-') {
            advance(lexer);
            if (lexer->lookahead == '-') {
                skip_past(lexer, "-->", false);
            }
        }
        return;
    }

    if (lexer->lookahead == '?') {
        skip_past(lexer, "?>", false);
        return;
    }

    char tag_name[7];
    unsigned length = 0;
    while (is_directive_char(lexer->lookahead) && length < sizeof(tag_name)) {
        int32_t c = lexer->lookahead;
        tag_name[length++] = (char)(c >= 'A' && c <= 'Z' ? c + 'a' - 'A' : c);
        advance(lexer);
    }
    if (is_directive_char(lexer->lookahead)) {
        return;
    }
    if (name_eq(tag_name, length, "script", 6)) {
        skip_past(lexer, "</script", true);
    } else if (name_eq(tag_name, length, "style", 5)) {
        skip_past(lexer, "</style", true);
    }
}

// Advances past what follows a `{` when its content is never parsed as
// blade: comments and echo statements
static void skip_after_open_brace(TSLexer *lexer) {
    if (lexer->lookahead == '{') {
        advance(lexer);
        if (lexer->lookahead == '-') {
            advance(lexer);
            skip_past(lexer, lexer->lookahead == '-' ? "-}}" : "}}", false);
        } else {
            skip_past(lexer, "}}", false);
        }
    } else if (lexer->lookahead == '!') {
        advance(lexer);
        if (lexer->lookahead == '!') {
            skip_past(lexer, "!!}", false);
        }
    }
}

typedef enum {
    CUSTOM_END_FOUND,
    // no `@end…` with this name at all, so none after any later position either
    CUSTOM_END_NONE,
    // only `@end…` closing other directives with the same name
    CUSTOM_END_UNBALANCED,
} CustomEnd;

// Looks ahead for the `@end…` closing the custom directive whose parameter
// starts at the lookahead, skipping over nested directives with the same
// name. Only directives the parser would see are taken into account, so
// comments, echo statements, raw php and directive parameters are skipped.
static CustomEnd find_custom_directive_end(TSLexer *lexer, const char *base, unsigned base_length) {
    char name[MAX_DIRECTIVE_NAME_LENGTH];
    unsigned length = 0;
    unsigned depth = 1;
    bool has_end = false;

    skip_parameter(lexer);

    while (!lexer->eof(lexer)) {
        switch (lexer->lookahead) {
            case '{':
                advance(lexer);
                skip_after_open_brace(lexer);
                continue;

            case '<':
                advance(lexer);
                skip_after_open_angle(lexer);
                continue;

            case '@':
                advance(lexer);
                break;

            default:
                advance(lexer);
                continue;
        }

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
            continue;
        }

        skip_blanks(lexer);
        if (lexer->lookahead == '(') {
            if (opens_custom_directive(name, length, base, base_length)) {
                depth++;
            }
            skip_parameter(lexer);
        } else if (name_eq(name, length, "php", 3)) {
            skip_past(lexer, "@endphp", false);
        } else if (name_eq(name, length, "setup", 5)) {
            skip_past(lexer, "@endsetup", false);
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

    if (valid_symbols[CUSTOM_DIRECTIVE_END] && closes_open_custom_directive(scanner, name, length)) {
        array_pop(&scanner->custom_directives);
        lexer->mark_end(lexer);
        lexer->result_symbol = CUSTOM_DIRECTIVE_END;
        return true;
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

    DirectiveName directive = directive_name(base, base_length);
    bool is_inline = find_inline_directive(scanner, directive) >= 0;

    if (valid_symbols[CUSTOM_DIRECTIVE_START] && !is_inline) {
        switch (find_custom_directive_end(lexer, base, base_length)) {
            case CUSTOM_END_FOUND:
                array_push(&scanner->custom_directives, directive);
                lexer->result_symbol = CUSTOM_DIRECTIVE_START;
                return true;
            case CUSTOM_END_NONE:
                is_inline = true;
                break;
            case CUSTOM_END_UNBALANCED:
                break;
        }
    }

    if (!valid_symbols[CUSTOM_DIRECTIVE] || !has_parameter) {
        return false;
    }

    if (is_inline) {
        remember_inline_directive(scanner, directive);
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
    array_delete(&scanner->custom_directives);
    array_delete(&scanner->inline_directives);
    ts_free(scanner);
}
