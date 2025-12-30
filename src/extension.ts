import * as vscode from 'vscode';

import { LogService } from './log-service';

export function activate(context: vscode.ExtensionContext) {
  console.log('Print Your Target extension is now active!');
  vscode.window.showInformationMessage('Print Your Target extension activated!');
  
  const logService = new LogService();

  // Register add log statement command
  const addLogDisposable = vscode.commands.registerCommand('print-your-target.addLogStatement', () => {
    console.log('Add log command triggered');
    logService.addLogStatement();
  });

  // Register delete log statements command
  const deleteLogDisposable = vscode.commands.registerCommand('print-your-target.deleteLogStatements', () => {
    console.log('Delete log command triggered');
    logService.deleteLogStatements();
  });

  context.subscriptions.push(addLogDisposable, deleteLogDisposable);
}

export function deactivate() {}
