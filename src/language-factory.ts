import * as vscode from 'vscode';

import { GoHandler } from './handlers/go-handler';
import { JavaScriptHandler } from './handlers/javascript-handler';
import type { LanguageHandler } from './types';

export class LanguageHandlerFactory {
  private static readonly LANGUAGE_MAP: { [key: string]: string } = {
    astro: 'javascript',
    go: 'go',
    html: 'javascript',
    javascript: 'javascript',
    javascriptreact: 'javascript',
    svelte: 'javascript',
    typescript: 'javascript',
    typescriptreact: 'javascript',
    vue: 'javascript',
  };

  static createHandler(languageId: string): LanguageHandler | null {
    const category = LanguageHandlerFactory.LANGUAGE_MAP[languageId];

    switch (category) {
      case 'javascript':
        return new JavaScriptHandler();
      case 'go':
        return new GoHandler();
      default:
        return null;
    }
  }

  static getSupportedLanguages(): string[] {
    return Object.keys(LanguageHandlerFactory.LANGUAGE_MAP);
  }

  static getLanguageCategory(languageId: string): string | null {
    return LanguageHandlerFactory.LANGUAGE_MAP[languageId] || null;
  }

  static getErrorKeywords(languageId: string): string[] {
    const config = vscode.workspace.getConfiguration('printYourTarget');
    const category = LanguageHandlerFactory.getLanguageCategory(languageId);

    switch (category) {
      case 'javascript':
        return config.get('errorKeywords.javascript', ['error', 'err', 'e']);
      case 'go':
        return config.get('errorKeywords.go', ['err', 'error']);
      default:
        return [];
    }
  }

  static getLogTypes(languageId: string): string[] {
    const config = vscode.workspace.getConfiguration('printYourTarget');
    const category = LanguageHandlerFactory.getLanguageCategory(languageId);

    switch (category) {
      case 'javascript':
        return config.get('deleteLogType.javascript', ['log', 'error', 'warn', 'info', 'debug', 'trace', 'table', 'group', 'groupEnd']);
      case 'go':
        return config.get('deleteLogType.go', ['Printf', 'Println', 'Fatalf', 'Panicf']);
      default:
        return [];
    }
  }
}
