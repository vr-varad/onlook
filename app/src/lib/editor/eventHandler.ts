import { debounce } from 'lodash';
import { EditorMode } from '../models';
import { EditorEngine } from './engine';
import { WebviewChannels } from '/common/constants';
import { DomElement } from '/common/models/element';

export class WebviewEventHandler {
    eventCallbacks: Record<string, (e: any) => void>;
    editorEngine: EditorEngine;

    constructor(editorEngine: EditorEngine) {
        this.handleIpcMessage = this.handleIpcMessage.bind(this);
        this.handleConsoleMessage = this.handleConsoleMessage.bind(this);
        this.editorEngine = editorEngine;
        this.eventCallbacks = {
            [WebviewChannels.WINDOW_RESIZED]: this.handleWindowResized(),
            [WebviewChannels.STYLE_UPDATED]: this.handleStyleUpdated(),
            [WebviewChannels.WINDOW_MUTATED]: this.handleWindowMutated(),
            [WebviewChannels.ELEMENT_INSERTED]: this.handleElementInserted(),
        };
    }

    handleWindowResized() {
        return (e: Electron.IpcMessageEvent) => {
            const webview = e.target as Electron.WebviewTag;
            this.editorEngine.elements.refreshSelectedElements(webview);
        };
    }

    handleElementInserted() {
        return (e: Electron.IpcMessageEvent) => {
            if (!e.args || e.args.length === 0) {
                console.error('No args found for style-updated event');
                return;
            }
            this.editorEngine.mode = EditorMode.DESIGN;
            const webview = e.target as Electron.WebviewTag;
            const domElement: DomElement = e.args[0];
            this.editorEngine.elements.click([domElement], webview);
        };
    }

    handleStyleUpdated() {
        return (e: Electron.IpcMessageEvent) => {
            if (!e.args || e.args.length === 0) {
                console.error('No args found for style-updated event');
                return;
            }
            const webview = e.target as Electron.WebviewTag;
            this.editorEngine.handleStyleUpdated(webview);
        };
    }

    handleWindowMutated() {
        // TODO: Only refresh the parts that change. Create a refresh element function in dom and only refresh that element in the tree
        return debounce(async (e: Electron.IpcMessageEvent) => {
            // const webview = e.target as Electron.WebviewTag;
            // const body = await this.editorEngine.dom.getBodyFromWebview(webview);
            // this.editorEngine.dom.setDom(webview.id, body);
        }, 1000);
    }

    handleIpcMessage(e: Electron.IpcMessageEvent) {
        const eventHandler = this.eventCallbacks[e.channel];
        if (!eventHandler) {
            console.error(`No event handler found for ${e.channel}`);
            return;
        }
        eventHandler(e);
    }

    handleConsoleMessage(e: Electron.ConsoleMessageEvent) {
        console.log(`%c ${e.message}`, 'background: #000; color: #AAFF00');
    }
}
