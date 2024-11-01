import * as vscode from 'vscode';

export class DicomReadonlyEditorProvider implements vscode.CustomReadonlyEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new DicomReadonlyEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            DicomReadonlyEditorProvider.viewType,
            provider
        );
        return providerRegistration;
    }

    private static readonly viewType = 'vscode-dicom-tag-view.tagViewer';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) {}

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        return { uri, dispose: () => {} };
    }

    async resolveCustomEditor(
        document: vscode.CustomDocument,
        webviewPanel: vscode.WebviewPanel,
        token: vscode.CancellationToken
    ): Promise<void> {
        webviewPanel.webview.options = {
            enableScripts: true,
        };

        const dicomContent = await this.getDocumentContent(document.uri);
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, dicomContent);
    }

    private async getDocumentContent(uri: vscode.Uri): Promise<string> {
        const content = await vscode.workspace.fs.readFile(uri);
        return content.toString();
    }

    private getHtmlForWebview(webview: vscode.Webview, dicomContent: string): string {
        const nonce = this.getNonce();
        const formattedDicom = JSON.stringify(JSON.parse(dicomContent), null, 2);

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>JSON Viewer</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 10px;
                    }
                    pre {
                        background-color: #f4f4f4;
                        padding: 10px;
                        border-radius: 5px;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                </style>
            </head>
            <body>
                <h1>JSON Viewer (Read-only)</h1>
                <pre><code>${this.escapeHtml(formattedDicom)}</code></pre>
            </body>
            </html>
        `;
    }

    private getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private escapeHtml(unsafe: string): string {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}