import { QuillOptionsStatic } from 'quill';
import { DeltaStatic } from 'quill-delta';
import { EventType } from '../interfaces/IMessage';
import { IResources } from '../interfaces/IResources';

/* This file contains HTML for the webview that contains Quill. You can use the es6-string-html, es6-string-css and 
   es6-string-javascript plugins for VSCode to get syntax highlighting on this file.
   
   We input all EventType.{...} occurrences as variables in the template strings to enable type analysis for the event
   types, since they might be change sensitive. */

export function generateWebViewIndex(
  resources: IResources,
  content: DeltaStatic | string | undefined,
  options: QuillOptionsStatic,
  editable: boolean
) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0">
        <style>
          html,
          body {
            height: 100%;
            margin: 0;
            padding: 0;
          }

          .quill-wrapper {
            display: flex;
            height: 100%;
            overflow: hidden;
            position: relative;
          }

          .quill-editor {
            overflow-y: auto;
            height: 100%;
            width: 100%;
           
          }
  
          .quill-wrapper .ql-container {
            padding: 11px; 
            transition: all 0.2s;
            padding-bottom: ${editable ? '52px' : 0};
          }

          .quill-wrapper .ql-editor {
            padding: 11px; 
            transition: all 0.2s;
          }

          .quill-wrapper .ql-container.ql-snow,
          .quill-wrapper .ql-toolbar.ql-snow + .ql-container.ql-snow {
            border: 0;
            transition: all 0.2s;
          }

          .quill-wrapper .ql-toolbar.ql-snow {
            border: 0;
            display: flex;
            align-items: center;
            border-top: 1px solid #ccc;
            padding-left: 8px;
            padding-right: 8px;
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 44px;
            background-color: white;
            z-index: 99;
          }

          .quill-wrapper .ql-editor.ql-blank::before {
            font-style: normal;
            left: 11px;
            color: rgba(0,0,0,0.54);
            transition: all 0.2s;
          }
        </style>

        <style>
          ${resources.styleSheet}
        </style>
      </head>
      <body>
        <div class="quill-wrapper">
          <div class="quill-editor"></div>
        </div>

        <script>
          ${resources.script};
        </script>

        <script>
          function sendMessage(type, data) {
            const message = JSON.stringify({ type, data });

            // window.ReactNativeWebView is used by the react-native-community/react-native-webview package
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(message);
            } else {
              window.postMessage(message);
            }
          }

          function onContentChange(data) {
            editor.setContents(data);
          }

          function processMessage(message) {
            const { type, data } = message;

            switch (type) {
              case ${EventType.CONTENT_CHANGE}:
                return onContentChange(data);
            }
          }

          function onMessage(event) {
            try {
              // TODO: Implement only sending delta's to save time on JSON parsing overhead
              processMessage(JSON.parse(event.data));
            } catch (error) {
              console.warn('Ignoring unprocessable event from React Native to Quill WebView due to error: ', error);
            }
          }

          function bindMessageHandler() {
            window.addEventListener('message', onMessage);
            window.onmessage = onMessage
          }

          function onFocus(editor) {
            editor.container.classList.add('quill-focus');
          }

          function onBlur(editor) {
            editor.container.classList.remove('quill-focus');
          }

          /* Create the Quill editor */
          const editor = new Quill('.quill-editor', ${JSON.stringify(options)});

          /* Set the initial content */
          
          if (${typeof content === 'string'}) {
            editor.clipboard.dangerouslyPasteHTML(0, ${JSON.stringify(content)});
           
          } else {
            editor.setContents(${JSON.stringify(content)})
          }

          if (${editable}) {
            editor.enable();
            setTimeout(() => {
              editor.setSelection(editor.scroll.length(), 0);
            }, 120);
            
          } else {
            editor.root.blur()
            editor.enable(false);
          }


          /* Send a message when the text changes */
          editor.on('text-change', function() {
            const html = editor.root.innerHTML;
            sendMessage(${EventType.CONTENT_CHANGE}, { content: editor.getContents(), html });
          });

          editor.root.addEventListener('focus', () => onFocus(editor));
          editor.root.addEventListener('blur', () => onBlur(editor));

          bindMessageHandler();
        </script>
      </body>
    </html>
  `;
}
