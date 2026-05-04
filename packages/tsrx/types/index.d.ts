import type * as AST from 'estree';
import type * as ESTreeJSX from 'estree-jsx';
import type { TSESTree } from '@typescript-eslint/types';
import type { Parse } from './parse.js';
import type * as ESRap from 'esrap';
import type { Position } from 'acorn';
import type { RequireAllOrNone } from '../src/helpers.js';
import type {
	JsxPlatform,
	JsxPlatformHooks,
	JsxTransformContext,
	JsxTransformOptions,
	JsxTransformResult,
	componentToFunctionDeclaration,
	createJsxTransform,
} from './jsx-platform';

export type {
	Parse,
	JsxPlatform,
	JsxPlatformHooks,
	JsxTransformContext,
	JsxTransformOptions,
	JsxTransformResult,
};
export { createJsxTransform, componentToFunctionDeclaration };

/**
 * Compile error interface
 */
export interface CompileError extends Error {
	code: string | undefined;
	pos: number | undefined;
	raisedAt: number | undefined;
	end: number | undefined;
	loc: AST.SourceLocation | undefined;
	fileName: string | null;
	type: 'fatal' | 'usage';
}

/**
 * Compilation options
 */
export interface CompileOptions {
	mode?: 'client' | 'server';
	minify_css?: boolean;
	dev?: boolean;
	hmr?: boolean;
	compat_kinds?: string[];
	/**
	 * When true, non-fatal errors are collected on the result's `errors`
	 * array instead of being thrown. Defaults to false (strict mode: throws).
	 */
	collect?: boolean;
	/**
	 * Enables editor-oriented parser recovery such as incomplete markup.
	 * Also collects non-fatal errors as `collect`.
	 */
	loose?: boolean;
}

export type NameSpace = 'html' | 'svg' | 'mathml';
interface BaseNodeMetaData {
	scoped?: boolean;
	path: AST.Node[];
	has_template?: boolean;
	source_name?: string;
	source_length?: number;
	module_keyword?: 'module' | 'namespace';
	is_capitalized?: boolean;
	commentContainerId?: number;
	parenthesized?: boolean;
	elementLeadingComments?: AST.Comment[];
	returns?: AST.ReturnStatement[];
	has_return?: boolean;
	has_throw?: boolean;
	has_continue?: boolean;
	is_reactive?: boolean;
	lone_return?: boolean;
	forceMapping?: boolean;
	lazy_id?: string;
	disable_verification?: boolean;
	lazy_param_is_component?: boolean;
	lazy_param_binding_mappings?: Array<{
		source: AST.Identifier;
		generated: AST.Identifier | AST.Literal;
	}>;
}

interface FunctionMetaData extends BaseNodeMetaData {
	// needed for volar tokens to recognize component functions
	is_component?: boolean;
	is_method?: boolean;
	tracked?: boolean;
}

// Strip parent, loc, and range from TSESTree nodes to match @sveltejs/acorn-typescript output
// acorn-typescript uses start/end instead of range, and loc is optional
type AcornTSNode<T> = Omit<T, 'parent' | 'loc' | 'range' | 'expression'> & {
	start?: number;
	end?: number;
	loc?: AST.SourceLocation;
	range?: AST.BaseNode['range'];
	metadata: BaseNodeMetaData;

	leadingComments?: AST.Comment[] | undefined;
	trailingComments?: AST.Comment[] | undefined;
};

interface FunctionLikeTS {
	returnType?: AST.TSTypeAnnotation;
	typeParameters?: AST.TSTypeParameterDeclaration;
	typeAnnotation?: AST.TSTypeAnnotation;
}

// TSRX augmentation for ESTree function nodes
declare module 'estree' {
	interface Program {
		innerComments?: Comment[] | undefined;
	}

	interface FunctionDeclaration extends FunctionLikeTS {
		metadata: FunctionMetaData;
	}
	interface FunctionExpression extends FunctionLikeTS {
		metadata: FunctionMetaData;
	}
	interface ArrowFunctionExpression extends FunctionLikeTS {
		metadata: FunctionMetaData;
	}

	interface NewExpression {
		metadata: BaseNodeMetaData & {
			skipNewMapping?: boolean;
		};
	}

	interface SimpleCallExpression {
		metadata: BaseNodeMetaData & {
			hash?: string;
		};
	}

	type Accessibility = 'public' | 'protected' | 'private'; // missing in acorn-typescript types
	interface MethodDefinition {
		typeParameters?: TSTypeParameterDeclaration;
		accessibility?: Accessibility;
	}

	interface PropertyDefinition {
		accessibility?: Accessibility;
		readonly?: boolean;
		optional?: boolean;
	}

	interface ClassDeclaration {
		typeParameters?: AST.TSTypeParameterDeclaration;
		superTypeParameters?: AST.TSTypeParameterInstantiation;
		implements?: AST.TSClassImplements[];
	}

	interface ClassExpression {
		typeParameters?: AST.TSTypeParameterDeclaration;
		superTypeParameters?: AST.TSTypeParameterInstantiation;
		implements?: AST.TSClassImplements[];
	}

	interface Identifier extends AST.TrackedNode {
		metadata: BaseNodeMetaData & {
			// needed for volar tokens to recognize component functions
			is_component?: boolean;
		};
		typeAnnotation?: TSTypeAnnotation | undefined;
		decorators: TSESTree.Decorator[];
		optional: boolean;
	}

	// Lazy destructuring patterns (&{...} and &[...])
	interface ObjectPattern {
		lazy?: boolean;
	}
	interface ArrayPattern {
		lazy?: boolean;
	}

	// We mark the whole node as marked when member is @[expression]
	// Otherwise, we only mark Identifier nodes
	interface MemberExpression {
		tracked?: boolean;
	}

	interface SimpleLiteral extends AST.LiteralNode {}
	interface RegExpLiteral extends AST.LiteralNode {}
	interface BigIntLiteral extends AST.LiteralNode {}

	interface TrackedNode {
		tracked?: boolean;
	}

	interface LiteralNode {
		was_expression?: boolean;
	}

	// Include TypeScript node types and TSRX-specific nodes in NodeMap
	interface NodeMap {
		Component: Component;
		Tsx: Tsx;
		TsxCompat: TsxCompat;
		TSRXExpression: TSRXExpression;
		Html: Html;
		Style: Style;
		Element: Element;
		Text: TextNode;
		Attribute: Attribute;
		RefAttribute: RefAttribute;
		SpreadAttribute: SpreadAttribute;
		ParenthesizedExpression: ParenthesizedExpression;
		ScriptContent: ScriptContent;
	}

