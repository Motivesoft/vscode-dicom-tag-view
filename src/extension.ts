// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DicomReadonlyEditorProvider } from './dicom';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Extension "vscode-dicom-tag-view" is now active');

	const openInCommand = 'vscode-dicom-tag-view.openInTagViewer';

	context.subscriptions.push(
	  vscode.commands.registerCommand(openInCommand, (uri: vscode.Uri) => {
		if (!uri && vscode.window.activeTextEditor) {
		  uri = vscode.window.activeTextEditor.document.uri;
		}

		if (uri) {
		  vscode.commands.executeCommand('vscode.openWith', uri, DicomReadonlyEditorProvider.viewType);
		}
	  })
	);

	context.subscriptions.push(DicomReadonlyEditorProvider.register(context));
}

// This method is called when your extension is deactivated
export function deactivate() {}
