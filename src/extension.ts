import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('print-your-target.addLogStatement', () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const document = editor.document;
		const selection = editor.selection;
		const selectedText = document.getText(selection);
		const languageId = document.languageId;
		const currentLine = document.lineAt(selection.start.line);
		const indentation = currentLine.text.match(/^\s*/)?.[0] || '';
		let logStatement = '';

		// 从插件配置中获取关键字数组
		const config = vscode.workspace.getConfiguration('printYourTarget');
		const errorKeywordsJavaScript: string[] = config.get('errorKeywords.javascript', ['error', 'err', 'e']);
		const errorKeywordsGo: string[] = config.get('errorKeywords.go', ['err', 'error']);

		// 定义文件类型大类
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

		// 获取当前语言大类的错误关键字
		let errorKeywords: string[] = [];
		if (languageCategory === 'javascript') {
			errorKeywords = errorKeywordsJavaScript;
		} else if (languageCategory === 'go') {
			errorKeywords = errorKeywordsGo;
		}

		switch (languageCategory) {
			case 'javascript':
				if (errorKeywords.includes(selectedText)) {
					logStatement = `${indentation}console.error('${selectedText}', ${selectedText});\n`;
				} else {
					logStatement = `${indentation}console.log('${selectedText}', ${selectedText});\n`;
				}
				break;
			case 'go':
				logStatement = `${indentation}log.Printf("%v: %+v\\n", "${selectedText}", ${selectedText})\n`;
				break;
			default:
				vscode.window.showInformationMessage('Unsupported file type.');
				return;
		}

		editor.edit(editBuilder => {
			const position = selection.end;
			const newPosition = new vscode.Position(position.line + 1, 0);
			editBuilder.insert(newPosition, logStatement);

			// 如果是 Go 文件，检查是否需要导入 log 包
			if (languageCategory === 'go') {
				const documentText = document.getText();
				if (!documentText.includes('import "log"')) {
					const importStatement = 'import "log"\n\n';
					editBuilder.insert(new vscode.Position(0, 0), importStatement);
				}
			}
		}).then(() => {
			// 调整光标位置到插入的日志行末
			const newPosition = new vscode.Position(selection.end.line + 1, logStatement.length - 1);
			const newSelection = new vscode.Selection(newPosition, newPosition);
			editor.selection = newSelection;
		});
	});

	context.subscriptions.push(disposable);

	let deleteLogDisposable = vscode.commands.registerCommand('print-your-target.deleteLogStatements', () => {
		const editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		const document = editor.document;
		const languageId = document.languageId;

		// 从插件配置中获取日志类型
		const config = vscode.workspace.getConfiguration('printYourTarget');
		const deleteLogTypesJavaScript: string[] = config.get('deleteLogType.javascript', ['log']);
		const deleteLogTypesGo: string[] = config.get('deleteLogType.go', ['Printf']);

		// 根据语言类型构建正则表达式
		let logRegex: RegExp | null = null;

		if (languageId === 'javascript' || languageId === 'typescript') {
			logRegex = new RegExp(
				`\\bconsole\\.(${deleteLogTypesJavaScript.join('|')})\\(.*?\\);?`,
				'g'
			);
		} else if (languageId === 'go') {
			logRegex = new RegExp(
				`\\blog\\.(${deleteLogTypesGo.join('|')})\\(.*?\\);?`,
				'g'
			);
		}

		if (!logRegex) {
			vscode.window.showInformationMessage('Unsupported file type.');
			return;
		}

		const documentText = document.getText();
		const edits: vscode.TextEdit[] = [];
		let match: RegExpExecArray | null;

		// 查找所有匹配的日志语句
		while ((match = logRegex.exec(documentText)) !== null) {
			const start = document.positionAt(match.index);
			const end = document.positionAt(match.index + match[0].length);
			edits.push(vscode.TextEdit.delete(new vscode.Range(start, end)));
		}

		// 应用编辑
		const edit = new vscode.WorkspaceEdit();
		edit.set(document.uri, edits);

		vscode.workspace.applyEdit(edit).then(() => {
			vscode.window.showInformationMessage('Specified log statements deleted.');
		});
	});

	context.subscriptions.push(deleteLogDisposable);
}

export function deactivate() { }