	interface ExpressionMap {
		Style: Style;
		Text: TextNode;
		JSXEmptyExpression: ESTreeJSX.JSXEmptyExpression;
		ParenthesizedExpression: ParenthesizedExpression;
		TSAsExpression: TSAsExpression;
	}

	// Missing estree type
	interface ParenthesizedExpression extends AST.BaseNode {
		type: 'ParenthesizedExpression';
		expression: AST.Expression;
		metadata: BaseNodeMetaData & {
			skipParenthesisMapping?: boolean;
		};
	}

	interface Comment {
		context?: Parse.CommentMetaData | null;
	}

	// For now only ObjectExpression needs printInline
	// Needed to avoid ts pragma comments being on the wrong line that
	// does not affect the next line as in the source code
	interface ObjectExpression {
		metadata: BaseNodeMetaData & {
			printInline?: boolean;
		};
	}

	/**
	 * Custom Comment interface with location information
	 */
	type CommentWithLocation = AST.Comment & NodeWithLocation;

	interface TryStatement {
		pending?: AST.BlockStatement | null;
	}

	interface CatchClause {
		resetParam?: AST.Pattern | null;
	}

	interface ForOfStatement {
		index?: AST.Identifier | null;
		key?: AST.Expression | null;
	}

	interface ImportDeclaration {
		importKind: TSESTree.ImportDeclaration['importKind'];
	}
	interface ImportSpecifier {
		importKind: TSESTree.ImportSpecifier['importKind'];
	}
	interface ExportNamedDeclaration {
		exportKind: TSESTree.ExportNamedDeclaration['exportKind'];
	}

	interface BaseNodeWithoutComments {
		// Adding start, end for now as always there
		// later might change to optional
		// And only define on certain nodes
		// BaseNode inherits from this interface
		start?: number;
		end?: number;
	}

	interface BaseNode {
		is_controlled?: boolean;
		// This is for Pattern but it's a type alias
		// So it's just easy to extend BaseNode even though
		// typeAnnotation, typeArguments do not apply to all nodes
		typeAnnotation?: TSTypeAnnotation;
		typeArguments?: TSTypeParameterInstantiation;

		// even though technically metadata starts out as undefined
		// metadata is always populated by the `_` visitor
		// which runs for every node before other visitors
		// so taking a practical approach and making it required
		// to avoid lots of typecasting or checking for undefined
		metadata: BaseNodeMetaData;

		comments?: Comment[];
	}

	interface NodeWithLocation {
		start: number;
		end: number;
		loc: AST.SourceLocation;
	}

	interface NodeWithMaybeComments {
		innerComments?: AST.Comment[] | undefined;
		leadingComments?: AST.Comment[] | undefined;
		trailingComments?: AST.Comment[] | undefined;
	}

	/**
	 * TSRX custom interfaces and types section
	 */
	interface Component extends AST.BaseNode {
		type: 'Component';
		// null is for anonymous components, e.g. `component(props) => {}`
		id: AST.Identifier | null;
		params: AST.Pattern[];
		body: AST.Node[];
		css: CSS.StyleSheet | null;
		metadata: BaseNodeMetaData & {
			arrow?: boolean;
			topScopedClasses?: TopScopedClasses;
			styleClasses?: StyleClasses;
		};
		default: boolean;
		typeParameters?: AST.TSTypeParameterDeclaration;
	}

	interface Tsx extends AST.BaseNode {
		type: 'Tsx';
		attributes: Array<any>;
		children: ESTreeJSX.JSXElement['children'];
		selfClosing?: boolean;
		unclosed?: boolean;
		openingElement: ESTreeJSX.JSXOpeningElement;
		closingElement: ESTreeJSX.JSXClosingElement;
	}

	interface TsxCompat extends AST.BaseNode {
		type: 'TsxCompat';
		kind: string;
		attributes: Array<any>;
		children: ESTreeJSX.JSXElement['children'];
		selfClosing?: boolean;
		unclosed?: boolean;
		openingElement: ESTreeJSX.JSXOpeningElement;
		closingElement: ESTreeJSX.JSXClosingElement;
	}

	interface Html extends AST.BaseNode {
		type: 'Html';
		expression: AST.Expression;
	}

	interface Style extends AST.BaseExpression {
		type: 'Style';
		value: AST.Literal;
		loc?: AST.SourceLocation;
	}

	export interface TSRXExpression extends AST.BaseExpression {
		type: 'TSRXExpression';
		expression: AST.Expression;
		loc?: AST.SourceLocation;
	}

	interface Element extends AST.BaseNode {
		type: 'Element';
		// MemberExpression for namespaced or dynamic elements
		id: AST.Identifier | AST.MemberExpression;
		attributes: TSRXAttribute[];
		children: AST.Node[];
		selfClosing?: boolean;
		unclosed?: boolean;
		loc: SourceLocation;
		metadata: BaseNodeMetaData & {
			ts_name?: string;
			// for <style> tag
			styleScopeHash?: string;
			// for elements with scoped style classes
			css?: {
				scopedClasses: Map<
					string,
					{
						start: number;
						end: number;
						selector: CSS.ClassSelector;
					}
				>;
				hash: string;
			};
		};
		openingElement: ESTreeJSX.JSXOpeningElement;
		closingElement: ESTreeJSX.JSXClosingElement;
		// for <style> tags
		css?: string;
		innerComments?: Comment[];
	}

	export interface TextNode extends AST.BaseExpression {
		type: 'Text';
		expression: AST.Expression;
		raw?: string;
		loc?: AST.SourceLocation;
	}

	interface ScriptContent extends Omit<AST.Element, 'type'> {
		type: 'ScriptContent';
		content: string;
	}

	/**
	 * TSRX attribute nodes
	 */
	interface Attribute extends AST.BaseNode {
		type: 'Attribute';
		name: AST.Identifier;
		value: AST.Expression | null;
		loc?: AST.SourceLocation;
		shorthand?: boolean;
		metadata: BaseNodeMetaData & {
			delegated?: boolean;
		};
	}

	interface RefAttribute extends AST.BaseNode {
		type: 'RefAttribute';
		argument: AST.Expression;
		loc?: AST.SourceLocation;
	}

	interface SpreadAttribute extends AST.BaseNode {
		type: 'SpreadAttribute';
		argument: AST.Expression;
		loc?: AST.SourceLocation;
	}

	/**
	 * TSRX's extended Declaration type that includes Component
	 * Use this instead of Declaration when you need Component support
	 */
	export type TSRXDeclaration = AST.Declaration | Component | AST.TSDeclareFunction;

	/**
	 * TSRX's extended ExportNamedDeclaration with Component support
	 */
	interface TSRXExportNamedDeclaration extends Omit<AST.ExportNamedDeclaration, 'declaration'> {
		declaration?: TSRXDeclaration | null | undefined;
	}

