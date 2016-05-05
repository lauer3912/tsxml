/// <reference path="../../typings/node/node" />
import * as fs from 'fs';
import * as test from '../../src/test';
import * as xml from '../../src/index';

// increase the unit test timeout to 3 minutes for huge files:
@test.UnitTest.timeout(1000 * 60 * 3)
abstract class FileTest extends test.UnitTest {
	protected abstract getFullPathToFile(): string;
	
	protected async performTest() {
		const parser = xml.Parser.parseStringToAst(await this.getFileContentAsString());
		await this.assert(true);
	}
	
	
	protected async getFileContentAsString(): Promise<string> {
		return new Promise<string>((resolve: (contentAsString: string) => void, reject: (reason: any) => void) => {
			fs.readFile(this.getFullPathToFile(), (err: any, content: Buffer) => {
				if (err) {
					reject(err);
				} else {
					resolve(content + '');
				}
			});
		});
	}
}


abstract class WellFormedFileTest extends FileTest {
	protected async performTest() {
		var hasException = false;
		try {
			await xml.Parser.parseStringToAst(await this.getFileContentAsString());
		} catch(err) {
			hasException = true;
			await this.assert(false, `error parsing valid file: ${err}`);
		}
		if (!hasException) {
			await this.assert(true, 'no errors parsing valid file');
		}
	}
}


abstract class NonWellFormedFileTest extends FileTest {
	protected async performTest() {
		var hasException = false;
		try {
			await xml.Parser.parseStringToAst(await this.getFileContentAsString());
		} catch(err) {
			hasException = true;
			await this.assert(true, 'error parsing invalid file');
			await this.assert(err instanceof xml.SyntaxError, `exception is a 'SyntaxError' instance: ${err}`);
		}
		if (!hasException) {
			await this.assert(false, 'no errors parsing invalid file');
		}
	}
}


@TestRunner.testName('Real World Examples')
export class TestRunner extends test.TestRunner {
	constructor() {
		super();
		this.prepareFileTestsForDirectory('wellFormed/', WellFormedFileTest);
		this.prepareFileTestsForDirectory('nonWellFormed/', NonWellFormedFileTest);
	}
	
	
	private prepareFileTestsForDirectory(directoryPath: string, testBaseClass: typeof FileTest): void {
		const basePath = './tests/real/xml/';
		fs.readdirSync(basePath + directoryPath).forEach(path => {
			const fullPathToFile = basePath + directoryPath + path,
				  stat = fs.statSync(fullPathToFile);
			if (!stat.isFile()) {
				return;
			}
			this.add(new (class extends testBaseClass {
				public get name() { return `${directoryPath}${path} (${(stat.size / 1e3).toFixed(2)}KB)`; }
				protected getFullPathToFile() { return fullPathToFile; }
			}));
		});
	}
}