#include <tree_sitter/parser.h>
#include <string.h>
#include <wctype.h>

enum TokenType {
  AUTOMATIC_SEMICOLON,
  TEMPLATE_CHARS,
  TERNARY_QMARK,
  JSX_TEXT,
  SCRIPT_CONTENT,
};

void *tree_sitter_ripple_external_scanner_create() { return NULL; }
void tree_sitter_ripple_external_scanner_destroy(void *p) {}
void tree_sitter_ripple_external_scanner_reset(void *p) {}
unsigned tree_sitter_ripple_external_scanner_serialize(void *p, char *buffer) { return 0; }
void tree_sitter_ripple_external_scanner_deserialize(void *p, const char *b, unsigned n) {}

static void advance(TSLexer *lexer) { lexer->advance(lexer, false); }
static void skip(TSLexer *lexer) { lexer->advance(lexer, true); }

static bool scan_whitespace_and_comments(TSLexer *lexer) {
  for (;;) {
    while (iswspace(lexer->lookahead)) {
      skip(lexer);
    }

    if (lexer->lookahead == '/') {
      skip(lexer);

      if (lexer->lookahead == '/') {
        skip(lexer);
        while (lexer->lookahead != 0 && lexer->lookahead != '\n') {
          skip(lexer);
        }
      } else if (lexer->lookahead == '*') {
        skip(lexer);
        while (true) {
          if (lexer->lookahead == 0) return false;
          if (lexer->lookahead == '*') {
            skip(lexer);
            if (lexer->lookahead == '/') {
              skip(lexer);
              break;
            }
          } else {
            skip(lexer);
          }
        }
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
}

static bool scan_automatic_semicolon(TSLexer *lexer) {
  lexer->result_symbol = AUTOMATIC_SEMICOLON;
  lexer->mark_end(lexer);

  for (;;) {
    if (lexer->lookahead == 0) return true;
    if (lexer->lookahead == '}') return true;
    if (lexer->is_at_included_range_start(lexer)) return true;
    if (lexer->lookahead == '\n') break;
    if (!iswspace(lexer->lookahead)) return false;
    skip(lexer);
  }

  skip(lexer);

  if (!scan_whitespace_and_comments(lexer)) return false;

  if (lexer->lookahead == ',') return false;
  if (lexer->lookahead == '.') return false;
  if (lexer->lookahead == ':') return false;
  if (lexer->lookahead == ';') return false;
  if (lexer->lookahead == '*') return false;
  if (lexer->lookahead == '%') return false;
  if (lexer->lookahead == '^') return false;
  if (lexer->lookahead == '+') return false;
  if (lexer->lookahead == '-') return false;
  if (lexer->lookahead == '/') return false;
  if (lexer->lookahead == '<') return false;
  if (lexer->lookahead == '=') return false;
  if (lexer->lookahead == '>') return false;
  if (lexer->lookahead == '|') return false;
  if (lexer->lookahead == '&') return false;
  if (lexer->lookahead == '?') return false;
  if (lexer->lookahead == '[') return false;
  if (lexer->lookahead == '(') return false;

  return true;
}

static bool scan_template_chars(TSLexer *lexer) {
  lexer->result_symbol = TEMPLATE_CHARS;
  for (bool has_content = false;; has_content = true) {
    lexer->mark_end(lexer);
    switch (lexer->lookahead) {
      case '`':
        return has_content;
      case '$':
        advance(lexer);
        if (lexer->lookahead == '{') {
          return has_content;
        }
        break;
      case '\\':
        return has_content;
      case 0:
        return false;
      default:
        advance(lexer);
    }
  }
}

static bool scan_ternary_qmark(TSLexer *lexer) {
  for (;;) {
    if (!iswspace(lexer->lookahead)) break;
    skip(lexer);
  }

  if (lexer->lookahead == '?') {
    advance(lexer);

    if (lexer->lookahead != '?') {
      lexer->mark_end(lexer);
      lexer->result_symbol = TERNARY_QMARK;

      if (lexer->lookahead == '.') return false;

      return true;
    }
  }

  return false;
}

static bool is_identifier_start(int32_t c) {
  return c == '_' || c == '$' || iswalpha(c);
}

static bool is_identifier_continue(int32_t c) {
  return is_identifier_start(c) || iswdigit(c);
}

static void scan_identifier_word(TSLexer *lexer, char *word, size_t word_size) {
  unsigned length = 0;

  while (is_identifier_continue(lexer->lookahead)) {
    if (length < word_size - 1) {
      word[length++] = (char)lexer->lookahead;
    }
    advance(lexer);
  }

  word[length] = '\0';
}

static bool check_boundary_lookahead(TSLexer *lexer, const char *word) {
  scan_whitespace_and_comments(lexer);
  if (strcmp(word, "case") == 0) {
    return lexer->lookahead == '\'' || lexer->lookahead == '"' ||
           lexer->lookahead == '`' || lexer->lookahead == '(' ||
           iswdigit(lexer->lookahead) || lexer->lookahead == '-' ||
           is_identifier_start(lexer->lookahead);
  }
  if (strcmp(word, "default") == 0) {
    return lexer->lookahead == ':';
  }
  if (strcmp(word, "else") == 0) {
    return lexer->lookahead == '{' || lexer->lookahead == 'i';
  }
  if (strcmp(word, "catch") == 0) {
    return lexer->lookahead == '(' || lexer->lookahead == '{';
  }
  return lexer->lookahead == '{';
}

static bool scan_jsx_text(TSLexer *lexer) {
  lexer->result_symbol = JSX_TEXT;
  bool has_content = false;
  bool has_non_whitespace_content = false;
  // True while only whitespace has been consumed since the nearest comment
  // boundary: the token start (right after a sibling element, expression
  // container, or code block) or the start of the current line. A `//` seen
  // while this holds starts a line comment; after real text it is literal, so
  // inline text like `https://…` stays text. `/*` is a comment anywhere.
  bool ws_only_since_boundary = true;

  while (iswspace(lexer->lookahead)) {
    skip(lexer);
    has_content = true;
  }

  if (has_content && lexer->lookahead == '@') {
    return false;
  }

  for (;;) {
    lexer->mark_end(lexer);
    switch (lexer->lookahead) {
      case '<':
      case '{':
      case '}':
      case 0:
        return has_content;
      case '@': {
        if (has_content) {
          return true;
        }
        return false;
      }
      case '/': {
        advance(lexer);
        if (lexer->lookahead == '*') {
          return has_content;
        }
        if (lexer->lookahead == '/' && ws_only_since_boundary) {
          return has_content;
        }
        has_content = true;
        has_non_whitespace_content = true;
        ws_only_since_boundary = false;
        break;
      }
      case '-':
        if (!has_non_whitespace_content) {
          return has_content;
        }
        advance(lexer);
        has_content = true;
        has_non_whitespace_content = true;
        ws_only_since_boundary = false;
        break;
      default:
        if (is_identifier_start(lexer->lookahead)) {
          if (!has_non_whitespace_content) {
            char word[16];
            scan_identifier_word(lexer, word, sizeof(word));
            if (strcmp(word, "finally") == 0 && check_boundary_lookahead(lexer, word)) {
              return false;
            }
            has_content = true;
            has_non_whitespace_content = true;
            ws_only_since_boundary = false;
            break;
          }
          while (is_identifier_continue(lexer->lookahead)) {
            advance(lexer);
          }
          has_content = true;
          has_non_whitespace_content = true;
          ws_only_since_boundary = false;
          break;
        }

        if (lexer->lookahead == '\n' || lexer->lookahead == '\r') {
          ws_only_since_boundary = true;
        } else if (!iswspace(lexer->lookahead)) {
          has_non_whitespace_content = true;
          ws_only_since_boundary = false;
        }
        advance(lexer);
        has_content = true;
    }
  }
}

// Raw `<script>` body: consume everything verbatim (including `<`, `{`, quotes
// and comments) up to, but not including, the literal closing `</script>` tag.
// Mirrors how tree-sitter-html scans raw text, so JS/TS bodies never parse as
// template markup. Returns false for an empty body (the grammar's `optional`
// handles that) or an unterminated element.
static bool scan_script_content(TSLexer *lexer) {
  lexer->result_symbol = SCRIPT_CONTENT;
  const char *end_tag = "</script>";
  bool has_content = false;

  for (;;) {
    lexer->mark_end(lexer);
    if (lexer->lookahead == 0) {
      return false;
    }
    if (lexer->lookahead == '<') {
      unsigned matched = 0;
      while (end_tag[matched] != '\0' && lexer->lookahead == end_tag[matched]) {
        advance(lexer);
        matched++;
      }
      if (end_tag[matched] == '\0') {
        // Full `</script>` seen; mark_end above already excluded it.
        return has_content;
      }
      has_content = true;
    } else {
      advance(lexer);
      has_content = true;
    }
  }
}

bool tree_sitter_ripple_external_scanner_scan(void *payload, TSLexer *lexer,
                                                const bool *valid_symbols) {
  // In error recovery every external token is marked valid at once; the
  // AUTOMATIC_SEMICOLON check filters that out, since it is never valid in the
  // one real state where SCRIPT_CONTENT is (right after `<script ...>`).
  if (valid_symbols[SCRIPT_CONTENT] && !valid_symbols[AUTOMATIC_SEMICOLON]) {
    return scan_script_content(lexer);
  }

  if (valid_symbols[TEMPLATE_CHARS]) {
    return scan_template_chars(lexer);
  }

  if (valid_symbols[AUTOMATIC_SEMICOLON]) {
    bool ret = scan_automatic_semicolon(lexer);
    if (!ret && !valid_symbols[TERNARY_QMARK] && lexer->lookahead == '?') {
      return false;
    }
    return ret;
  }

  if (valid_symbols[TERNARY_QMARK]) {
    return scan_ternary_qmark(lexer);
  }

  if (valid_symbols[JSX_TEXT]) {
    return scan_jsx_text(lexer);
  }

  return false;
}
