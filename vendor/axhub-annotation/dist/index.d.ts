import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';

/**
 * Web Editor V2 - Shared Type Definitions
 *
 * This module defines types shared between:
 * - Background script (injection control)
 * - Inject script (web-editor-v2.ts)
 * - Future: UI panels
 */
/** Current state of the web editor */
interface WebEditorState {
    /** Whether the editor is currently active */
    active: boolean;
    /** Editor version for compatibility checks */
    version: 2;
}
/**
 * Framework debug source information
 * Extracted from React Fiber or Vue component instance
 */
interface DebugSource {
    /** Source file path */
    file: string;
    /** Line number (1-based) */
    line?: number;
    /** Column number (1-based) */
    column?: number;
    /** Component name (if available) */
    componentName?: string;
}
/**
 * Element Locator - Primary key for element identification
 *
 * Uses multiple strategies to locate elements, supporting:
 * - HMR/DOM changes recovery
 * - Cross-session persistence
 * - Framework-agnostic identification
 */
interface ElementLocator {
    /** CSS selector candidates (ordered by specificity) */
    selectors: string[];
    /** Structural fingerprint for similarity matching */
    fingerprint: string;
    /** Framework debug information (React/Vue) */
    debugSource?: DebugSource;
    /** DOM tree path (child indices from root) */
    path: number[];
    /** iframe selector chain (from top to target frame) - Phase 4 */
    frameChain?: string[];
    /** Shadow DOM host selector chain - Phase 2 */
    shadowHostChain?: string[];
}
/** Stable element identifier for aggregating transactions across UI contexts */
type WebEditorElementKey = string;
/**
 * Revert element response from content script.
 */
interface WebEditorRevertElementResponse {
    /** Whether the revert was successful */
    success: boolean;
    /** What was reverted (for UI feedback) */
    reverted?: {
        style?: boolean;
        text?: boolean;
        class?: boolean;
    };
    /** Error message if revert failed */
    error?: string;
}
interface GenieEditorHostResource {
    kind: string;
    id?: string;
    path?: string;
    url?: string;
    meta?: Record<string, unknown>;
}
interface GenieEditorModifiedElementSummary {
    elementKey: WebEditorElementKey;
    locator: ElementLocator;
    label: string;
    note: string;
    imageCount: number;
    changeKinds: Array<'text' | 'style' | 'class'>;
}
interface GenieEditorTextChange {
    before: string;
    after: string;
}
interface GenieEditorStyleChangeSet {
    cssText: string;
}
interface GenieEditorEditedSnapshot {
    resource: GenieEditorHostResource | null;
    selectedElement: SelectedElementSummary | null;
    modifiedElements: GenieEditorModifiedElementSummary[];
    textChanges: GenieEditorTextChange[];
    styleChanges: GenieEditorStyleChangeSet;
}
/**
 * Summary of currently selected element.
 * Lightweight payload for selection sync (no transaction data).
 */
interface SelectedElementSummary {
    /** Stable element identifier */
    elementKey: WebEditorElementKey;
    /** Locator for element identification and highlighting */
    locator: ElementLocator;
    /** Short display label (e.g., "div#app") */
    label: string;
    /** Full label with context (e.g., "body > div#app") */
    fullLabel: string;
    /** Tag name of the element */
    tagName: string;
    /** Timestamp for deduplication */
    updatedAt: number;
}
/**
 * Genie Editor public lifecycle state.
 */
interface GenieEditorState extends WebEditorState {
}
interface GenieEditorStatus {
    active: boolean;
    hasSelection: boolean;
    selectedElement: SelectedElementSummary | null;
    undoCount: number;
    redoCount: number;
    modifiedCount: number;
    hasTextChanges: boolean;
    hasStyleChanges: boolean;
    hasModifiedElements: boolean;
}
type GenieEditorStatusListener = (status: GenieEditorStatus) => void;
interface GenieEditorDebugState {
    available: boolean;
    connected: boolean;
    bridgeConfig: {
        apiBaseUrl: string;
        integrationChannel: string;
        targetClientId: string;
        provider: string;
    } | null;
    selectedElementKey: string | null;
    currentConversation: {
        scopeKey: string;
        sessionId: string;
        provider: string | null;
        invalidated: boolean;
        sentCount: number;
        expiresAt: number;
        sessionUrl: string | null;
    } | null;
    hasReusableConversation: boolean;
    currentElementTask: {
        elementKey: string;
        status: string;
        sessionId: string | null;
        provider: string | null;
        message: string;
        updatedAt: number;
    } | null;
    visibleTasks: Array<{
        elementKey: string;
        status: string;
        sessionId: string | null;
        provider: string | null;
        message: string;
        updatedAt: number;
    }>;
}
/**
 * Genie Editor public API.
 * Legacy global access remains available on `window.__MCP_WEB_EDITOR_V2__`.
 */
