import * as vscode from 'vscode';
import * as dicomParser from 'dicom-parser';

export class DicomReadonlyEditorProvider implements vscode.CustomReadonlyEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new DicomReadonlyEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(
            DicomReadonlyEditorProvider.viewType,
            provider
        );
        return providerRegistration;
    }

    public static readonly viewType = 'vscode-dicom-tag-view.tagViewer';

    constructor(
        private readonly context: vscode.ExtensionContext
    ) { }

    async openCustomDocument(
        uri: vscode.Uri,
        openContext: vscode.CustomDocumentOpenContext,
        token: vscode.CancellationToken
    ): Promise<vscode.CustomDocument> {
        return { uri, dispose: () => { } };
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
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document.uri, dicomContent);
    }

    private async getDocumentContent(uri: vscode.Uri): Promise<dicomParser.DataSet> {
        const content = await vscode.workspace.fs.readFile(uri);
        return dicomParser.parseDicom(content);
    }

    // Print each tag as a <LI> and then call recursively for sequences by embedding a <UL>
    private getHtmlForDataSet(dataSet: dicomParser.DataSet, indent : string = ""): string {
        let formattedDicom = "";
        const elements = dataSet.elements;

        // Display in tag order
        var keys = [];
        for(let tag in dataSet.elements) {
            keys.push(tag);
        }
        keys.sort();
        
        for (let index in keys) {
            const tag = keys[index];
            const element = elements[tag];
            const vr = element.vr;
            const value = dicomParser.explicitElementToString(dataSet, element);

            formattedDicom += `${indent}${this.formatTag(tag)} : ${vr} : `;
            if (typeof value === 'undefined') {
                if (vr === "SQ") {
                    formattedDicom += `[sequence, item count = ${element.items?.length}]\n`;
                    if (element.items) {
                        let index = 0;
                        element.items.forEach(item => {
                            if (item.dataSet) {
                                formattedDicom += `${indent}  Item #${index}\n${this.getHtmlForDataSet(item.dataSet, indent+"    ")}`;
                            }
                            index++;
                        });
                    }
                } else {
                    formattedDicom += `[undefined]\n`;
                }
            } else {
                formattedDicom += `${this.escapeHtml(value)}\n`;
            }
        }

        return formattedDicom;
    }

    private getHtmlForWebview(webview: vscode.Webview, documentUri : vscode.Uri, dicomContent: dicomParser.DataSet): string {
        const nonce = this.getNonce();

        let formattedDicom = `<ul>${this.getHtmlForDataSet(dicomContent)}</ul>`;

        const path = documentUri.path;
        const segments = path.split('/');
        const filename = segments[segments.length - 1];

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DICOM Tag Viewer</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 10px;
                    }
                    pre {
                        <!--background-color: #f4f4f4;-->
                        padding: 10px;
                        border-radius: 5px;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                </style>
            </head>
            <body>
                <h1>${filename}</h1>
                <pre><code>${formattedDicom}</code></pre>
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

    private formatTag(tagValue : string ) : string {
        // Remove the first character (x) and split the rest into two parts
        const numbers = tagValue.slice(1);
        const firstPart = numbers.slice(0, 4);
        const secondPart = numbers.slice(4);

        // Join the parts with a comma
        return `${firstPart},${secondPart}`;
    }
}
