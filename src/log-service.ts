import * as vscode from 'vscode';

import { TypeScriptASTAnalyzer } from './ast-utils';
import { LanguageHandlerFactory } from './language-factory';

export class LogService {
  private analyzerCache = new WeakMap<vscode.TextDocument, TypeScriptASTAnalyzer>();

  private getAnalyzer(document: vscode.TextDocument): TypeScriptASTAnalyzer {
    let analyzer = this.analyzerCache.get(document);
    if (!analyzer) {
      analyzer = new TypeScriptASTAnalyzer(document);
      this.analyzerCache.set(document, analyzer);
    }
    return analyzer;
  }

  private shouldUseAnalyzer(languageId: string): boolean {
    const jsLanguages = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'jsx', 'tsx', 'vue', 'svelte', 'astro', 'html'];
    return jsLanguages.includes(languageId);
  }

  clearCache(document: vscode.TextDocument): void {
    this.analyzerCache.delete(document);
  }

  async addLogStatement(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const document = editor.document;
    const selection = editor.selection;
    const selectedText = document.getText(selection);
    const languageId = document.languageId;

    // Get or create analyzer for JavaScript/TypeScript files
    const analyzer = this.shouldUseAnalyzer(languageId) ? this.getAnalyzer(document) : undefined;

    // Get language handler
    const handler = LanguageHandlerFactory.createHandler(languageId, analyzer);
    if (!handler) {
      vscode.window.showInformationMessage(`Unsupported language: ${languageId}`);
      return;
    }

    try {
      // Get error keywords for this language
      const errorKeywords = LanguageHandlerFactory.getErrorKeywords(languageId);

      // Analyze the selection
      const analysis = handler.analyzeSelection(selectedText, document, selection, errorKeywords);

      // Generate log statement
      const logStatement = handler.generateLogStatement(analysis);

      // Find insertion point
      const insertionPoint = handler.findInsertionPoint(document, selection, analysis);

      // Create the final statement with proper indentation
      const finalStatement = `${insertionPoint.indentation}${logStatement}\n`;

      // Apply the edit
      const success = await editor.edit(editBuilder => {
        editBuilder.insert(insertionPoint.position, finalStatement);

        // Add required imports if needed (for Go)
        if (handler.addRequiredImports) {
          const importEdits = handler.addRequiredImports(document);
          for (const edit of importEdits) {
            if (edit.range.isEmpty) {
              editBuilder.insert(edit.range.start, edit.newText);
            } else {
              editBuilder.replace(edit.range, edit.newText);
            }
          }
        }
      });

      if (success) {
        // Position cursor at the end of the inserted log statement
        const insertedLine = editor.document.lineAt(insertionPoint.position.line);
        const endOfLine = insertedLine.range.end;
        editor.selection = new vscode.Selection(endOfLine, endOfLine);
        editor.revealRange(new vscode.Range(endOfLine, endOfLine));
      } else {
        vscode.window.showErrorMessage('Failed to insert log statement.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Error adding log statement: ${message}`);
    }
  }

  async deleteLogStatements(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const document = editor.document;
    const languageId = document.languageId;

    // Get or create analyzer for JavaScript/TypeScript files
    const analyzer = this.shouldUseAnalyzer(languageId) ? this.getAnalyzer(document) : undefined;

    // Get language handler
    const handler = LanguageHandlerFactory.createHandler(languageId, analyzer);
    if (!handler) {
      vscode.window.showInformationMessage(`Unsupported language: ${languageId}`);
      return;
    }

    try {
      // Get log types for this language
      const logTypes = LanguageHandlerFactory.getLogTypes(languageId);

      // Find all log statements
      const logRanges = handler.findLogStatements(document, logTypes);

      if (logRanges.length === 0) {
        vscode.window.showInformationMessage('No log statements found to delete.');
        return;
      }

      // Create workspace edit for batch deletion
      const workspaceEdit = new vscode.WorkspaceEdit();

      // Sort ranges in reverse order to avoid position shifts during deletion
      const sortedRanges = logRanges.sort((a, b) => b.start.compareTo(a.start));

      for (const range of sortedRanges) {
        workspaceEdit.delete(document.uri, range);
      }

      // Apply the edit
      const success = await vscode.workspace.applyEdit(workspaceEdit);

      if (success) {
        vscode.window.showInformationMessage(`${logRanges.length} log statement(s) deleted.`);
      } else {
        vscode.window.showErrorMessage('Failed to delete log statements.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`Error deleting log statements: ${message}`);
    }
  }

  async deleteLogStatementsInRange(range: vscode.Range): Promise<number> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return 0;
    }

    const document = editor.document;
    const languageId = document.languageId;

    // Get or create analyzer for JavaScript/TypeScript files
    const analyzer = this.shouldUseAnalyzer(languageId) ? this.getAnalyzer(document) : undefined;

    const handler = LanguageHandlerFactory.createHandler(languageId, analyzer);

    if (!handler) {
      return 0;
    }

    const logTypes = LanguageHandlerFactory.getLogTypes(languageId);
    const allLogRanges = handler.findLogStatements(document, logTypes);

    // Filter ranges that intersect with the specified range
    const rangesInScope = allLogRanges.filter(logRange => range.intersection(logRange) !== undefined);

    if (rangesInScope.length === 0) {
      return 0;
    }

    const workspaceEdit = new vscode.WorkspaceEdit();
    const sortedRanges = rangesInScope.sort((a, b) => b.start.compareTo(a.start));

    for (const logRange of sortedRanges) {
      workspaceEdit.delete(document.uri, logRange);
    }

    const success = await vscode.workspace.applyEdit(workspaceEdit);
    return success ? rangesInScope.length : 0;
  }
}