interface GenieEditorApi {
    /** Start the editor */
    start: () => void;
    /** Stop the editor */
    stop: () => void;
    /** Dispose the editor instance and release all listeners */
    destroy: () => void;
    /** Toggle editor on/off, returns new state */
    toggle: () => boolean;
    /** Get current state */
    getState: () => GenieEditorState;
    /** Get current host-facing status snapshot */
    getStatus: () => GenieEditorStatus;
    /** Subscribe to host-facing status changes */
    subscribeStatus: (listener: GenieEditorStatusListener) => () => void;
    /** Read the currently selected element summary */
    getSelectedElement: () => SelectedElementSummary | null;
    /** Read the current modified element summaries */
    getModifiedElements: () => GenieEditorModifiedElementSummary[];
    /** Read aggregated text changes */
    getTextChanges: () => GenieEditorTextChange[];
    /** Read aggregated style changes */
    getStyleChanges: () => GenieEditorStyleChangeSet;
    /** Read the full edited snapshot for host consumption */
    getEditedSnapshot: () => GenieEditorEditedSnapshot;
    /** Read the internal Genie/runtime debug state for diagnostics */
    getDebugState?: () => GenieEditorDebugState;
    /** Get current undo/redo counts */
    getHistoryCounts?: () => {
        undoCount: number;
        redoCount: number;
    };
    /**
     * Revert a specific element to its original state (Phase 2 - Selective Undo).
     * Creates a compensating transaction that can be undone.
     */
    revertElement: (elementKey: WebEditorElementKey) => Promise<WebEditorRevertElementResponse>;
    /**
     * Clear current selection (called from sidepanel after send).
     * Triggers deselect and broadcasts null selection.
     */
    clearSelection: () => void;
    /** Acknowledge that current text edits have been saved externally */
    acknowledgeSavedTextChanges: () => void;
    /** Acknowledge that current style edits have been saved or cleared externally */
    acknowledgeSavedStyleChanges: () => void;
    /** Clear the edits associated with a specific element */
    clearElementEdits: (elementKey: WebEditorElementKey) => Promise<boolean>;
    /** Clear all current edits and local cache */
    clearAllEdits: () => Promise<void>;
}
type WebEditorV2Api = GenieEditorApi;
declare global {
    interface Window {
        __AXHUB_GENIE_EDITOR__?: GenieEditorApi;
        __MCP_WEB_EDITOR_V2__?: WebEditorV2Api;
    }
}

