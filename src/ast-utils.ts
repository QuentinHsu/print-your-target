import * as ts from 'typescript';
import * as vscode from 'vscode';

import type { StatementInfo } from './types';

export class TypeScriptASTAnalyzer {
  private sourceFile: ts.SourceFile | null = null;
  private document: vscode.TextDocument;

  constructor(document: vscode.TextDocument) {
    this.document = document;
    this.parseDocument();
  }

  private parseDocument(): void {
    const text = this.document.getText();
    const fileName = this.document.fileName;

    // Determine script kind based on file extension
    let scriptKind = ts.ScriptKind.JS;
    if (fileName.endsWith('.ts')) {
      scriptKind = ts.ScriptKind.TS;
    } else if (fileName.endsWith('.tsx')) {
      scriptKind = ts.ScriptKind.TSX;
    } else if (fileName.endsWith('.jsx')) {
      scriptKind = ts.ScriptKind.JSX;
    }

    this.sourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true, scriptKind);
  }

  public getNodeAtPosition(position: vscode.Position): ts.Node | null {
    if (!this.sourceFile) return null;

    const offset = this.document.offsetAt(position);

    function findNodeAtOffset(node: ts.Node): ts.Node | null {
      if (offset >= node.getStart() && offset <= node.getEnd()) {
        // Check children first (depth-first search)
        const child = ts.forEachChild(node, findNodeAtOffset);
        return child || node;
      }
      return null;
    }

    return findNodeAtOffset(this.sourceFile);
  }

  public getStatementInfo(selection: vscode.Selection): StatementInfo | null {
    if (!this.sourceFile) return null;

    const startNode = this.getNodeAtPosition(selection.start);
    if (!startNode) return null;

    // Find the containing statement
    let statement: ts.Node | undefined = startNode;
    while (statement && !this.isStatement(statement)) {
      statement = statement.parent;
    }

    if (!statement) return null;

    const startPos = this.document.positionAt(statement.getStart());
    const endPos = this.document.positionAt(statement.getEnd());
    const range = new vscode.Range(startPos, endPos);

    // Get indentation from the statement line
    const lineText = this.document.lineAt(startPos.line).text;
    const indentMatch = lineText.match(/^\s*/);
    const indentation = indentMatch ? indentMatch[0] : '';

    return {
      indentation,
      isComplete: this.isCompleteStatement(statement),
      range,
      type: this.getStatementType(statement),
    };
  }

  private isStatement(node: ts.Node): boolean {
    return ts.isStatement(node) || ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node);
  }

  private getStatementType(node: ts.Node): 'expression' | 'statement' | 'declaration' | 'block' {
    if (ts.isExpressionStatement(node)) return 'expression';
    if (ts.isVariableStatement(node) || ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) {
      return 'declaration';
    }
    if (ts.isBlock(node)) return 'block';
    return 'statement';
  }

  private isCompleteStatement(node: ts.Node): boolean {
    const text = node.getFullText();
    return text.trim().endsWith(';') || text.trim().endsWith('}') || ts.isBlock(node);
  }

  public findBestInsertionPoint(selection: vscode.Selection): vscode.Position {
    const statementInfo = this.getStatementInfo(selection);

    if (!statementInfo) {
      // Fallback to simple line-based insertion
      return new vscode.Position(selection.end.line + 1, 0);
    }

    // Insert after the complete statement
    let insertLine = statementInfo.range.end.line;

    // If the statement doesn't end with proper termination, look for it
    if (!statementInfo.isComplete) {
      insertLine = this.findStatementEnd(statementInfo.range.end);
    }

    return new vscode.Position(insertLine + 1, 0);
  }

  private findStatementEnd(startPos: vscode.Position): number {
    const maxLookAhead = Math.min(startPos.line + 10, this.document.lineCount - 1);

    for (let i = startPos.line; i <= maxLookAhead; i++) {
      const lineText = this.document.lineAt(i).text;

      // Found semicolon or closing brace
      if (lineText.trim().endsWith(';') || lineText.trim().endsWith('}')) {
        return i;
      }

      // Found start of new statement (non-indented line that's not empty)
      if (i > startPos.line && lineText.trim().length > 0 && !lineText.startsWith(' ') && !lineText.startsWith('\t')) {
        return i - 1;
      }
    }

    return startPos.line;
  }

  public findLogStatements(logTypes: string[]): vscode.Range[] {
    if (!this.sourceFile) return [];

    const ranges: vscode.Range[] = [];
    const logTypesSet = new Set(logTypes);

    const visit = (node: ts.Node) => {
      // Look for console.log, console.error, etc.
      if (ts.isCallExpression(node)) {
        const expression = node.expression;

        if (ts.isPropertyAccessExpression(expression)) {
          const object = expression.expression;
          const property = expression.name;

          // Check if it's console.xxx where xxx is in our log types
          if (ts.isIdentifier(object) && object.text === 'console' && ts.isIdentifier(property) && logTypesSet.has(property.text)) {
            // Find the complete statement containing this call
            let statement: ts.Node = node;
            while (statement.parent && !ts.isStatement(statement.parent)) {
              statement = statement.parent;
            }
            if (statement.parent && ts.isStatement(statement.parent)) {
              statement = statement.parent;
            }

            const startPos = this.document.positionAt(statement.getStart());

            // Include the entire line for clean deletion
            const line = this.document.lineAt(startPos.line);
            ranges.push(line.rangeIncludingLineBreak);
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(this.sourceFile);
    return ranges;
  }

  public analyzeSelectedExpression(selection: vscode.Selection): {
    isVariable: boolean;
    isFunction: boolean;
    isObject: boolean;
    isAsync: boolean;
    isError: boolean;
    variableName: string;
    expressionType: string;
  } {
    const selectedText = this.document.getText(selection).trim();
    const node = this.getNodeAtPosition(selection.start);

    if (!node || !selectedText) {
      return {
        expressionType: 'unknown',
        isAsync: false,
        isError: false,
        isFunction: false,
        isObject: false,
        isVariable: false,
        variableName: 'unknown',
      };
    }

    const isVariable = ts.isIdentifier(node);
    const isFunction = ts.isCallExpression(node) || selectedText.includes('(');
    const isObject = ts.isObjectLiteralExpression(node) || selectedText.includes('.');
    const isAsync = selectedText.includes('await') || selectedText.includes('async');

    // Extract variable name
    let variableName = selectedText;
    if (ts.isIdentifier(node)) {
      variableName = node.text;
    } else if (ts.isPropertyAccessExpression(node)) {
      variableName = node.name.text;
    } else {
      const match = selectedText.match(/^(\w+)/);
      variableName = match ? match[1] : selectedText;
    }

    return {
      expressionType: this.getNodeTypeName(node),
      isAsync,
      isError: false, // Will be determined by keyword matching
      isFunction,
      isObject,
      isVariable,
      variableName,
    };
  }

  private getNodeTypeName(node: ts.Node): string {
    return ts.SyntaxKind[node.kind] || 'Unknown';
  }
}