	/**
	 * TSRX's extended Program with Component support
	 */
	interface TSRXProgram extends Omit<Program, 'body'> {
		body: (Program['body'][number] | Component | FunctionExpression)[];
	}

	interface TSRXProperty extends Omit<AST.Property, 'value'> {
		value: AST.Property['value'] | Component;
	}

	export type TSRXAttribute = AST.Attribute | AST.SpreadAttribute | AST.RefAttribute;

	export type TSRXStatement = AST.Statement | TSESTree.Statement;

	export type NodeWithChildren = AST.Element | AST.Tsx | AST.TsxCompat;

	export namespace CSS {
		export interface BaseNode extends AST.NodeWithMaybeComments {
			start: number;
			end: number;
			loc?: AST.SourceLocation;
		}

		export interface StyleSheet extends BaseNode {
			type: 'StyleSheet';
			children: Array<Atrule | Rule>;
			source: string;
			hash: string;
		}

		export interface Atrule extends BaseNode {
			type: 'Atrule';
			name: string;
			prelude: string;
			block: Block | null;
		}

		export interface Rule extends BaseNode {
			type: 'Rule';
			prelude: SelectorList;
			block: Block;
			metadata: {
				parent_rule: Rule | null;
				has_local_selectors: boolean;
				is_global_block: boolean;
			};
		}

		/**
		 * A list of selectors, e.g. `a, b, c {}`
		 */
		export interface SelectorList extends BaseNode {
			type: 'SelectorList';
			/**
			 * The `a`, `b` and `c` in `a, b, c {}`
			 */
			children: ComplexSelector[];
		}

		/**
		 * A complex selector, e.g. `a b c {}`
		 */
		export interface ComplexSelector extends BaseNode {
			type: 'ComplexSelector';
			/**
			 * The `a`, `b` and `c` in `a b c {}`
			 */
			children: RelativeSelector[];
			metadata: {
				rule: Rule | null;
				used: boolean;
				is_global?: boolean;
			};
		}

		/**
		 * A relative selector, e.g the `a` and `> b` in `a > b {}`
		 */
		export interface RelativeSelector extends BaseNode {
			type: 'RelativeSelector';
			/**
			 * In `a > b`, `> b` forms one relative selector, and `>` is the combinator. `null` for the first selector.
			 */
			combinator: null | Combinator;
			/**
			 * The `b:is(...)` in `> b:is(...)`
			 */
			selectors: SimpleSelector[];

			metadata: {
				is_global: boolean;
				is_global_like: boolean;
				scoped: boolean;
			};
		}

		export interface TypeSelector extends BaseNode {
			type: 'TypeSelector';
			name: string;
		}

		export interface IdSelector extends BaseNode {
			type: 'IdSelector';
			name: string;
		}

		export interface ClassSelector extends BaseNode {
			type: 'ClassSelector';
			name: string;
		}

		export interface AttributeSelector extends BaseNode {
			type: 'AttributeSelector';
			name: string;
			matcher: string | null;
			value: string | null;
			flags: string | null;
		}

		export interface PseudoElementSelector extends BaseNode {
			type: 'PseudoElementSelector';
			name: string;
		}

		export interface PseudoClassSelector extends BaseNode {
			type: 'PseudoClassSelector';
			name: string;
			args: SelectorList | null;
		}

		export interface Percentage extends BaseNode {
			type: 'Percentage';
			value: string;
		}

		export interface NestingSelector extends BaseNode {
			type: 'NestingSelector';
			name: '&';
		}

		export interface Nth extends BaseNode {
			type: 'Nth';
			value: string;
		}

		export type SimpleSelector =
			| TypeSelector
			| IdSelector
			| ClassSelector
			| AttributeSelector
			| PseudoElementSelector
			| PseudoClassSelector
			| Percentage
			| Nth
			| NestingSelector;

		export interface Combinator extends BaseNode {
			type: 'Combinator';
			name: string;
		}

		export interface Block extends BaseNode {
			type: 'Block';
			children: Array<Declaration | Rule | Atrule>;
		}

		export interface Declaration extends BaseNode {
			type: 'Declaration';
			property: string;
			value: string;
		}

		// for zimmerframe
		export type Node =
			| StyleSheet
			| Rule
			| Atrule
			| SelectorList
			| Block
			| ComplexSelector
			| RelativeSelector
			| Combinator
			| SimpleSelector
			| Declaration;
	}
}

declare module 'estree-jsx' {
	interface JSXAttribute {
		shorthand: boolean;
	}

	interface JSXIdentifier {
		tracked?: boolean;
		metadata: BaseNodeMetaData & {
			is_component?: boolean;
		};
	}

	interface JSXEmptyExpression {
		loc: AST.SourceLocation;
		innerComments?: AST.Comment[];
	}

	interface JSXOpeningFragment {
		attributes: Array<JSXAttribute | JSXSpreadAttribute>;
	}

	interface JSXElement {
		metadata: BaseNodeMetaData & {
			ts_name?: string;
		};
	}

	interface JSXExpressionContainer {
		html?: boolean;
		text?: boolean;
		style?: boolean;
	}

	interface JSXMemberExpression {
		computed?: boolean;
	}

	interface TSRXJSXOpeningElement extends Omit<JSXOpeningElement, 'name'> {
		name: AST.MemberExpression | JSXIdentifier | JSXNamespacedName;
	}

	interface TSRXJSXClosingElement extends Omit<JSXClosingElement, 'name'> {
		name: AST.MemberExpression | JSXIdentifier | JSXNamespacedName;
	}

	interface ExpressionMap {
		JSXIdentifier: JSXIdentifier;
	}
}

