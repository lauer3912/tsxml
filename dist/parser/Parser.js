"use strict";

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = _promise2.default))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator.throw(value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const ast = require('../ast');
const DocumentNode_1 = require('../ast/DocumentNode');
const ContainerNode_1 = require('../ast/ContainerNode');
const SyntaxErrorCode_1 = require('./SyntaxErrorCode');
const SyntaxError_1 = require('./SyntaxError');
/**
 * Parsers create a syntax tree from an XML string. Use the static methods `parse*()` instead of using `new Parser()`.
 */
class Parser {
    /**
     * Creates a new parser object. Use the static methods `parse*()` instead of instantiating manually.
     */
    constructor(stringToParse) {
        this.stringToParse = stringToParse;
        this.ast = new DocumentNode_1.DocumentNode();
        this.currentContainerNode = this.getAst();
        this.currentTokenIndex = 0;
    }
    /**
     * Parses an XML string and returns the parser object that parsed the string.
     * @see Parser.parseStringToAst(...)
     */
    static parseString(stringToParse) {
        return __awaiter(this, void 0, _promise2.default, function* () {
            const parser = new Parser(stringToParse);
            parser.parseComplete();
            return parser;
        });
    }
    /**
     * Parses an XML string and returns a syntax tree.
     * @see Parser.parseString(...)
     */
    static parseStringToAst(stringToParse) {
        return __awaiter(this, void 0, _promise2.default, function* () {
            return (yield Parser.parseString(stringToParse)).getAst();
        });
    }
    /**
     * Returns the syntax tree object the parser creates.
     */
    getAst() {
        return this.ast;
    }
    parseComplete() {
        // don't do anything if the source string is empty
        if (this.stringToParse.length < 1) {
            return;
        }
        while (!this.isAtEndOfInput()) {
            this.parseFromCurrentToken();
        }
    }
    getCurrentLine() {
        return this.getTokenMatrix()[this.getCurrentTokenIndex()].line;
    }
    getCurrentColumn() {
        return this.getTokenMatrix()[this.getCurrentTokenIndex()].column;
    }
    getCurrentTokenIndex() {
        return this.currentTokenIndex;
    }
    isAtEndOfInput() {
        return this.getCurrentTokenIndex() >= this.stringToParse.length;
    }
    getTokenAtIndex(index) {
        return this.stringToParse[index];
    }
    getCurrentToken() {
        return this.getTokenAtIndex(this.getCurrentTokenIndex());
    }
    getTokenRange(startIndex, endIndex) {
        return this.stringToParse.slice(startIndex, endIndex);
    }
    getTokenRangeStartingAt(startIndex, length) {
        return this.stringToParse.slice(startIndex, startIndex + length);
    }
    getNextToken() {
        return this.getTokenAtIndex(this.getCurrentTokenIndex() + 1);
    }
    getPreviousToken() {
        return this.getTokenAtIndex(this.getCurrentTokenIndex() - 1);
    }
    findFirstOccurenceOfTokenAfterIndex(token, startIndex) {
        return this.stringToParse.indexOf(token[0], startIndex);
    }
    doesTokenOccurBeforeNextOccurenceOfOtherToken(token, otherToken, startIndex) {
        const tokenIndex = this.findFirstOccurenceOfTokenAfterIndex(token, startIndex),
              otherTokenIndex = this.findFirstOccurenceOfTokenAfterIndex(otherToken, startIndex);
        if (tokenIndex < 0 || otherTokenIndex < 0) {
            return false;
        }
        return tokenIndex < otherTokenIndex;
    }
    getCurrentContainerNode() {
        return this.currentContainerNode;
    }
    ///
    /// SYNTAX ERROR HANDLING & FACTORY METHODS:
    /// The following methods help creating and raising syntax errors.
    ///
    createSyntaxError(errorCode, line, column, message) {
        return new SyntaxError_1.SyntaxError(errorCode, line, column, this.stringToParse, message);
    }
    createSyntaxErrorAtCurrentToken(errorCode, message) {
        return this.createSyntaxError(errorCode, this.getCurrentLine(), this.getCurrentColumn(), message);
    }
    createUnexpectedTokenSyntaxErrorAtCurrentToken(message) {
        message = message || `token can not be parsed`;
        return this.createSyntaxErrorAtCurrentToken(SyntaxErrorCode_1.SyntaxErrorCode.UnexpectedToken, message);
    }
    raiseError(error) {
        throw error;
    }
    ///
    /// TOKEN IDENTIFICATION & CLASSIFICATION UTILITIES:
    /// Methods that help identifying certain tokens.
    ///
    static isAlphabeticToken(token) {
        return (/[a-z]/i.test(token[0])
        );
    }
    static isNumericToken(token) {
        return (/[0-9]/i.test(token[0])
        );
    }
    static isWhitespaceToken(token) {
        token = token[0];
        return token === ' ' || token === '\t' || token === '\r' || token === '\n';
    }
    static isTokenLegalInTagNameOrTagNameNamespacePrefix(token) {
        return Parser.isAlphabeticToken(token) || Parser.isNumericToken(token) || token[0] === '-' || token[0] === '_';
    }
    static isTokenLegalInAttributeNameOrAttributeNameNameNamespacePrefix(token) {
        return Parser.isAlphabeticToken(token) || Parser.isNumericToken(token) || token[0] === '-' || token[0] === '_';
    }
    ///
    /// TOKEN ITERATION METHODS:
    /// These methods handle the iteration over the XML string that is being parsed. Only use
    /// the methods provided here to iterate over, move along, look at (back or ahead) the XML
    /// string, don't do this manually.
    ///
    moveByNumberOfTokens(numberOfTokens) {
        this.currentTokenIndex += numberOfTokens;
    }
    goBackByNumberOfTokens(numberOfTokens) {
        this.moveByNumberOfTokens(0 - Math.abs(numberOfTokens));
    }
    goBackToPreviousToken() {
        this.goBackByNumberOfTokens(1);
    }
    advanceByNumberOfTokens(numberOfTokens) {
        this.moveByNumberOfTokens(Math.abs(numberOfTokens));
    }
    advanceToNextToken() {
        this.advanceByNumberOfTokens(1);
    }
    ///
    /// PARSING METHODS:
    /// All methods that actually parse XML into AST nodes.
    ///
    parseFromCurrentToken() {
        if (this.isAtEndOfInput()) {
            return;
        }
        switch (true) {
            default:
                this.parseIntoNewTextNode();
                break;
            case typeof this.getCurrentToken() !== 'string':
            case Parser.isWhitespaceToken(this.getCurrentToken()) || this.getCurrentToken() === '\r' || this.getCurrentToken() === '\n':
                this.advanceToNextToken();
                break;
            case this.getCurrentToken() === '<':
                this.parseFromOpenAngleBracket();
                break;
        }
    }
    /**
     * Called when the parser is at an open angle bracket (`<`) and needs to decide how to parse upcoming tokens. This method looks ahead to decide
     * whether the open angle bracket is the beginning of an XML tag, or if it's the beginning of text node content, so either:
     *     <foo...
     *     ^       here
     * or:
     *     <foo><</foo>
     *          ^ here
     *
     * Keep in mind that this method must *only* be called in these two cases, all other possible occurances of open angle brackets are handled in
     * more specific methods (namely when parsing CDATA or comments), which are not ambiguous (comments and CDATA nodes have delimiters that clearly
     * indicate where their content begins and ends, text nodes do not have this).
     * The same goes for attributes: An open angle bracket in a properly quoted attribute string is always going to be parsed as an attribute value.
     * An open angle bracket in an attribute value *that is not enclosed by quotes* is always a syntax error:
     *     <foo bar="1<2" />
     *                ^       OK, but does not concern this method
     *     <foo bar=1<2 />
     *               ^        NOT OK, always a syntax error. Also doesn't concern this method.
     */
    parseFromOpenAngleBracket() {
        // If:
        //     the next token does not indicate a CDATA node, comment, PI or MDO
        //   and:
        //     there's another open angle bracket before the next occurance of a closing angle bracket
        // assume that the current open angle bracket is text node content. In all other cases, assume that the current open angle bracket indicates
        // the bginning of a new tag.
        if (this.getNextToken() !== '!' && this.getNextToken() !== '?' && this.doesTokenOccurBeforeNextOccurenceOfOtherToken('<', '>', this.getCurrentTokenIndex() + 1)) {
            this.parseIntoNewTextNode();
        } else {
            this.parseFromBeginningOfTag();
        }
    }
    /**
     * Creates a new text node, appends it to the ast and parses all upcoming text into it. Stops parsing at the first character that can not be
     * considered text anymore.
     */
    parseIntoNewTextNode() {
        const textNode = new ast.TextNode();
        textNode.content = '';
        this.getCurrentContainerNode().appendChild(textNode);
        // skip all whitespace
        while (Parser.isWhitespaceToken(this.getCurrentToken())) {
            this.advanceToNextToken();
        }
        while (!this.isAtEndOfInput()) {
            // If the current token is an open angle bracket ('<'), we could have the following two situations:
            //     <a>123</a>
            //           ^
            // or:
            //     <a>123<456</a>
            //           ^
            // To distinguish between these situations, we have to check whether another open angle bracket appears
            // before the next closing bracket:
            //     <a>123</a>
            //           ^  |
            //              ^ — There's no other open angle bracket before the closing one, hence
            //                  the open angle bracket opens the closing tag.
            // or:
            //     <a>123<123</a>
            //           ^   |
            //               ^ — There is indeed another open angle bracket before the closing one,
            //                   hence the open angle bracket we're at right now does *not* open the
            //                   closing tag.
            if (this.getCurrentToken() === '<' && !this.doesTokenOccurBeforeNextOccurenceOfOtherToken('<', '>', this.getCurrentTokenIndex() + 1)) {
                // we're at the start of the closing tag, so don't collect any further text content
                break;
            }
            textNode.content += this.getCurrentToken();
            this.advanceToNextToken();
        }
    }
    parseFromBeginningOfTag() {
        // Find out if we're dealing with a "normal" node here or with a MDO (markup declaration opener), PI (processing instruction) or comment.
        // We will not know whether the node is self closing, or if it has child nodes or text content, but
        // we know just enough to delegate the node to a more dedicated parsing method depending on what the
        // node actually is.
        switch (true) {
            default:
                this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken(`expected exclamation mark, question mark or alphabetic tag name`));
                break;
            // The node is a normal tag if it starts with an alphabetic token, such as:
            //     <foo ...
            //      ^
            // or:
            //     <a alpha="1" />
            //      ^
            case Parser.isTokenLegalInTagNameOrTagNameNamespacePrefix(this.getNextToken()):
                this.parseFromBeginningOfNormalNode();
                break;
            // The node is a close tag if it starts with an open angle bracket followed by a slash, such as:
            //     </foo>
            //     ^^
            // or:
            //     </ foo>
            //     ^^
            case this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 2) === '</':
                this.parseFromBeginningOfCloseTag();
                break;
            // If the node's tag name starts with an exclamation mark, the node is either a, CDATA section, MDO or a comment:
            //     <![CDATA[ ...
            //      ^
            // or:
            //     <!DOCTYPE ...
            //      ^
            // or:
            //     <!-- ...
            //      ^
            case this.getNextToken() === '!':
                // Look ahead at the next character(s) to decide whether the node is a CDATA section, MDO or a comment.
                switch (true) {
                    default:
                        this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken(`expected declaration opener or comment node`));
                        break;
                    // There's a CDATA opener coming up
                    //     <![CDATA[ ...
                    //       ^^^^^^^
                    case this.getTokenRangeStartingAt(this.getCurrentTokenIndex() + 2, 7) === '[CDATA[':
                        this.parseFromBeginningOfCDataSectionNode();
                        break;
                    // There's an alphabetic token following the exclamation mark, so it's an MDO node:
                    //     <!DOCTYPE ...
                    //       ^
                    case Parser.isAlphabeticToken(this.getTokenAtIndex(this.getCurrentTokenIndex() + 2)):
                        this.parseFromBeginningOfDeclarationOpenerNode();
                        break;
                    // If there's a double hyphen following the exclamation mark, it's always a comment:
                    //     <!-- ...
                    //       ^^
                    case this.getTokenRangeStartingAt(this.getCurrentTokenIndex() + 2, 2) === '--':
                        this.parseFromBeginningOfCommentNode();
                        break;
                }
                break;
            // If the node's tag name starts with a question mark, the node is a PI:
            //     <?svg ...
            //      ^
            case this.getNextToken() === '?':
                this.parseFromBeginningOfProcessingInstructionNode();
                break;
        }
    }
    parseFromBeginningOfNormalNode() {
        // Validate that we actually have a "normal" node:
        if (!Parser.isTokenLegalInTagNameOrTagNameNamespacePrefix(this.getNextToken())) {
            this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken(`expected beginning of tag name, got '${ this.getNextToken() }'`));
        }
        const node = new ContainerNode_1.ContainerNode();
        this.getCurrentContainerNode().appendChild(node);
        // Skip over the node opener:
        //     <alpha ...
        //     ^      we're here
        this.advanceToNextToken();
        //     <alpha
        //      ^      we're here
        this.parseCompleteOpeningTagInto(node, true, false);
        return;
    }
    parseFromBeginningOfCloseTag() {
        // Validate that we actually have a close tag:
        if (this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 2) !== '</') {
            this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken(`expected beginning of close tag (</...), got '${ this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 2) }'`));
        }
        // Skip over the tag opener:
        //     </alpha ...
        //     ^      we're here
        this.advanceByNumberOfTokens(2);
        //     </alpha
        //       ^      we're here
        while (Parser.isWhitespaceToken(this.getCurrentToken())) {
            this.advanceToNextToken();
        }
        while (Parser.isTokenLegalInTagNameOrTagNameNamespacePrefix(this.getCurrentToken())) {
            this.advanceToNextToken();
        }
        while (Parser.isWhitespaceToken(this.getCurrentToken())) {
            this.advanceToNextToken();
        }
        if (this.getCurrentToken() !== '>') {
            this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken(`expected end of close tag, got '${ this.getCurrentToken() }'`));
        }
        this.advanceToNextToken();
        this.currentContainerNode = this.currentContainerNode.parentNode;
        return;
    }
    parseFromBeginningOfDeclarationOpenerNode() {
        // Validate that we actually have an MDO node:
        if (this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 2) !== '<!') {
            this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken('expected beginning of declaration opener (<!)'));
        }
        // We know this is actually an MDO node, so create the tree member and append it
        const mdoNode = new ast.DeclarationOpenerNode();
        this.getCurrentContainerNode().appendChild(mdoNode);
        // Skip over the MDO opener:
        //     <!DOCTYPE ...
        //     ^      we're here
        this.advanceByNumberOfTokens(2);
        //     <!DOCTYPE
        //       ^      we're here
        this.parseCompleteOpeningTagInto(mdoNode, false, true);
        return;
    }
    parseFromBeginningOfProcessingInstructionNode() {
        // Validate that we actually have a PI node:
        if (this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 2) !== '<?') {
            this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken('expected beginning of processing instruction (<?)'));
        }
        // We know this is actually a PI node, so create the tree member and append it
        const piNode = new ast.ProcessingInstructionNode();
        this.getCurrentContainerNode().appendChild(piNode);
        // Skip over the PI opener:
        //     <?svg ...
        //     ^      we're here
        this.advanceByNumberOfTokens(2);
        //     <?svg
        //       ^      we're here
        this.parseCompleteOpeningTagInto(piNode, false, false);
        return;
    }
    /**
     * Parses a CDATA section.
     * @see https://www.w3.org/TR/xml/#sec-cdata-sect
     */
    parseFromBeginningOfCDataSectionNode() {
        // Validate that we actually have a CDATA section node:
        if (this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 9) !== '<![CDATA[') {
            this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken('expected beginning of CDATA section (<![CDATA[)'));
        }
        // We know this is actually a CDATA section node, so create the tree member and append to its content as long as it isn't closed by ']]>'.
        const cdataNode = new ast.CDataSectionNode();
        this.getCurrentContainerNode().appendChild(cdataNode);
        // Skip over the CDATA opener:
        //     <![CDATA[
        //     ^      we're here
        this.advanceByNumberOfTokens(9);
        //     <![CDATA[
        //             ^      we're here
        // Start appending to the content:
        cdataNode.content = '';
        while (this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 3) !== ']]>') {
            cdataNode.content += this.getCurrentToken();
            this.advanceToNextToken();
        }
        // Skip to after the end of the comment node:
        //     <![CDATA[...]]>
        //                ^      we're here
        this.advanceByNumberOfTokens(3);
        //     <![CDATA[...]]>
        //                    ^      we're now here
        return;
    }
    parseFromBeginningOfCommentNode() {
        // Validate that we actually have a comment node:
        if (this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 4) !== '<!--') {
            this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken('expected beginning of comment (<!--)'));
        }
        // We know this is actually a comment node, so create the tree member and append to its content as long as the comment
        // node is not closed by `-->`.
        const commentNode = new ast.CommentNode();
        this.getCurrentContainerNode().appendChild(commentNode);
        // Skip over the comment opener:
        //     <!--
        //     ^      we're here
        this.advanceByNumberOfTokens(4);
        //     <!--
        //         ^      we're here
        // Start appending to the comment's content:
        commentNode.content = '';
        while (this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 3) !== '-->') {
            commentNode.content += this.getCurrentToken();
            this.advanceToNextToken();
        }
        // Skip to after the end of the comment node:
        //     <!-- some comment text, maybe with line breaks -->
        //                                                   ^      we're here
        this.advanceByNumberOfTokens(4);
        //     <!-- some comment text, maybe with line breaks -->
        //                                                       ^      we're now here
        return;
    }
    parseCompleteOpeningTagInto(node, allowDescendingIntoNewNode, allowSystemLiterals) {
        // we could now be in any of the following constructs:
        //     <alpha ...
        //      ^
        // or:
        //     <!DOCTYPE ...
        //       ^
        // or:
        //     <?svg ...
        //       ^
        this.parseTagNameInto(node);
        if (this.getCurrentToken() !== '?' && this.getCurrentToken() !== '>') {
            this.parseAttributeListInto(node, allowSystemLiterals);
        }
        // skip all whitespace
        while (Parser.isWhitespaceToken(this.getCurrentToken())) {
            this.advanceToNextToken();
        }
        switch (true) {
            default:
                this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken(`expected end of opening tag`));
                break;
            case this.getTokenRangeStartingAt(this.getCurrentTokenIndex(), 2) === '/>':
                this.advanceByNumberOfTokens(2);
                return;
            case this.getCurrentToken() === '?':
                this.advanceToNextToken();
            // FALL THROUGH
            case this.getCurrentToken() === '>':
                if (allowDescendingIntoNewNode) {
                    this.currentContainerNode = node;
                }
                this.advanceToNextToken();
                break;
        }
    }
    /**
     * Parses a tag name into an AST node. Supports namespace prefixes.
     * @param node The AST node to parse the tag name into.
     */
    parseTagNameInto(node) {
        // this will be set to `true` as soon as the first colon was seen
        var colonSeen = false,
            nameStash = '';
        // we could now be in any of the following constructs:
        //     <alpha ...
        //      ^
        //     <alpha:beta ...
        //      ^
        // or:
        //     <!DOCTYPE ...
        //       ^
        // or:
        //     <?svg ...
        //       ^
        while (Parser.isTokenLegalInTagNameOrTagNameNamespacePrefix(this.getCurrentToken()) || this.getCurrentToken() === ':') {
            if (this.getCurrentToken() === ':') {
                if (colonSeen) {
                    this.raiseError(this.createSyntaxErrorAtCurrentToken(SyntaxErrorCode_1.SyntaxErrorCode.IllegalNamespacePrefix, 'illegal multiple namespace prefix (multiple colons in tag name)'));
                }
                colonSeen = true;
                node.namespacePrefix = node.namespacePrefix || '';
                node.namespacePrefix += nameStash;
                nameStash = '';
                this.advanceToNextToken();
                if (!Parser.isAlphabeticToken(this.getCurrentToken())) {
                    this.raiseError(this.createSyntaxErrorAtCurrentToken(SyntaxErrorCode_1.SyntaxErrorCode.MissingTagNameAfterNamespacePrefix, 'namespace prefix must be followed by a tag name'));
                    return;
                }
            }
            nameStash += this.getCurrentToken();
            this.advanceToNextToken();
        }
        node.tagName = nameStash;
    }
    parseAttributeListInto(node, allowSystemLiterals) {
        // We are now at the first token after the opening tag name, which could be either whitespace, the end of the opening tag or
        // the start of a system literal:
        //     <alpha fibo="nacci"...
        //           ^
        // or:
        //     <alpha>
        //           ^
        // or:
        //     <alpha />
        //           ^
        // or:
        //     <alpha/>
        //           ^
        // or:
        //     <alpha"FOO"/>
        //           ^
        if (!Parser.isWhitespaceToken(this.getCurrentToken()) && this.getCurrentToken() !== '/' && this.getCurrentToken() !== '>') {
            if (!(allowSystemLiterals && (this.getCurrentToken() !== '"' || this.getCurrentToken() !== '\''))) {
                this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken('expected whitespace or end of opening tag'));
            }
        }
        // skip all whitespace
        while (Parser.isWhitespaceToken(this.getCurrentToken())) {
            this.advanceToNextToken();
        }
        // if there's no alphabetic token here, there are no attributes to be parsed
        if (!Parser.isAlphabeticToken(this.getCurrentToken()) && !(allowSystemLiterals && (this.getCurrentToken() !== '"' || this.getCurrentToken() !== '\''))) {
            return;
        }
        let i = 0;
        // advance until there are no attributes and literals to be parsed
        while (this.getCurrentToken() !== '/' && this.getCurrentToken() !== '>' && i++ < 10) {
            if (this.getCurrentToken() === '"' || this.getCurrentToken() === '\'') {
                if (!allowSystemLiterals) {
                    this.raiseError(this.createUnexpectedTokenSyntaxErrorAtCurrentToken('system literal not allowed on this node'));
                }
                node.systemLiterals.push(this.parseLiteral());
            } else {
                let attrInfo = this.parseAttribute();
                node.setAttribute(attrInfo.name, attrInfo.value);
                // skip all whitespace
                while (Parser.isWhitespaceToken(this.getCurrentToken())) {
                    this.advanceToNextToken();
                }
            }
        }
    }
    parseLiteral() {
        var value = '';
        // skip all whitespace
        while (Parser.isWhitespaceToken(this.getCurrentToken())) {
            this.advanceToNextToken();
        }
        const valueQuoteCharacter = this.getCurrentToken();
        while (!this.isAtEndOfInput()) {
            this.advanceToNextToken();
            if (this.getCurrentToken() === valueQuoteCharacter && this.getPreviousToken() !== '\\') {
                this.advanceToNextToken();
                break;
            }
            if (this.getCurrentToken() === '\\' && this.getNextToken() === valueQuoteCharacter) {
                continue;
            }
            value += this.getCurrentToken();
        }
        return value;
    }
    parseAttribute() {
        var name = '',
            value,
            valueQuoteCharacter,
            colonSeen = false,
            getAttrInfo = () => ({ name: name, value: value });
        // skip all whitespace
        while (Parser.isWhitespaceToken(this.getCurrentToken())) {
            this.advanceToNextToken();
        }
        // advance as long as we're in the attribute's name
        while (Parser.isTokenLegalInAttributeNameOrAttributeNameNameNamespacePrefix(this.getCurrentToken()) || this.getCurrentToken() === ':') {
            if (this.getCurrentToken() === ':') {
                if (colonSeen) {
                    this.raiseError(this.createSyntaxErrorAtCurrentToken(SyntaxErrorCode_1.SyntaxErrorCode.IllegalNamespacePrefix, 'illegal multiple namespace prefix (multiple colons in tag name)'));
                }
                colonSeen = true;
                if (!Parser.isAlphabeticToken(this.getNextToken())) {
                    this.raiseError(this.createSyntaxErrorAtCurrentToken(SyntaxErrorCode_1.SyntaxErrorCode.MissingTagNameAfterNamespacePrefix, 'namespace prefix must be followed by a tag name'));
                    return;
                }
            }
            name += this.getCurrentToken();
            this.advanceToNextToken();
        }
        // skip all whitespace after the attribute name
        while (Parser.isWhitespaceToken(this.getCurrentToken())) {
            this.advanceToNextToken();
        }
        // if there's no equal sign here, the attribute is empty:
        if (this.getCurrentToken() !== '=') {
            return getAttrInfo();
        }
        this.advanceToNextToken();
        if (Parser.isWhitespaceToken(this.getCurrentToken()) || this.getCurrentToken() === '"' || this.getCurrentToken() === '\'') {
            // skip all whitespace after the equal sign
            while (Parser.isWhitespaceToken(this.getCurrentToken())) {
                this.advanceToNextToken();
            }
            if (this.getCurrentToken() === '"' || this.getCurrentToken() === '\'') {
                valueQuoteCharacter = this.getCurrentToken();
            } else {
                return getAttrInfo();
            }
        } else {}
        value = '';
        while (!this.isAtEndOfInput()) {
            this.advanceToNextToken();
            if (this.getCurrentToken() === valueQuoteCharacter && this.getPreviousToken() !== '\\') {
                this.advanceToNextToken();
                break;
            }
            if (this.getCurrentToken() === '\\' && this.getNextToken() === valueQuoteCharacter) {
                continue;
            }
            value += this.getCurrentToken();
        }
        return getAttrInfo();
    }
    ///
    /// MISC METHODS & PROPERTIES:
    ///
    getTokenMatrix() {
        if (typeof this.tokenMatrix !== 'object' || this.tokenMatrix === null) {
            this.createTokenMatrix();
        }
        return this.tokenMatrix;
    }
    createTokenMatrix() {
        var line = 1,
            column = 0;
        this.tokenMatrix = new Array(this.stringToParse.length);
        for (let i = 0; i < this.stringToParse.length; i++) {
            column += 1;
            const currentToken = this.stringToParse[i];
            this.tokenMatrix[i] = { line: line, column: column };
            if (currentToken === '\n') {
                line += 1;
                column = 0;
            }
        }
    }
}
exports.Parser = Parser;