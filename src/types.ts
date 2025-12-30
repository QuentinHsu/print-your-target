import type * as vscode from 'vscode';

export interface LogAnalysis {
  logMethod: string;
  logMessage: string;
  variableName: string;
  selectedText: string;
}

export interface InsertionPoint {
  position: vscode.Position;
  indentation: string;
}

export interface LogStatement {
  statement: string;
  insertionPoint: InsertionPoint;
}

export interface LanguageHandler {
  analyzeSelection(selectedText: string, document: vscode.TextDocument, selection: vscode.Selection, errorKeywords: string[]): LogAnalysis;

  generateLogStatement(analysis: LogAnalysis): string;

  findInsertionPoint(document: vscode.TextDocument, selection: vscode.Selection, analysis: LogAnalysis): InsertionPoint;

  findLogStatements(document: vscode.TextDocument, logTypes: string[]): vscode.Range[];

  addRequiredImports?(document: vscode.TextDocument): vscode.TextEdit[];
}

export interface ASTNode {
  kind: string;
  start: number;
  end: number;
  line: number;
  column: number;
  parent?: ASTNode;
  children?: ASTNode[];
}

export interface StatementInfo {
  range: vscode.Range;
  type: 'expression' | 'statement' | 'declaration' | 'block';
  isComplete: boolean;
  indentation: string;
}