type ProtoDevControlType = 'input' | 'inputNumber' | 'select' | 'switch' | 'checkbox' | 'slider' | 'textarea' | 'text' | 'button' | 'colorPicker';
type ProtoDevOptionValue = string | number;
interface ProtoDevOption {
    label: string;
    value: ProtoDevOptionValue;
}
interface ProtoDevControlBase {
    type: ProtoDevControlType;
    attributeId: string;
    displayName: string;
    info?: string;
    initialValue?: unknown;
    /** Allow arbitrary extra config properties per component type */
    [key: string]: unknown;
}
interface ProtoDevInputControl extends ProtoDevControlBase {
    type: 'input';
    initialValue?: string;
}
interface ProtoDevInputNumberControl extends ProtoDevControlBase {
    type: 'inputNumber';
    initialValue?: number;
    min?: number;
    max?: number;
    step?: number;
}
interface ProtoDevSelectControl extends ProtoDevControlBase {
    type: 'select';
    options: ProtoDevOption[];
    initialValue?: ProtoDevOptionValue;
}
interface ProtoDevSwitchControl extends ProtoDevControlBase {
    type: 'switch';
    initialValue?: boolean;
}
interface ProtoDevCheckboxControl extends ProtoDevControlBase {
    type: 'checkbox';
    initialValue?: boolean;
}
interface ProtoDevSliderControl extends ProtoDevControlBase {
    type: 'slider';
    initialValue?: number;
    min?: number;
    max?: number;
    step?: number;
    showInputNumber?: boolean;
}
interface ProtoDevTextareaControl extends ProtoDevControlBase {
    type: 'textarea';
    initialValue?: string;
    placeholder?: string;
    minRows?: number;
    maxRows?: number;
}
interface ProtoDevTextControl extends ProtoDevControlBase {
    type: 'text';
    initialValue?: string;
}
interface ProtoDevButtonControl extends ProtoDevControlBase {
    type: 'button';
    initialValue?: string;
    onClick?: () => void;
    buttonType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
}
interface ProtoDevColorPickerControl extends ProtoDevControlBase {
    type: 'colorPicker';
    initialValue?: string;
}
type ProtoDevControl = ProtoDevInputControl | ProtoDevInputNumberControl | ProtoDevSelectControl | ProtoDevSwitchControl | ProtoDevCheckboxControl | ProtoDevSliderControl | ProtoDevTextareaControl | ProtoDevTextControl | ProtoDevButtonControl | ProtoDevColorPickerControl;
type ProtoDevControlInput = ProtoDevControl;
type ProtoDevState = Record<string, unknown>;
interface ProtoDevRuntimeSnapshot {
    controls: ProtoDevControl[];
    state: ProtoDevState;
    open: boolean;
    ownerId: string | null;
}
interface ProtoDevControllerOptions {
    controls?: ProtoDevControlInput[];
    storageKey?: string;
    defaultOpen?: boolean;
}
interface ProtoDevController {
    id: string;
    mount(): void;
    unmount(): void;
    getState(): ProtoDevState;
    setState(partial: ProtoDevState): void;
    subscribe(listener: (state: ProtoDevState) => void): () => void;
}

type DisplayMode = 'bubble' | 'drawer';
interface AnnotationNode {
    id: string;
    index: number;
    locator: ElementLocator;
    aiPrompt: string;
    annotationText: string;
    hasMarkdown: boolean;
    color: string;
    images: string[];
    controls?: ProtoDevControl[];
    createdAt: number;
    updatedAt: number;
}
interface AnnotationData {
    version: 2;
    prototypeName: string;
    pageId: string;
    nodes: AnnotationNode[];
    updatedAt: number;
}
interface AnnotationState {
    active: boolean;
    displayMode: DisplayMode;
    data: AnnotationData;
    selectedId: string | null;
    colorFilter: string | null;
    loading: boolean;
}
type StateListener = (state: AnnotationState) => void;
interface AnnotationSource {
    data: AnnotationData | null;
    markdownMap?: Record<string, string>;
    assetMap?: Record<string, string>;
}
type AnnotationSourceInput = AnnotationSource | (() => Promise<AnnotationSource | null>);
interface AnnotationViewerOptions {
    showToolbar?: boolean;
    showThemeToggle?: boolean;
    showDisplayModeSwitch?: boolean;
    showColorFilter?: boolean;
    zIndex?: number;
    emptyWhenNoData?: boolean;
}

interface AnnotationViewerProps {
    source: AnnotationSourceInput;
    defaultVisible?: boolean;
    defaultDisplayMode?: DisplayMode;
    resolveElement?: (locator: ElementLocator) => Element | null;
    options?: AnnotationViewerOptions;
}
declare function AnnotationViewer(props: AnnotationViewerProps): null;

interface AnnotationStorage {
    load(): Promise<AnnotationData | null>;
    loadAnnotationsMd(): Promise<string | null>;
    loadMarkdown(nodeId: string): Promise<string | null>;
    getAssetUrl(filename: string): string;
}

