import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('print-your-target.addLogStatement', async () => { // Mark function as async
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const document = editor.document;
		const selection = editor.selection;
		const selectedText = document.getText(selection);
		const languageId = document.languageId;
		// ... existing code for configuration and language category ...
		const config = vscode.workspace.getConfiguration('printYourTarget');
		const errorKeywordsJavaScript: string[] = config.get('errorKeywords.javascript', ['error', 'err', 'e']);
		const errorKeywordsGo: string[] = config.get('errorKeywords.go', ['err', 'error']);

		const languageCategoryMap: { [key: string]: string } = {
			javascript: 'javascript',
			typescript: 'javascript',
			typescriptreact: 'javascript',
			javascriptreact: 'javascript',
			vue: 'javascript',
			astro: 'javascript',
			svelte: 'javascript',
			html: 'javascript',
			go: 'go',
		};

		const languageCategory = languageCategoryMap[languageId] || 'unsupported';

		let errorKeywords: string[] = [];
		if (languageCategory === 'javascript') {
			errorKeywords = errorKeywordsJavaScript;
		} else if (languageCategory === 'go') {
			errorKeywords = errorKeywordsGo;
		}

		let logStatement = '';
		let insertPosition: vscode.Position | null = null;
		let finalLogStatement = ''; // Store the final statement with indentation

		switch (languageCategory) {
			case 'javascript':
				{ // Use block scope for clarity
					const baseLog = errorKeywords.includes(selectedText)
						? `console.error('${selectedText}', ${selectedText});`
						: `console.log('${selectedText}', ${selectedText});`;

					// --- Start: Find Insertion Point Logic ---
					let targetLineNumber = -1;
					let indent = '';
					const startLine = selection.start.line;
					const endLine = selection.end.line;

					// Heuristic: Look for an opening brace '{' after the selection
					// Search from the end line downwards for a few lines
					let blockFound = false;
					for (let i = endLine; i < Math.min(endLine + 5, document.lineCount); i++) {
						const line = document.lineAt(i);
						const braceIndex = line.text.indexOf('{');
						// Ensure brace is not part of the selection itself if selection spans multiple lines
						if (braceIndex !== -1 && (i > endLine || braceIndex > selection.end.character)) {
							targetLineNumber = i + 1; // Insert on the line *after* the brace
							const blockIndentMatch = line.text.match(/^\s*/);
							const blockIndent = blockIndentMatch ? blockIndentMatch[0] : '';
							// Use editor's tab settings for indentation inside the block
							const tabSize = typeof editor.options.tabSize === 'number' ? editor.options.tabSize : 4;
							const indentChar = editor.options.insertSpaces ? ' ' : '\t';
							indent = blockIndent + indentChar.repeat(editor.options.insertSpaces ? tabSize : 1);
							blockFound = true;
							break;
						}
						// If we encounter a closing brace before an opening one, stop searching in this direction
						if (line.text.includes('}')) {
							break;
						}
					}

					// If no opening brace found nearby, insert after the line containing the end of the selection
					if (!blockFound) {
						targetLineNumber = endLine + 1;
						const endLineText = document.lineAt(endLine).text;
						const currentIndentMatch = endLineText.match(/^\s*/);
						indent = currentIndentMatch ? currentIndentMatch[0] : ''; // Use indentation of the current line
					}

					// Ensure target line is within document bounds
					if (targetLineNumber >= document.lineCount) {
						// If inserting after the last line, add a newline first if needed
						const lastLine = document.lineAt(document.lineCount - 1);
						if (lastLine.text.trim().length > 0) {
							await editor.edit(editBuilder => {
								editBuilder.insert(lastLine.range.end, '\n');
							});
							targetLineNumber = document.lineCount; // It will be the new last line index + 1
						} else {
							targetLineNumber = document.lineCount - 1; // Insert on the empty last line
						}
						// Recalculate indent if we are now on a potentially different line
						const currentIndentMatch = document.lineAt(endLine).text.match(/^\s*/);
						indent = currentIndentMatch ? currentIndentMatch[0] : '';
					}


					insertPosition = new vscode.Position(targetLineNumber, 0); // Insert at the beginning of the target line
					finalLogStatement = indent + baseLog + '\n';
					// --- End: Find Insertion Point Logic ---
				}
				break;
			case 'go':
				{
					const currentLine = document.lineAt(selection.start.line);
					const indentation = currentLine.text.match(/^\s*/)?.[0] || '';
					logStatement = `${indentation}log.Printf("%v: %+v\\n", "${selectedText}", ${selectedText})\n`;
					const position = selection.end;
					// Simple insertion for Go for now, can be refined similarly if needed
					insertPosition = new vscode.Position(position.line + 1, 0);
					finalLogStatement = logStatement;
				}
				break;
			default:
				vscode.window.showInformationMessage('Unsupported file type.');
				return;
		}

		if (insertPosition && finalLogStatement) {
			const finalInsertPos = insertPosition; // Capture for use in closure
			const statementToInsert = finalLogStatement; // Capture for use in closure

			editor.edit(editBuilder => {
				editBuilder.insert(finalInsertPos, statementToInsert);

				// Handle Go import separately if needed (logic remains similar)
				if (languageCategory === 'go') {
					const documentText = document.getText();
					if (!documentText.includes("import \"log\"")) {
						// Check if package declaration exists
						let importInsertPos = new vscode.Position(0, 0);
						for (let i = 0; i < Math.min(5, document.lineCount); i++) {
							const lineText = document.lineAt(i).text;
							if (lineText.startsWith("package ")) {
								importInsertPos = new vscode.Position(i + 1, 0); // Insert after package line
								break;
							}
						}
						// Add extra newline if inserting after package declaration
						const importStatement = (importInsertPos.line > 0 ? "\n" : "") + "import \"log\"\n";
						editBuilder.insert(importInsertPos, importStatement);
					}
				}
			}).then(() => {
				// Adjust cursor position to the end of the inserted log statement
				const endOfInsertedLine = finalInsertPos.line;
				const endOfInsertedChar = statementToInsert.length > 0 ? statementToInsert.length - 1 : 0; // -1 to exclude newline
				const newPosition = new vscode.Position(endOfInsertedLine, endOfInsertedChar);
				const newSelection = new vscode.Selection(newPosition, newPosition);
				editor.selection = newSelection;
				// Reveal the new position in the editor
				editor.revealRange(new vscode.Range(newPosition, newPosition));
			});
		}
	});

	context.subscriptions.push(disposable);

	// ... existing deleteLogDisposable registration ...
	let deleteLogDisposable = vscode.commands.registerCommand('print-your-target.deleteLogStatements', () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const document = editor.document;
		const languageId = document.languageId;

		// 从插件配置中获取日志类型
		const config = vscode.workspace.getConfiguration('printYourTarget');
		const deleteLogTypesJavaScript: string[] = config.get('deleteLogType.javascript', ['log', 'error', 'warn', 'info', 'debug']); // Added more types
		const deleteLogTypesGo: string[] = config.get('deleteLogType.go', ['Printf', 'Println', 'Fatalf', 'Panicf']); // Added more types

		// 根据语言类型构建正则表达式
		let logRegex: RegExp | null = null;
		let lineRegex: RegExp | null = null; // Regex to match the entire line for deletion

		const jsTsIds = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue', 'svelte', 'astro', 'html']; // Broader JS family

		if (jsTsIds.includes(languageId)) {
			// Matches console.log(...); console.error(...); etc. potentially across lines
			// This regex is complex and might need refinement for edge cases (e.g., nested calls)
			// It tries to match balanced parentheses.
			// Simpler approach: Match the line containing console.log/error etc.
			// logRegex = /console\.(log|error|warn|info|debug)\s*\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)\s*;?/g;
			lineRegex = new RegExp(`^\\s*console\\.(${deleteLogTypesJavaScript.join('|')})\\s*\\(.*\\);?\\s*$`, 'gm');

		} else if (languageId === 'go') {
			// Matches log.Printf(...), log.Println(...) etc.
			lineRegex = new RegExp(`^\\s*log\\.(${deleteLogTypesGo.join('|')})\\s*\\(.*\\)\\s*$`, 'gm');
		}

		if (!lineRegex) {
			vscode.window.showInformationMessage('Unsupported file type for log deletion.');
			return;
		}

		const documentText = document.getText();
		const edits: vscode.TextEdit[] = [];
		let match: RegExpExecArray | null;

		// Find all lines matching the log pattern
		while ((match = lineRegex.exec(documentText)) !== null) {
			const startPos = document.positionAt(match.index);
			const endPos = document.positionAt(match.index + match[0].length);
			// Get the full line range to delete, including the newline character
			const line = document.lineAt(startPos.line);
			// If it's not the last line, include the newline, otherwise just delete the line content
			const rangeToDelete = line.lineNumber === document.lineCount - 1
				? line.range
				: line.rangeIncludingLineBreak;
			edits.push(vscode.TextEdit.delete(rangeToDelete));
		}

		if (edits.length === 0) {
			vscode.window.showInformationMessage('No matching log statements found to delete.');
			return;
		}

		// Apply edits using WorkspaceEdit for potentially large changes
		const edit = new vscode.WorkspaceEdit();
		// Apply edits in reverse order of position to avoid index shifts
		edits.sort((a, b) => b.range.start.compareTo(a.range.start));
		edit.set(document.uri, edits);

		vscode.workspace.applyEdit(edit).then((success) => {
			if (success) {
				vscode.window.showInformationMessage(`${edits.length} log statement line(s) deleted.`);
			} else {
				vscode.window.showErrorMessage('Failed to delete log statements.');
			}
		});
	});

	context.subscriptions.push(deleteLogDisposable);
}

export function deactivate() { }