import * as vscode from 'vscode';

import type { InsertionPoint, LanguageHandler, LogAnalysis } from '../types';

export class GoHandler implements LanguageHandler {
  analyzeSelection(selectedText: string, document: vscode.TextDocument, selection: vscode.Selection, errorKeywords: string[]): LogAnalysis {
    const trimmedText = selectedText.trim();

    // If no selection, try to get word at cursor
    if (!trimmedText) {
      const wordRange = document.getWordRangeAtPosition(selection.start);
      if (wordRange) {
        const word = document.getText(wordRange);
        return {
          logMessage: word,
          logMethod: 'Printf',
          selectedText: word,
          variableName: word,
        };
      }
      return {
        logMessage: 'debug',
        logMethod: 'Printf',
        selectedText: 'debug',
        variableName: 'debug',
      };
    }

    // Check for error keywords
    const containsErrorKeyword = errorKeywords.some(keyword => {
      const lowerText = trimmedText.toLowerCase();
      const lowerKeyword = keyword.toLowerCase();

      if (keyword.length === 1) {
        return lowerText === lowerKeyword;
      }

      const wordBoundaryRegex = new RegExp(`\\b${lowerKeyword}\\b`, 'i');
      return wordBoundaryRegex.test(lowerText);
    });

    // Determine log method
    const logMethod = containsErrorKeyword ? 'Printf' : 'Printf'; // Go typically uses Printf for most logging

    return {
      logMessage: trimmedText,
      logMethod,
      selectedText: trimmedText,
      variableName: trimmedText,
    };
  }

  generateLogStatement(analysis: LogAnalysis): string {
    const { logMessage, selectedText } = analysis;

    // Use Go's Printf format
    return `log.Printf("%s: %+v\\n", "${logMessage}", ${selectedText})`;
  }

  findInsertionPoint(document: vscode.TextDocument, selection: vscode.Selection, _analysis: LogAnalysis): InsertionPoint {
    // Simple insertion logic for Go - can be enhanced with Go AST parsing
    const currentLine = document.lineAt(selection.end.line);
    const indentMatch = currentLine.text.match(/^\s*/);
    const indentation = indentMatch ? indentMatch[0] : '';

    // Find next appropriate line
    let insertLine = selection.end.line + 1;

    // Look for statement end (semicolon, brace, etc.)
    for (let i = selection.end.line; i < Math.min(selection.end.line + 5, document.lineCount); i++) {
      const lineText = document.lineAt(i).text.trim();
      if (lineText.endsWith(';') || lineText.endsWith('}')) {
        insertLine = i + 1;
        break;
      }
    }

    return {
      indentation,
      position: new vscode.Position(insertLine, 0),
    };
  }

  findLogStatements(document: vscode.TextDocument, logTypes: string[]): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    const text = document.getText();

    // Create regex pattern for Go log statements
    const logPattern = new RegExp(`^\\s*log\\.(${logTypes.join('|')})\\s*\\([^)]*\\)`, 'gm');

    let match = logPattern.exec(text);
    while (match !== null) {
      const startPos = document.positionAt(match.index);
      const line = document.lineAt(startPos.line);
      ranges.push(line.rangeIncludingLineBreak);
      match = logPattern.exec(text);
    }

    return ranges;
  }

  addRequiredImports(document: vscode.TextDocument): vscode.TextEdit[] {
    const text = document.getText();
    const edits: vscode.TextEdit[] = [];

    // Check if log import exists
    if (!text.includes('import "log"') && !text.includes('"log"')) {
      // Find package declaration
      let importInsertPos = new vscode.Position(0, 0);

      for (let i = 0; i < Math.min(10, document.lineCount); i++) {
        const lineText = document.lineAt(i).text;
        if (lineText.startsWith('package ')) {
          importInsertPos = new vscode.Position(i + 1, 0);
          break;
        }
      }

      const importStatement = `${importInsertPos.line > 0 ? '\n' : ''}import "log"\n`;
      edits.push(vscode.TextEdit.insert(importInsertPos, importStatement));
    }

    return edits;
  }
}
