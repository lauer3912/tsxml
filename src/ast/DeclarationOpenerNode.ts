import {Node} from './Node';
import {IStringificationParams} from './IStringificationParams';

export class DeclarationOpenerNode extends Node {
	public systemLiterals: string[] = [];
	
	
	/**
	 * @override
	 */
	protected stringify(params: IStringificationParams, nodeIndentDepth?: number): string {
		nodeIndentDepth = Math.max(nodeIndentDepth || 0, 0);
		return `${Node.generateIndentString(params.indentChar, nodeIndentDepth)}<!${this.tagName}${this.stringifyAttributes(nodeIndentDepth)}${this.stringifySystemLiterals()}>${params.newlineChar}`;
	}
	
	
	private stringifySystemLiterals(): string {
		if (this.systemLiterals.length > 0) {
			return ' ' + this.systemLiterals.join('');;
		}
		return '';
	}
}