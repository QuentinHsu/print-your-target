import * as vscode from 'vscode';

// 辅助函数：分析 JavaScript 选择内容
function analyzeJavaScriptSelection(
	selectedText: string, 
	document: vscode.TextDocument, 
	selection: vscode.Selection, 
	errorKeywords: string[]
): { logMethod: string; logMessage: string; variableName: string } {
	const trimmedText = selectedText.trim();
	
	// 如果没有选择文本，尝试智能选择当前词
	if (!trimmedText) {
		const wordRange = document.getWordRangeAtPosition(selection.start);
		if (wordRange) {
			const word = document.getText(wordRange);
			return {
				logMethod: 'log',
				logMessage: word,
				variableName: word
			};
		}
		return {
			logMethod: 'log',
			logMessage: 'debug',
			variableName: 'debug'
		};
	}
	// 检测是否包含错误关键词 - 使用更精确的匹配
	const containsErrorKeyword = errorKeywords.some(keyword => {
		const lowerText = trimmedText.toLowerCase();
		const lowerKeyword = keyword.toLowerCase();
		
		// 对于单字符关键词（如 'e'），只匹配完整的变量名
		if (keyword.length === 1) {
			return lowerText === lowerKeyword;
		}
		
		// 对于多字符关键词，可以是子字符串匹配，但要确保是完整的单词
		// 使用单词边界匹配，避免部分匹配
		const wordBoundaryRegex = new RegExp(`\\b${lowerKeyword}\\b`, 'i');
		return wordBoundaryRegex.test(lowerText);
	});

	// 检测表达式类型
	const isFunction = /\w+\s*\(.*\)/.test(trimmedText);
	const isObject = /\{[\s\S]*\}/.test(trimmedText) || trimmedText.includes('.');
	const isArray = /\[[\s\S]*\]/.test(trimmedText);
	const isAsyncAwait = /\b(await|async)\b/.test(trimmedText);
	const isPromise = /\.then\s*\(|\.catch\s*\(|new\s+Promise/.test(trimmedText);
	const isConditional = /\?|\|\||&&/.test(trimmedText);

	// 确定 console 方法
	let logMethod = 'log';
	if (containsErrorKeyword) {
		logMethod = 'error';
	} else if (isAsyncAwait || isPromise) {
		logMethod = 'info';
	} else if (isFunction) {
		logMethod = 'debug';
	} else if (isConditional) {
		logMethod = 'warn';
	}

	// 生成描述性消息
	let logMessage = trimmedText;
	if (isFunction) {
		const funcName = trimmedText.match(/(\w+)\s*\(/)?.[1];
		logMessage = funcName ? `${funcName}() result` : 'function result';
	} else if (isObject && trimmedText.includes('.')) {
		logMessage = `${trimmedText} value`;
	} else if (isArray) {
		logMessage = `${trimmedText} array`;
	}

	// 提取变量名（用于对象展开等场景）
	const variableName = trimmedText.match(/^\w+/)?.[0] || trimmedText;

	return { logMethod, logMessage, variableName };
}

// 辅助函数：生成 console 语句
function generateConsoleStatement(
	logMethod: string, 
	logMessage: string, 
	variableName: string, 
	selectedText: string
): string {
	const trimmedText = selectedText.trim();
	
	// 如果是复杂表达式，使用对象形式打印
	if (trimmedText.includes('.') || trimmedText.includes('(') || trimmedText.includes('[')) {
		return `console.${logMethod}('${logMessage}:', { ${variableName}: ${trimmedText} });`;
	}
	
	// 统一使用简洁格式，不带 emoji
	return `console.${logMethod}('${logMessage}:', ${trimmedText});`;
}

// 辅助函数：找到 JavaScript 插入位置
function findJavaScriptInsertionPoint(
	document: vscode.TextDocument,
	editor: vscode.TextEditor,
	selection: vscode.Selection,
	baseLog: string
): { insertPosition: vscode.Position; finalStatement: string } {
	const endLine = selection.end.line;
	const selectedText = document.getText(selection).trim();
	
	// 获取选择所在行的缩进作为基准
	const selectionLineText = document.lineAt(endLine).text;
	const selectionIndentMatch = selectionLineText.match(/^\s*/);
	const selectionIndent = selectionIndentMatch ? selectionIndentMatch[0] : '';

	let targetLineNumber = -1;
	let indent = selectionIndent;

	// 检查是否是简单的变量选择（不包含复杂表达式）
	const isSimpleVariable = /^\w+$/.test(selectedText);
	
	// 对于简单变量选择，直接在当前行下方插入
	if (isSimpleVariable) {
		targetLineNumber = endLine + 1;
	}
	// 对于复杂表达式或语句，查找合适的插入位置
	else {
		const currentLineText = document.lineAt(endLine).text.trim();
		
		// 当前行就是完整语句
		if (currentLineText.endsWith(';')) {
			targetLineNumber = endLine + 1;
		}
		// 查找当前语句的结束位置
		else {
			let statementEndFound = false;
			
			// 在合理范围内查找语句结束
			for (let i = endLine + 1; i < Math.min(endLine + 5, document.lineCount); i++) {
				const line = document.lineAt(i);
				const text = line.text;
				const lineIndentMatch = text.match(/^\s*/);
				const lineIndent = lineIndentMatch ? lineIndentMatch[0] : '';
				
				// 如果遇到缩进明显减少的行，说明退出了当前块
				if (text.trim().length > 0 && lineIndent.length < selectionIndent.length) {
					// 在当前选择行的下一行插入（保持在当前块内）
					targetLineNumber = endLine + 1;
					statementEndFound = true;
					break;
				}
				
				// 查找语句结束符
				if (text.trim().endsWith(';')) {
					targetLineNumber = i + 1;
					statementEndFound = true;
					break;
				}
				
				// 遇到块结束符（右大括号）
				if (text.trim() === '}' || text.trim().startsWith('}')) {
					// 在右大括号之前插入
					targetLineNumber = i;
					statementEndFound = true;
					break;
				}
			}
			
			// 如果没找到明确的结束位置，默认在下一行插入
			if (!statementEndFound) {
				targetLineNumber = endLine + 1;
			}
		}
	}

	// 处理文档边界
	if (targetLineNumber >= document.lineCount) {
		targetLineNumber = document.lineCount;
		const lastLine = document.lineAt(document.lineCount - 1);
		if (lastLine.text.trim().length === 0) {
			targetLineNumber = document.lineCount - 1;
		}
	}

	const insertPosition = new vscode.Position(targetLineNumber, 0);
	const finalStatement = indent + baseLog + '\n';

	return { insertPosition, finalStatement };
}

// 辅助函数：检查是否在块结构内部
function checkIfInsideBlock(document: vscode.TextDocument, lineNumber: number): boolean {
	// 向上查找，看是否有未闭合的块结构
	let openBraces = 0;
	const maxLookback = Math.min(lineNumber, 20); // 最多向上查找20行
	
	for (let i = lineNumber; i >= lineNumber - maxLookback; i--) {
		const line = document.lineAt(i);
		const text = line.text;
		
		// 计算大括号平衡
		for (const char of text) {
			if (char === '{') {
				openBraces++;
			} else if (char === '}') {
				openBraces--;
			}
		}
		
		// 如果发现了控制结构（if, for, while等）且有未闭合的大括号
		if (openBraces > 0 && /^\s*(if|for|while|switch|try|catch|else|function)\s*[\(\{]/.test(text)) {
			return true;
		}
	}
	
	return openBraces > 0;
}

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
					// 智能检测选择的内容和上下文
					const { logMethod, logMessage, variableName } = analyzeJavaScriptSelection(selectedText, document, selection, errorKeywords);
					
					// 生成 console 语句
					const baseLog = generateConsoleStatement(logMethod, logMessage, variableName, selectedText);

					// --- Start: Find Insertion Point Logic ---
					const { insertPosition: pos, finalStatement } = findJavaScriptInsertionPoint(
						document, editor, selection, baseLog
					);
					
					insertPosition = pos;
					finalLogStatement = finalStatement;
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
		const deleteLogTypesJavaScript: string[] = config.get('deleteLogType.javascript', [
			'log', 'error', 'warn', 'info', 'debug', 'trace', 'table', 'group', 'groupEnd'
		]); // 扩展支持更多 console 方法
		const deleteLogTypesGo: string[] = config.get('deleteLogType.go', ['Printf', 'Println', 'Fatalf', 'Panicf']);

		// 根据语言类型构建正则表达式
		let logRegex: RegExp | null = null;
		let lineRegex: RegExp | null = null; // Regex to match the entire line for deletion

		const jsTsIds = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'vue', 'svelte', 'astro', 'html']; // Broader JS family

		if (jsTsIds.includes(languageId)) {
			// 匹配标准 console 语句格式：
			// - console.log('message:', variable);
			// - console.error('message:', variable);  
			// - console.log('message:', { variable: value });
			lineRegex = new RegExp(`^\\s*console\\.(${deleteLogTypesJavaScript.join('|')})\\s*\\([^)]*\\)\\s*;?\\s*$`, 'gm');
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