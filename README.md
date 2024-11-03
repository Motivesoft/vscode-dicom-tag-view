# DICOM Tag View

This extension allows DICOM files to be opened to display their tag contents in a read-only editor window.

## Features

Once installed, the extension adds an option to the `Open With...` context menu that will take the currently selected DICOM file, open a new editor window and display the DICOM tags in the file.

If a DICOM file is open in a different type of editor, use the `Open In DICOM Tag Viewer` option on the right-click menu option to open it in this tag viewer.

## Requirements

This extension uses the [`dicom-parser`](https://www.npmjs.com/package/dicom-parser) library

## Extension Settings

None at this time.

## Known Issues

This is a DICOM tag viewer only. It does not constitute a medical device and cannot not be used for clinical or diagnostic interpretation.

Currently, the DICOM tag display is quite basic, limited to tag group and element, VR and a textual representation of the tag contents.

Future versions may incorporate the use of a tag dictionary, and an optional display of binary data from `OB` and `OW` value representations.

There are currently no plans to offer a graphical representation of image data.

## Release Notes

### 0.1.0

- Initial release to gauge interest and seek further requirements.
