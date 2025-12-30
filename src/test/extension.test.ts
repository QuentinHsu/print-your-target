import * as assert from 'assert';
import { suite, test } from 'mocha';
import * as vscode from 'vscode';
import { LanguageHandlerFactory } from '../language-factory';
import { JavaScriptHandler } from '../handlers/javascript-handler';
import { GoHandler } from '../handlers/go-handler';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  suite('LanguageHandlerFactory', () => {
    test('should create JavaScript handler for supported languages', () => {
      const jsHandler = LanguageHandlerFactory.createHandler('javascript');
      assert.ok(jsHandler instanceof JavaScriptHandler);

      const tsHandler = LanguageHandlerFactory.createHandler('typescript');
      assert.ok(tsHandler instanceof JavaScriptHandler);
    });

    test('should create Go handler for Go language', () => {
      const goHandler = LanguageHandlerFactory.createHandler('go');
      assert.ok(goHandler instanceof GoHandler);
    });

    test('should return null for unsupported languages', () => {
      const handler = LanguageHandlerFactory.createHandler('python');
      assert.strictEqual(handler, null);
    });
  });

  suite('JavaScriptHandler', () => {
    test('should analyze simple variable selection', () => {
      const handler = new JavaScriptHandler();
      const mockDocument = {
        getText: () => 'user',
        getWordRangeAtPosition: () => null,
        lineAt: () => ({ text: '  const user = "test";' }),
        positionAt: () => new vscode.Position(0, 0),
        offsetAt: () => 0,
        fileName: 'test.js'
      } as any;
      
      const mockSelection = {
        start: new vscode.Position(0, 6),
        end: new vscode.Position(0, 10)
      } as any;

      const analysis = handler.analyzeSelection('user', mockDocument, mockSelection, ['error']);
      
      assert.strictEqual(analysis.selectedText, 'user');
      assert.strictEqual(analysis.variableName, 'user');
      assert.strictEqual(analysis.logMethod, 'log');
    });

    test('should generate appropriate log statements', () => {
      const handler = new JavaScriptHandler();
      const analysis = {
        logMethod: 'log',
        logMessage: 'user',
        variableName: 'user',
        selectedText: 'user'
      };
      
      const statement = handler.generateLogStatement(analysis);
      assert.ok(statement.includes('console.log'));
      assert.ok(statement.includes('user'));
    });
  });

  suite('GoHandler', () => {
    test('should generate Go log statements', () => {
      const handler = new GoHandler();
      const analysis = {
        logMethod: 'Printf',
        logMessage: 'user',
        variableName: 'user',
        selectedText: 'user'
      };
      
      const statement = handler.generateLogStatement(analysis);
      assert.ok(statement.includes('log.Printf'));
      assert.ok(statement.includes('%+v'));
    });
  });
});
