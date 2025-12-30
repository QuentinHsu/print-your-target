import type * as vscode from 'vscode';

import { TypeScriptASTAnalyzer } from '../ast-utils';
import type { InsertionPoint, LanguageHandler, LogAnalysis } from '../types';

export class JavaScriptHandler implements LanguageHandler {
  private analyzer?: TypeScriptASTAnalyzer;

  constructor(analyzer?: TypeScriptASTAnalyzer) {
    this.analyzer = analyzer;
  }

  private getAnalyzer(document: vscode.TextDocument): TypeScriptASTAnalyzer {
    if (this.analyzer) {
      return this.analyzer;
    }
    return new TypeScriptASTAnalyzer(document);
  }

  analyzeSelection(selectedText: string, document: vscode.TextDocument, selection: vscode.Selection, errorKeywords: string[]): LogAnalysis {
    const trimmedText = selectedText.trim();
    const analyzer = this.getAnalyzer(document);

    // If no selection, try to get word at cursor
    if (!trimmedText) {
      const wordRange = document.getWordRangeAtPosition(selection.start);
      if (wordRange) {
        const word = document.getText(wordRange);
        return {
          logMessage: word,
          logMethod: 'log',
          selectedText: word,
          variableName: word,
        };
      }
      return {
        logMessage: 'debug',
        logMethod: 'log',
        selectedText: 'debug',
        variableName: 'debug',
      };
    }

    // Use AST analysis for better understanding
    const expressionInfo = analyzer.analyzeSelectedExpression(selection);

    // Check for error keywords with better matching
    const containsErrorKeyword = this.containsErrorKeyword(trimmedText, errorKeywords);

    // Determine log method based on analysis
    let logMethod = 'log';
    if (containsErrorKeyword) {
      logMethod = 'error';
    } else if (expressionInfo.isAsync) {
      logMethod = 'info';
    } else if (expressionInfo.isFunction) {
      logMethod = 'debug';
    } else if (trimmedText.includes('?') || trimmedText.includes('||') || trimmedText.includes('&&')) {
      logMethod = 'warn';
    }

    // Generate descriptive message
    const logMessage = this.generateLogMessage(trimmedText, expressionInfo);

    return {
      logMessage,
      logMethod,
      selectedText: trimmedText,
      variableName: expressionInfo.variableName,
    };
  }

  private containsErrorKeyword(text: string, errorKeywords: string[]): boolean {
    return errorKeywords.some(keyword => {
      const lowerText = text.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();

      // For single character keywords, match exactly
      if (keyword.length === 1) {
        return lowerText === lowerKeyword;
      }

      // For multi-character keywords, use word boundary matching
      const wordBoundaryRegex = new RegExp(`\\b${lowerKeyword}\\b`, 'i');
      return wordBoundaryRegex.test(lowerText);
    });
  }

  private generateLogMessage(text: string, expressionInfo: { isFunction: boolean; isObject: boolean; variableName: string }): string {
    if (expressionInfo.isFunction) {
      const funcMatch = text.match(/(\w+)\s*\(/);
      const funcName = funcMatch ? funcMatch[1] : 'function';
      return `${funcName}() result`;
    }

    if (expressionInfo.isObject && text.includes('.')) {
      return `${text} value`;
    }

    if (text.includes('[') && text.includes(']')) {
      return `${text} array`;
    }

    return text;
  }

  generateLogStatement(analysis: LogAnalysis): string {
    const { logMethod, logMessage, selectedText, variableName } = analysis;

    // For complex expressions, use object destructuring format
    if (this.isComplexExpression(selectedText)) {
      return `console.${logMethod}('${logMessage}:', { ${variableName}: ${selectedText} });`;
    }

    // Simple format for basic variables
    return `console.${logMethod}('${logMessage}:', ${selectedText});`;
  }

  private isComplexExpression(text: string): boolean {
    return text.includes('.') || text.includes('(') || text.includes('[') || text.includes('?');
  }

  findInsertionPoint(document: vscode.TextDocument, selection: vscode.Selection, _analysis: LogAnalysis): InsertionPoint {
    const analyzer = this.getAnalyzer(document);
    const position = analyzer.findBestInsertionPoint(selection);

    // Get indentation from the selection line
    const selectionLine = document.lineAt(selection.start.line);
    const indentMatch = selectionLine.text.match(/^\s*/);
    const indentation = indentMatch ? indentMatch[0] : '';

    return {
      indentation,
      position,
    };
  }

  findLogStatements(document: vscode.TextDocument, logTypes: string[]): vscode.Range[] {
    const analyzer = this.getAnalyzer(document);
    return analyzer.findLogStatements(logTypes);
  }
}