declare module 'estree' {
	// Helper map for creating our own TypeNode
	// and to be used to extend estree's NodeMap
	interface TSNodeMap {
		// TypeScript nodes
		TSAnyKeyword: TSAnyKeyword;
		TSArrayType: TSArrayType;
		TSAsExpression: TSAsExpression;
		TSBigIntKeyword: TSBigIntKeyword;
		TSBooleanKeyword: TSBooleanKeyword;
		TSCallSignatureDeclaration: TSCallSignatureDeclaration;
		TSConditionalType: TSConditionalType;
		TSConstructorType: TSConstructorType;
		TSConstructSignatureDeclaration: TSConstructSignatureDeclaration;
		TSDeclareFunction: TSDeclareFunction;
		TSEnumDeclaration: TSEnumDeclaration;
		TSEnumMember: TSEnumMember;
		TSExportAssignment: TSExportAssignment;
		TSExternalModuleReference: TSExternalModuleReference;
		TSFunctionType: TSFunctionType;
		TSImportEqualsDeclaration: TSImportEqualsDeclaration;
		TSImportType: TSImportType;
		TSIndexedAccessType: TSIndexedAccessType;
		TSIndexSignature: TSIndexSignature;
		TSInferType: TSInferType;
		TSInstantiationExpression: TSInstantiationExpression;
		TSInterfaceBody: TSInterfaceBody;
		TSInterfaceDeclaration: TSInterfaceDeclaration;
		TSIntersectionType: TSIntersectionType;
		TSIntrinsicKeyword: TSIntrinsicKeyword;
		TSLiteralType: TSLiteralType;
		TSMappedType: TSMappedType;
		TSMethodSignature: TSMethodSignature;
		TSModuleBlock: TSModuleBlock;
		TSModuleDeclaration: TSModuleDeclaration;
		TSNamedTupleMember: TSNamedTupleMember;
		TSNamespaceExportDeclaration: TSNamespaceExportDeclaration;
		TSNeverKeyword: TSNeverKeyword;
		TSNonNullExpression: TSNonNullExpression;
		TSNullKeyword: TSNullKeyword;
		TSNumberKeyword: TSNumberKeyword;
		TSObjectKeyword: TSObjectKeyword;
		TSOptionalType: TSOptionalType;
		TSParameterProperty: TSParameterProperty;
		TSPropertySignature: TSPropertySignature;
		TSQualifiedName: TSQualifiedName;
		TSRestType: TSRestType;
		TSSatisfiesExpression: TSSatisfiesExpression;
		TSStringKeyword: TSStringKeyword;
		TSSymbolKeyword: TSSymbolKeyword;
		TSThisType: TSThisType;
		TSTupleType: TSTupleType;
		TSTypeAliasDeclaration: TSTypeAliasDeclaration;
		TSTypeAnnotation: TSTypeAnnotation;
		TSTypeAssertion: TSTypeAssertion;
		TSTypeLiteral: TSTypeLiteral;
		TSTypeOperator: TSTypeOperator;
		TSTypeParameter: TSTypeParameter;
		TSTypeParameterDeclaration: TSTypeParameterDeclaration;
		TSTypeParameterInstantiation: TSTypeParameterInstantiation;
		TSTypePredicate: TSTypePredicate;
		TSTypeQuery: TSTypeQuery;
		TSTypeReference: TSTypeReference;
		TSUndefinedKeyword: TSUndefinedKeyword;
		TSUnionType: TSUnionType;
		TSUnknownKeyword: TSUnknownKeyword;
		TSVoidKeyword: TSVoidKeyword;
		TSParenthesizedType: TSParenthesizedType;
		TSExpressionWithTypeArguments: TSExpressionWithTypeArguments;
		TSClassImplements: TSClassImplements;
	}

	// Create our version of TypeNode with modified types to be used in replacements
	type TypeNode = TSNodeMap[keyof TSNodeMap];

	// Extend NodeMap to include TypeScript nodes
	interface NodeMap extends TSNodeMap {
		TypeNode: TypeNode;
	}

	type EntityName = AST.Identifier | AST.ThisExpression | TSQualifiedName;
	type Parameter =
		| AST.ArrayPattern
		| AST.AssignmentPattern
		| AST.Identifier
		| AST.ObjectPattern
		| AST.RestElement
		| TSParameterProperty;
	type TypeElement =
		| TSCallSignatureDeclaration
		| TSConstructSignatureDeclaration
		| TSIndexSignature
		| TSMethodSignature
		| TSPropertySignature;
	type TSPropertySignature = TSPropertySignatureComputedName | TSPropertySignatureNonComputedName;
	type PropertyNameComputed = AST.Expression;
	type PropertyNameNonComputed = AST.Identifier | NumberLiteral | StringLiteral;