interface AnnotationViewerSourceConfig {
    source: AnnotationSourceInput;
    defaultDisplayMode?: DisplayMode;
    resolveElement?: (locator: ElementLocator) => Element | null;
    options?: AnnotationViewerOptions;
}
interface AnnotationViewerLegacyConfig {
    prototypeName: string;
    pageId: string;
    storage: AnnotationStorage;
    defaultDisplayMode?: DisplayMode;
    resolveElement?: (locator: ElementLocator) => Element | null;
    options?: AnnotationViewerOptions;
}
type AnnotationViewerConfig = AnnotationViewerSourceConfig | AnnotationViewerLegacyConfig;
interface AnnotationViewerApi {
    start(): Promise<void>;
    stop(): void;
    getState(): AnnotationState;
    subscribe(fn: StateListener): () => void;
    selectAnnotation(id: string | null): void;
}
declare function createAnnotationViewer(config: AnnotationViewerConfig): AnnotationViewerApi;

interface AnnotationMarkdownRecord {
    nodeId: string;
    annotationText: string;
}
declare function serializeAnnotationsMarkdown(nodes: Array<Pick<AnnotationNode, 'id' | 'annotationText' | 'hasMarkdown'>>): string;
declare function parseAnnotationsMarkdown(content: string | null | undefined): Record<string, string>;
declare function parseAnnotationMarkdownRecords(content: string | null | undefined): AnnotationMarkdownRecord[];

interface BuildAnnotationPromptOptions {
    prototypeName?: string;
    pageId?: string;
}
interface AnnotationPromptBuildResult {
    prompt: string;
    processedNodeIds: string[];
}
declare function buildAnnotationPrompt(nodes: readonly AnnotationNode[], options?: BuildAnnotationPromptOptions): AnnotationPromptBuildResult;

type GenieBrandState = 'awake' | 'sleeping' | 'working' | 'dragging';
type GenieBrandThemeMode = 'light' | 'dark';
interface GenieDragVelocity {
    x: number;
    y: number;
}
interface GenieBrandButtonProps {
    state: GenieBrandState;
    size?: number;
    disabled?: boolean;
    loading?: boolean;
    title?: string;
    themeMode?: GenieBrandThemeMode;
    dragVelocity?: GenieDragVelocity;
    onClick?: () => void;
}
declare function GenieBrandButton(props: GenieBrandButtonProps): react_jsx_runtime.JSX.Element;

declare function createProtoDevController(options?: ProtoDevControllerOptions): ProtoDevController;

interface ProtoDevPanelProps {
    controls?: ProtoDevControlInput[];
    storageKey?: string;
    defaultOpen?: boolean;
}
declare function ProtoDevPanel(props: ProtoDevPanelProps): React.ReactElement | null;

declare global {
    interface Window {
        __AXHUB_PROTO_DEV__?: {
            getState: () => ProtoDevState;
            getControls: () => ProtoDevControl[];
            setState: (partial: ProtoDevState) => void;
            subscribe: (listener: () => void) => () => void;
        };
    }
}
declare function registerProtoDevControls(controls: ProtoDevControlInput[]): ProtoDevControl[];
declare function getProtoDevState(): ProtoDevState;
declare function setProtoDevState(partial: ProtoDevState): void;
declare function subscribeProtoDevState(listener: (state: ProtoDevState) => void): () => void;
declare function useProtoDevState<T = ProtoDevState>(): T;

export { type AnnotationData, type AnnotationNode, type AnnotationSource, type AnnotationSourceInput, type AnnotationState, type AnnotationStorage, AnnotationViewer, type AnnotationViewerApi, type AnnotationViewerConfig, type AnnotationViewerOptions, type AnnotationViewerProps, type DisplayMode, type ElementLocator, GenieBrandButton, type GenieBrandState, type GenieBrandThemeMode, type ProtoDevControl, type ProtoDevControlInput, type ProtoDevControlType, type ProtoDevController, type ProtoDevControllerOptions, type ProtoDevOption, type ProtoDevOptionValue, ProtoDevPanel, type ProtoDevRuntimeSnapshot, type ProtoDevState, type StateListener, buildAnnotationPrompt, createAnnotationViewer, createProtoDevController, registerProtoDevControls as defineProtoDevControls, getProtoDevState, parseAnnotationMarkdownRecords, parseAnnotationsMarkdown, serializeAnnotationsMarkdown, setProtoDevState, subscribeProtoDevState, useProtoDevState };
