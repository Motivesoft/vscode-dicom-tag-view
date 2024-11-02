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

    private async getDocumentContent(uri: vscode.Uri): Promise<dicomParser.DataSet> {
        const content = await vscode.workspace.fs.readFile(uri);
        return dicomParser.parseDicom( content );
    }
    
    private getHtmlForWebview(webview: vscode.Webview, dicomContent: dicomParser.DataSet): string {
        const nonce = this.getNonce();

/* 
        let output : string[] = [];
        dumpDataSet(dicomContent.elements, output);
        const formattedDicom = output.join('');
 */ 
        let formattedDicom = "";
        const elements = dicomContent.elements;
        for (let tag in elements) {
          const element = elements[tag];
          const vr = element.vr;
          const value = dicomParser.explicitElementToString(dicomContent,element);

          let escapedValue: string;
          if (typeof value === 'undefined') {
            if (vr === "SQ" ) {
                escapedValue = "[sequence]";
                if( element.items ) {
                    element.items.forEach( item => {
                        //formattedDicom+=`<br>&nbsp;&nbsp;&nbsp;&nbsp;${item.tag} : ${item.vr} : ${dicomParser.explicitElementToString(dicomContent,item)}`;
                        //formattedDicom+=`<br>&nbsp;&nbsp;&nbsp;&nbsp;${item.tag} : ${item.vr}`;
                        if( item.dataSet ) {
                            formattedDicom += this.getHtmlForWebview(webview, item.dataSet);
                        }
                    });
                }
            } else {
                escapedValue = "[undefined]";
            }
          } else {
            escapedValue = this.escapeHtml(value);
          }

          formattedDicom += `<br>${tag} : ${vr} : ${escapedValue}`;
        }

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
                        background-color: #f4f4f4;
                        padding: 10px;
                        border-radius: 5px;
                        white-space: pre-wrap;
                        word-wrap: break-word;
                    }
                </style>
            </head>
            <body>
                <h1>DICOM Tag Viewer (Read-only)</h1>
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
}

/*     
    // This function iterates through dataSet recursively and adds new HTML strings
    // to the output array passed into it
    function dumpDataSet(instance : {[tag: string]: dicomParser.Element} | undefined, output : string[])
    {
        // the dataSet.elements object contains properties for each element parsed.  The name of the property
        // is based on the elements tag and looks like 'xGGGGEEEE' where GGGG is the group number and EEEE is the
        // element number both with lowercase hexadecimal letters.  For example, the Series Description DICOM element 0008,103E would
        // be named 'x0008103e'.  Here we iterate over each property (element) so we can build a string describing its
        // contents to add to the output array
        for(var propertyName in instance) {
            var element = instance[propertyName];
            
            // The output string begins with the element tag, length and VR (if present).  VR is undefined for
            // implicit transfer syntaxes
            var text = propertyName;
            //text += " length=" + element.length;

            if(element.constructor === Array) {
                output.push('<li>' + text + '</li>');
                output.push('<ul>');

                let elementArray : Array<dicomParser.Element> = element;

                // each item contains its own data set so we iterate over the items
                // and recursively call this function
                var itemNumber = 0;
                (element as Array<dicomParser.Element>).forEach(function (item) {
                    output.push('<li>Item #' + itemNumber++ + '</li>');
                    output.push('<ul>');
                    dumpDataSet(item.dataSet?.elements, output);
                    output.push('</ul>');
                });
                output.push('</ul>');
            } else if(typeof element === 'object')
            {
                if(element.hadUndefinedLength) {
                    text += " <strong>(-1)</strong>";
                }
                text += " length=" + element.length + '; offset=' + element.dataOffset;
            } else if(typeof element === 'string') {
                text += " = " + element;
            }


            var color = 'black';

            // finally we add the string to our output array surrounded by li elements so it shows up in the
            // DOM as a list
            output.push('<li style="color:' + color +';">'+ text + '</li>');
        }
    }
 */