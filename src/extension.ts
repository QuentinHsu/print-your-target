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

		switch (languageId) {
			case 'javascript':
			case 'typescript':
				logStatement = `${indentation}console.log({${selectedText}});\n`;
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
			if (languageId === 'go') {
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
}

export function deactivate() { }