	// TypeScript AST node interfaces from @sveltejs/acorn-typescript
	// Based on TSESTree types but adapted for acorn's output format
	interface TSAnyKeyword extends AcornTSNode<TSESTree.TSAnyKeyword> {}
	interface TSArrayType extends Omit<AcornTSNode<TSESTree.TSArrayType>, 'elementType'> {
		elementType: TypeNode;
	}
	interface TSAsExpression extends Omit<AcornTSNode<TSESTree.TSAsExpression>, 'typeAnnotation'> {
		// Have to override it to use our Expression for required properties like metadata
		expression: AST.Expression;
		typeAnnotation: TypeNode;
	}
	interface TSBigIntKeyword extends AcornTSNode<TSESTree.TSBigIntKeyword> {}
	interface TSBooleanKeyword extends AcornTSNode<TSESTree.TSBooleanKeyword> {}
	interface TSCallSignatureDeclaration extends Omit<
		AcornTSNode<TSESTree.TSCallSignatureDeclaration>,
		'typeParameters' | 'typeAnnotation'
	> {
		parameters: Parameter[];
		typeParameters: TSTypeParameterDeclaration | undefined;
		typeAnnotation: TSTypeAnnotation | undefined;
	}
	interface TSConditionalType extends Omit<
		AcornTSNode<TSESTree.TSConditionalType>,
		'checkType' | 'extendsType' | 'falseType' | 'trueType'
	> {
		checkType: TypeNode;
		extendsType: TypeNode;
		falseType: TypeNode;
		trueType: TypeNode;
	}
	interface TSConstructorType extends Omit<
		AcornTSNode<TSESTree.TSConstructorType>,
		'typeParameters' | 'params'
	> {
		typeAnnotation: TSTypeAnnotation | undefined;
		typeParameters: TSTypeParameterDeclaration | undefined;
		parameters: AST.Parameter[];
	}
	interface TSConstructSignatureDeclaration extends Omit<
		AcornTSNode<TSESTree.TSConstructSignatureDeclaration>,
		'typeParameters' | 'typeAnnotation'
	> {
		parameters: Parameter[];
		typeParameters: TSTypeParameterDeclaration | undefined;
		typeAnnotation: TSTypeAnnotation | undefined;
	}
	interface TSDeclareFunction extends Omit<
		AcornTSNode<TSESTree.TSDeclareFunction>,
		'id' | 'params' | 'typeParameters' | 'returnType'
	> {
		id: AST.Identifier;
		params: Parameter[];
		typeParameters: TSTypeParameterDeclaration | undefined;
		returnType: TSTypeAnnotation | undefined;
	}
	interface TSEnumDeclaration extends Omit<
		AcornTSNode<TSESTree.TSEnumDeclaration>,
		'id' | 'members'
	> {
		id: AST.Identifier;
		members: TSEnumMember[];
	}
	interface TSEnumMember extends Omit<AcornTSNode<TSESTree.TSEnumMember>, 'id' | 'initializer'> {
		id: AST.Identifier | StringLiteral;
		initializer: AST.Expression | undefined;
	}
	interface TSExportAssignment extends Omit<
		AcornTSNode<TSESTree.TSExportAssignment>,
		'expression'
	> {
		expression: AST.Expression;
	}
	interface TSExternalModuleReference extends Omit<
		AcornTSNode<TSESTree.TSExternalModuleReference>,
		'expression'
	> {
		expression: StringLiteral;
	}
	interface TSFunctionType extends Omit<
		AcornTSNode<TSESTree.TSFunctionType>,
		'typeParameters' | 'params'
	> {
		typeAnnotation: TSTypeAnnotation | undefined;
		typeParameters: TSTypeParameterDeclaration | undefined;
		parameters: Parameter[];
	}
	interface TSImportEqualsDeclaration extends AcornTSNode<TSESTree.TSImportEqualsDeclaration> {}
	interface TSImportType extends Omit<
		AcornTSNode<TSESTree.TSImportType>,
		'argument' | 'qualifier' | 'typeParameters'
	> {
		argument: TypeNode;
		qualifier: EntityName | null;
		// looks like acorn-typescript has typeParameters
		typeParameters: TSTypeParameterDeclaration | undefined | undefined;
	}
	interface TSIndexedAccessType extends Omit<
		AcornTSNode<TSESTree.TSIndexedAccessType>,
		'indexType' | 'objectType'
	> {
		indexType: TypeNode;
		objectType: TypeNode;
	}
	interface TSIndexSignature extends Omit<
		AcornTSNode<TSESTree.TSIndexSignature>,
		'parameters' | 'typeAnnotation'
	> {
		parameters: AST.Parameter[];
		typeAnnotation: TSTypeAnnotation | undefined;
	}
	interface TSInferType extends Omit<AcornTSNode<TSESTree.TSInferType>, 'typeParameter'> {
		typeParameter: TSTypeParameter;
	}
	interface TSInstantiationExpression extends Omit<
		AcornTSNode<TSESTree.TSInstantiationExpression>,
		'typeArguments' | 'expression'
	> {
		expression: AST.Expression;
		typeArguments: TSTypeParameterInstantiation;
	}
	interface TSInterfaceBody extends Omit<AcornTSNode<TSESTree.TSInterfaceBody>, 'body'> {
		body: TypeElement[];
	}
	interface TSInterfaceDeclaration extends Omit<
		AcornTSNode<TSESTree.TSInterfaceDeclaration>,
		'id' | 'typeParameters' | 'body' | 'extends'
	> {
		id: AST.Identifier;
		typeParameters: TSTypeParameterDeclaration | undefined;
		body: TSInterfaceBody;
		extends: TSExpressionWithTypeArguments[];
	}
	interface TSIntersectionType extends Omit<AcornTSNode<TSESTree.TSIntersectionType>, 'types'> {
		types: TypeNode[];
	}
	interface TSIntrinsicKeyword extends AcornTSNode<TSESTree.TSIntrinsicKeyword> {}
	interface TSLiteralType extends Omit<AcornTSNode<TSESTree.TSLiteralType>, 'literal'> {
		literal: AST.Literal | AST.TemplateLiteral;
	}
	interface TSMappedType extends Omit<
		AcornTSNode<TSESTree.TSMappedType>,
		'typeParameter' | 'typeAnnotation' | 'nameType'
	> {
		typeAnnotation: TypeNode | undefined;
		typeParameter: TSTypeParameter;
		nameType: TypeNode | null;
	}
	interface TSMethodSignature extends Omit<
		AcornTSNode<TSESTree.TSMethodSignature>,
		'key' | 'typeParameters' | 'params' | 'typeAnnotation'
	> {
		key: PropertyNameComputed | PropertyNameNonComputed;
		typeParameters: TSTypeParameterDeclaration | undefined;
		parameters: Parameter[];
		// doesn't actually exist in the spec but acorn-typescript adds it
		typeAnnotation: TSTypeAnnotation | undefined;
	}
	interface TSModuleBlock extends Omit<AcornTSNode<TSESTree.TSModuleBlock>, 'body'> {
		body: AST.Statement[];
	}
	interface TSModuleDeclaration extends Omit<
		AcornTSNode<TSESTree.TSModuleDeclaration>,
		'body' | 'id'
	> {
		body: TSModuleBlock;
		id: AST.Identifier;
		metadata: BaseNodeMetaData & {
			exports?: Set<string>;
		};
	}
	interface TSNamedTupleMember extends Omit<
		AcornTSNode<TSESTree.TSNamedTupleMember>,
		'elementType' | 'label'
	> {
		elementType: TypeNode;
		label: AST.Identifier;
	}
	interface TSNamespaceExportDeclaration extends Omit<
		AcornTSNode<TSESTree.TSNamespaceExportDeclaration>,
		'id'
	> {
		id: AST.Identifier;
	}
	interface TSNeverKeyword extends AcornTSNode<TSESTree.TSNeverKeyword> {}
	interface TSNonNullExpression extends AcornTSNode<TSESTree.TSNonNullExpression> {
		expression: AST.Expression;
	}
	interface TSNullKeyword extends AcornTSNode<TSESTree.TSNullKeyword> {}
	interface TSNumberKeyword extends AcornTSNode<TSESTree.TSNumberKeyword> {}
	interface TSObjectKeyword extends AcornTSNode<TSESTree.TSObjectKeyword> {}
	interface TSOptionalType extends Omit<AcornTSNode<TSESTree.TSOptionalType>, 'typeAnnotation'> {
		typeAnnotation: TypeNode;
	}
	interface TSParameterProperty extends AcornTSNode<TSESTree.TSParameterProperty> {}
	interface TSPropertySignatureComputedName extends Omit<
		AcornTSNode<TSESTree.TSPropertySignatureComputedName>,
		'key' | 'typeAnnotation'
	> {
		key: PropertyNameComputed;
		typeAnnotation: TSTypeAnnotation | undefined;
	}
	interface TSPropertySignatureNonComputedName extends Omit<
		AcornTSNode<TSESTree.TSPropertySignatureNonComputedName>,
		'key' | 'typeAnnotation'
	> {
		key: PropertyNameNonComputed;
		typeAnnotation: TSTypeAnnotation | undefined;
	}
	interface TSQualifiedName extends Omit<AcornTSNode<TSESTree.TSQualifiedName>, 'left' | 'right'> {
		left: EntityName;
		right: AST.Identifier;
	}
	interface TSRestType extends Omit<AcornTSNode<TSESTree.TSRestType>, 'typeAnnotation'> {
		typeAnnotation: TypeNode;
	}
	interface TSSatisfiesExpression extends Omit<
		AcornTSNode<TSESTree.TSSatisfiesExpression>,
		'typeAnnotation'
	> {
		expression: AST.Expression;
		typeAnnotation: TypeNode;
	}
	interface TSStringKeyword extends AcornTSNode<TSESTree.TSStringKeyword> {}
	interface TSSymbolKeyword extends AcornTSNode<TSESTree.TSSymbolKeyword> {}
	interface TSThisType extends AcornTSNode<TSESTree.TSThisType> {}
	interface TSTupleType extends Omit<AcornTSNode<TSESTree.TSTupleType>, 'elementTypes'> {
		elementTypes: TypeNode[];
	}
	interface TSTypeAliasDeclaration extends Omit<
		AcornTSNode<TSESTree.TSTypeAliasDeclaration>,
		'id' | 'typeParameters' | 'typeAnnotation'
	> {
		id: AST.Identifier;
		typeAnnotation: TypeNode;
		typeParameters: TSTypeParameterDeclaration | undefined;
	}
	interface TSTypeAnnotation extends Omit<
		AcornTSNode<TSESTree.TSTypeAnnotation>,
		'typeAnnotation'
	> {
		typeAnnotation: TypeNode;
	}
	interface TSTypeAssertion extends AcornTSNode<TSESTree.TSTypeAssertion> {
		expression: AST.Expression;
	}
	interface TSTypeLiteral extends Omit<AcornTSNode<TSESTree.TSTypeLiteral>, 'members'> {
		members: TypeElement[];
	}
	interface TSTypeOperator extends Omit<AcornTSNode<TSESTree.TSTypeOperator>, 'typeAnnotation'> {
		typeAnnotation: TypeNode | undefined;
	}
	interface TSTypeParameter extends Omit<
		AcornTSNode<TSESTree.TSTypeParameter>,
		'name' | 'constraint' | 'default'
	> {
		constraint: TypeNode | undefined;
		default: TypeNode | undefined;
		name: string; // for some reason acorn-typescript uses string instead of Identifier
	}
	interface TSTypeParameterDeclaration extends Omit<
		AcornTSNode<TSESTree.TSTypeParameterDeclaration>,
		'params'
	> {
		params: TSTypeParameter[];
		extra?: {
			trailingComma: number;
		};
	}
	interface TSTypeParameterInstantiation extends Omit<
		AcornTSNode<TSESTree.TSTypeParameterInstantiation>,
		'params'
	> {
		params: TypeNode[];
	}
	interface TSTypePredicate extends Omit<
		AcornTSNode<TSESTree.TSTypePredicate>,
		'parameterName' | 'typeAnnotation'
	> {
		parameterName: AST.Identifier | AST.TSThisType;
		typeAnnotation: AST.TSTypeAnnotation | null;
	}
	interface TSTypeQuery extends Omit<
		AcornTSNode<TSESTree.TSTypeQuery>,
		'exprName' | 'typeArguments'
	> {
		exprName: EntityName | TSImportType;
		typeArguments: TSTypeParameterInstantiation | undefined;
	}
	interface TSTypeReference extends Omit<
		AcornTSNode<TSESTree.TSTypeReference>,
		'typeName' | 'typeArguments'
	> {
		typeArguments: TSTypeParameterInstantiation | undefined;
		typeName: EntityName;
	}
	interface TSUndefinedKeyword extends AcornTSNode<TSESTree.TSUndefinedKeyword> {}
	interface TSUnionType extends Omit<AcornTSNode<TSESTree.TSUnionType>, 'types'> {
		types: TypeNode[];
	}
	// TSInterfaceHeritage doesn't exist in acorn-typescript which uses TSExpressionWithTypeArguments
	interface TSInterfaceHeritage extends Omit<
		AcornTSNode<TSESTree.TSInterfaceHeritage>,
		'expression' | 'typeParameters'
	> {
		expression: AST.Expression;
		// acorn-typescript uses typeParameters instead of typeArguments
		typeParameters: TSTypeParameterInstantiation | undefined;
	}
	// Extends TSInterfaceHeritage as it's the semantically the same as used by acorn-typescript
	interface TSExpressionWithTypeArguments extends Omit<TSInterfaceHeritage, 'type'> {
		type: 'TSExpressionWithTypeArguments';
	}

