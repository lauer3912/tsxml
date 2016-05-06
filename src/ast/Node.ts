import {IAttribute} from './IAttribute';
import {IStringificationParams} from './IStringificationParams';
import {ContainerNode} from './ContainerNode';

/**
 * Base class for all nodes.
 */
export abstract class Node {
	/**
	 * The default formatting options for stringification.
	 */
	public static get defaultStringificationParams(): IStringificationParams {
		return {
			attrParen: '"',
			indentChar: '\t',
			newlineChar: '\n'
		};
	}
	
	
	public namespacePrefix: string;
	
	
	public tagName: string;
	
	
	public get parentNode(): ContainerNode<any> {
		return this._parentNode;
	}
	
	
	public getAllAttributeNames(): string[] {
		return Object.keys(this.attrList);
	}
	
	
	public getNumberOfAttributes(): number {
		return this.getAllAttributeNames().length;
	}
	
	
	public hasAttribute(attrName: string): boolean {
		return this.getAllAttributeNames().indexOf(attrName) !== -1;
	}
	
	
	public getAttribute<TValue>(attrName: string, namespaceName?: string): IAttribute<TValue> {
		if (typeof namespaceName !== 'undefined') {
			attrName = namespaceName + attrName;
		}
		return this.attrList[attrName];
	}
	
	
	/**
	 * @chainable
	 */
	public setAttribute<TValue>(attrName: string, value: IAttribute<TValue>, namespaceName?: string): Node {
		if (typeof namespaceName !== 'undefined') {
			attrName = namespaceName + attrName;
		}
		this.attrList[attrName] = value;
		return this;
	}
	
	
	/**
	 * @chainable
	 */
	public removeAttribute(attrName: string, namespaceName?: string): Node {
		if (typeof namespaceName !== 'undefined') {
			attrName = namespaceName + attrName;
		}
		delete this.attrList[attrName];
		return this;
	}
	
	
	public toFormattedString(stringificationParams?: IStringificationParams): string {
		if (typeof stringificationParams === 'object' && stringificationParams !== null) {
			stringificationParams = Node.mergeObjects(Node.defaultStringificationParams, stringificationParams);
		} else {
			stringificationParams = Node.defaultStringificationParams;
		}
		return this.stringify(stringificationParams);
	}
	
	
	public toString(): string {
		return this.stringify({
			indentChar: '',
			newlineChar: '',
			attrParen: '"'
		});
	}
	
	
	public isTagNameAndNamespaceIdenticalTo(otherNode: Node): boolean {
		return this.namespacePrefix === otherNode.namespacePrefix &&
			   this.tagName === otherNode.tagName;
	}
	
	
	public isAttributeListIdenticalTo(otherNode: Node): boolean {
		if (this.getNumberOfAttributes() !== otherNode.getNumberOfAttributes()) {
			return false;
		}
		const indexOfFirstNonIdenticalAttributeName = this.getAllAttributeNames().findIndex(attrName => {
			return this.getAttribute(attrName) !== otherNode.getAttribute(attrName);
		});
		return indexOfFirstNonIdenticalAttributeName === -1;
	}
	
	
	/**
	 * Checks whether a node is identical to another node by comparing tag names, attribute names and values.
	 */
	public isIdenticalTo(otherNode: Node): boolean {
		return this.constructor === otherNode.constructor && this.isTagNameAndNamespaceIdenticalTo(otherNode) && this.isAttributeListIdenticalTo(otherNode);
	}
	
	
	protected static changeParentNode(childNode: Node, newParentNode: ContainerNode<any>): void {
		childNode._parentNode = newParentNode;
	}
	
	
	protected static removeParentNode(childNode: Node): void {
		childNode._parentNode = undefined;
	}
	
	
	protected static generateIndentString(indentChar: string, indentDepth: number): string {
		indentDepth = Math.max(indentDepth || 0, 0);
		if (indentDepth === 0) {
			return '';
		}
		let indentString = '';
		while (indentDepth-- > 0) {
			indentString += indentChar;
		}
		return indentString;
	}
	
	
	protected stringify(params: IStringificationParams, nodeIndentDepth?: number): string {
		nodeIndentDepth = Math.max(nodeIndentDepth || 0, 0);
		return `${Node.generateIndentString(params.indentChar, nodeIndentDepth)}<${this.tagName}${this.stringifyAttributes(nodeIndentDepth)} />${params.newlineChar}`;
	}
	
	
	protected stringifyAttributes(nodeIndentDepth: number): string {
		var attrString = '';
		for (let attrName in this.attrList) {
			const attrValue = this.attrList[attrName];
			if (typeof attrValue !== 'undefined') {
				attrString += ` ${attrName}="${attrValue}"`;
			} else {
				attrString += ` ${attrName}`;
			}
		}
		return attrString;
	}
	
	
	private static mergeObjects<TObject>(baseObject: TObject, overlayObject: TObject): TObject {
		for (let key in overlayObject) {
			(<any>baseObject)[key] = (<any>overlayObject)[key];
		}
		return baseObject;
	}
	
	
	private _parentNode: ContainerNode<any>;
	
	
	private attrList: { [attrName: string]:  IAttribute<any>; } = { };
}