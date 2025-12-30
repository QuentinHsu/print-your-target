import * as vscode from 'vscode';

import { LogService } from './log-service';

export function activate(context: vscode.ExtensionContext) {
  const logService = new LogService();

  // Register add log statement command
  const addLogDisposable = vscode.commands.registerCommand('print-your-target.addLogStatement', () => {
    logService.addLogStatement();
  });

  // Register delete log statements command
  const deleteLogDisposable = vscode.commands.registerCommand('print-your-target.deleteLogStatements', () => {
    logService.deleteLogStatements();
  });

  // Clear cache when document changes to avoid stale AST
  const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
    logService.clearCache(event.document);
  });

  context.subscriptions.push(addLogDisposable, deleteLogDisposable, documentChangeDisposable);
}

export function deactivate() {}