	interface TSClassImplements extends AcornTSNode<TSESTree.TSClassImplements> {}
	interface TSUnknownKeyword extends AcornTSNode<TSESTree.TSUnknownKeyword> {}
	interface TSVoidKeyword extends AcornTSNode<TSESTree.TSVoidKeyword> {}
	interface NumberLiteral extends AcornTSNode<TSESTree.NumberLiteral> {}
	interface StringLiteral extends AcornTSNode<TSESTree.StringLiteral> {}

	// acorn-typescript specific nodes (not in @typescript-eslint/types)
	interface TSParenthesizedType extends AST.BaseNode {
		type: 'TSParenthesizedType';
	}

	// Extend ExpressionMap for TypeScript expressions
	interface ExpressionMap {
		TSAsExpression: TSAsExpression;
		TSInstantiationExpression: TSInstantiationExpression;
		TSNonNullExpression: TSNonNullExpression;
		TSSatisfiesExpression: TSSatisfiesExpression;
		TSTypeAssertion: TSTypeAssertion;
	}
}

/**
 * Parse error information
 */
export interface ParseError {
	message: string;
	pos: number;
	loc: Position;
}

/**
 * Parse options
 */
export interface ParseOptions {
	collect?: boolean;
	loose?: boolean;
	errors?: CompileError[];
	comments?: AST.CommentWithLocation[];
}

/**
 * Analyze options
 */
export interface AnalyzeOptions
	extends ParseOptions, Pick<CompileOptions, 'mode' | 'compat_kinds'> {
	errors?: CompileError[];
	to_ts?: boolean;
}

/**
 * Result of parsing operation
 */
export interface ParseResult {
	ast: AST.Program;
	errors: ParseError[];
}

export interface AnalysisResult {
	ast: AST.Program;
	scopes: Map<AST.Node, ScopeInterface>;
	scope: ScopeInterface;
	component_metadata: Array<{ id: string }>;
	metadata: {
		serverImportsPresent: boolean;
		serverImportDeclarations: AST.ImportDeclaration[];
		serverModule: AST.TSModuleDeclaration | null;
	};
	errors: CompileError[];
	comments: AST.CommentWithLocation[];
}

/**
 * Configuration for the TSRX parser plugin
 */
export interface TSRXPluginConfig {
	allowSatisfies?: boolean;
}

/**
 * Types of declarations in scope
 */
export type DeclarationKind =
	| 'var'
	| 'let'
	| 'const'
	| 'function'
	| 'param'
	| 'rest_param'
	| 'component'
	| 'import'
	| 'module'
	| 'using'
	| 'await using';

/**
 * Binding kinds
 */
export type BindingKind =
	| 'normal'
	| 'for_pattern'
	| 'rest_prop'
	| 'prop'
	| 'prop_fallback'
	| 'lazy'
	| 'lazy_fallback'
	| 'index';

/**
 * A variable binding in a scope
 */
export interface Binding {
	/** The identifier node that declares this binding */
	node: AST.Identifier;
	/** References to this binding */
	references: Array<{ node: AST.Identifier; path: AST.Node[] }>;
	/** Initial value/declaration */
	initial:
		| null
		| AST.Expression
		| AST.FunctionDeclaration
		| AST.ClassDeclaration
		| AST.ImportDeclaration
		| AST.TSModuleDeclaration;
	/** Whether this binding has been reassigned */
	reassigned: boolean;
	/** Whether this binding has been mutated (property access) */
	mutated: boolean;
	/** Whether this binding has been updated (reassigned or mutated) */
	updated: boolean;
	/** Whether this binding represents a called function */
	is_called: boolean;
	/** Additional metadata for this binding */
	metadata: {
		is_dynamic_component?: boolean;
		pattern?: AST.Identifier;
		is_ripple_object?: boolean;
	} | null;
	/** Kind of binding */
	kind: BindingKind;
	/** Declaration kind */
	declaration_kind?: DeclarationKind;
	/** The scope that contains this binding */
	scope: ScopeInterface;
	/** Transform functions for reading, assigning, and updating this binding */
	transform?: {
		read: (node?: AST.Identifier) => AST.Expression;
		assign?: (node: AST.Identifier, value: AST.Expression) => AST.Expression;
		update?: (node: AST.UpdateExpression) => AST.Expression;
	};
	/** Whether the read transform already produces an unwrapped value (calls get() internally) */
	read_unwraps?: boolean;
}

/**
 * Root scope manager
 */
export interface ScopeRootInterface {
	/** Set of conflicting/reserved names */
	conflicts: Set<string>;
	/** Generate unique identifier name */
	unique(preferred_name: string): AST.Identifier;
}

export interface ScopeConstructorInterface {
	root: ScopeRootInterface;
	parent: ScopeInterface | null;
	porous: boolean;
	error_options: {
		collect: boolean;
		errors: CompileError[];
		filename: string;
		comments?: AST.CommentWithLocation[];
	};
}

export type ScopeConstructorParameters = [
	root: ScopeConstructorInterface['root'],
	parent: ScopeConstructorInterface['parent'],
	porous: ScopeConstructorInterface['porous'],
	error_options: ScopeConstructorInterface['error_options'],
];

/**
 * Lexical scope for variable bindings
 */
export interface ScopeInterface {
	/** Root scope manager */
	root: ScopeRootInterface;
	/** Parent scope */
	parent: ScopeInterface | null;
	/** Map of declared bindings */
	declarations: Map<string, Binding>;
	/** Map of declarators to their bindings */
	declarators: Map<AST.VariableDeclarator, Binding[]>;
	/** Map of references in this scope */
	references: Map<string, Array<{ node: AST.Identifier; path: AST.Node[] }>>;
	/** Function nesting depth */
	function_depth: number;
	/** Whether reactive tracing is enabled */
	tracing: null | AST.Expression;
	server_block?: boolean;

	/** Create child scope */
	child(porous?: boolean): ScopeInterface;
	/** Declare a binding */
	declare(
		node: AST.Identifier,
		kind: BindingKind,
		declaration_kind: DeclarationKind,
		initial?:
			| null
			| AST.Expression
			| AST.FunctionDeclaration
			| AST.ClassDeclaration
			| AST.ImportDeclaration
			| AST.TSModuleDeclaration,
	): Binding;
	/** Get binding by name */
	get(name: string): Binding | null;
	/** Get bindings for a declarator */
	get_bindings(node: AST.VariableDeclarator): Binding[];
	/** Find the scope that owns a name */
	owner(name: string): ScopeInterface | null;
	/** Add a reference */
	reference(node: AST.Identifier, path: AST.Node[]): void;
	/** Generate unique identifier name */
	generate(preferred_name: string): string;
}

/**
 * Compiler state object
 */

interface BaseStateMetaData {
	tracking?: boolean | null;
}

export interface BaseState {
	/** For utils */
	scope: ScopeInterface;
	scopes: Map<AST.Node | AST.Node[], ScopeInterface>;
	ancestor_server_block: AST.TSModuleDeclaration | undefined;
	inside_head?: boolean;
	keep_component_style?: boolean;

	/** Common For All */
	to_ts: boolean;
	component?: AST.Component;
}

export interface AnalysisState extends BaseState {
	analysis: AnalysisResult & {
		module: {
			ast: AnalysisResult['ast'];
			scope: AnalysisResult['scope'];
			scopes: AnalysisResult['scopes'];
			filename: string;
		};
	};
	elements?: AST.Element[];
	function_depth?: number;
	collect?: boolean;
	configured_compat_kinds?: Set<string>;
	metadata: BaseStateMetaData & {
		styleClasses?: StyleClasses;
	};
	mode: CompileOptions['mode'];
	// keep this as an object as we destructure
	module: {
		// Incremented counter for generating unique track/trackAsync hashes
		track_id: number;
	};
}

export interface TransformServerState extends BaseState {
	imports: Set<string | AST.ImportDeclaration>;
	init: Array<AST.Statement> | null;
	stylesheets: AST.CSS.StyleSheet[];
	component_metadata: AnalysisResult['component_metadata'];
	filename: string;
	metadata: BaseStateMetaData;
	namespace: NameSpace;
	server_block_locals: AST.VariableDeclaration[];
	server_exported_names: string[];
	dynamicElementName?: AST.TemplateLiteral;
	applyParentCssScope?: AST.CSS.StyleSheet['hash'];
	dev?: boolean;
	return_flags?: Map<AST.ReturnStatement, { name: string; tracked: boolean }>;
	template_child?: boolean;
	skip_regular_blocks?: boolean;
	in_regular_block?: boolean;
}

export type UpdateList = Array<
	RequireAllOrNone<
		{
			identity?: AST.Identifier | AST.Expression;
			initial?: AST.Expression;
			operation: (expr?: AST.Expression, prev?: AST.Expression) => AST.ExpressionStatement;
			expression?: AST.Expression;
			needsPrevTracking?: boolean;
		},
		'initial' | 'identity' | 'expression'
	>
>;

export interface TransformClientState extends BaseState {
	events: Set<string>;
	filename: string;
	final: Array<AST.Statement> | null;
	flush_node: ((is_text?: boolean, is_controlled?: boolean) => AST.Identifier) | null;
	hoisted: Array<AST.Statement>;
	imports: Set<string | AST.ImportDeclaration>;
	server_block_locals: AST.VariableDeclaration[];
	init: Array<AST.Statement> | null;
	metadata: BaseStateMetaData;
	namespace: NameSpace;
	stylesheets: Array<AST.CSS.StyleSheet>;
	template: Array<string | AST.Expression> | null;
	update: UpdateList | null;
	errors: CompileError[];
	applyParentCssScope?: AST.CSS.StyleSheet['hash'];
	skip_children_traversal: boolean;
	return_flags?: Map<AST.ReturnStatement, { name: string; tracked: boolean }>;
	is_tsrx_element?: boolean;
}

/** Override zimmerframe types and provide our own */
type NodeOf<T extends string, X> = X extends { type: T } ? X : never;

type SpecializedVisitors<T extends AST.Node | AST.CSS.Node, U> = {
	[K in T['type']]?: Visitor<NodeOf<K, T>, U, T>;
};

type VisitFn<V> = (node: V) => void;

export type CatchAllVisitor<T, U, V> = (
	node: T,
	context: Context<V, U>,
	visit: VisitFn<V>,
) => V | void;

export type Visitor<T, U, V> = (node: T, context: Context<V, U>) => V | void;

export type Visitors<T extends AST.Node | AST.CSS.Node, U> = T['type'] extends '_'
	? never
	: SpecializedVisitors<T, U> & {
			_?: CatchAllVisitor<T, U, T>;
		};

export interface Context<T, U> extends Omit<
	ESRap.Context,
	'path' | 'state' | 'visit' | 'next' | 'stop'
> {
	next: (state?: U) => T | void;
	path: T[];
	state: U;
	stop: () => void;
	visit: (node: T, state?: U) => T;
}

/**
 * Transform context object
 */
export type TransformClientContext = Context<AST.Node, TransformClientState>;
export type TransformServerContext = Context<AST.Node, TransformServerState>;
export type AnalysisContext = Context<AST.Node, AnalysisState>;
export type CommonContext = TransformClientContext | TransformServerContext | AnalysisContext;
export type VisitorClientContext = TransformClientContext & { root?: boolean };

/**
 * Delegated event result
 */
export interface DelegatedEventResult {
	function?: AST.FunctionExpression | AST.FunctionDeclaration | AST.ArrowFunctionExpression;
}

export type TopScopedClasses = Map<
	string,
	{
		start: number;
		end: number;
		selector: AST.CSS.ClassSelector;
	}
>;

export type StyleClasses = Map<string, AST.MemberExpression['property']>;

/**
 * Event handling types
 */
export interface AddEventOptions extends ExtendedEventOptions {
	customName?: string;
}

export interface AddEventObject extends AddEventOptions {
	handleEvent(object: Event): void;
}

export interface ExtendedEventOptions {
	capture?: boolean;
	once?: boolean;
	passive?: boolean;
	signal?: AbortSignal;
	delegated?: boolean;
}

/**
 * Volar integration types
 */
import type {
	CodeInformation as VolarCodeInformation,
	Mapping as VolarMapping,
} from '@volar/language-core';
import type { DocumentHighlightKind } from 'vscode-languageserver-types';
import type { RawSourceMap } from 'source-map';

export interface DefinitionLocation {
	embeddedId: string;
	start: number;
	end: number;
}

export interface PluginActionOverrides {
	wordHighlight?: {
		kind: DocumentHighlightKind;
	};
	suppressedDiagnostics?: number[];
	hover?: string | false | ((content: string) => string);
	definition?:
		| {
				description?: string;
				location?: DefinitionLocation;
				typeReplace?: {
					name: string;
					path: string;
				};
		  }
		| false;
}

export interface CustomMappingData extends PluginActionOverrides {
	embeddedId?: string;
	content?: string;
}

export interface MappingData extends VolarCodeInformation {
	customData: CustomMappingData;
}

export interface CodeMapping extends Omit<VolarMapping<MappingData>, 'generatedLengths'> {
	generatedLengths: number[];
	data: MappingData;
}

export interface VolarMappingsResult {
	code: string;
	mappings: CodeMapping[];
	cssMappings: CodeMapping[];
	errors: CompileError[];
}

/**
 * Result of compilation operation
 */
export interface CompileResult {
	/** The generated JavaScript code */
	code: string;
	/** Source map for the generated code */
	map: import('source-map').RawSourceMap;
	/** Rendered CSS for the module, or `''` when the module emits no styles. */
	css: string;
	/**
	 * Space-separated scope hashes for the rendered CSS, or `null` when the
	 * module emits no styles.
	 */
	cssHash: string | null;
	/**
	 * Non-fatal errors collected during compilation. Populated only when the
	 * caller passes `collect: true` or `loose: true`; empty otherwise.
	 */
	errors: CompileError[];
}

/**
 * Volar-specific compile options
 */
export interface VolarCompileOptions extends Omit<ParseOptions, 'errors' | 'comments'> {
	minify_css?: boolean;
	dev?: boolean;
}

/**
 * Common base options accepted by every TSRX target's `compile` entry point.
 * Targets that need extra knobs (e.g. ripple's `mode`/`dev`/`hmr`, preact's
 * `suspenseSource`) intersect their own option type with this base when
 * declaring their `compile` export.
 */
export interface BaseCompileOptions {
	collect?: boolean;
	loose?: boolean;
}

/**
 * Shared `compile` signature for every TSRX target package. Per-target
 * `compile` declarations should be `CompileFn<TOptions, TResult>` so any
 * drift in the shared contract becomes a typecheck error in every package.
 *
 * @template TOptions Per-target options accepted as the third argument.
 *   Defaults to {@link BaseCompileOptions}.
 * @template TResult Per-target result type. Must extend {@link CompileResult};
 *   targets may add fields (e.g. ripple's deprecated `js` back-compat field)
 *   via intersection.
 */
export type CompileFn<
	TOptions = BaseCompileOptions,
	TResult extends CompileResult = CompileResult,
> = (source: string, filename?: string, options?: TOptions) => TResult;

/**
 * Shared `compile_to_volar_mappings` signature for every TSRX target package.
 *
 * @template TOptions Per-target options accepted as the third argument.
 *   Defaults to {@link ParseOptions}; targets may intersect their own option
 *   type to add e.g. `suspenseSource`.
 */
export type VolarCompileFn<TOptions = ParseOptions> = (
	source: string,
	filename?: string,
	options?: TOptions,
) => VolarMappingsResult;

/**
 * Source map transformation types
 */
export type PostProcessingChanges = Map<number, { offset: number; delta: number }>;
export type LineOffsets = number[];
