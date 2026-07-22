// src/AnnotationViewer.tsx
import React23 from "react";

// src/annotation-runtime.tsx
import React22 from "react";
import { createRoot } from "react-dom/client";
import { App, ConfigProvider as ConfigProvider2 } from "antd";
import { StyleProvider, createCache } from "@ant-design/cssinjs";

// src/core/locator.ts
var FINGERPRINT_TEXT_MAX_LENGTH = 32;
var FINGERPRINT_MAX_CLASSES = 8;
function safeQuerySelector(root, selector) {
  try {
    return root.querySelector(selector);
  } catch {
    return null;
  }
}
function normalizeText(text, maxLength) {
  return text.replace(/\s+/g, " ").trim().slice(0, maxLength);
}
function computeFingerprint(element) {
  const parts = [];
  const tag = element.tagName?.toLowerCase() ?? "unknown";
  parts.push(tag);
  const id = element.id?.trim();
  if (id) {
    parts.push(`id=${id}`);
  }
  const classes = Array.from(element.classList).slice(0, FINGERPRINT_MAX_CLASSES);
  if (classes.length > 0) {
    parts.push(`class=${classes.join(".")}`);
  }
  const text = normalizeText(element.textContent ?? "", FINGERPRINT_TEXT_MAX_LENGTH);
  if (text) {
    parts.push(`text=${text}`);
  }
  return parts.join("|");
}
function isSelectorUnique(root, selector) {
  try {
    return root.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}
function verifyFingerprint(element, fingerprint) {
  const currentFingerprint = computeFingerprint(element);
  const storedParts = fingerprint.split("|");
  const currentParts = currentFingerprint.split("|");
  if (storedParts[0] !== currentParts[0]) return false;
  const storedId = storedParts.find((p) => p.startsWith("id="));
  const currentId = currentParts.find((p) => p.startsWith("id="));
  if (storedId && storedId !== currentId) return false;
  return true;
}
function locateElement(locator, rootDocument = document) {
  let doc = rootDocument;
  if (locator.frameChain?.length) {
    for (const frameSelector of locator.frameChain) {
      const frame = safeQuerySelector(doc, frameSelector);
      if (!(frame instanceof HTMLIFrameElement)) return null;
      const contentDoc = frame.contentDocument;
      if (!contentDoc) return null;
      doc = contentDoc;
    }
  }
  let queryRoot = doc;
  if (locator.shadowHostChain?.length) {
    for (const hostSelector of locator.shadowHostChain) {
      if (!isSelectorUnique(queryRoot, hostSelector)) return null;
      const host = safeQuerySelector(queryRoot, hostSelector);
      if (!host) return null;
      const shadowRoot = host.shadowRoot;
      if (!shadowRoot) return null;
      queryRoot = shadowRoot;
    }
  }
  for (const selector of locator.selectors) {
    if (!isSelectorUnique(queryRoot, selector)) continue;
    const element = safeQuerySelector(queryRoot, selector);
    if (!element) continue;
    if (locator.fingerprint && !verifyFingerprint(element, locator.fingerprint)) {
      continue;
    }
    return element;
  }
  return null;
}

// src/constants.ts
var WEB_EDITOR_V2_LOG_PREFIX = "[WebEditorV2]";
var WEB_EDITOR_V2_HOST_ID = "__mcp_web_editor_v2_host__";
var WEB_EDITOR_V2_OVERLAY_ID = "__mcp_web_editor_v2_overlay__";
var WEB_EDITOR_V2_UI_ID = "__mcp_web_editor_v2_ui__";
var WEB_EDITOR_V2_Z_INDEX = 2147483647;
var WEB_EDITOR_V2_COLORS = {
  /** Hover highlight color */
  hover: "#008F5D",
  /** Selected element color */
  selected: "#008F5D",
  /** Selection box border */
  selectionBorder: "#008F5D",
  /** Drag ghost color */
  dragGhost: "rgba(0, 143, 93, 0.22)",
  /** Insertion line color */
  insertionLine: "#008F5D",
  /** Alignment guide line color (snap guides) */
  guideLine: "rgba(0, 143, 93, 0.72)",
  /** Distance label background (Phase 4.3) */
  distanceLabelBg: "rgba(18, 18, 18, 0.94)",
  /** Distance label border (Phase 4.3) */
  distanceLabelBorder: "rgba(0, 143, 93, 0.24)",
  /** Distance label text (Phase 4.3) */
  distanceLabelText: "rgba(255, 255, 255, 0.98)"
};
var WEB_EDITOR_V2_INSERTION_LINE_WIDTH = 3;
var WEB_EDITOR_V2_GUIDE_LINE_WIDTH = 1;
var WEB_EDITOR_V2_DISTANCE_LINE_WIDTH = 1;
var WEB_EDITOR_V2_DISTANCE_TICK_SIZE = 4;
var WEB_EDITOR_V2_DISTANCE_LABEL_FONT = '600 11px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
var WEB_EDITOR_V2_DISTANCE_LABEL_PADDING_X = 6;
var WEB_EDITOR_V2_DISTANCE_LABEL_PADDING_Y = 3;
var WEB_EDITOR_V2_DISTANCE_LABEL_RADIUS = 4;
var WEB_EDITOR_V2_DISTANCE_LABEL_OFFSET = 8;

// src/utils/disposables.ts
var Disposer = class {
  constructor() {
    this.disposed = false;
    this.disposers = [];
  }
  /** Whether this disposer has already been disposed */
  get isDisposed() {
    return this.disposed;
  }
  /**
   * Add a dispose function to be called during cleanup.
   * If already disposed, the function is called immediately.
   */
  add(dispose) {
    if (this.disposed) {
      try {
        dispose();
      } catch {
      }
      return;
    }
    this.disposers.push(dispose);
  }
  listen(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    this.add(() => target.removeEventListener(type, listener, options));
  }
  /**
   * Add a ResizeObserver and automatically disconnect it on dispose.
   */
  observeResize(target, callback, options) {
    const observer = new ResizeObserver(callback);
    observer.observe(target, options);
    this.add(() => observer.disconnect());
    return observer;
  }
  /**
   * Add a MutationObserver and automatically disconnect it on dispose.
   */
  observeMutation(target, callback, options) {
    const observer = new MutationObserver(callback);
    observer.observe(target, options);
    this.add(() => observer.disconnect());
    return observer;
  }
  /**
   * Add a requestAnimationFrame and automatically cancel it on dispose.
   * Returns a function to manually cancel the frame.
   */
  requestAnimationFrame(callback) {
    const id = requestAnimationFrame(callback);
    let cancelled = false;
    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      cancelAnimationFrame(id);
    };
    this.add(cancel);
    return cancel;
  }
  /**
   * Dispose all registered resources in reverse order.
   * Safe to call multiple times.
   */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    for (let i = this.disposers.length - 1; i >= 0; i--) {
      try {
        this.disposers[i]();
      } catch {
      }
    }
    this.disposers.length = 0;
  }
};

// src/overlay/canvas-overlay.ts
var CANVAS_ATTR = "data-mcp-canvas";
var CANVAS_ATTR_VALUE = "overlay";
var HOVER_ANIMATION_DURATION_MS = 100;
var AI_SELECTION_SCAN_DURATION_MS = 2600;
var BOX_STYLES = {
  hover: {
    strokeColor: WEB_EDITOR_V2_COLORS.hover,
    fillColor: `${WEB_EDITOR_V2_COLORS.hover}15`,
    // 15 = ~8% opacity
    lineWidth: 2,
    dashPattern: [6, 4]
  },
  selection: {
    strokeColor: WEB_EDITOR_V2_COLORS.selected,
    fillColor: "transparent",
    lineWidth: 2,
    dashPattern: []
  },
  dragGhost: {
    strokeColor: WEB_EDITOR_V2_COLORS.selectionBorder,
    fillColor: WEB_EDITOR_V2_COLORS.dragGhost,
    lineWidth: 2,
    dashPattern: [8, 6]
  }
};
function isFinitePositive(value) {
  return Number.isFinite(value) && value > 0;
}
function isValidRect(rect) {
  if (!rect) return false;
  return Number.isFinite(rect.left) && Number.isFinite(rect.top) && isFinitePositive(rect.width) && isFinitePositive(rect.height);
}
function isValidLine(line) {
  if (!line) return false;
  return Number.isFinite(line.x1) && Number.isFinite(line.y1) && Number.isFinite(line.x2) && Number.isFinite(line.y2);
}
function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpRect(from, to, t) {
  return {
    left: lerp(from.left, to.left, t),
    top: lerp(from.top, to.top, t),
    width: lerp(from.width, to.width, t),
    height: lerp(from.height, to.height, t)
  };
}
function buildRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
function createCanvasOverlay(options) {
  const { container } = options;
  const disposer = new Disposer();
  const existing = container.querySelector(
    `canvas[${CANVAS_ATTR}="${CANVAS_ATTR_VALUE}"]`
  );
  if (existing) {
    existing.remove();
  }
  const canvas = document.createElement("canvas");
  canvas.setAttribute(CANVAS_ATTR, CANVAS_ATTR_VALUE);
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    display: "block"
  });
  container.append(canvas);
  disposer.add(() => canvas.remove());
  const ctxOrNull = canvas.getContext("2d", {
    alpha: true,
    desynchronized: true
    // Lower latency on supported browsers
  });
  if (!ctxOrNull) {
    disposer.dispose();
    throw new Error(`${WEB_EDITOR_V2_LOG_PREFIX} Failed to get canvas 2D context`);
  }
  const ctx = ctxOrNull;
  let hoverRect = null;
  let hoverAnimation = null;
  let selectionRect = null;
  let selectionEffect = "default";
  let editingRects = null;
  let dragGhostRect = null;
  let insertionLine = null;
  let guideLines = null;
  let distanceLabels = null;
  let textHighlightRects = null;
  let viewportWidth = 1;
  let viewportHeight = 1;
  let devicePixelRatio = 1;
  let dirty = true;
  let rafId = null;
  function createAiEditingEffectNode() {
    const root = document.createElement("div");
    root.setAttribute("data-we-ai-selection-effect", "true");
    Object.assign(root.style, {
      position: "absolute",
      pointerEvents: "none",
      display: "none",
      overflow: "hidden",
      borderRadius: "0",
      border: `2px solid ${WEB_EDITOR_V2_COLORS.selected}`,
      boxShadow: "none",
      backdropFilter: "blur(2px)",
      WebkitBackdropFilter: "blur(2px)",
      background: "rgba(255, 255, 255, 0.22)",
      zIndex: "1"
    });
    const sweep = document.createElement("div");
    Object.assign(sweep.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "100%",
      height: "72px",
      background: "linear-gradient(to bottom, rgba(0, 143, 93, 0), rgba(0, 143, 93, 0.08) 28%, rgba(0, 143, 93, 0.18) 50%, rgba(0, 143, 93, 0.08) 72%, rgba(0, 143, 93, 0))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      willChange: "transform"
    });
    const sweepLine = document.createElement("div");
    Object.assign(sweepLine.style, {
      width: "100%",
      height: "1px",
      background: "rgba(0, 143, 93, 0.62)",
      boxShadow: "0 0 12px rgba(0, 143, 93, 0.58)"
    });
    sweep.append(sweepLine);
    root.append(sweep);
    container.append(root);
    return {
      root,
      sweep,
      animation: null,
      animationKey: ""
    };
  }
  const aiEditingEffectNodes = [];
  disposer.add(() => {
    for (const node of aiEditingEffectNodes) {
      node.animation?.cancel();
      node.root.remove();
    }
  });
  function ensureAiEditingEffectNodes(count) {
    while (aiEditingEffectNodes.length < count) {
      aiEditingEffectNodes.push(createAiEditingEffectNode());
    }
    while (aiEditingEffectNodes.length > count) {
      const node = aiEditingEffectNodes.pop();
      if (!node) break;
      node.animation?.cancel();
      node.root.remove();
    }
  }
  function cancelRaf() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
  disposer.add(cancelRaf);
  function scheduleRaf() {
    if (rafId !== null || disposer.isDisposed) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      render();
    });
  }
  function updateCanvasSize() {
    const nextDpr = Math.max(1, window.devicePixelRatio || 1);
    const cssWidth = Math.max(1, viewportWidth);
    const cssHeight = Math.max(1, viewportHeight);
    const pixelWidth = Math.round(cssWidth * nextDpr);
    const pixelHeight = Math.round(cssHeight * nextDpr);
    const needsResize = canvas.width !== pixelWidth || canvas.height !== pixelHeight || Math.abs(devicePixelRatio - nextDpr) > 1e-3;
    if (!needsResize) return false;
    devicePixelRatio = nextDpr;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    return true;
  }
  function clearCanvas() {
    updateCanvasSize();
    ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  }
  function drawBox(rect, style) {
    if (!isValidRect(rect)) return;
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (w <= 0 || h <= 0) return;
    const x = Math.round(rect.left) + 0.5;
    const y = Math.round(rect.top) + 0.5;
    ctx.save();
    ctx.lineWidth = style.lineWidth;
    ctx.strokeStyle = style.strokeColor;
    ctx.fillStyle = style.fillColor;
    ctx.setLineDash(style.dashPattern);
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function syncAiSelectionEffect() {
    const nextRects = [];
    if (selectionEffect === "ai-editing" && isValidRect(selectionRect)) {
      nextRects.push(selectionRect);
    }
    if (editingRects?.length) {
      for (const rect of editingRects) {
        if (isValidRect(rect)) {
          nextRects.push(rect);
        }
      }
    }
    ensureAiEditingEffectNodes(nextRects.length);
    if (nextRects.length === 0) {
      for (const node of aiEditingEffectNodes) {
        node.root.style.display = "none";
        node.animation?.pause();
      }
      return;
    }
    nextRects.forEach((rect, index) => {
      const node = aiEditingEffectNodes[index];
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const scanSize = Math.max(48, Math.min(88, Math.round(height * 0.28)));
      node.root.style.display = "block";
      node.root.style.left = `${Math.round(rect.left)}px`;
      node.root.style.top = `${Math.round(rect.top)}px`;
      node.root.style.width = `${width}px`;
      node.root.style.height = `${height}px`;
      node.sweep.style.height = `${scanSize}px`;
      const animationKey = `${height}:${scanSize}`;
      if (node.animationKey !== animationKey || !node.animation) {
        node.animation?.cancel();
        node.animationKey = animationKey;
        node.animation = node.sweep.animate(
          [
            { transform: `translateY(-${scanSize}px)` },
            { transform: `translateY(${height}px)` }
          ],
          {
            duration: AI_SELECTION_SCAN_DURATION_MS,
            iterations: Infinity,
            easing: "linear"
          }
        );
      }
      node.animation.play();
    });
  }
  function drawInsertionLine(line) {
    if (!isValidLine(line)) return;
    ctx.save();
    ctx.lineWidth = WEB_EDITOR_V2_INSERTION_LINE_WIDTH;
    ctx.strokeStyle = WEB_EDITOR_V2_COLORS.insertionLine;
    ctx.setLineDash([]);
    ctx.lineCap = "round";
    const x1 = Math.round(line.x1) + 0.5;
    const y1 = Math.round(line.y1) + 0.5;
    const x2 = Math.round(line.x2) + 0.5;
    const y2 = Math.round(line.y2) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
  function drawGuideLines(lines) {
    if (!lines || lines.length === 0) return;
    ctx.save();
    ctx.lineWidth = WEB_EDITOR_V2_GUIDE_LINE_WIDTH;
    ctx.strokeStyle = WEB_EDITOR_V2_COLORS.guideLine;
    ctx.setLineDash([]);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const line of lines) {
      if (!isValidLine(line)) continue;
      const x1 = Math.round(line.x1) + 0.5;
      const y1 = Math.round(line.y1) + 0.5;
      const x2 = Math.round(line.x2) + 0.5;
      const y2 = Math.round(line.y2) + 0.5;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.restore();
  }
  function drawDistanceLabels(labels) {
    if (!labels || labels.length === 0) return;
    ctx.save();
    ctx.lineWidth = WEB_EDITOR_V2_DISTANCE_LINE_WIDTH;
    ctx.strokeStyle = WEB_EDITOR_V2_COLORS.guideLine;
    ctx.setLineDash([]);
    ctx.lineCap = "round";
    const tick = WEB_EDITOR_V2_DISTANCE_TICK_SIZE;
    ctx.beginPath();
    for (const label of labels) {
      const line = label.line;
      if (!isValidLine(line)) continue;
      const x1 = Math.round(line.x1) + 0.5;
      const y1 = Math.round(line.y1) + 0.5;
      const x2 = Math.round(line.x2) + 0.5;
      const y2 = Math.round(line.y2) + 0.5;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      if (label.axis === "x") {
        ctx.moveTo(x1, y1 - tick);
        ctx.lineTo(x1, y1 + tick);
        ctx.moveTo(x2, y2 - tick);
        ctx.lineTo(x2, y2 + tick);
      } else {
        ctx.moveTo(x1 - tick, y1);
        ctx.lineTo(x1 + tick, y1);
        ctx.moveTo(x2 - tick, y2);
        ctx.lineTo(x2 + tick, y2);
      }
    }
    ctx.stroke();
    ctx.font = WEB_EDITOR_V2_DISTANCE_LABEL_FONT;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const label of labels) {
      const line = label.line;
      if (!isValidLine(line)) continue;
      const metrics = ctx.measureText(label.text);
      const textWidth = metrics.width;
      const ascent = Number.isFinite(metrics.actualBoundingBoxAscent) ? metrics.actualBoundingBoxAscent : 8;
      const descent = Number.isFinite(metrics.actualBoundingBoxDescent) ? metrics.actualBoundingBoxDescent : 3;
      const textHeight = ascent + descent;
      const pillWidth = Math.ceil(textWidth + WEB_EDITOR_V2_DISTANCE_LABEL_PADDING_X * 2);
      const pillHeight = Math.ceil(textHeight + WEB_EDITOR_V2_DISTANCE_LABEL_PADDING_Y * 2);
      const midX = (line.x1 + line.x2) / 2;
      const midY = (line.y1 + line.y2) / 2;
      const offset = WEB_EDITOR_V2_DISTANCE_LABEL_OFFSET;
      let pillX = midX - pillWidth / 2;
      let pillY = midY - pillHeight / 2;
      if (label.axis === "x") {
        pillY = midY - pillHeight / 2 - offset;
        if (pillY < 0) {
          pillY = midY + offset - pillHeight / 2;
        }
      } else {
        pillX = midX + offset - pillWidth / 2;
        if (pillX + pillWidth > viewportWidth) {
          pillX = midX - offset - pillWidth / 2;
        }
      }
      const maxPillX = Math.max(2, viewportWidth - pillWidth - 2);
      const maxPillY = Math.max(2, viewportHeight - pillHeight - 2);
      pillX = clamp(pillX, 2, maxPillX);
      pillY = clamp(pillY, 2, maxPillY);
      ctx.save();
      ctx.fillStyle = WEB_EDITOR_V2_COLORS.distanceLabelBg;
      ctx.strokeStyle = WEB_EDITOR_V2_COLORS.distanceLabelBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      buildRoundedRectPath(
        ctx,
        pillX,
        pillY,
        pillWidth,
        pillHeight,
        WEB_EDITOR_V2_DISTANCE_LABEL_RADIUS
      );
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = WEB_EDITOR_V2_COLORS.distanceLabelText;
      ctx.fillText(label.text, pillX + pillWidth / 2, pillY + pillHeight / 2);
      ctx.restore();
    }
    ctx.restore();
  }
  function drawTextHighlightRects(rects) {
    if (!rects || rects.length === 0) return;
    ctx.save();
    ctx.fillStyle = `${WEB_EDITOR_V2_COLORS.selected}25`;
    ctx.strokeStyle = "transparent";
    for (const rect of rects) {
      if (!isValidRect(rect)) continue;
      const x = Math.round(rect.left);
      const y = Math.round(rect.top);
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      ctx.beginPath();
      buildRoundedRectPath(ctx, x, y, w, h, 2);
      ctx.fill();
    }
    ctx.restore();
  }
  function markDirty() {
    if (disposer.isDisposed) return;
    dirty = true;
    scheduleRaf();
  }
  function render() {
    if (disposer.isDisposed || !dirty) return;
    cancelRaf();
    dirty = false;
    const now = performance.now();
    let hoverRectToRender = hoverRect;
    if (hoverAnimation) {
      const elapsed = now - hoverAnimation.startTime;
      const progress = clamp(elapsed / hoverAnimation.durationMs, 0, 1);
      const easedProgress = easeOutCubic(progress);
      hoverRectToRender = lerpRect(hoverAnimation.start, hoverAnimation.end, easedProgress);
      if (progress >= 1) {
        hoverAnimation = null;
      } else {
        dirty = true;
      }
    }
    clearCanvas();
    drawTextHighlightRects(textHighlightRects);
    drawBox(hoverRectToRender, BOX_STYLES.hover);
    if (selectionEffect !== "ai-editing") {
      drawBox(selectionRect, BOX_STYLES.selection);
    }
    drawBox(dragGhostRect, BOX_STYLES.dragGhost);
    drawInsertionLine(insertionLine);
    drawGuideLines(guideLines);
    drawDistanceLabels(distanceLabels);
    syncAiSelectionEffect();
    if (dirty) {
      scheduleRaf();
    }
  }
  function setHoverRect(rect, options2) {
    const shouldAnimate = options2?.animate === true;
    if (!shouldAnimate) {
      hoverAnimation = null;
      hoverRect = rect;
      markDirty();
      return;
    }
    const now = performance.now();
    let fromRect = hoverRect;
    if (hoverAnimation) {
      const elapsed = now - hoverAnimation.startTime;
      const progress = clamp(elapsed / hoverAnimation.durationMs, 0, 1);
      const easedProgress = easeOutCubic(progress);
      fromRect = lerpRect(hoverAnimation.start, hoverAnimation.end, easedProgress);
    }
    if (!isValidRect(fromRect) || !isValidRect(rect)) {
      hoverAnimation = null;
      hoverRect = rect;
      markDirty();
      return;
    }
    hoverAnimation = {
      start: { ...fromRect },
      end: { ...rect },
      startTime: now,
      durationMs: HOVER_ANIMATION_DURATION_MS
    };
    hoverRect = rect;
    markDirty();
  }
  function setSelectionRect(rect) {
    selectionRect = rect;
    syncAiSelectionEffect();
    markDirty();
  }
  function setSelectionEffect(effect) {
    if (selectionEffect === effect) return;
    selectionEffect = effect;
    syncAiSelectionEffect();
    markDirty();
  }
  function setEditingRects(rects) {
    editingRects = rects && rects.length > 0 ? rects : null;
    syncAiSelectionEffect();
    markDirty();
  }
  function setDragGhostRect(rect) {
    dragGhostRect = rect;
    markDirty();
  }
  function setInsertionLine(line) {
    insertionLine = line;
    markDirty();
  }
  function setGuideLines(lines) {
    guideLines = lines && lines.length > 0 ? lines : null;
    markDirty();
  }
  function setDistanceLabels(labels) {
    distanceLabels = labels && labels.length > 0 ? labels : null;
    markDirty();
  }
  function setTextHighlightRects(rects) {
    textHighlightRects = rects && rects.length > 0 ? rects : null;
    markDirty();
  }
  function clear() {
    hoverRect = null;
    hoverAnimation = null;
    selectionRect = null;
    selectionEffect = "default";
    editingRects = null;
    textHighlightRects = null;
    syncAiSelectionEffect();
    dragGhostRect = null;
    insertionLine = null;
    guideLines = null;
    distanceLabels = null;
    markDirty();
  }
  try {
    const rect = container.getBoundingClientRect();
    viewportWidth = Math.max(1, rect.width);
    viewportHeight = Math.max(1, rect.height);
  } catch (error) {
    console.warn(`${WEB_EDITOR_V2_LOG_PREFIX} Initial size measurement failed:`, error);
  }
  disposer.observeResize(container, (entries) => {
    const entry = entries[0];
    const rect = entry?.contentRect;
    if (!rect) return;
    const nextWidth = Math.max(1, rect.width);
    const nextHeight = Math.max(1, rect.height);
    if (Math.abs(nextWidth - viewportWidth) < 0.5 && Math.abs(nextHeight - viewportHeight) < 0.5) {
      return;
    }
    viewportWidth = nextWidth;
    viewportHeight = nextHeight;
    markDirty();
  });
  markDirty();
  return {
    canvas,
    markDirty,
    render,
    clear,
    setHoverRect,
    setSelectionRect,
    setSelectionEffect,
    setEditingRects,
    setTextHighlightRects,
    setDragGhostRect,
    setInsertionLine,
    setGuideLines,
    setDistanceLabels,
    dispose: () => disposer.dispose()
  };
}

// src/utils/mobile-detect.ts
var _isMobile = null;
function isMobileDevice() {
  if (_isMobile !== null) return _isMobile;
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    _isMobile = false;
    return false;
  }
  const hasTouchScreen = "ontouchstart" in window || navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0;
  const isNarrowViewport = window.innerWidth <= 768;
  _isMobile = hasTouchScreen && isNarrowViewport;
  return _isMobile;
}

// src/ui/shadow-host.ts
var ANNOTATION_UI_PORTAL_CLASS = "axhub-annotation-popover";
var SHADOW_HOST_STYLES = (
  /* css */
  `
  :host {
    all: initial;

    /* Shared overlay tokens */
    --we-surface-bg: #0a0a0a;

    /* Border colors */
    --we-border-subtle: rgba(255, 255, 255, 0.08);

    /* Text colors */
    --we-text-primary: rgba(255, 255, 255, 0.94);
    --we-text-secondary: rgba(255, 255, 255, 0.72);
    --we-text-muted: #a1a1aa;

    /* Shared chrome */
    --we-shadow-panel: 0 20px 54px rgba(0, 0, 0, 0.42), 0 6px 20px rgba(0, 0, 0, 0.28);
    --we-shadow-glow: 0 0 22px rgba(0, 143, 93, 0.18);
    --we-editor-surface-dark: #121212;
    --we-editor-surface-elevated-dark: #161616;
    --we-editor-surface-muted-dark: #18181b;
    --we-editor-surface-interactive-dark: #1d1d1f;
    --we-editor-border-dark: rgba(255, 255, 255, 0.08);
    --we-editor-border-strong-dark: rgba(255, 255, 255, 0.12);
    --we-editor-text-primary-dark: rgba(255, 255, 255, 0.94);
    --we-editor-text-secondary-dark: rgba(255, 255, 255, 0.72);
    --we-editor-text-muted-dark: #a1a1aa;
    --we-brand-primary: #008f5d;
    --we-brand-accent: #00d68f;
    --we-brand-sleeping: #71717a;

    --we-radius-panel: 16px;
    --we-radius-control: 12px;
    --we-radius-pill: 999px;

    /* Focus ring */
    --we-focus-ring: rgba(0, 214, 143, 0.24);
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  /* Overlay container - for Canvas and visual feedback */
  #${WEB_EDITOR_V2_OVERLAY_ID} {
    position: fixed;
    inset: 0;
    pointer-events: none;
    contain: layout style;
  }

  /* ==========================================================================
   * Resize Handles (Phase 4.9)
   * ========================================================================== */

  /* Handles layer - covers viewport, pass-through by default */
  .we-handles-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    contain: layout style paint;
  }

  /* Selection frame - positioned by selection rect */
  .we-selection-frame {
    position: absolute;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    transform: translate3d(0, 0, 0);
    pointer-events: none;
    will-change: transform, width, height;
  }

  .we-parent-corner {
    position: absolute;
    width: 7px;
    height: 7px;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    pointer-events: auto;
    display: block;
    cursor: pointer;
    user-select: none;
    touch-action: manipulation;
    z-index: 7;
  }

  .we-parent-corner[data-hidden="true"] {
    display: none;
  }

  .we-parent-corner:focus-visible {
    outline: none;
  }

  .we-parent-corner__chrome {
    width: 100%;
    height: 100%;
    border-radius: 2px;
    display: block;
    opacity: 0.82;
    transition: opacity 140ms ease, box-shadow 140ms ease;
  }

  /* Individual resize handle */
  .we-resize-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    border-radius: 2px;
    background: #ffffff;
    border: 1px solid ${WEB_EDITOR_V2_COLORS.selectionBorder};
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 0 2px rgba(0, 214, 143, 0.18),
      0 8px 20px rgba(0, 0, 0, 0.18);
    pointer-events: auto;
    touch-action: none;
    user-select: none;
    transition: background-color 0.1s ease, border-color 0.1s ease, transform 0.1s ease,
      box-shadow 0.1s ease;
  }

  .we-resize-handle:hover {
    background: #ffffff;
    border-color: ${WEB_EDITOR_V2_COLORS.selectionBorder};
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.98), 0 0 0 3px rgba(0, 214, 143, 0.22),
      0 10px 24px rgba(0, 0, 0, 0.2);
    transform: translate(-50%, -50%) scale(1.15);
  }

  .we-resize-handle:active {
    transform: translate(-50%, -50%) scale(1.0);
  }

  /* Handle positions - all use translate(-50%, -50%) as base */
  .we-resize-handle[data-dir="n"]  { left: 50%; top: 0; transform: translate(-50%, -50%); cursor: ns-resize; }
  .we-resize-handle[data-dir="s"]  { left: 50%; top: 100%; transform: translate(-50%, -50%); cursor: ns-resize; }
  .we-resize-handle[data-dir="e"]  { left: 100%; top: 50%; transform: translate(-50%, -50%); cursor: ew-resize; }
  .we-resize-handle[data-dir="w"]  { left: 0; top: 50%; transform: translate(-50%, -50%); cursor: ew-resize; }
  .we-resize-handle[data-dir="nw"] { left: 0; top: 0; transform: translate(-50%, -50%); cursor: nwse-resize; }
  .we-resize-handle[data-dir="ne"] { left: 100%; top: 0; transform: translate(-50%, -50%); cursor: nesw-resize; }
  .we-resize-handle[data-dir="sw"] { left: 0; top: 100%; transform: translate(-50%, -50%); cursor: nesw-resize; }
  .we-resize-handle[data-dir="se"] { left: 100%; top: 100%; transform: translate(-50%, -50%); cursor: nwse-resize; }

  /* Size HUD - shows W\xD7H while resizing */
  .we-size-hud {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translate(-50%, calc(-100% - 8px));
    padding: 3px 8px;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.98);
    background: rgba(18, 18, 18, 0.94);
    border: 1px solid rgba(0, 214, 143, 0.2);
    border-radius: 999px;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    box-shadow: var(--we-shadow-glow), 0 8px 20px rgba(0, 0, 0, 0.24);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }

  /* ==========================================================================
   * Performance HUD (Phase 5.3)
   * ========================================================================== */

  .we-perf-hud {
    position: fixed;
    left: 12px;
    bottom: 12px;
    padding: 8px 10px;
    border-radius: 16px;
    background: rgba(18, 18, 18, 0.86);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.96);
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 12px;
    line-height: 1.25;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
    z-index: 10;
    box-shadow: var(--we-shadow-panel);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    font-variant-numeric: tabular-nums;
  }

  .we-perf-hud-line + .we-perf-hud-line {
    margin-top: 4px;
  }

  /* UI container - for panels and controls */
  /* Position below toolbar: 16px (toolbar top) + 40px (toolbar height) + 8px (gap) = 64px */
  #${WEB_EDITOR_V2_UI_ID} {
    position: fixed;
    inset: 0;
    top: 32px;
    right: 16px;
    pointer-events: none;
    z-index: 10020;
    font-family: "Inter", "SF Pro Display", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 11px;
    line-height: 1.4;
    color: var(--we-text-primary);
    -webkit-font-smoothing: antialiased;
  }

  /* ==========================================================================
     Breadcrumbs (Phase 2.2) - Anchored to selection element
     ========================================================================== */
  .we-breadcrumbs {
    position: fixed;
    /* left/top set dynamically via JS based on selection rect */
    left: 16px;
    top: 72px;
    width: auto;
    max-width: min(600px, calc(100vw - 400px));
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    background: var(--we-surface-bg);
    border: 1px solid var(--we-border-subtle);
    border-radius: var(--we-radius-panel);
    box-shadow: var(--we-shadow-panel);
    pointer-events: auto;
    user-select: none;
    overflow-x: auto;
    white-space: nowrap;
    scrollbar-width: none;
    z-index: 5;
    color: var(--we-text-primary);
  }

  .we-breadcrumbs[data-hidden="true"] {
    display: none;
  }

  .we-breadcrumbs[data-position="bottom"] {
    top: auto;
    bottom: 72px;
  }

  .we-breadcrumbs::-webkit-scrollbar {
    display: none;
  }

  .we-crumb {
    display: inline-flex;
    align-items: center;
    max-width: 220px;
    padding: 4px 8px;
    border-radius: var(--we-radius-control);
    border: none;
    background: transparent;
    color: var(--we-text-secondary);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;
    cursor: pointer;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: all 0.15s ease;
  }

  .we-crumb-send-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: var(--we-radius-control);
    background: rgba(0, 143, 93, 0.1);
    color: #008F5D;
    cursor: pointer;
    transition: background 0.15s ease, transform 0.15s ease;
    flex: 0 0 auto;
  }

  .we-crumb-send-btn svg {
    width: 14px;
    height: 14px;
    display: block;
  }

  .we-crumb-send-btn:hover {
    background: rgba(0, 143, 93, 0.16);
    transform: translateY(-1px);
  }

  .we-crumb-send-btn:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--we-focus-ring);
  }

  .we-crumb:hover {
    background: rgba(0, 143, 93, 0.08);
    color: var(--we-text-primary);
  }

  .we-crumb:active {
    background: rgba(0, 143, 93, 0.12);
  }

  .we-crumb:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px var(--we-focus-ring);
  }

  .we-crumb--current {
    background: rgba(0, 143, 93, 0.1);
    color: #008F5D;
    font-weight: 600;
  }

  .we-crumb-sep {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    flex: 0 0 auto;
    color: var(--we-text-muted);
    font-size: 12px;
  }

  .we-crumb-sep--shadow {
    color: var(--we-text-secondary);
  }

  .we-change-markers {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9996;
  }

  .we-change-marker {
    position: fixed;
    transform: translate(-50%, -50%);
    width: 22px;
    height: 22px;
    border-radius: 999px;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
    box-shadow:
      0 8px 18px rgba(15, 23, 42, 0.22),
      0 0 0 2px rgba(255, 255, 255, 0.95);
    pointer-events: auto;
    cursor: pointer;
    transition: transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease;
  }

  .we-change-marker:hover,
  .we-change-marker:focus-visible {
    transform: translate(-50%, -50%) scale(1.06);
    box-shadow:
      0 10px 22px rgba(15, 23, 42, 0.28),
      0 0 0 2px rgba(255, 255, 255, 0.95),
      0 0 0 5px rgba(0, 143, 93, 0.18);
    outline: none;
  }

  .we-change-marker__tooltip {
    position: absolute;
    left: 50%;
    top: calc(100% + 8px);
    transform: translateX(-50%);
    width: min(280px, calc(100vw - 32px));
    max-width: min(280px, calc(100vw - 32px));
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.96);
    color: rgba(255, 255, 255, 0.92);
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.22);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
  }

  .we-change-marker:hover .we-change-marker__tooltip,
  .we-change-marker:focus-visible .we-change-marker__tooltip {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  .we-change-marker__details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 4px;
  }

  .we-change-marker__label {
    display: block;
    font-size: 10px;
    font-weight: 500;
    line-height: 1.35;
    color: rgba(255, 255, 255, 0.58);
  }

  .we-change-marker__note {
    display: block;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.96);
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ==========================================================================
   * Global Hidden Rule
   * Ensures [hidden] attribute always hides elements, even when they have
   * explicit display values (flex, inline-flex, etc.)
   * ========================================================================== */
  .${ANNOTATION_UI_PORTAL_CLASS},
  .${ANNOTATION_UI_PORTAL_CLASS} *,
  .${ANNOTATION_UI_PORTAL_CLASS}.ant-popover,
  .${ANNOTATION_UI_PORTAL_CLASS}.ant-popover * {
    pointer-events: auto;
  }

  [hidden] {
    display: none !important;
  }
`
);
function setImportantStyle(element, property, value) {
  element.style.setProperty(property, value, "important");
}
function mountShadowHost(_options = {}) {
  const disposer = new Disposer();
  let elements = null;
  const existing = document.getElementById(WEB_EDITOR_V2_HOST_ID);
  if (existing) {
    try {
      existing.remove();
    } catch {
    }
  }
  const host = document.createElement("div");
  host.id = WEB_EDITOR_V2_HOST_ID;
  host.setAttribute("data-mcp-web-editor", "v2");
  setImportantStyle(host, "position", "fixed");
  setImportantStyle(host, "inset", "0");
  setImportantStyle(host, "z-index", String(WEB_EDITOR_V2_Z_INDEX));
  setImportantStyle(host, "pointer-events", "none");
  setImportantStyle(host, "background", "transparent");
  if (isMobileDevice()) {
    setImportantStyle(host, "contain", "none");
  } else {
    setImportantStyle(host, "contain", "layout style paint");
    setImportantStyle(host, "isolation", "isolate");
  }
  const shadowRoot = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = SHADOW_HOST_STYLES;
  shadowRoot.append(styleEl);
  const overlayRoot = document.createElement("div");
  overlayRoot.id = WEB_EDITOR_V2_OVERLAY_ID;
  const uiRoot = document.createElement("div");
  uiRoot.id = WEB_EDITOR_V2_UI_ID;
  shadowRoot.append(overlayRoot, uiRoot);
  const mountPoint = document.documentElement ?? document.body;
  mountPoint.append(host);
  disposer.add(() => host.remove());
  elements = { host, shadowRoot, overlayRoot, uiRoot };
  const blockedEvents = [
    "pointerdown",
    "pointerup",
    "pointermove",
    "pointerenter",
    "pointerleave",
    "mousedown",
    "mouseup",
    "mousemove",
    "mouseenter",
    "mouseleave",
    "click",
    "dblclick",
    "contextmenu",
    "keydown",
    "keyup",
    "keypress",
    "wheel",
    "touchstart",
    "touchmove",
    "touchend",
    "touchcancel",
    "focus",
    "blur",
    "input",
    "change"
  ];
  const stopPropagation = (event) => {
    event.stopPropagation();
  };
  for (const eventType of blockedEvents) {
    disposer.listen(uiRoot, eventType, stopPropagation);
    disposer.listen(overlayRoot, eventType, stopPropagation);
  }
  const isOverlayElement = (node) => {
    if (!(node instanceof Node)) return false;
    if (node === host) return true;
    const root = typeof node.getRootNode === "function" ? node.getRootNode() : null;
    return root instanceof ShadowRoot && root.host === host;
  };
  const isMarkedUiElement = (node) => {
    if (!(node instanceof Element)) return false;
    return node.classList.contains(ANNOTATION_UI_PORTAL_CLASS) || Boolean(node.closest(`.${ANNOTATION_UI_PORTAL_CLASS}`));
  };
  const isEventFromUi = (event) => {
    try {
      if (typeof event.composedPath === "function") {
        return event.composedPath().some((el) => isOverlayElement(el) || isMarkedUiElement(el));
      }
    } catch {
    }
    return isOverlayElement(event.target) || isMarkedUiElement(event.target);
  };
  return {
    getElements: () => elements,
    isOverlayElement,
    isEventFromUi,
    dispose: () => {
      elements = null;
      disposer.dispose();
    }
  };
}

// src/core/position-tracker.ts
var PASSIVE_LISTENER = { passive: true };
var RECT_EPSILON = 0.5;
var SELECTION_MUTATION_OPTIONS = {
  childList: true,
  subtree: true
};
function getTraversalParent(node) {
  if (!node) return null;
  if (node.parentNode) return node.parentNode;
  if (node instanceof ShadowRoot) return node.host;
  return null;
}
function collectScrollTargets(element) {
  if (!element) return [window, document];
  const targets = /* @__PURE__ */ new Set();
  let current = element;
  while (current) {
    if (current instanceof Element || current instanceof ShadowRoot || current instanceof Document) {
      targets.add(current);
    }
    current = getTraversalParent(current);
  }
  targets.add(window);
  targets.add(document);
  return Array.from(targets);
}
function toViewportRect(domRect) {
  const { left, top, width, height } = domRect;
  if (!Number.isFinite(left) || !Number.isFinite(top) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }
  return {
    left,
    top,
    width: Math.max(0, width),
    height: Math.max(0, height)
  };
}
function approximatelyEqual(a, b) {
  return Math.abs(a - b) < RECT_EPSILON;
}
function rectApproximatelyEqual(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return approximatelyEqual(a.left, b.left) && approximatelyEqual(a.top, b.top) && approximatelyEqual(a.width, b.width) && approximatelyEqual(a.height, b.height);
}
function trackedRectsEqual(a, b) {
  return rectApproximatelyEqual(a.hover, b.hover) && rectApproximatelyEqual(a.selection, b.selection);
}
function createPositionTracker(options) {
  const { onPositionUpdate } = options;
  const disposer = new Disposer();
  let hoverElement = null;
  let selectionElement = null;
  let lastRects = { hover: null, selection: null };
  let rafId = null;
  function cancelRaf() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
  disposer.add(cancelRaf);
  function scheduleUpdate() {
    if (disposer.isDisposed) return;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      updateIfChanged();
    });
  }
  let selectionObservers = new Disposer();
  disposer.add(() => selectionObservers.dispose());
  function resetSelectionObservers() {
    selectionObservers.dispose();
    selectionObservers = new Disposer();
    const target = selectionElement;
    if (!target) return;
    selectionObservers.observeResize(target, () => {
      if (disposer.isDisposed) return;
      if (selectionElement !== target) return;
      scheduleUpdate();
    });
    const mutationCallback = () => {
      if (disposer.isDisposed) return;
      if (selectionElement !== target) return;
      scheduleUpdate();
    };
    const rootNode = target.getRootNode?.();
    if (rootNode instanceof ShadowRoot) {
      selectionObservers.observeMutation(rootNode, mutationCallback, SELECTION_MUTATION_OPTIONS);
    }
    const body = document.body ?? document.documentElement;
    if (body) {
      selectionObservers.observeMutation(body, mutationCallback, SELECTION_MUTATION_OPTIONS);
    }
    for (const scrollTarget of collectScrollTargets(target)) {
      selectionObservers.listen(scrollTarget, "scroll", mutationCallback, PASSIVE_LISTENER);
    }
  }
  function resolveConnected(element) {
    if (!element) return null;
    return element.isConnected ? element : null;
  }
  function readElementRect(element) {
    if (!element) return null;
    try {
      return toViewportRect(element.getBoundingClientRect());
    } catch {
      return null;
    }
  }
  function computeRects() {
    const resolvedHover = resolveConnected(hoverElement);
    const resolvedSelection = resolveConnected(selectionElement);
    if (hoverElement && !resolvedHover) {
      hoverElement = null;
    }
    if (selectionElement && !resolvedSelection) {
      selectionElement = null;
      resetSelectionObservers();
    }
    if (resolvedHover && resolvedSelection && resolvedHover === resolvedSelection) {
      const rect = readElementRect(resolvedHover);
      return { hover: rect, selection: rect };
    }
    return {
      hover: readElementRect(resolvedHover),
      selection: readElementRect(resolvedSelection)
    };
  }
  function updateIfChanged() {
    if (disposer.isDisposed) return;
    const nextRects = computeRects();
    if (trackedRectsEqual(nextRects, lastRects)) return;
    lastRects = nextRects;
    onPositionUpdate(nextRects);
  }
  function handleViewportChange() {
    if (!hoverElement && !selectionElement && !lastRects.hover && !lastRects.selection) {
      return;
    }
    scheduleUpdate();
  }
  disposer.listen(window, "scroll", handleViewportChange, PASSIVE_LISTENER);
  disposer.listen(document, "scroll", handleViewportChange, { ...PASSIVE_LISTENER, capture: true });
  disposer.listen(window, "resize", handleViewportChange, PASSIVE_LISTENER);
  function setHoverElement(element) {
    if (disposer.isDisposed) return;
    if (hoverElement === element) return;
    hoverElement = element;
    scheduleUpdate();
  }
  function setSelectionElement(element) {
    if (disposer.isDisposed) return;
    if (selectionElement === element) return;
    selectionElement = element;
    resetSelectionObservers();
    scheduleUpdate();
  }
  function forceUpdate(force) {
    if (disposer.isDisposed) return;
    cancelRaf();
    if (force) {
      const nextRects = computeRects();
      lastRects = nextRects;
      onPositionUpdate(nextRects);
      return;
    }
    updateIfChanged();
  }
  return {
    setHoverElement,
    setSelectionElement,
    forceUpdate,
    dispose: () => disposer.dispose()
  };
}

// src/ui/annotation-markers.ts
function normalizeColorToken(value) {
  return String(value || "").trim().toLowerCase();
}
function applyMarkerStyle(button, node) {
  Object.assign(button.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    border: "1.5px solid rgba(255, 255, 255, 0.92)",
    background: node.color || "#1890FF",
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 24px rgba(0, 0, 0, 0.22)",
    transform: "translate(-5px, -9px)",
    cursor: "pointer",
    pointerEvents: "auto",
    zIndex: "3",
    userSelect: "none",
    fontSize: "10px",
    fontWeight: "700",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#fff",
    lineHeight: "1",
    letterSpacing: "-0.3px"
  });
  button.textContent = String(node.index);
}
function createAnnotationMarkers(options) {
  const records = /* @__PURE__ */ new Map();
  const ensureRecord = (node) => {
    const existing = records.get(node.id);
    if (existing) {
      applyMarkerStyle(existing.button, node);
      existing.button.setAttribute("aria-label", `\u6807\u6CE8 ${node.index}`);
      return existing;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.annotationMarker = node.id;
    button.setAttribute("aria-label", `\u6807\u6CE8 ${node.index}`);
    applyMarkerStyle(button, node);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      options.onSelect(node.id);
    });
    options.container.append(button);
    const tracker = createPositionTracker({
      onPositionUpdate: (rects) => {
        const rect = rects.selection;
        if (!rect || rect.width <= 0 || rect.height <= 0) {
          button.style.display = "none";
          return;
        }
        button.style.display = "inline-flex";
        button.style.left = `${Math.round(rect.left)}px`;
        button.style.top = `${Math.round(rect.top)}px`;
      }
    });
    const record = { button, tracker };
    records.set(node.id, record);
    return record;
  };
  return {
    update(nodes, colorFilter = null) {
      const nextIds = new Set(nodes.map((node) => node.id));
      for (const node of nodes) {
        const record = ensureRecord(node);
        const visible = !colorFilter || normalizeColorToken(node.color) === normalizeColorToken(colorFilter);
        record.button.style.display = visible ? "inline-flex" : "none";
        record.button.style.pointerEvents = visible ? "auto" : "none";
        const target = options.resolveNodeElement(node);
        record.tracker.setSelectionElement(visible ? target : null);
        if (visible) {
          record.tracker.forceUpdate(true);
        }
      }
      for (const [id, record] of records.entries()) {
        if (nextIds.has(id)) continue;
        record.tracker.dispose();
        record.button.remove();
        records.delete(id);
      }
    },
    dispose() {
      for (const record of records.values()) {
        record.tracker.dispose();
        record.button.remove();
      }
      records.clear();
    }
  };
}

// src/ui/runtime/annotation-shell.tsx
import React21 from "react";
import { Drawer, FloatButton, Popover, Segmented, Space, Switch as Switch3 } from "antd";
import { CheckOutlined, SettingOutlined } from "@ant-design/icons";
import { SimpleEditor } from "tiptap-editor";

// src/constants/colors.ts
var ANNOTATION_COLORS = [
  { label: "\u7D2B\u8272", value: "#7B68EE" },
  { label: "\u84DD\u8272", value: "#1890FF" },
  { label: "\u9752\u8272", value: "#00CED1" },
  { label: "\u7EFF\u8272", value: "#00C853" },
  { label: "\u9EC4\u8272", value: "#FFD700" },
  { label: "\u6A59\u8272", value: "#FF8C00" },
  { label: "\u7EA2\u8272", value: "#FF4757" }
];
var DEFAULT_ANNOTATION_COLOR = "#1890FF";

// src/ui/floating-drag.ts
var WINDOW_CAPTURE = { capture: true, passive: false };
var SETTLE_DISTANCE_FACTOR = 0.12;
var DEFAULT_SETTLE_DURATION_MS = 220;
var HANDLE_POINTER_DOWN_CAPTURE = { capture: true };
var INTERACTIVE_DESCENDANT_SELECTOR = [
  "button",
  "input",
  "textarea",
  "select",
  "option",
  "label",
  "a[href]",
  '[role="button"]',
  '[role="switch"]',
  '[role="menuitem"]',
  '[data-we-no-drag="true"]',
  ".ant-btn",
  ".ant-switch",
  ".ant-select",
  ".ant-input",
  ".ant-input-affix-wrapper"
].join(", ");
function blockEvent(event) {
  if (event.cancelable) {
    event.preventDefault();
  }
  event.stopImmediatePropagation();
  event.stopPropagation();
}
function clampNumber(value, min, max) {
  if (!Number.isFinite(value)) return min;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.min(hi, Math.max(lo, value));
}
function clampPosition(position, size, clampMargin, viewport) {
  const margin = Number.isFinite(clampMargin) ? Math.max(0, clampMargin) : 0;
  const maxLeft = Math.max(margin, viewport.width - margin - size.width);
  const maxTop = Math.max(margin, viewport.height - margin - size.height);
  return {
    left: clampNumber(position.left, margin, maxLeft),
    top: clampNumber(position.top, margin, maxTop)
  };
}
function roundPosition(position) {
  return {
    left: Math.round(position.left),
    top: Math.round(position.top)
  };
}
function easeOutCubic2(progress) {
  const clamped = clampNumber(progress, 0, 1);
  return 1 - (1 - clamped) ** 3;
}
function positionsEqual(a, b) {
  return Math.round(a.left) === Math.round(b.left) && Math.round(a.top) === Math.round(b.top);
}
function shouldIgnoreInteractiveTarget(eventTarget, handleEl, enabled) {
  if (!enabled || !(eventTarget instanceof Element) || eventTarget === handleEl) {
    return false;
  }
  const interactiveAncestor = eventTarget.closest(INTERACTIVE_DESCENDANT_SELECTOR);
  if (!interactiveAncestor) return false;
  if (typeof handleEl.contains === "function") {
    return handleEl.contains(interactiveAncestor);
  }
  return true;
}
function installFloatingDrag(options) {
  const { handleEl, targetEl, onPositionChange, clampMargin } = options;
  const moveThresholdPx = Math.max(0, options.moveThresholdPx ?? 3);
  const moveThresholdSq = moveThresholdPx * moveThresholdPx;
  const settleDurationMs = Math.max(80, options.settleDurationMs ?? DEFAULT_SETTLE_DURATION_MS);
  let session = null;
  let disposed = false;
  let cursorSnapshot = null;
  let emittedPosition = null;
  let dragState = false;
  function emitDragState(active) {
    if (dragState === active) return;
    dragState = active;
    options.onDragStateChange?.(active);
  }
  function emitDragMetrics(metrics) {
    options.onDragMetricsChange?.(metrics);
  }
  function setGlobalDraggingCursor(enabled) {
    const rootEl = document.documentElement;
    const bodyEl = document.body;
    if (enabled) {
      if (!cursorSnapshot) {
        cursorSnapshot = {
          documentCursor: rootEl.style.cursor,
          bodyCursor: bodyEl.style.cursor
        };
      }
      rootEl.style.cursor = "grabbing";
      bodyEl.style.cursor = "grabbing";
      return;
    }
    if (!cursorSnapshot) return;
    rootEl.style.cursor = cursorSnapshot.documentCursor;
    bodyEl.style.cursor = cursorSnapshot.bodyCursor;
    cursorSnapshot = null;
  }
  function teardownWindowListeners() {
    window.removeEventListener("pointermove", onWindowPointerMove, WINDOW_CAPTURE);
    window.removeEventListener("pointerup", onWindowPointerUp, WINDOW_CAPTURE);
    window.removeEventListener("pointercancel", onWindowPointerCancel, WINDOW_CAPTURE);
    window.removeEventListener("keydown", onWindowKeyDown, WINDOW_CAPTURE);
    window.removeEventListener("blur", onWindowBlur, WINDOW_CAPTURE);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  }
  function cancelAnimationLoop() {
    if (!session || session.rafId === null) return;
    window.cancelAnimationFrame(session.rafId);
    session.rafId = null;
  }
  function cleanupCapture(pointerId) {
    try {
      handleEl.releasePointerCapture(pointerId);
    } catch {
    }
  }
  function getViewportSize() {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  function getTargetSize(currentSession) {
    return {
      width: currentSession.targetWidth,
      height: currentSession.targetHeight
    };
  }
  function clampSessionPosition(currentSession, position) {
    return clampPosition(position, getTargetSize(currentSession), clampMargin, getViewportSize());
  }
  function emitPosition(position) {
    const rounded = roundPosition(position);
    if (emittedPosition && positionsEqual(emittedPosition, rounded)) return;
    emittedPosition = rounded;
    onPositionChange(rounded);
  }
  function finishSession(resetMetrics = true) {
    if (!session) return;
    cancelAnimationLoop();
    teardownWindowListeners();
    cleanupCapture(session.pointerId);
    handleEl.dataset.dragging = "false";
    setGlobalDraggingCursor(false);
    emitDragState(false);
    if (resetMetrics) {
      emitDragMetrics({ velocityX: 0, velocityY: 0 });
    }
    session = null;
  }
  function ensureAnimationLoop() {
    if (!session || session.rafId !== null) return;
    session.rafId = window.requestAnimationFrame(onAnimationFrame);
  }
  function applyCurrentPointerPosition(clientX, clientY) {
    const currentSession = session;
    if (!currentSession) return;
    currentSession.targetPosition = clampSessionPosition(currentSession, {
      left: clientX - currentSession.offsetX,
      top: clientY - currentSession.offsetY
    });
    ensureAnimationLoop();
  }
  function startSettling(currentSession) {
    currentSession.phase = "settling";
    currentSession.settleStartedAt = performance.now();
    currentSession.settleFrom = { ...currentSession.currentPosition };
    currentSession.settleTo = clampSessionPosition(currentSession, {
      left: currentSession.currentPosition.left + currentSession.velocityX * SETTLE_DISTANCE_FACTOR,
      top: currentSession.currentPosition.top + currentSession.velocityY * SETTLE_DISTANCE_FACTOR
    });
    if (positionsEqual(currentSession.settleFrom, currentSession.settleTo)) {
      emitPosition(currentSession.settleTo);
      finishSession();
      return;
    }
    ensureAnimationLoop();
  }
  function cancelDrag() {
    const currentSession = session;
    if (!currentSession) return;
    cancelAnimationLoop();
    emitPosition(currentSession.startPosition);
    finishSession();
  }
  function suppressClickOnce() {
    const onClick = (event) => {
      blockEvent(event);
    };
    handleEl.addEventListener("click", onClick, { capture: true, once: true });
    window.setTimeout(() => {
      handleEl.removeEventListener("click", onClick, { capture: true });
    }, 300);
  }
  function activateDrag(pointerId) {
    const currentSession = session;
    if (!currentSession || currentSession.pointerId !== pointerId || currentSession.activated) return;
    currentSession.activated = true;
    currentSession.phase = "dragging";
    handleEl.dataset.dragging = "true";
    emitDragState(true);
    setGlobalDraggingCursor(true);
    try {
      handleEl.setPointerCapture(pointerId);
    } catch {
    }
    ensureAnimationLoop();
  }
  function onAnimationFrame(timestamp) {
    const currentSession = session;
    if (!currentSession) return;
    currentSession.rafId = null;
    if (currentSession.phase === "dragging") {
      currentSession.currentPosition = { ...currentSession.targetPosition };
      emitPosition(currentSession.currentPosition);
      return;
    }
    if (currentSession.phase === "settling" && currentSession.settleStartedAt !== null && currentSession.settleFrom && currentSession.settleTo) {
      const progress = (timestamp - currentSession.settleStartedAt) / settleDurationMs;
      const eased = easeOutCubic2(progress);
      currentSession.currentPosition = {
        left: currentSession.settleFrom.left + (currentSession.settleTo.left - currentSession.settleFrom.left) * eased,
        top: currentSession.settleFrom.top + (currentSession.settleTo.top - currentSession.settleFrom.top) * eased
      };
      emitPosition(currentSession.currentPosition);
      if (progress < 1) {
        ensureAnimationLoop();
      } else {
        emitPosition(currentSession.settleTo);
        finishSession();
      }
    }
  }
  function onWindowPointerMove(event) {
    const currentSession = session;
    if (!currentSession || event.pointerId !== currentSession.pointerId) return;
    if (!currentSession.activated) {
      const dx = event.clientX - currentSession.startClientX;
      const dy = event.clientY - currentSession.startClientY;
      if (dx * dx + dy * dy < moveThresholdSq) return;
      activateDrag(event.pointerId);
    }
    if (!currentSession.activated) return;
    blockEvent(event);
    const now = performance.now();
    const elapsed = Math.max(8, now - currentSession.lastMoveTime);
    const instantVelocityX = (event.clientX - currentSession.lastClientX) / elapsed * 1e3;
    const instantVelocityY = (event.clientY - currentSession.lastClientY) / elapsed * 1e3;
    currentSession.velocityX = currentSession.velocityX * 0.65 + instantVelocityX * 0.35;
    currentSession.velocityY = currentSession.velocityY * 0.65 + instantVelocityY * 0.35;
    currentSession.lastClientX = event.clientX;
    currentSession.lastClientY = event.clientY;
    currentSession.lastMoveTime = now;
    emitDragMetrics({
      velocityX: currentSession.velocityX,
      velocityY: currentSession.velocityY
    });
    applyCurrentPointerPosition(event.clientX, event.clientY);
  }
  function onWindowPointerUp(event) {
    const currentSession = session;
    if (!currentSession || event.pointerId !== currentSession.pointerId) return;
    if (!currentSession.activated) {
      finishSession();
      return;
    }
    blockEvent(event);
    suppressClickOnce();
    teardownWindowListeners();
    cleanupCapture(event.pointerId);
    handleEl.dataset.dragging = "false";
    setGlobalDraggingCursor(false);
    emitDragState(false);
    startSettling(currentSession);
  }
  function onWindowPointerCancel(event) {
    const currentSession = session;
    if (!currentSession || event.pointerId !== currentSession.pointerId) return;
    if (currentSession.activated) {
      blockEvent(event);
      cancelDrag();
    } else {
      finishSession();
    }
  }
  function onWindowKeyDown(event) {
    if (event.key !== "Escape" || !session) return;
    if (session.activated) {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      cancelDrag();
    } else {
      finishSession();
    }
  }
  function onWindowBlur() {
    if (!session) return;
    if (session.activated) {
      cancelDrag();
    } else {
      finishSession();
    }
  }
  function onVisibilityChange() {
    if (!session || document.visibilityState !== "hidden") return;
    if (session.activated) {
      cancelDrag();
    } else {
      finishSession();
    }
  }
  function onHandlePointerDown(event) {
    if (disposed || !targetEl.isConnected || session) return;
    if (event.button !== 0 || !event.isPrimary) return;
    if (shouldIgnoreInteractiveTarget(event.target, handleEl, Boolean(options.ignoreInteractiveChildren))) {
      return;
    }
    const rect = targetEl.getBoundingClientRect();
    const startPosition = roundPosition({ left: rect.left, top: rect.top });
    const now = performance.now();
    session = {
      pointerId: event.pointerId,
      startPosition,
      currentPosition: startPosition,
      targetPosition: startPosition,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      targetWidth: rect.width,
      targetHeight: rect.height,
      startClientX: event.clientX,
      startClientY: event.clientY,
      lastClientX: event.clientX,
      lastClientY: event.clientY,
      lastMoveTime: now,
      velocityX: 0,
      velocityY: 0,
      activated: false,
      phase: moveThresholdSq > 0 ? "pending" : "dragging",
      rafId: null,
      settleStartedAt: null,
      settleFrom: null,
      settleTo: null
    };
    emitDragMetrics({ velocityX: 0, velocityY: 0 });
    handleEl.dataset.dragging = "false";
    if (moveThresholdSq === 0) {
      activateDrag(event.pointerId);
    }
    window.addEventListener("pointermove", onWindowPointerMove, WINDOW_CAPTURE);
    window.addEventListener("pointerup", onWindowPointerUp, WINDOW_CAPTURE);
    window.addEventListener("pointercancel", onWindowPointerCancel, WINDOW_CAPTURE);
    window.addEventListener("keydown", onWindowKeyDown, WINDOW_CAPTURE);
    window.addEventListener("blur", onWindowBlur, WINDOW_CAPTURE);
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  handleEl.dataset.dragging = "false";
  handleEl.addEventListener("pointerdown", onHandlePointerDown, HANDLE_POINTER_DOWN_CAPTURE);
  return () => {
    disposed = true;
    handleEl.removeEventListener("pointerdown", onHandlePointerDown, HANDLE_POINTER_DOWN_CAPTURE);
    finishSession();
  };
}

// src/ui/prompt-card-position.ts
function getVisualViewportHeight() {
  if (typeof window !== "undefined" && window.visualViewport && Number.isFinite(window.visualViewport.height)) {
    return window.visualViewport.height;
  }
  return typeof window !== "undefined" ? window.innerHeight : 0;
}
function computePromptCardPosition(options) {
  const {
    anchorRect,
    cardWidth,
    cardHeight,
    viewportWidth,
    viewportHeight,
    propertyPanelEnabled,
    safePaddingPx = 12,
    propertyPanelWidth = 268,
    propertyPanelRight = 16,
    anchorGapPx = 12
  } = options;
  if (isMobileDevice()) {
    const visualHeight = getVisualViewportHeight();
    const mobileCardPadding = 8;
    const left2 = mobileCardPadding;
    const top2 = Math.max(
      mobileCardPadding,
      visualHeight - cardHeight - mobileCardPadding
    );
    return { left: Math.round(left2), top: Math.round(top2) };
  }
  const safeRightX = propertyPanelEnabled ? viewportWidth - (propertyPanelWidth + propertyPanelRight + safePaddingPx) : viewportWidth - safePaddingPx;
  const maxLeft = Math.min(viewportWidth - safePaddingPx - cardWidth, safeRightX - cardWidth);
  const anchorCenterX = anchorRect.left + anchorRect.width / 2;
  const left = Math.min(maxLeft, Math.max(safePaddingPx, anchorCenterX - cardWidth / 2));
  const belowTop = anchorRect.top + anchorRect.height + anchorGapPx;
  const aboveTop = anchorRect.top - anchorGapPx - cardHeight;
  const spaceBelow = viewportHeight - belowTop - safePaddingPx;
  const preferredTop = spaceBelow < cardHeight && aboveTop >= safePaddingPx ? aboveTop : belowTop;
  const top = Math.min(
    viewportHeight - safePaddingPx - cardHeight,
    Math.max(safePaddingPx, preferredTop)
  );
  return { left: Math.round(left), top: Math.round(top) };
}

// src/ui/runtime/theme.ts
var PROPERTY_PANEL_WIDTH = 268;
var PROPERTY_PANEL_RADIUS = 20;
var PROPERTY_PANEL_TOP = 24;
var PROPERTY_PANEL_RIGHT = 16;
var PROMPT_CARD_WIDTH = 380;
var POPUP_LAYER_Z_INDEX = 10040;
var WEB_EDITOR_POPUP_ROOT_ATTR = "data-we-popup-root";
var ACTION_ICON_SIZE = 15;
var ACTION_ICON_STROKE = 1.8;
var ACTION_BUTTON_SIZE = 28;
var BRAND_PRIMARY = "#008F5D";
var BRAND_PRIMARY_HOVER = "#00A36A";
var BRAND_PRIMARY_ACTIVE = "#007A4F";
var BRAND_PRIMARY_SOFT = "rgba(0, 143, 93, 0.16)";
var BRAND_PRIMARY_RING = "rgba(0, 143, 93, 0.28)";
var BRAND_ACCENT = "#00D68F";
var SLEEPING_ICON = "#A1A1AA";
var SLEEPING_ICON_STRONG = "#71717A";
var LIGHT_EDITOR_CHROME = {
  accent: BRAND_PRIMARY,
  accentBright: BRAND_ACCENT,
  accentHover: BRAND_PRIMARY_HOVER,
  accentActive: BRAND_PRIMARY_ACTIVE,
  accentSoft: BRAND_PRIMARY_SOFT,
  accentRing: BRAND_PRIMARY_RING,
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceMuted: "#FAFAFA",
  surfaceInteractive: "#F4F4F5",
  surfaceOverlay: "rgba(255, 255, 255, 0.96)",
  border: "rgba(39, 39, 42, 0.10)",
  borderStrong: "rgba(39, 39, 42, 0.16)",
  divider: "rgba(228, 228, 231, 0.95)",
  textPrimary: "#18181B",
  textSecondary: "#3F3F46",
  textMuted: "#A1A1AA",
  textSleeping: "#A1A1AA",
  textSleepingStrong: "#71717A",
  textDanger: "#DC2626",
  hoverSubtle: "rgba(244, 244, 245, 1)",
  hoverGhost: "rgba(15, 23, 42, 0.035)",
  toolbarShellBorder: "rgba(228, 228, 231, 0.80)",
  toolbarShellInset: "inset 0 1px 0 rgba(255, 255, 255, 0.88)",
  toolbarGlow: "0 0 20px -5px rgba(0, 143, 93, 0.20)",
  shadow: "0 24px 60px rgba(15, 23, 42, 0.14), 0 8px 24px rgba(15, 23, 42, 0.08)",
  shadowCompact: "0 18px 38px rgba(15, 23, 42, 0.14), 0 6px 16px rgba(15, 23, 42, 0.08)",
  overlayCloseBackground: "rgba(255, 255, 255, 0.94)"
};
var DARK_EDITOR_CHROME = {
  accent: BRAND_PRIMARY,
  accentBright: BRAND_ACCENT,
  accentHover: BRAND_PRIMARY_HOVER,
  accentActive: BRAND_PRIMARY_ACTIVE,
  accentSoft: BRAND_PRIMARY_SOFT,
  accentRing: BRAND_PRIMARY_RING,
  surface: "#121212",
  surfaceElevated: "#161616",
  surfaceMuted: "#18181B",
  surfaceInteractive: "#27272A",
  surfaceOverlay: "rgba(18, 18, 18, 0.96)",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(255, 255, 255, 0.12)",
  divider: "rgba(39, 39, 42, 0.95)",
  textPrimary: "rgba(255, 255, 255, 0.94)",
  textSecondary: "#D4D4D8",
  textMuted: "#A1A1AA",
  textSleeping: SLEEPING_ICON,
  textSleepingStrong: SLEEPING_ICON_STRONG,
  textDanger: "#ff7875",
  hoverSubtle: "rgba(39, 39, 42, 0.80)",
  hoverGhost: "rgba(255, 255, 255, 0.04)",
  toolbarShellBorder: "rgba(39, 39, 42, 0.82)",
  toolbarShellInset: "inset 0 1px 0 rgba(255, 255, 255, 0.02)",
  toolbarGlow: "0 0 20px -5px rgba(0, 143, 93, 0.15)",
  shadow: "0 18px 48px rgba(0, 0, 0, 0.42), 0 4px 18px rgba(0, 0, 0, 0.28)",
  shadowCompact: "0 16px 32px rgba(0, 0, 0, 0.36), 0 4px 14px rgba(0, 0, 0, 0.22)",
  overlayCloseBackground: "rgba(18, 18, 18, 0.92)"
};
function cssVar(name) {
  return `var(${name})`;
}
var EDITOR_CHROME = {
  accent: cssVar("--we-editor-accent"),
  accentBright: cssVar("--we-editor-accent-bright"),
  accentHover: cssVar("--we-editor-accent-hover"),
  accentActive: cssVar("--we-editor-accent-active"),
  accentSoft: cssVar("--we-editor-accent-soft"),
  accentRing: cssVar("--we-editor-accent-ring"),
  surface: cssVar("--we-editor-surface"),
  surfaceElevated: cssVar("--we-editor-surface-elevated"),
  surfaceMuted: cssVar("--we-editor-surface-muted"),
  surfaceInteractive: cssVar("--we-editor-surface-interactive"),
  surfaceOverlay: cssVar("--we-editor-surface-overlay"),
  border: cssVar("--we-editor-border"),
  borderStrong: cssVar("--we-editor-border-strong"),
  divider: cssVar("--we-editor-divider"),
  textPrimary: cssVar("--we-editor-text-primary"),
  textSecondary: cssVar("--we-editor-text-secondary"),
  textMuted: cssVar("--we-editor-text-muted"),
  textSleeping: cssVar("--we-editor-text-sleeping"),
  textSleepingStrong: cssVar("--we-editor-text-sleeping-strong"),
  textDanger: cssVar("--we-editor-text-danger"),
  hoverSubtle: cssVar("--we-editor-hover-subtle"),
  hoverGhost: cssVar("--we-editor-hover-ghost"),
  toolbarShellBorder: cssVar("--we-editor-toolbar-shell-border"),
  toolbarShellInset: cssVar("--we-editor-toolbar-shell-inset"),
  toolbarGlow: cssVar("--we-editor-toolbar-glow"),
  shadow: cssVar("--we-editor-shadow"),
  shadowCompact: cssVar("--we-editor-shadow-compact"),
  overlayCloseBackground: cssVar("--we-editor-overlay-close-background")
};
function getEditorChromeValues(mode) {
  return mode === "dark" ? DARK_EDITOR_CHROME : LIGHT_EDITOR_CHROME;
}
function createEditorChromeCssVars(mode) {
  const chrome = getEditorChromeValues(mode);
  return {
    ["--we-editor-accent"]: chrome.accent,
    ["--we-editor-accent-bright"]: chrome.accentBright,
    ["--we-editor-accent-hover"]: chrome.accentHover,
    ["--we-editor-accent-active"]: chrome.accentActive,
    ["--we-editor-accent-soft"]: chrome.accentSoft,
    ["--we-editor-accent-ring"]: chrome.accentRing,
    ["--we-editor-surface"]: chrome.surface,
    ["--we-editor-surface-elevated"]: chrome.surfaceElevated,
    ["--we-editor-surface-muted"]: chrome.surfaceMuted,
    ["--we-editor-surface-interactive"]: chrome.surfaceInteractive,
    ["--we-editor-surface-overlay"]: chrome.surfaceOverlay,
    ["--we-editor-border"]: chrome.border,
    ["--we-editor-border-strong"]: chrome.borderStrong,
    ["--we-editor-divider"]: chrome.divider,
    ["--we-editor-text-primary"]: chrome.textPrimary,
    ["--we-editor-text-secondary"]: chrome.textSecondary,
    ["--we-editor-text-muted"]: chrome.textMuted,
    ["--we-editor-text-sleeping"]: chrome.textSleeping,
    ["--we-editor-text-sleeping-strong"]: chrome.textSleepingStrong,
    ["--we-editor-text-danger"]: chrome.textDanger,
    ["--we-editor-hover-subtle"]: chrome.hoverSubtle,
    ["--we-editor-hover-ghost"]: chrome.hoverGhost,
    ["--we-editor-toolbar-shell-border"]: chrome.toolbarShellBorder,
    ["--we-editor-toolbar-shell-inset"]: chrome.toolbarShellInset,
    ["--we-editor-toolbar-glow"]: chrome.toolbarGlow,
    ["--we-editor-shadow"]: chrome.shadow,
    ["--we-editor-shadow-compact"]: chrome.shadowCompact,
    ["--we-editor-overlay-close-background"]: chrome.overlayCloseBackground
  };
}
function createRuntimeAntdTheme(mode) {
  const chrome = getEditorChromeValues(mode);
  return {
    token: {
      colorPrimary: chrome.accent,
      colorInfo: chrome.accent,
      colorSuccess: chrome.accent,
      colorLink: chrome.accent,
      colorPrimaryHover: chrome.accentHover,
      colorPrimaryActive: chrome.accentActive,
      colorPrimaryBorder: chrome.accent,
      colorPrimaryBorderHover: chrome.accentHover,
      colorPrimaryBg: chrome.accentSoft,
      colorPrimaryBgHover: "rgba(0, 143, 93, 0.22)",
      borderRadius: 8,
      fontSize: 11,
      fontSizeSM: 11,
      colorBgBase: chrome.surface,
      colorBgContainer: chrome.surfaceElevated,
      colorBgElevated: chrome.surfaceElevated,
      colorFill: mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(15, 23, 42, 0.06)",
      colorFillSecondary: chrome.surfaceMuted,
      colorFillTertiary: chrome.surfaceInteractive,
      colorText: chrome.textPrimary,
      colorTextSecondary: chrome.textSecondary,
      colorTextTertiary: chrome.textMuted,
      colorBorder: chrome.border,
      colorBorderSecondary: chrome.borderStrong,
      colorTextPlaceholder: chrome.textMuted,
      colorSplit: chrome.border,
      boxShadowSecondary: chrome.shadow,
      colorIcon: chrome.textSecondary,
      colorIconHover: chrome.textPrimary,
      controlOutline: chrome.accentSoft,
      controlOutlineWidth: 2,
      controlHeight: 32,
      controlHeightSM: 28
    },
    components: {
      Button: {
        borderRadius: 12,
        paddingInlineSM: 8,
        controlHeightSM: 28,
        defaultShadow: "none",
        primaryShadow: "none",
        dangerShadow: "none",
        textTextColor: chrome.textPrimary,
        textHoverBg: chrome.hoverSubtle,
        defaultBg: chrome.surfaceMuted,
        defaultColor: chrome.textPrimary,
        defaultBorderColor: chrome.border,
        defaultHoverBg: chrome.surfaceInteractive,
        defaultHoverColor: chrome.textPrimary,
        defaultHoverBorderColor: chrome.borderStrong
      },
      Collapse: {
        contentBg: "transparent",
        headerBg: "transparent",
        borderlessContentBg: "transparent",
        contentPadding: "0 0 8px",
        borderlessContentPadding: "0 0 8px"
      },
      Input: {
        colorBgContainer: chrome.surfaceMuted,
        activeBg: chrome.surfaceInteractive,
        hoverBg: chrome.surfaceInteractive,
        activeBorderColor: chrome.accent,
        hoverBorderColor: chrome.borderStrong,
        activeShadow: `0 0 0 2px ${chrome.accentSoft}`
      },
      InputNumber: {
        colorBgContainer: chrome.surfaceMuted,
        activeBg: chrome.surfaceInteractive,
        hoverBg: chrome.surfaceInteractive,
        activeBorderColor: chrome.accent,
        hoverBorderColor: chrome.borderStrong,
        activeShadow: `0 0 0 2px ${chrome.accentSoft}`
      },
      Select: {
        optionSelectedBg: chrome.accentSoft,
        optionActiveBg: chrome.hoverSubtle,
        selectorBg: chrome.surfaceMuted,
        activeBorderColor: chrome.accent,
        hoverBorderColor: chrome.borderStrong
      },
      Segmented: {
        trackBg: chrome.surfaceMuted,
        itemSelectedBg: chrome.surfaceInteractive,
        itemSelectedColor: chrome.textPrimary
      },
      Slider: {
        colorPrimary: chrome.accent,
        handleSize: 8,
        railBg: mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(15, 23, 42, 0.12)",
        railHoverBg: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(15, 23, 42, 0.18)",
        trackBg: chrome.accent,
        trackHoverBg: chrome.accentHover
      },
      ColorPicker: {
        colorPrimary: chrome.accent
      },
      Dropdown: {
        colorBgElevated: chrome.surfaceElevated,
        colorText: chrome.textPrimary,
        colorTextDescription: chrome.textSecondary,
        controlItemBgHover: chrome.hoverSubtle,
        controlItemBgActive: chrome.accentSoft,
        borderRadiusLG: 16
      },
      Modal: {
        contentBg: chrome.surfaceElevated,
        headerBg: chrome.surfaceElevated,
        titleColor: chrome.textPrimary,
        titleFontSize: 14,
        borderRadiusLG: 18
      },
      Tooltip: {
        colorBgSpotlight: mode === "dark" ? "#050608" : "#0F172A",
        colorTextLightSolid: "#FFFFFF"
      },
      Popover: {
        colorBgElevated: chrome.surfaceElevated,
        colorText: chrome.textPrimary
      }
    }
  };
}

// src/ui/runtime/styles.ts
var panelStyle = {
  position: "absolute",
  zIndex: 10008,
  top: PROPERTY_PANEL_TOP,
  right: PROPERTY_PANEL_RIGHT,
  width: PROPERTY_PANEL_WIDTH,
  maxWidth: "calc(100vw - 32px)",
  display: "flex",
  flexDirection: "column",
  borderRadius: PROPERTY_PANEL_RADIUS,
  background: EDITOR_CHROME.surface,
  border: `1px solid ${EDITOR_CHROME.border}`,
  boxShadow: EDITOR_CHROME.shadow,
  pointerEvents: "auto",
  overflow: "hidden"
};
var PROPERTY_PANEL_LOCAL_STYLES = `
  @keyframes we-runtime-genie-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes we-runtime-genie-task-scan {
    0% {
      top: calc(-1 * var(--we-runtime-genie-task-scan-size, 88px));
      opacity: 0;
    }
    12% {
      opacity: 1;
    }
    100% {
      top: 100%;
      opacity: 0;
    }
  }

  .we-runtime-prop-panel__body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: ${EDITOR_CHROME.textPrimary};
  }

  .we-runtime-prop-panel__collapse.ant-collapse {
    background: transparent;
  }

  .we-runtime-prop-panel__collapse.ant-collapse > .ant-collapse-item {
    border-bottom: 1px solid ${EDITOR_CHROME.divider};
  }

  .we-runtime-prop-panel__collapse.ant-collapse > .ant-collapse-item:last-child {
    border-bottom: 0;
  }

  .we-runtime-prop-panel__collapse.ant-collapse
    > .ant-collapse-item
    > .ant-collapse-header
  {
    padding: 10px 0 8px;
    align-items: center;
  }

  .we-runtime-prop-panel__collapse.ant-collapse
    > .ant-collapse-item
    > .ant-collapse-header
    .ant-collapse-expand-icon {
    color: ${EDITOR_CHROME.textMuted};
  }

  .we-runtime-prop-panel__collapse.ant-collapse
    > .ant-collapse-item
    > .ant-collapse-header
    .ant-collapse-header-text {
    font-size: 12px;
    font-weight: 600;
    color: ${EDITOR_CHROME.textPrimary};
  }

  .we-runtime-prop-panel__collapse.ant-collapse > .ant-collapse-item > .ant-collapse-content {
    background: transparent;
    border-top: 0;
  }

  .we-runtime-prop-panel__body .ant-input,
  .we-runtime-prop-panel__body .ant-input-affix-wrapper,
  .we-runtime-prop-panel__body .ant-input-number,
  .we-runtime-prop-panel__body .ant-select-selector {
    background: ${EDITOR_CHROME.surfaceMuted};
    border-color: ${EDITOR_CHROME.border};
    box-shadow: none;
  }

  .we-runtime-prop-panel__body .ant-input:hover,
  .we-runtime-prop-panel__body .ant-input-number:hover,
  .we-runtime-prop-panel__body .ant-select:hover .ant-select-selector {
    border-color: ${EDITOR_CHROME.borderStrong};
    background: ${EDITOR_CHROME.surfaceInteractive};
  }

  .we-runtime-prop-panel__body .ant-input:focus,
  .we-runtime-prop-panel__body .ant-input-focused,
  .we-runtime-prop-panel__body .ant-input-number-focused,
  .we-runtime-prop-panel__body .ant-select-focused .ant-select-selector {
    background: ${EDITOR_CHROME.surfaceInteractive};
  }

  .we-runtime-prop-panel__body .ant-segmented {
    background: ${EDITOR_CHROME.surfaceMuted};
    padding: 2px;
    border-radius: 10px;
  }

  .we-runtime-prop-panel__body .ant-segmented-item {
    min-height: 28px;
    display: flex;
    align-items: stretch;
    justify-content: center;
  }

  .we-runtime-prop-panel__body .ant-segmented-item-selected {
    box-shadow: inset 0 0 0 1px ${EDITOR_CHROME.borderStrong};
    border-radius: 8px;
  }

  .we-runtime-prop-panel__body .ant-segmented-item-label {
    width: 100%;
    min-height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1.2;
    text-align: center;
  }

  .we-runtime-prop-panel__body .ant-slider {
    margin-block: 4px;
  }

  .we-runtime-prop-panel__body .ant-btn.ant-btn-text {
    padding-inline: 6px;
    color: ${EDITOR_CHROME.textSecondary};
  }

  .we-runtime-prop-panel__body .ant-btn.ant-btn-text:hover {
    color: ${EDITOR_CHROME.textPrimary};
    background: ${EDITOR_CHROME.hoverGhost};
  }

  .we-runtime-prop-panel__body .ant-empty-description {
    color: ${EDITOR_CHROME.textSecondary};
  }

  .we-runtime-prop-panel__body .ant-color-picker-trigger {
    align-items: center;
  }

  .we-runtime-prop-panel__body .we-runtime-prop-panel__unit-input {
    width: 100%;
  }

  .we-runtime-prop-panel__body .we-runtime-prop-panel__unit-input-amount {
    text-align: left;
    font-variant-numeric: tabular-nums;
  }

  .we-runtime-prop-panel__body .we-runtime-prop-panel__unit-input .ant-select.ant-select-sm,
  .we-runtime-prop-panel__body .we-runtime-prop-panel__unit-input .ant-input.ant-input-sm {
    min-width: 0;
  }

  .we-runtime-prop-panel__unit-select-popup {
    min-width: 76px !important;
  }

  .we-runtime-prop-panel__unit-select-popup .ant-select-item-option-content,
  .we-runtime-prop-panel__unit-select-popup .ant-select-item {
    white-space: nowrap;
  }

  .we-runtime-prop-panel__body .ant-input-number-input,
  .we-runtime-prop-panel__body .ant-select-selection-item,
  .we-runtime-prop-panel__body .ant-select-selection-placeholder,
  .we-runtime-prop-panel__body .ant-input,
  .we-runtime-prop-panel__body textarea {
    color: ${EDITOR_CHROME.textPrimary};
  }

  .we-runtime-prop-panel__body .ant-select,
  .we-runtime-prop-panel__body .ant-input-number,
  .we-runtime-prop-panel__body .ant-input,
  .we-runtime-prop-panel__body .ant-input-affix-wrapper {
    width: 100%;
    min-width: 0;
  }

  .we-runtime-prop-panel__body .ant-select .ant-select-arrow {
    color: ${EDITOR_CHROME.textMuted};
  }

  .we-runtime-prop-panel__body .ant-switch {
    background: ${EDITOR_CHROME.borderStrong};
    flex: 0 0 auto;
  }

  .we-runtime-prop-panel__body .ant-switch.ant-switch-checked {
    background: ${EDITOR_CHROME.accent};
  }

  .we-runtime-prop-panel__drag-handle {
    cursor: grab;
  }

  .we-runtime-prop-panel__drag-handle[data-dragging="true"] {
    cursor: grabbing !important;
  }

  .we-runtime-toolbar__spinner {
    position: absolute;
    inset: -150%;
    animation: we-runtime-genie-spin linear infinite;
  }

  .we-runtime-genie-task__scanner {
    position: absolute;
    left: 0;
    right: 0;
    height: var(--we-runtime-genie-task-scan-size, 88px);
    top: calc(-1 * var(--we-runtime-genie-task-scan-size, 88px));
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      180deg,
      transparent 0%,
      color-mix(in srgb, var(--we-runtime-genie-task-accent) 14%, transparent) 38%,
      color-mix(in srgb, var(--we-runtime-genie-task-accent) 20%, transparent) 50%,
      color-mix(in srgb, var(--we-runtime-genie-task-accent) 14%, transparent) 62%,
      transparent 100%
    );
    animation: we-runtime-genie-task-scan 2.8s linear infinite;
  }

  .we-runtime-genie-task__scanner::after {
    content: "";
    width: 100%;
    height: 1px;
    background: color-mix(in srgb, var(--we-runtime-genie-task-accent) 72%, white);
    box-shadow: 0 0 14px color-mix(in srgb, var(--we-runtime-genie-task-accent) 64%, transparent);
  }
`;
var WEB_EDITOR_POPUP_ROOT_STYLES = `
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: ${POPUP_LAYER_Z_INDEX};
  }

  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] > * {
    pointer-events: auto;
  }

  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu-submenu,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu-item,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu-submenu-title,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu-title-content,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu-item-icon,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu-submenu-arrow,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu-item a {
    color: ${EDITOR_CHROME.textPrimary} !important;
  }

  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown .ant-dropdown-menu {
    background: ${EDITOR_CHROME.surfaceElevated} !important;
    border: 1px solid ${EDITOR_CHROME.border} !important;
    box-shadow: ${EDITOR_CHROME.shadow} !important;
  }

  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu-item-disabled,
  [${WEB_EDITOR_POPUP_ROOT_ATTR}="true"] .ant-dropdown-menu-item-disabled .ant-dropdown-menu-title-content {
    color: ${EDITOR_CHROME.textMuted} !important;
  }
`;
var promptCardStyle = {
  position: "fixed",
  zIndex: POPUP_LAYER_Z_INDEX + 10,
  width: PROMPT_CARD_WIDTH,
  maxWidth: "calc(100vw - 24px)",
  padding: 10,
  borderRadius: 14,
  background: EDITOR_CHROME.surfaceOverlay,
  border: `1px solid ${EDITOR_CHROME.border}`,
  color: EDITOR_CHROME.textPrimary,
  boxShadow: EDITOR_CHROME.shadow,
  pointerEvents: "auto",
  isolation: "isolate",
  display: "flex",
  flexDirection: "column",
  gap: 8
};

// src/ui/runtime/drawer-size.ts
var ANNOTATION_DRAWER_DEFAULT_WIDTH = 440;
var ANNOTATION_DRAWER_MIN_WIDTH = 320;
var ANNOTATION_DRAWER_MAX_WIDTH = 680;
var ANNOTATION_DRAWER_VIEWPORT_MARGIN = 24;
var ANNOTATION_DRAWER_FALLBACK_MAX_WIDTH = 280;
function getViewportAvailableWidth(viewportWidth) {
  if (typeof viewportWidth !== "number" || !Number.isFinite(viewportWidth)) {
    return ANNOTATION_DRAWER_MAX_WIDTH;
  }
  return Math.max(
    ANNOTATION_DRAWER_FALLBACK_MAX_WIDTH,
    Math.floor(viewportWidth - ANNOTATION_DRAWER_VIEWPORT_MARGIN)
  );
}
function getAnnotationDrawerMaxWidth(viewportWidth) {
  return Math.min(ANNOTATION_DRAWER_MAX_WIDTH, getViewportAvailableWidth(viewportWidth));
}
function getAnnotationDrawerMinWidth(viewportWidth) {
  return Math.min(ANNOTATION_DRAWER_MIN_WIDTH, getAnnotationDrawerMaxWidth(viewportWidth));
}
function clampAnnotationDrawerWidth(width, viewportWidth) {
  const minWidth = getAnnotationDrawerMinWidth(viewportWidth);
  const maxWidth = getAnnotationDrawerMaxWidth(viewportWidth);
  return Math.min(maxWidth, Math.max(minWidth, Math.round(width)));
}
function getAnnotationDrawerDefaultWidth(viewportWidth) {
  return clampAnnotationDrawerWidth(ANNOTATION_DRAWER_DEFAULT_WIDTH, viewportWidth);
}

// src/ui/panel-compact-position.ts
function clampNumber2(value, min, max) {
  if (!Number.isFinite(value)) return min;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return Math.min(hi, Math.max(lo, value));
}
function clampFloatingPosition(options) {
  const { position, size, viewport } = options;
  const margin = Number.isFinite(options.margin) ? Math.max(0, options.margin) : 0;
  const maxLeft = Math.max(margin, viewport.width - margin - size.width);
  const maxTop = Math.max(margin, viewport.height - margin - size.height);
  return {
    left: Math.round(clampNumber2(position.left, margin, maxLeft)),
    top: Math.round(clampNumber2(position.top, margin, maxTop))
  };
}

// src/ui/runtime/annotation-toolbar-position.ts
var ANNOTATION_TOOLBAR_SIZE = 40;
var ANNOTATION_TOOLBAR_MARGIN = 16;
function clampAnnotationToolbarPosition(position, viewport) {
  return clampFloatingPosition({
    position,
    size: {
      width: ANNOTATION_TOOLBAR_SIZE,
      height: ANNOTATION_TOOLBAR_SIZE
    },
    viewport,
    margin: ANNOTATION_TOOLBAR_MARGIN
  });
}
function getDefaultAnnotationToolbarPosition(viewport) {
  return clampAnnotationToolbarPosition(
    {
      left: viewport.width - ANNOTATION_TOOLBAR_MARGIN - ANNOTATION_TOOLBAR_SIZE,
      top: ANNOTATION_TOOLBAR_MARGIN
    },
    viewport
  );
}

// src/ui/runtime/action-buttons.tsx
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button, Tooltip } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { jsx, jsxs } from "react/jsx-runtime";
var ICON_ACTION_TONE_STYLES = {
  neutral: {
    color: EDITOR_CHROME.textPrimary
  },
  accent: {
    color: EDITOR_CHROME.accent,
    background: "rgba(0, 143, 93, 0.14)"
  },
  danger: {
    color: EDITOR_CHROME.textDanger,
    background: "rgba(255, 120, 117, 0.12)"
  },
  dark: {
    color: EDITOR_CHROME.textPrimary
  }
};
function SvgIcon(props) {
  const { children, size = ACTION_ICON_SIZE, strokeWidth = ACTION_ICON_STROKE } = props;
  return /* @__PURE__ */ jsx(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      "aria-hidden": "true",
      style: { display: "block" },
      children: /* @__PURE__ */ jsx(
        "g",
        {
          stroke: "currentColor",
          strokeWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          children
        }
      )
    }
  );
}
function CloseToolIcon() {
  return /* @__PURE__ */ jsxs(SvgIcon, { children: [
    /* @__PURE__ */ jsx("path", { d: "M4.5 4.5l7 7" }),
    /* @__PURE__ */ jsx("path", { d: "M11.5 4.5l-7 7" })
  ] });
}
function TooltipButton(props) {
  const { title, children, disabled } = props;
  return /* @__PURE__ */ jsx(Tooltip, { title, children: /* @__PURE__ */ jsx("span", { style: { display: "inline-flex" }, children: React.cloneElement(children, { disabled }) }) });
}
function IconActionButton(props) {
  const { title, icon, onClick, disabled, loading, tone = "neutral", style } = props;
  const [hovered, setHovered] = React.useState(false);
  const toneStyle = ICON_ACTION_TONE_STYLES[tone];
  const mobile = isMobileDevice();
  const btnSize = mobile ? Math.max(ACTION_BUTTON_SIZE, 36) : ACTION_BUTTON_SIZE;
  return /* @__PURE__ */ jsx(TooltipButton, { title, disabled, children: /* @__PURE__ */ jsx(
    Button,
    {
      size: "small",
      type: "text",
      "aria-label": title,
      icon: loading ? /* @__PURE__ */ jsx(LoadingOutlined, { spin: true }) : icon,
      disabled,
      onClick,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      danger: tone === "danger",
      style: {
        width: btnSize,
        minWidth: btnSize,
        height: btnSize,
        padding: 0,
        fontSize: ACTION_ICON_SIZE,
        borderRadius: 999,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        boxShadow: "none",
        touchAction: "manipulation",
        color: disabled ? EDITOR_CHROME.textMuted : toneStyle.color ?? EDITOR_CHROME.textPrimary,
        background: disabled ? "transparent" : hovered ? toneStyle.background ?? EDITOR_CHROME.hoverSubtle : "transparent",
        transition: "background-color 220ms ease, color 220ms ease, transform 220ms ease",
        ...style
      }
    }
  ) });
}

// src/devtools/store.ts
import React2 from "react";

// src/devtools/normalize.ts
function normalizeText2(value, fallback) {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}
function normalizeOptionValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : String(value ?? "");
}
function normalizeOptions(input) {
  if (!Array.isArray(input)) return [];
  return input.map((option) => ({
    label: normalizeText2(option?.label, String(option?.value ?? "")),
    value: normalizeOptionValue(option?.value)
  }));
}
function getDefaultInitialValue(control) {
  if (control.type === "inputNumber") {
    return typeof control.initialValue === "number" && Number.isFinite(control.initialValue) ? control.initialValue : 0;
  }
  if (control.type === "switch") {
    return typeof control.initialValue === "boolean" ? control.initialValue : false;
  }
  if (control.type === "select") {
    const options = normalizeOptions(control.options);
    if (control.initialValue !== void 0) {
      return normalizeOptionValue(control.initialValue);
    }
    return options[0]?.value ?? "";
  }
  return typeof control.initialValue === "string" ? control.initialValue : String(control.initialValue ?? "");
}
function normalizeControl(control) {
  const attributeId = String(control?.attributeId ?? "").trim();
  const displayName = normalizeText2(control?.displayName, attributeId);
  const info = control?.info ? String(control.info) : void 0;
  if (!attributeId || !displayName) {
    return null;
  }
  if (control.type === "select") {
    const options = normalizeOptions(control.options);
    return {
      type: "select",
      attributeId,
      displayName,
      info,
      options,
      initialValue: getDefaultInitialValue({
        ...control,
        options
      })
    };
  }
  if (control.type === "inputNumber") {
    return {
      type: "inputNumber",
      attributeId,
      displayName,
      info,
      initialValue: getDefaultInitialValue(control)
    };
  }
  if (control.type === "switch") {
    return {
      type: "switch",
      attributeId,
      displayName,
      info,
      initialValue: getDefaultInitialValue(control)
    };
  }
  if (control.type === "input") {
    return {
      type: "input",
      attributeId,
      displayName,
      info,
      initialValue: getDefaultInitialValue(control)
    };
  }
  return null;
}
function normalizeProtoDevControls(controls) {
  const orderedIds = [];
  const byId = /* @__PURE__ */ new Map();
  for (const rawControl of controls) {
    const control = normalizeControl(rawControl);
    if (!control) {
      continue;
    }
    if (!byId.has(control.attributeId)) {
      orderedIds.push(control.attributeId);
    }
    byId.set(control.attributeId, control);
  }
  return orderedIds.map((attributeId) => byId.get(attributeId) || null).filter((control) => control !== null);
}

// src/devtools/store.ts
var storeState = {
  controls: [],
  defaults: {},
  state: {},
  open: false,
  ownerId: null,
  mountedPanelIds: []
};
var runtimeListeners = /* @__PURE__ */ new Set();
var stateListeners = /* @__PURE__ */ new Set();
var cachedStateSnapshot = {};
var cachedRuntimeSnapshot = {
  controls: [],
  state: cachedStateSnapshot,
  open: false,
  ownerId: null
};
function refreshSnapshots() {
  cachedStateSnapshot = { ...storeState.state };
  cachedRuntimeSnapshot = {
    controls: [...storeState.controls],
    state: cachedStateSnapshot,
    open: storeState.open,
    ownerId: storeState.ownerId
  };
}
function isBrowser() {
  return typeof window !== "undefined";
}
function syncWindowState() {
  if (!isBrowser()) return;
  window.__AXHUB_PROTO_DEV__ = {
    getState: () => ({ ...storeState.state }),
    getControls: () => [...storeState.controls],
    setState: (partial) => {
      setProtoDevState(partial);
    },
    subscribe: (listener) => subscribeProtoDevRuntime(listener)
  };
}
function emitRuntime() {
  syncWindowState();
  const snapshot = getProtoDevStateSnapshot();
  runtimeListeners.forEach((listener) => listener());
  stateListeners.forEach((listener) => listener(snapshot));
}
function seedDefaultValue(control) {
  const previousDefault = storeState.defaults[control.attributeId];
  const nextDefault = control.initialValue;
  const currentValue = storeState.state[control.attributeId];
  const hasValue = Object.prototype.hasOwnProperty.call(storeState.state, control.attributeId);
  if (!hasValue || Object.is(currentValue, previousDefault)) {
    storeState.state[control.attributeId] = nextDefault;
  }
  storeState.defaults[control.attributeId] = nextDefault;
}
function registerProtoDevControls(controls) {
  const normalizedControls = normalizeProtoDevControls(controls);
  const duplicateIds = /* @__PURE__ */ new Set();
  const seenIds = /* @__PURE__ */ new Set();
  for (const rawControl of controls) {
    const attributeId = String(rawControl?.attributeId ?? "").trim();
    if (!attributeId) continue;
    if (seenIds.has(attributeId)) {
      duplicateIds.add(attributeId);
    }
    seenIds.add(attributeId);
  }
  duplicateIds.forEach((attributeId) => {
    console.warn(`[ProtoDevPanel] Duplicate control attributeId "${attributeId}" detected. Using the last definition.`);
  });
  storeState.controls = normalizedControls;
  normalizedControls.forEach(seedDefaultValue);
  refreshSnapshots();
  emitRuntime();
  return normalizedControls;
}
function getProtoDevState() {
  return { ...cachedStateSnapshot };
}
function getProtoDevStateSnapshot() {
  return cachedStateSnapshot;
}
function setProtoDevState(partial) {
  let changed = false;
  for (const [key, value] of Object.entries(partial || {})) {
    if (!Object.is(storeState.state[key], value)) {
      storeState.state[key] = value;
      changed = true;
    }
  }
  if (changed) {
    refreshSnapshots();
    emitRuntime();
  }
}
function subscribeProtoDevState(listener) {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}
function subscribeProtoDevRuntime(listener) {
  runtimeListeners.add(listener);
  return () => {
    runtimeListeners.delete(listener);
  };
}
function useProtoDevState() {
  return React2.useSyncExternalStore(
    subscribeProtoDevRuntime,
    () => getProtoDevStateSnapshot(),
    () => getProtoDevStateSnapshot()
  );
}
function setProtoDevOpen(open) {
  if (storeState.open === open) return;
  storeState.open = open;
  refreshSnapshots();
  emitRuntime();
}
function claimProtoDevOwner(ownerId) {
  if (!storeState.mountedPanelIds.includes(ownerId)) {
    storeState.mountedPanelIds.push(ownerId);
  }
  if (!storeState.ownerId) {
    storeState.ownerId = ownerId;
    refreshSnapshots();
    emitRuntime();
    return;
  }
  refreshSnapshots();
  emitRuntime();
}
function releaseProtoDevOwner(ownerId) {
  storeState.mountedPanelIds = storeState.mountedPanelIds.filter((id) => id !== ownerId);
  if (storeState.ownerId !== ownerId) {
    refreshSnapshots();
    emitRuntime();
    return;
  }
  storeState.ownerId = storeState.mountedPanelIds[0] ?? null;
  refreshSnapshots();
  emitRuntime();
}

// src/devtools/controller.ts
var controllerCounter = 0;
function readPersistedState(storageKey) {
  if (!storageKey || typeof window === "undefined") {
    return null;
  }
  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
function persistState(storageKey, state) {
  if (!storageKey || typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
  }
}
function createProtoDevController(options = {}) {
  const id = `proto-dev-${++controllerCounter}`;
  let mounted = false;
  let unsubscribePersist = null;
  return {
    id,
    mount() {
      if (mounted) return;
      mounted = true;
      registerProtoDevControls(options.controls || []);
      claimProtoDevOwner(id);
      const persistedState = readPersistedState(options.storageKey);
      if (persistedState) {
        setProtoDevState(persistedState);
      }
      if (options.defaultOpen) {
        setProtoDevOpen(true);
      }
      if (options.storageKey) {
        unsubscribePersist = subscribeProtoDevState((state) => {
          persistState(options.storageKey, state);
        });
      }
    },
    unmount() {
      if (!mounted) return;
      mounted = false;
      unsubscribePersist?.();
      unsubscribePersist = null;
      releaseProtoDevOwner(id);
    },
    getState() {
      return getProtoDevState();
    },
    setState(partial) {
      setProtoDevState(partial);
    },
    subscribe(listener) {
      return subscribeProtoDevState(listener);
    }
  };
}

// src/devtools/ProtoDevPanel.tsx
import React3 from "react";
function isProtoDevEnabled() {
  if (typeof process !== "undefined" && typeof process.env?.NODE_ENV === "string") {
    return process.env.NODE_ENV !== "production";
  }
  return true;
}
function ProtoDevPanel(props) {
  const { controls, storageKey, defaultOpen } = props;
  const controller = React3.useMemo(
    () => createProtoDevController({ controls, storageKey, defaultOpen }),
    [controls, defaultOpen, storageKey]
  );
  React3.useEffect(() => {
    if (!isProtoDevEnabled()) {
      return void 0;
    }
    controller.mount();
    return () => {
      controller.unmount();
    };
  }, [controller]);
  if (!isProtoDevEnabled()) {
    return null;
  }
  return null;
}

// src/devtools/controls-content.tsx
import React20 from "react";
import { ConfigProvider } from "antd";

// src/ui/config-panel/AttributeTree.tsx
import React19 from "react";

// src/ui/config-panel/components/Collapse.tsx
import React4 from "react";
import { Collapse as AntdCollapse } from "antd";
import { Fragment, jsx as jsx2 } from "react/jsx-runtime";
import { createElement } from "react";
var _AttributeTree = null;
function setAttributeTreeRef(ref) {
  _AttributeTree = ref;
}
var Collapse = React4.memo(function Collapse2(props) {
  const { config, attributes, onChange } = props;
  const items = React4.useMemo(() => {
    if (!config.children) return [];
    return config.children.filter((child) => {
      const hasChildren = Array.isArray(child.children) && child.children.length > 0;
      return hasChildren && child.show !== false;
    }).map((child, index) => ({
      label: child.displayName,
      key: index.toString(),
      children: /* @__PURE__ */ jsx2(Fragment, { children: (child.children || []).map(
        (childConfig, idx) => _AttributeTree ? /* @__PURE__ */ createElement(
          _AttributeTree,
          {
            ...props,
            config: childConfig,
            key: idx.toString()
          }
        ) : null
      ) })
    }));
  }, [config.children, props]);
  return /* @__PURE__ */ jsx2("div", { className: "annotation-config-panel-tab", children: /* @__PURE__ */ jsx2(
    AntdCollapse,
    {
      activeKey: attributes.activeKey ?? "0",
      className: "custom-collapse",
      onChange: (keys) => {
        onChange({ activeKey: keys });
      },
      items,
      size: "small"
    }
  ) });
});

// src/ui/config-panel/components/CollapsePanel.tsx
import React5 from "react";
import { Fragment as Fragment2, jsx as jsx3 } from "react/jsx-runtime";
var CollapsePanel = React5.memo(function CollapsePanel2(props) {
  return /* @__PURE__ */ jsx3(Fragment2, { children: props.children });
});

// src/ui/config-panel/components/Group.tsx
import React7 from "react";

// src/ui/config-panel/components/AttrLabel.tsx
import React6 from "react";
import { Tooltip as Tooltip2 } from "antd";
import { InfoCircleOutlined, CaretRightOutlined } from "@ant-design/icons";
import { Fragment as Fragment3, jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
function HighlightText(props) {
  const { text, keyword } = props;
  if (!keyword) return /* @__PURE__ */ jsx4(Fragment3, { children: text });
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return /* @__PURE__ */ jsx4(Fragment3, { children: parts.map(
    (part, index) => part.toLowerCase() === keyword.toLowerCase() ? /* @__PURE__ */ jsx4("span", { style: { backgroundColor: "#ffd666" }, children: part }, index) : part
  ) });
}
var rootStyle = {
  display: "flex",
  alignItems: "center",
  flex: "1 1 auto",
  minWidth: 0,
  color: "rgba(0, 0, 0, 0.65)",
  fontSize: 12
};
var labelMainStyle = {
  display: "flex",
  alignItems: "center",
  flex: "1 1 auto",
  minWidth: 0
};
var labelTextStyle = {
  flex: "1 1 auto",
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap"
};
var collapseIconStyle = {
  marginRight: 5,
  transition: "transform 0.3s ease"
};
var AttrLabel = React6.memo(function AttrLabel2(props) {
  const { config, keyword, style, canCollapse, collapsed, onClick } = props;
  const { displayName, info } = config;
  if (!displayName) return null;
  return /* @__PURE__ */ jsxs2(
    "div",
    {
      style: { ...rootStyle, ...style, cursor: onClick ? "pointer" : "unset" },
      onClick,
      children: [
        canCollapse && /* @__PURE__ */ jsx4(
          CaretRightOutlined,
          {
            rotate: collapsed ? 0 : 90,
            style: collapseIconStyle
          }
        ),
        /* @__PURE__ */ jsxs2("div", { style: labelMainStyle, children: [
          /* @__PURE__ */ jsx4(Tooltip2, { title: displayName, children: /* @__PURE__ */ jsx4("span", { style: labelTextStyle, children: /* @__PURE__ */ jsx4(HighlightText, { text: displayName, keyword }) }) }),
          info ? /* @__PURE__ */ jsx4(
            Tooltip2,
            {
              placement: "left",
              title: info,
              overlayStyle: { width: 280, fontSize: 12, color: "rgba(0,0,0,0.65)" },
              arrow: { pointAtCenter: true },
              children: /* @__PURE__ */ jsx4(InfoCircleOutlined, { style: { marginLeft: 4 } })
            }
          ) : null
        ] })
      ]
    }
  );
});

// src/ui/config-panel/components/Group.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var groupStyle = {
  margin: "4px 0"
};
var inlineGroupStyle = {
  ...groupStyle,
  display: "flex",
  flexWrap: "wrap",
  alignItems: "flex-start"
};
var contentStyle = {
  transition: "max-height 0.25s ease, opacity 0.25s ease",
  overflow: "hidden"
};
var contentCollapsedStyle = {
  ...contentStyle,
  maxHeight: 0,
  opacity: 0,
  pointerEvents: "none"
};
var contentExpandedStyle = {
  ...contentStyle,
  maxHeight: 2e3,
  opacity: 1
};
var Group = React7.memo(function Group2(props) {
  const { config, children } = props;
  const [collapsed, setCollapsed] = React7.useState(true);
  const isInline = config.displayType === "inline";
  return /* @__PURE__ */ jsxs3("div", { style: isInline ? inlineGroupStyle : groupStyle, children: [
    /* @__PURE__ */ jsx5(
      AttrLabel,
      {
        config,
        canCollapse: true,
        collapsed,
        onClick: () => setCollapsed((prev) => !prev),
        style: { color: "rgba(0,0,0,0.85)", padding: "4px 0" }
      }
    ),
    /* @__PURE__ */ jsx5("div", { style: collapsed ? contentCollapsedStyle : contentExpandedStyle, children })
  ] });
});

// src/ui/config-panel/components/Checkbox.tsx
import React9 from "react";
import { Checkbox as AntdCheckbox } from "antd";

// src/ui/config-panel/components/FieldWrapper.tsx
import React8 from "react";
import { jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
var wrapperStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  margin: "6px 0"
};
var FieldWrapper = React8.memo(function FieldWrapper2(props) {
  const { config, keyword, style, children } = props;
  return /* @__PURE__ */ jsxs4("div", { style: { ...wrapperStyle, ...style }, children: [
    /* @__PURE__ */ jsx6(AttrLabel, { keyword, config }),
    children
  ] });
});

// src/ui/config-panel/components/Checkbox.tsx
import { jsx as jsx7 } from "react/jsx-runtime";
function getAttrValue(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var Checkbox = React9.memo(function Checkbox2(props) {
  const { config, attributes, onChange, keyword } = props;
  const value = getAttrValue(attributes, config.attributeId, config.initialValue);
  return /* @__PURE__ */ jsx7(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsx7(
    AntdCheckbox,
    {
      checked: Boolean(value),
      disabled: config.disabled ?? false,
      onChange: (e) => onChange({ [config.attributeId]: e.target.checked })
    }
  ) });
});

// src/ui/config-panel/components/Button.tsx
import React10 from "react";
import { Button as AntdButton, Dropdown } from "antd";
import { jsx as jsx8 } from "react/jsx-runtime";
function getAttrValue2(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var Button2 = React10.memo(function Button3(props) {
  const { config, attributes, keyword } = props;
  const value = getAttrValue2(attributes, config.attributeId, config.initialValue);
  const onClick = config.onClick;
  const buttonType = config.buttonType;
  const buttonSize = config.size || "small";
  if (config.more) {
    const menuProps = {
      items: config.more,
      onClick: config.onMenuClick || (() => {
      })
    };
    return /* @__PURE__ */ jsx8(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsx8(
      Dropdown.Button,
      {
        menu: menuProps,
        onClick,
        size: buttonSize,
        type: buttonType,
        disabled: config.disabled ?? false,
        buttonsRender: ([leftBtn, rightBtn]) => [
          React10.cloneElement(leftBtn, { style: { flex: 1 } }),
          React10.cloneElement(rightBtn, { style: { width: 40 } })
        ],
        style: { display: "flex", width: "100%" },
        children: value
      }
    ) });
  }
  return /* @__PURE__ */ jsx8(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsx8(
    AntdButton,
    {
      type: buttonType,
      onClick,
      size: buttonSize,
      block: config.block ?? false,
      children: value
    }
  ) });
});

// src/ui/config-panel/components/ColorPicker.tsx
import React11 from "react";
import { ColorPicker as AntdColorPicker } from "antd";
import { jsx as jsx9 } from "react/jsx-runtime";
function getAttrValue3(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var ColorPicker = React11.memo(function ColorPicker2(props) {
  const { config, attributes, onChange, keyword } = props;
  const color = getAttrValue3(attributes, config.attributeId, config.initialValue) || "";
  return /* @__PURE__ */ jsx9(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsx9(
    AntdColorPicker,
    {
      value: color || void 0,
      showText: true,
      size: "small",
      onChange: (_, css) => {
        onChange({ [config.attributeId]: css });
      }
    }
  ) });
});

// src/ui/config-panel/components/CustomTextArea.tsx
import React12 from "react";
import { Input as AntdInput } from "antd";
import { jsx as jsx10 } from "react/jsx-runtime";
var { TextArea } = AntdInput;
var DEBOUNCE_MS = 500;
function getAttrValue4(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var FocusPreservingTextArea = React12.memo(function FocusPreservingTextArea2(props) {
  const { value, onChange, disabled, placeholder, minRows = 6, maxRows = 20 } = props;
  const textAreaRef = React12.useRef(null);
  const [internalValue, setInternalValue] = React12.useState(value);
  const [selection, setSelection] = React12.useState(null);
  React12.useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || "");
    }
  }, [value]);
  React12.useEffect(() => {
    if (textAreaRef.current && selection) {
      try {
        textAreaRef.current.setSelectionRange(selection.start, selection.end);
      } catch {
      }
    }
  }, [internalValue, selection]);
  const handleChange = React12.useCallback(
    (e) => {
      const nextValue = e.target.value;
      setInternalValue(nextValue);
      setSelection({
        start: e.target.selectionStart,
        end: e.target.selectionEnd
      });
      onChange(nextValue);
    },
    [onChange]
  );
  return /* @__PURE__ */ jsx10(
    TextArea,
    {
      ref: textAreaRef,
      disabled,
      value: internalValue,
      placeholder,
      onChange: handleChange,
      autoSize: { minRows, maxRows }
    }
  );
});
var CustomTextArea = React12.memo(function CustomTextArea2(props) {
  const { config, attributes, onChange, keyword } = props;
  const value = getAttrValue4(attributes, config.attributeId, config.initialValue) || "";
  const debounceTimerRef = React12.useRef(null);
  React12.useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  const handleChange = React12.useCallback(
    (nextValue) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChange({ [config.attributeId]: nextValue });
      }, DEBOUNCE_MS);
    },
    [config.attributeId, onChange]
  );
  return /* @__PURE__ */ jsx10(FieldWrapper, { config, keyword, style: { flexDirection: "column", alignItems: "stretch" }, children: /* @__PURE__ */ jsx10(
    FocusPreservingTextArea,
    {
      value,
      onChange: handleChange,
      disabled: config.disabled ?? false,
      placeholder: config.placeholder,
      minRows: config.minRows || 6,
      maxRows: config.maxRows || 20
    }
  ) });
});

// src/ui/config-panel/components/Input.tsx
import React13 from "react";
import { Input as AntdInput2 } from "antd";
import { jsx as jsx11 } from "react/jsx-runtime";
function getAttrValue5(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var Input = React13.memo(function Input2(props) {
  const { config, attributes, onChange, keyword } = props;
  const value = getAttrValue5(attributes, config.attributeId, config.initialValue);
  const widthStyle = config.displayName ? { width: config.width || "40%" } : { width: "100%", minWidth: "40%" };
  return /* @__PURE__ */ jsx11(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsx11("div", { style: widthStyle, children: /* @__PURE__ */ jsx11(
    AntdInput2,
    {
      value,
      placeholder: config.placeholder,
      disabled: config.disabled ?? false,
      onChange: (e) => onChange({ [config.attributeId]: e.target.value }),
      size: "small"
    }
  ) }) });
});

// src/ui/config-panel/components/InputNumber.tsx
import React14 from "react";
import { InputNumber as AntdInputNumber } from "antd";
import { jsx as jsx12 } from "react/jsx-runtime";
function getAttrValue6(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var InputNumber = React14.memo(function InputNumber2(props) {
  const { config, attributes, onChange, keyword } = props;
  const value = getAttrValue6(attributes, config.attributeId, config.initialValue);
  return /* @__PURE__ */ jsx12(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsx12(
    AntdInputNumber,
    {
      value,
      step: config.step || 1,
      min: config.min,
      max: config.max,
      onChange: (v) => onChange({ [config.attributeId]: v }),
      placeholder: "\u6570\u503C",
      style: { width: "40%" },
      size: "small"
    }
  ) });
});

// src/ui/config-panel/components/Select.tsx
import React15 from "react";
import { Select as AntdSelect } from "antd";
import { jsx as jsx13 } from "react/jsx-runtime";
function getAttrValue7(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var Select = React15.memo(function Select2(props) {
  const { config, attributes, onChange, keyword } = props;
  const value = getAttrValue7(attributes, config.attributeId, config.initialValue);
  const options = config.options || [];
  const widthStyle = config.displayName ? { width: "40%" } : { width: "100%", minWidth: "40%" };
  return /* @__PURE__ */ jsx13(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsx13(
    AntdSelect,
    {
      mode: config.mode || void 0,
      allowClear: true,
      value,
      onChange: (v) => onChange({ [config.attributeId]: v }),
      popupMatchSelectWidth: config.dropdownMatchSelectWidth || 120,
      placeholder: "\u8BF7\u9009\u62E9",
      style: widthStyle,
      options,
      size: "small"
    }
  ) });
});

// src/ui/config-panel/components/Text.tsx
import React16 from "react";
import { Typography, Button as Button4, Tooltip as Tooltip3 } from "antd";
import { BugOutlined } from "@ant-design/icons";
import { jsx as jsx14, jsxs as jsxs5 } from "react/jsx-runtime";
function getAttrValue8(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var textContainerStyle = {
  display: "flex",
  alignItems: "center"
};
var execButtonStyle = {
  marginLeft: 4,
  padding: "0 4px",
  minWidth: "auto",
  height: "auto",
  lineHeight: 1
};
var Text = React16.memo(function Text2(props) {
  const { config, attributes, keyword } = props;
  const value = getAttrValue8(attributes, config.attributeId, config.initialValue);
  const link = getAttrValue8(attributes, config.attributeId, config.link) || value;
  const textType = getAttrValue8(attributes, config.attributeId, config.textType);
  const maxWidth = config.maxWidth || "140px";
  const textElement = textType === "link" ? /* @__PURE__ */ jsx14(Typography.Link, { href: link, target: "_blank", children: value }) : /* @__PURE__ */ jsx14(
    Typography.Paragraph,
    {
      copyable: config.copyable ? { tooltips: ["\u590D\u5236", "\u5DF2\u590D\u5236"] } : false,
      ellipsis: { rows: 1 },
      type: textType,
      style: { marginBottom: 0 },
      children: value
    }
  );
  const executableButton = config.executable ? /* @__PURE__ */ jsx14(Tooltip3, { title: config.executableTooltip || "\u8FD0\u884C", children: /* @__PURE__ */ jsx14(
    Button4,
    {
      variant: "link",
      size: "small",
      color: "primary",
      icon: /* @__PURE__ */ jsx14(BugOutlined, {}),
      onClick: () => {
        if (typeof config.onExecute === "function") {
          config.onExecute();
        }
      },
      style: execButtonStyle
    }
  ) }) : null;
  return /* @__PURE__ */ jsx14(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsx14("div", { style: { maxWidth }, children: /* @__PURE__ */ jsxs5("div", { style: textContainerStyle, children: [
    textElement,
    executableButton
  ] }) }) });
});

// src/ui/config-panel/components/Slider.tsx
import React17 from "react";
import { Slider as AntdSlider, InputNumber as AntdInputNumber2 } from "antd";
import { jsx as jsx15, jsxs as jsxs6 } from "react/jsx-runtime";
function getAttrValue9(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var containerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "55%",
  minWidth: 0
};
var sliderStyle = {
  flex: "1 1 auto",
  minWidth: 0,
  margin: 0
};
var inputNumberStyle = {
  width: 56,
  flex: "0 0 auto"
};
var Slider = React17.memo(function Slider2(props) {
  const { config, attributes, onChange, keyword } = props;
  const value = getAttrValue9(attributes, config.attributeId, config.initialValue);
  return /* @__PURE__ */ jsx15(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsxs6("div", { style: containerStyle, children: [
    /* @__PURE__ */ jsx15(
      AntdSlider,
      {
        style: sliderStyle,
        value,
        min: config.min,
        max: config.max,
        step: config.step || 1,
        onChange: (v) => onChange({ [config.attributeId]: v })
      }
    ),
    Boolean(config.showInputNumber) && /* @__PURE__ */ jsx15(
      AntdInputNumber2,
      {
        style: inputNumberStyle,
        value,
        max: config.max,
        min: config.min,
        step: config.step || 1,
        onChange: (v) => onChange({ [config.attributeId]: v }),
        size: "small"
      }
    )
  ] }) });
});

// src/ui/config-panel/components/Switch.tsx
import React18 from "react";
import { Switch as AntdSwitch } from "antd";
import { jsx as jsx16 } from "react/jsx-runtime";
function getAttrValue10(attributes, attributeId, fallback) {
  if (!attributeId) return fallback;
  return attributeId in attributes ? attributes[attributeId] : fallback;
}
var Switch = React18.memo(function Switch2(props) {
  const { config, attributes, onChange, keyword } = props;
  const value = getAttrValue10(attributes, config.attributeId, config.initialValue);
  return /* @__PURE__ */ jsx16(FieldWrapper, { config, keyword, children: /* @__PURE__ */ jsx16(
    AntdSwitch,
    {
      checked: Boolean(value),
      onChange: (checked) => onChange({ [config.attributeId]: checked })
    }
  ) });
});

// src/ui/config-panel/components/index.ts
var configComponents = {
  Collapse,
  CollapsePanel,
  Group,
  Checkbox,
  Button: Button2,
  ColorPicker,
  CustomTextArea,
  Input,
  InputNumber,
  Select,
  Text,
  Slider,
  Switch
};
var components_default = configComponents;

// src/ui/config-panel/AttributeTree.tsx
import { jsx as jsx17 } from "react/jsx-runtime";
import { createElement as createElement2 } from "react";
function titleCase(type) {
  if (!type) return "";
  return type.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}
function getStatus(config, attributes, relations) {
  if (!relations || relations.length === 0) return [];
  const status = [];
  const matching = relations.filter((r) => r.toAttributeId === config.attributeId);
  for (const { fromAttributeId, value, operator, action } of matching) {
    const fromValue = attributes[fromAttributeId];
    if (operator === "=" && fromValue === value) {
      status.push(action);
    } else if (operator === "!=" && fromValue !== value) {
      status.push(action);
    }
  }
  return status;
}
var AttributeTree = React19.memo(function AttributeTree2(props) {
  const { config, attributes, relations } = props;
  const Component = config.type ? components_default[titleCase(config.type)] : void 0;
  const status = getStatus(config, attributes, relations);
  const visible = Component && config.show !== false && !status.includes("hidden");
  if (!visible) return null;
  const children = config.children?.map((child, idx) => /* @__PURE__ */ createElement2(AttributeTree2, { ...props, config: child, key: String(idx) }));
  return /* @__PURE__ */ jsx17(Component, { ...props, children });
});
setAttributeTreeRef(AttributeTree);

// src/devtools/controls-content.tsx
import { jsx as jsx18, jsxs as jsxs7 } from "react/jsx-runtime";
function mapControlType(type) {
  switch (type) {
    case "inputNumber":
      return "input-number";
    case "colorPicker":
      return "color-picker";
    case "textarea":
      return "custom-text-area";
    default:
      return type;
  }
}
function controlToConfigNode(control) {
  const { type, attributeId, displayName, info, initialValue, ...rest } = control;
  return {
    type: mapControlType(type),
    attributeId,
    displayName,
    info,
    initialValue,
    ...rest
  };
}
function controlsToConfigTree(controls) {
  return {
    type: "collapse-panel",
    children: controls.map(controlToConfigNode)
  };
}
function ProtoDevControlsContent(props) {
  const { controls, state, onValueChange, compact = false } = props;
  if (!controls.length) {
    return null;
  }
  const configTree = React20.useMemo(() => controlsToConfigTree(controls), [controls]);
  const handleChange = React20.useCallback(
    (values) => {
      for (const [key, value] of Object.entries(values)) {
        onValueChange(key, value);
      }
    },
    [onValueChange]
  );
  return /* @__PURE__ */ jsxs7(
    "div",
    {
      "data-proto-dev-inline-controls": "true",
      style: {
        display: "flex",
        flexDirection: "column",
        gap: compact ? 8 : 12
      },
      children: [
        /* @__PURE__ */ jsxs7(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8
            },
            children: [
              /* @__PURE__ */ jsx18("span", { style: { fontSize: compact ? 12 : 13, fontWeight: 700, color: EDITOR_CHROME.textPrimary }, children: "\u72B6\u6001\u8C03\u8BD5" }),
              /* @__PURE__ */ jsxs7("span", { style: { fontSize: 11, color: EDITOR_CHROME.textMuted }, children: [
                controls.length,
                " \u9879"
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx18(ConfigProvider, { componentSize: "small", children: /* @__PURE__ */ jsx18(
          AttributeTree,
          {
            attributes: state,
            config: configTree,
            onChange: handleChange
          }
        ) })
      ]
    }
  );
}

// src/ui/runtime/annotation-shell.tsx
import { Fragment as Fragment4, jsx as jsx19, jsxs as jsxs8 } from "react/jsx-runtime";
var ANNOTATION_POPOVER_CLASS = "axhub-annotation-popover";
function normalizeColorToken2(value) {
  return String(value || "").trim().toLowerCase();
}
function buildColorSwatchOptions(colors) {
  const paletteByColor = new Map(
    ANNOTATION_COLORS.map((option) => [normalizeColorToken2(option.value), option.label])
  );
  const seen = /* @__PURE__ */ new Set();
  return colors.map((color) => String(color || "").trim()).filter(Boolean).filter((color) => {
    const normalized = normalizeColorToken2(color);
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  }).map((color) => ({
    label: paletteByColor.get(normalizeColorToken2(color)) || color,
    value: color
  }));
}
function ColorSwatchGrid(props) {
  const {
    value,
    allowAll = false,
    options = ANNOTATION_COLORS,
    onChange
  } = props;
  const swatchSize = 18;
  const gap = 6;
  const activeSwatchStyle = (active) => ({
    border: active ? `2px solid ${EDITOR_CHROME.textPrimary}` : "2px solid transparent",
    boxShadow: active ? `0 0 0 2px ${EDITOR_CHROME.accentSoft}` : "none"
  });
  return /* @__PURE__ */ jsxs8(
    "div",
    {
      onMouseDown: (event) => {
        event.preventDefault();
      },
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        alignItems: "center",
        gap,
        minWidth: 156
      },
      children: [
        allowAll ? /* @__PURE__ */ jsx19(
          "button",
          {
            type: "button",
            title: "\u5168\u90E8\u989C\u8272",
            "aria-label": "\u5168\u90E8\u989C\u8272",
            onClick: (event) => {
              event.preventDefault();
              onChange(null);
            },
            style: {
              position: "relative",
              width: swatchSize,
              height: swatchSize,
              padding: 0,
              borderRadius: 999,
              background: EDITOR_CHROME.surface,
              border: "none",
              cursor: "pointer",
              justifySelf: "center",
              overflow: "hidden",
              ...activeSwatchStyle(value === null)
            },
            children: /* @__PURE__ */ jsxs8(
              "svg",
              {
                "aria-hidden": "true",
                viewBox: "0 0 20 20",
                fill: "none",
                xmlns: "http://www.w3.org/2000/svg",
                style: {
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%"
                },
                children: [
                  /* @__PURE__ */ jsx19("circle", { cx: "10", cy: "10", r: "9", stroke: EDITOR_CHROME.borderStrong, strokeWidth: "1.2", fill: EDITOR_CHROME.surface }),
                  /* @__PURE__ */ jsx19("line", { x1: "4.5", y1: "15.5", x2: "15.5", y2: "4.5", stroke: EDITOR_CHROME.textMuted, strokeWidth: "1.6", strokeLinecap: "round" })
                ]
              }
            )
          }
        ) : null,
        options.map((option) => {
          const active = normalizeColorToken2(value) === normalizeColorToken2(option.value);
          return /* @__PURE__ */ jsx19(
            "button",
            {
              type: "button",
              title: option.label,
              "aria-label": option.label,
              onClick: (event) => {
                event.preventDefault();
                onChange(option.value);
              },
              style: {
                width: swatchSize,
                height: swatchSize,
                padding: 0,
                borderRadius: 999,
                background: option.value,
                cursor: "pointer",
                justifySelf: "center",
                ...activeSwatchStyle(active)
              },
              children: active ? /* @__PURE__ */ jsx19(CheckOutlined, { style: { color: "#fff", fontSize: 11 } }) : null
            },
            option.value
          );
        })
      ]
    }
  );
}
function AnnotationShell(props) {
  const {
    displayMode,
    anchorRect,
    selectedNode,
    currentTarget,
    annotationText,
    markdownText,
    images,
    displayIndex,
    color,
    colorFilter,
    availableFilterColors,
    annotationCount,
    drawerContainer,
    themeMode,
    protoState,
    showToolbar,
    showThemeToggle,
    showDisplayModeSwitch,
    showColorFilter,
    zIndex,
    onThemeModeChange,
    onDisplayModeChange,
    onColorFilterChange,
    onProtoValueChange,
    onCloseCard
  } = props;
  const cardRef = React21.useRef(null);
  const toolbarRef = React21.useRef(null);
  const drawerEditorRef = React21.useRef(null);
  const [cardPosition, setCardPosition] = React21.useState({ left: 24, top: 80 });
  const [settingsOpen, setSettingsOpen] = React21.useState(false);
  const [drawerWidth, setDrawerWidth] = React21.useState(() => getAnnotationDrawerDefaultWidth(typeof window === "undefined" ? void 0 : window.innerWidth));
  const [toolbarPosition, setToolbarPosition] = React21.useState(() => getDefaultAnnotationToolbarPosition({
    width: typeof window === "undefined" ? 1440 : window.innerWidth,
    height: typeof window === "undefined" ? 900 : window.innerHeight
  }));
  const [toolbarDragging, setToolbarDragging] = React21.useState(false);
  React21.useLayoutEffect(() => {
    if (!anchorRect || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const nextPosition = computePromptCardPosition({
      anchorRect,
      cardWidth: rect.width || 380,
      cardHeight: rect.height || 164,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      propertyPanelEnabled: false
    });
    setCardPosition((prev) => prev.left === nextPosition.left && prev.top === nextPosition.top ? prev : nextPosition);
  }, [anchorRect, annotationText, images.length, selectedNode?.id]);
  React21.useEffect(() => {
    if (typeof window === "undefined") {
      return void 0;
    }
    const syncDrawerWidth = () => {
      setDrawerWidth((currentWidth) => clampAnnotationDrawerWidth(currentWidth, window.innerWidth));
      setToolbarPosition((currentPosition) => clampAnnotationToolbarPosition(currentPosition, {
        width: window.innerWidth,
        height: window.innerHeight
      }));
    };
    window.addEventListener("resize", syncDrawerWidth);
    return () => {
      window.removeEventListener("resize", syncDrawerWidth);
    };
  }, []);
  const cardVisible = displayMode === "bubble" && Boolean(currentTarget && anchorRect);
  const drawerOpen = displayMode === "drawer" && Boolean(currentTarget);
  const displayAnnotation = markdownText || annotationText;
  const protoControls = selectedNode?.controls || [];
  const filterColorOptions = React21.useMemo(
    () => buildColorSwatchOptions(availableFilterColors),
    [availableFilterColors]
  );
  const hasSettingsControls = showToolbar && (showThemeToggle || showDisplayModeSwitch || showColorFilter);
  const globalToolbarZIndex = typeof zIndex === "number" ? zIndex + 1 : 10060;
  const viewportWidth = typeof window === "undefined" ? void 0 : window.innerWidth;
  const drawerMaxWidth = getAnnotationDrawerMaxWidth(viewportWidth);
  const drawerDefaultWidth = clampAnnotationDrawerWidth(drawerWidth, viewportWidth);
  React21.useEffect(() => {
    const toolbarEl = toolbarRef.current;
    if (!hasSettingsControls || !toolbarEl || typeof window === "undefined") {
      return void 0;
    }
    return installFloatingDrag({
      handleEl: toolbarEl,
      targetEl: toolbarEl,
      clampMargin: 16,
      moveThresholdPx: 4,
      onPositionChange: (position) => {
        setToolbarPosition(position);
      },
      onDragStateChange: (active) => {
        setToolbarDragging(active);
      }
    });
  }, [hasSettingsControls]);
  const colorFilterContent = /* @__PURE__ */ jsx19(
    "div",
    {
      className: ANNOTATION_POPOVER_CLASS,
      onPointerDownCapture: (event) => event.stopPropagation(),
      style: { padding: 2 },
      children: /* @__PURE__ */ jsx19(
        ColorSwatchGrid,
        {
          value: colorFilter,
          allowAll: true,
          options: filterColorOptions,
          onChange: (nextColor) => {
            onColorFilterChange(nextColor);
          }
        }
      )
    }
  );
  const settingsCardContent = /* @__PURE__ */ jsxs8(
    Space,
    {
      direction: "vertical",
      size: 12,
      className: ANNOTATION_POPOVER_CLASS,
      onPointerDownCapture: (event) => event.stopPropagation(),
      style: { width: 248 },
      children: [
        showThemeToggle ? /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }, children: [
          /* @__PURE__ */ jsx19(
            "span",
            {
              style: {
                fontSize: 13,
                color: EDITOR_CHROME.textPrimary,
                whiteSpace: "nowrap",
                flex: "0 0 auto"
              },
              children: "\u6697\u9ED1\u6A21\u5F0F"
            }
          ),
          /* @__PURE__ */ jsx19(
            "div",
            {
              style: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "flex-end",
                flex: "0 0 auto"
              },
              children: /* @__PURE__ */ jsx19(
                Switch3,
                {
                  checked: themeMode === "dark",
                  onChange: (checked) => {
                    onThemeModeChange(checked ? "dark" : "light");
                  }
                }
              )
            }
          )
        ] }) : null,
        showDisplayModeSwitch ? /* @__PURE__ */ jsxs8("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
          /* @__PURE__ */ jsx19("span", { style: { fontSize: 12, fontWeight: 600, color: EDITOR_CHROME.textSecondary }, children: "\u663E\u793A\u6A21\u5F0F" }),
          /* @__PURE__ */ jsx19(
            Segmented,
            {
              block: true,
              size: "small",
              value: displayMode,
              options: [
                { label: "\u6C14\u6CE1", value: "bubble" },
                { label: "\u62BD\u5C49", value: "drawer" }
              ],
              onChange: (value) => {
                onDisplayModeChange(value);
              }
            }
          )
        ] }) : null,
        showColorFilter ? /* @__PURE__ */ jsxs8("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
          /* @__PURE__ */ jsx19("span", { style: { fontSize: 12, fontWeight: 600, color: EDITOR_CHROME.textSecondary }, children: "\u989C\u8272\u7B5B\u9009" }),
          colorFilterContent
        ] }) : null
      ]
    }
  );
  const drawerEditorStyles = `
    .axhub-annotation-drawer-editor {
      --white: rgba(255, 255, 255, 1);
      --black: rgba(14, 14, 17, 1);
      --transparent: rgba(255, 255, 255, 0);
      --tt-gray-light-a-50: rgba(56, 56, 56, 0.04);
      --tt-gray-light-a-100: rgba(15, 22, 36, 0.05);
      --tt-gray-light-a-200: rgba(37, 39, 45, 0.1);
      --tt-brand-color-400: rgba(57, 184, 131, 1);
      --tt-brand-color-500: rgba(0, 143, 93, 1);
      --tt-bg-color: var(--white);
      --tt-border-color: var(--tt-gray-light-a-200);
      --tt-border-color-tint: var(--tt-gray-light-a-100);
      position: relative;
      height: calc(100dvh - 112px);
      min-height: 420px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid ${EDITOR_CHROME.border};
      background: ${EDITOR_CHROME.surfaceElevated};
      display: flex;
      flex-direction: column;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
    }

    .axhub-annotation-drawer-editor.dark {
      --tt-bg-color: var(--black);
      --tt-border-color: rgba(238, 238, 246, 0.11);
      --tt-border-color-tint: rgba(231, 231, 243, 0.07);
    }

    .axhub-annotation-drawer-editor,
    .axhub-annotation-drawer-editor *,
    .axhub-annotation-drawer-editor *::before,
    .axhub-annotation-drawer-editor *::after {
      box-sizing: border-box;
    }

    .axhub-annotation-drawer-editor .simple-editor-wrapper {
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      background: ${EDITOR_CHROME.surfaceElevated};
      color: ${EDITOR_CHROME.textPrimary};
      display: flex;
      flex-direction: column;
    }

    .axhub-annotation-drawer-editor .simple-editor-content {
      max-width: none;
      width: 100%;
      min-height: 0;
      margin: 0;
      flex: 1 1 auto;
      overflow-y: auto;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(250, 252, 255, 0.96));
    }

    .axhub-annotation-drawer-editor .simple-editor-content .tiptap.ProseMirror.simple-editor {
      width: 100%;
      max-width: none;
      min-height: 100%;
      margin: 0 auto;
      padding: 24px 24px 112px;
      box-sizing: border-box;
      outline: none;
      color: ${EDITOR_CHROME.textPrimary};
      cursor: default;
      background: transparent;
      font-family: "DM Sans", "Inter", sans-serif;
      font-size: 15px;
      line-height: 1.75;
    }

    .axhub-annotation-drawer-editor .tiptap-toolbar {
      display: none !important;
    }

    .axhub-annotation-drawer-editor .simple-editor-content .tiptap.ProseMirror.simple-editor > :first-child {
      margin-top: 0;
    }

    .axhub-annotation-drawer-editor .simple-editor-content .tiptap.ProseMirror.simple-editor p:first-child {
      margin-top: 0;
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror p {
      margin: 0;
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror p + p,
    .axhub-annotation-drawer-editor .tiptap.ProseMirror ul + p,
    .axhub-annotation-drawer-editor .tiptap.ProseMirror ol + p,
    .axhub-annotation-drawer-editor .tiptap.ProseMirror blockquote + p,
    .axhub-annotation-drawer-editor .tiptap.ProseMirror pre + p {
      margin-top: 14px;
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror h1,
    .axhub-annotation-drawer-editor .tiptap.ProseMirror h2,
    .axhub-annotation-drawer-editor .tiptap.ProseMirror h3 {
      margin: 1.4em 0 0.65em;
      line-height: 1.2;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: ${EDITOR_CHROME.textPrimary};
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror h1 { font-size: 1.85rem; }
    .axhub-annotation-drawer-editor .tiptap.ProseMirror h2 { font-size: 1.45rem; }
    .axhub-annotation-drawer-editor .tiptap.ProseMirror h3 { font-size: 1.15rem; }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror ul,
    .axhub-annotation-drawer-editor .tiptap.ProseMirror ol {
      margin: 14px 0;
      padding-left: 24px;
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror li + li { margin-top: 6px; }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror a {
      color: #1677ff;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror code {
      padding: 0.15em 0.38em;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.06);
      font-family: "SFMono-Regular", "SF Mono", Consolas, monospace;
      font-size: 0.92em;
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror pre {
      margin: 16px 0;
      padding: 14px 16px;
      border-radius: 14px;
      background: rgba(15, 23, 42, 0.94);
      color: rgba(248, 250, 252, 0.96);
      overflow-x: auto;
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror pre code {
      padding: 0;
      background: transparent;
      color: inherit;
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror blockquote {
      margin: 16px 0;
      padding: 12px 16px;
      border-left: 3px solid rgba(24, 144, 255, 0.48);
      background: rgba(24, 144, 255, 0.06);
      border-radius: 0 12px 12px 0;
      color: ${EDITOR_CHROME.textSecondary};
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror hr {
      border: none;
      border-top: 1px solid ${EDITOR_CHROME.border};
      margin: 20px 0;
    }

    .axhub-annotation-drawer-editor .tiptap.ProseMirror img {
      display: block;
      max-width: 100%;
      height: auto;
      border-radius: 14px;
      margin: 18px auto;
    }

    .axhub-annotation-drawer-editor.dark .simple-editor-content {
      background: linear-gradient(180deg, rgba(24, 24, 27, 0.96), rgba(17, 24, 39, 0.94));
    }

    .axhub-annotation-drawer-editor.dark .tiptap.ProseMirror code {
      background: rgba(255, 255, 255, 0.08);
    }

    .axhub-annotation-drawer-editor.dark .tiptap.ProseMirror blockquote {
      background: rgba(24, 144, 255, 0.12);
    }

    .axhub-annotation-drawer-editor .simple-editor-content::-webkit-scrollbar {
      display: none;
    }
  `;
  return /* @__PURE__ */ jsxs8(Fragment4, { children: [
    /* @__PURE__ */ jsx19("style", { children: PROPERTY_PANEL_LOCAL_STYLES }),
    hasSettingsControls ? /* @__PURE__ */ jsx19(
      "div",
      {
        ref: toolbarRef,
        className: "axhub-annotation-global-toolbar",
        style: {
          position: "fixed",
          left: toolbarPosition.left,
          top: toolbarPosition.top,
          zIndex: globalToolbarZIndex,
          display: "inline-flex",
          pointerEvents: "auto",
          cursor: toolbarDragging ? "grabbing" : "grab",
          userSelect: "none"
        },
        children: /* @__PURE__ */ jsx19(
          Popover,
          {
            trigger: "click",
            placement: "bottomRight",
            open: settingsOpen,
            onOpenChange: setSettingsOpen,
            arrow: false,
            content: settingsCardContent,
            getPopupContainer: () => toolbarRef.current ?? drawerContainer ?? document.body,
            overlayClassName: ANNOTATION_POPOVER_CLASS,
            children: /* @__PURE__ */ jsx19("span", { style: { display: "inline-flex" }, children: /* @__PURE__ */ jsx19(
              FloatButton,
              {
                icon: /* @__PURE__ */ jsx19(SettingOutlined, {}),
                "aria-label": "\u8BBE\u7F6E",
                tooltip: null,
                rootClassName: "ant-float-btn-pure"
              }
            ) })
          }
        )
      }
    ) : null,
    cardVisible ? /* @__PURE__ */ jsxs8(
      "div",
      {
        ref: cardRef,
        style: {
          ...promptCardStyle,
          ...typeof zIndex === "number" ? { zIndex } : {},
          left: cardPosition.left,
          top: cardPosition.top,
          display: "flex",
          flexDirection: "column",
          gap: 10
        },
        children: [
          /* @__PURE__ */ jsx19("style", { children: `
            .axhub-annotation-bubble-scroll::-webkit-scrollbar {
              width: 4px;
              background: transparent;
            }
            .axhub-annotation-bubble-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .axhub-annotation-bubble-scroll::-webkit-scrollbar-thumb {
              background: rgba(0,0,0,0.15);
              border-radius: 4px;
            }
            .axhub-annotation-bubble-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(0,0,0,0.28);
            }
          ` }),
          /* @__PURE__ */ jsxs8("div", { style: { display: "flex", alignItems: "center", gap: 6 }, children: [
            /* @__PURE__ */ jsx19(
              "span",
              {
                "aria-hidden": "true",
                style: {
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: color,
                  border: `1.5px solid ${EDITOR_CHROME.surface}`,
                  boxShadow: `0 0 0 1px ${EDITOR_CHROME.borderStrong}`,
                  flex: "0 0 auto"
                }
              }
            ),
            /* @__PURE__ */ jsx19("div", { style: { flex: 1 } }),
            displayIndex != null ? /* @__PURE__ */ jsxs8("span", { style: { fontSize: 11, fontWeight: 600, color: EDITOR_CHROME.textMuted, padding: "0 2px" }, children: [
              "#",
              displayIndex
            ] }) : null,
            /* @__PURE__ */ jsx19(
              IconActionButton,
              {
                title: "\u5173\u95ED",
                icon: /* @__PURE__ */ jsx19(CloseToolIcon, {}),
                tone: "dark",
                onClick: onCloseCard
              }
            )
          ] }),
          displayAnnotation.trim() ? /* @__PURE__ */ jsxs8(
            "div",
            {
              className: "axhub-annotation-bubble-scroll",
              style: {
                maxHeight: 360,
                overflow: "auto hidden",
                overflowY: "overlay",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(0,0,0,0.15) transparent"
              },
              children: [
                /* @__PURE__ */ jsx19("style", { children: `
                .axhub-annotation-bubble-md .simple-editor-wrapper { background: transparent !important; }
                .axhub-annotation-bubble-md .simple-editor-content { max-width: none; width: 100%; margin: 0; background: transparent !important; }
                .axhub-annotation-bubble-md .tiptap-toolbar { display: none !important; }
                .axhub-annotation-bubble-md .tiptap.ProseMirror.simple-editor {
                  padding: 0 4px 0 0 !important;
                  font-size: 12.5px !important;
                  line-height: 1.6 !important;
                  min-height: auto !important;
                  color: ${EDITOR_CHROME.textPrimary};
                  cursor: default !important;
                }
                .axhub-annotation-bubble-md .tiptap.ProseMirror p { margin: 0; }
                .axhub-annotation-bubble-md .tiptap.ProseMirror p + p { margin-top: 8px; }
                .axhub-annotation-bubble-md .tiptap.ProseMirror h1,
                .axhub-annotation-bubble-md .tiptap.ProseMirror h2,
                .axhub-annotation-bubble-md .tiptap.ProseMirror h3 {
                  margin: 0.8em 0 0.4em; line-height: 1.3; font-weight: 700;
                }
                .axhub-annotation-bubble-md .tiptap.ProseMirror h1 { font-size: 1.3em; }
                .axhub-annotation-bubble-md .tiptap.ProseMirror h2 { font-size: 1.15em; }
                .axhub-annotation-bubble-md .tiptap.ProseMirror h3 { font-size: 1.05em; }
                .axhub-annotation-bubble-md .tiptap.ProseMirror ul,
                .axhub-annotation-bubble-md .tiptap.ProseMirror ol { margin: 6px 0; padding-left: 20px; }
                .axhub-annotation-bubble-md .tiptap.ProseMirror li + li { margin-top: 3px; }
                .axhub-annotation-bubble-md .tiptap.ProseMirror code {
                  padding: 0.1em 0.3em; border-radius: 4px;
                  background: rgba(15, 23, 42, 0.06); font-size: 0.9em;
                }
                .axhub-annotation-bubble-md .tiptap.ProseMirror pre {
                  margin: 8px 0; padding: 10px 12px; border-radius: 10px;
                  background: rgba(15, 23, 42, 0.92); color: rgba(248, 250, 252, 0.96);
                  overflow-x: auto; font-size: 0.88em;
                }
                .axhub-annotation-bubble-md .tiptap.ProseMirror pre code { padding: 0; background: transparent; color: inherit; }
                .axhub-annotation-bubble-md .tiptap.ProseMirror blockquote {
                  margin: 8px 0; padding: 8px 12px;
                  border-left: 3px solid rgba(24, 144, 255, 0.48);
                  background: rgba(24, 144, 255, 0.06); border-radius: 0 8px 8px 0;
                }
                .axhub-annotation-bubble-md .tiptap.ProseMirror hr {
                  border: none; border-top: 1px solid ${EDITOR_CHROME.border}; margin: 10px 0;
                }
                .axhub-annotation-bubble-md .tiptap.ProseMirror img {
                  display: block; max-width: 100%; height: auto; border-radius: 8px; margin: 10px auto;
                }
                .axhub-annotation-bubble-md .tiptap.ProseMirror a {
                  color: #1677ff; text-decoration: underline; text-underline-offset: 2px;
                }
              ` }),
                /* @__PURE__ */ jsx19("div", { className: "axhub-annotation-bubble-md", children: /* @__PURE__ */ jsx19(
                  SimpleEditor,
                  {
                    contentType: "markdown",
                    content: displayAnnotation,
                    editable: false,
                    embedded: true,
                    compactToolbar: true,
                    showThemeToggle: false
                  },
                  `bubble-${selectedNode?.id ?? "none"}`
                ) })
              ]
            }
          ) : /* @__PURE__ */ jsx19(
            "div",
            {
              style: {
                padding: "0 4px 0 0",
                color: EDITOR_CHROME.textMuted,
                fontSize: 12.5,
                lineHeight: 1.6
              },
              children: "\u6682\u65E0\u6807\u6CE8\u5185\u5BB9"
            }
          ),
          images.length > 0 ? /* @__PURE__ */ jsx19("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: images.map((image) => /* @__PURE__ */ jsx19(
            "img",
            {
              src: image.url,
              alt: image.filename,
              style: {
                width: 56,
                height: 56,
                objectFit: "cover",
                borderRadius: 10,
                border: `1px solid ${EDITOR_CHROME.border}`
              }
            },
            image.filename
          )) }) : null,
          protoControls.length > 0 ? /* @__PURE__ */ jsx19(
            "div",
            {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingTop: 10,
                borderTop: `1px solid ${EDITOR_CHROME.border}`
              },
              children: /* @__PURE__ */ jsx19(
                ProtoDevControlsContent,
                {
                  controls: protoControls,
                  state: protoState,
                  compact: true,
                  onValueChange: onProtoValueChange
                }
              )
            }
          ) : null
        ]
      }
    ) : null,
    drawerOpen ? /* @__PURE__ */ jsxs8(
      Drawer,
      {
        title: null,
        closable: false,
        placement: "right",
        ...{
          defaultSize: drawerDefaultWidth,
          maxSize: drawerMaxWidth
        },
        resizable: {
          onResize: (nextWidth) => {
            const viewportWidth2 = typeof window === "undefined" ? void 0 : window.innerWidth;
            setDrawerWidth(clampAnnotationDrawerWidth(nextWidth, viewportWidth2));
          },
          onResizeEnd: () => {
            if (typeof window === "undefined" || !drawerEditorRef.current) {
              return;
            }
            const wrapper = drawerEditorRef.current.closest(".ant-drawer-content-wrapper");
            if (!(wrapper instanceof HTMLElement)) {
              return;
            }
            setDrawerWidth(clampAnnotationDrawerWidth(wrapper.getBoundingClientRect().width, window.innerWidth));
          }
        },
        zIndex,
        open: true,
        autoFocus: false,
        onClose: onCloseCard,
        getContainer: drawerContainer ?? false,
        styles: {
          body: {
            background: EDITOR_CHROME.surface,
            color: EDITOR_CHROME.textPrimary,
            padding: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          },
          header: {
            display: "none"
          },
          content: {
            background: EDITOR_CHROME.surface
          }
        },
        children: [
          /* @__PURE__ */ jsx19("style", { children: drawerEditorStyles }),
          /* @__PURE__ */ jsxs8(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 12px",
                borderBottom: `1px solid ${EDITOR_CHROME.border}`,
                flex: "0 0 auto"
              },
              children: [
                /* @__PURE__ */ jsx19(
                  "span",
                  {
                    "aria-hidden": "true",
                    style: {
                      width: 14,
                      height: 14,
                      borderRadius: 999,
                      background: color,
                      border: `1.5px solid ${EDITOR_CHROME.surface}`,
                      boxShadow: `0 0 0 1px ${EDITOR_CHROME.borderStrong}`,
                      flex: "0 0 auto"
                    }
                  }
                ),
                /* @__PURE__ */ jsx19("div", { style: { flex: 1 } }),
                displayIndex != null ? /* @__PURE__ */ jsxs8("span", { style: { fontSize: 11, fontWeight: 600, color: EDITOR_CHROME.textMuted, padding: "0 2px" }, children: [
                  "#",
                  displayIndex
                ] }) : null,
                /* @__PURE__ */ jsx19(
                  IconActionButton,
                  {
                    title: "\u5173\u95ED",
                    icon: /* @__PURE__ */ jsx19(CloseToolIcon, {}),
                    tone: "dark",
                    onClick: onCloseCard
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsxs8(
            "div",
            {
              ref: drawerEditorRef,
              className: `axhub-annotation-drawer-editor${themeMode === "dark" ? " dark" : ""}`,
              "data-theme-mode": themeMode,
              "data-readonly": "true",
              style: { flex: "1 1 auto", minHeight: 0 },
              children: [
                protoControls.length > 0 ? /* @__PURE__ */ jsx19(
                  "div",
                  {
                    style: {
                      flex: "0 0 auto",
                      padding: "16px 20px",
                      borderBottom: `1px solid ${EDITOR_CHROME.border}`,
                      background: EDITOR_CHROME.surface
                    },
                    children: /* @__PURE__ */ jsx19(
                      ProtoDevControlsContent,
                      {
                        controls: protoControls,
                        state: protoState,
                        onValueChange: onProtoValueChange
                      }
                    )
                  }
                ) : null,
                displayAnnotation.trim() ? /* @__PURE__ */ jsx19(
                  SimpleEditor,
                  {
                    contentType: "markdown",
                    content: displayAnnotation,
                    editable: false,
                    embedded: true,
                    compactToolbar: true,
                    showThemeToggle: false
                  },
                  `drawer-${selectedNode?.id ?? "none"}`
                ) : /* @__PURE__ */ jsx19(
                  "div",
                  {
                    style: {
                      flex: 1,
                      overflowY: "auto",
                      padding: "24px 24px 112px",
                      color: EDITOR_CHROME.textMuted,
                      fontFamily: '"DM Sans", "Inter", sans-serif',
                      fontSize: 15,
                      lineHeight: 1.75
                    },
                    children: "\u6682\u65E0\u6807\u6CE8\u5185\u5BB9"
                  }
                )
              ]
            }
          )
        ]
      },
      `annotation-drawer:${selectedNode?.id ?? "none"}`
    ) : null
  ] });
}

// src/markdown-serializer.ts
var SECTION_HEADER_PREFIX = "## \u6807\u6CE8 ";
function trimTrailingWhitespace(value) {
  return value.replace(/[ \t]+\n/g, "\n").trim();
}
function buildDetailLink(nodeId) {
  return `\u2192 [\u8BE6\u7EC6\u6807\u6CE8](annotations/${nodeId}.md)`;
}
function serializeAnnotationsMarkdown(nodes) {
  const sections = nodes.map((node) => {
    const parts = [`${SECTION_HEADER_PREFIX}${node.id}`];
    const annotationText = trimTrailingWhitespace(node.annotationText || "");
    parts.push("");
    if (annotationText) {
      parts.push(annotationText);
      parts.push("");
    }
    if (node.hasMarkdown) {
      parts.push(buildDetailLink(node.id));
      parts.push("");
    }
    parts.push("---");
    return parts.join("\n");
  });
  return sections.length > 0 ? `${sections.join("\n\n")}
` : "";
}
function stripDetailLink(nodeId, content) {
  const detailLink = buildDetailLink(nodeId);
  const escaped = detailLink.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.replace(new RegExp(`\\n?${escaped}\\s*$`), "").trim();
}
function parseAnnotationsMarkdown(content) {
  const normalized = String(content || "").replace(/\r\n/g, "\n");
  if (!normalized.trim()) {
    return {};
  }
  const result = {};
  const sections = normalized.split(/\n(?=## 标注 )/g).map((section) => section.trim()).filter(Boolean);
  for (const section of sections) {
    const lines = section.split("\n");
    const header = lines.shift() || "";
    if (!header.startsWith(SECTION_HEADER_PREFIX)) {
      continue;
    }
    const nodeId = header.slice(SECTION_HEADER_PREFIX.length).trim();
    if (!nodeId) {
      continue;
    }
    const body = lines.join("\n").replace(/\n---\s*$/u, "").trim();
    result[nodeId] = stripDetailLink(nodeId, body);
  }
  return result;
}
function parseAnnotationMarkdownRecords(content) {
  return Object.entries(parseAnnotationsMarkdown(content)).map(([nodeId, annotationText]) => ({
    nodeId,
    annotationText
  }));
}

// src/source-loader.ts
async function loadAnnotationSource(source) {
  try {
    return typeof source === "function" ? await source() : source;
  } catch {
    return null;
  }
}

// src/annotation-runtime.tsx
import { jsx as jsx20 } from "react/jsx-runtime";
var ANNOTATION_THEME_STORAGE_KEY = "axhub-annotation-theme-mode";
var DEFAULT_VIEWER_OPTIONS = {
  showToolbar: true,
  showThemeToggle: true,
  showDisplayModeSwitch: true,
  showColorFilter: true,
  emptyWhenNoData: false
};
function readInitialThemeMode() {
  if (typeof window === "undefined") return "light";
  try {
    return window.localStorage.getItem(ANNOTATION_THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
function createEmptyData() {
  return {
    version: 2,
    prototypeName: "",
    pageId: "",
    nodes: [],
    updatedAt: Date.now()
  };
}
function createEmptyUiState() {
  return {
    selectedNode: null,
    currentTarget: null,
    anchorRect: null,
    annotationText: "",
    markdownText: "",
    images: []
  };
}
function cloneData(data) {
  return {
    ...data,
    nodes: data.nodes.map((node) => ({
      ...node,
      images: [...node.images],
      controls: Array.isArray(node.controls) ? [...node.controls] : []
    }))
  };
}
function cloneUiState(uiState) {
  return {
    ...uiState,
    images: uiState.images.map((image) => ({ ...image }))
  };
}
function normalizeColorToken3(value) {
  return String(value || "").trim().toLowerCase();
}
function reindexNodes(nodes) {
  return nodes.map((node, index) => ({
    ...node,
    index: index + 1
  }));
}
function normalizeLoadedData(data) {
  if (!data || data.version !== 2) {
    return createEmptyData();
  }
  return {
    ...data,
    nodes: reindexNodes(
      (Array.isArray(data.nodes) ? data.nodes : []).map((node, index) => ({
        ...node,
        index: index + 1,
        aiPrompt: String(node.aiPrompt || "").trim(),
        annotationText: String(node.annotationText || "").trim(),
        hasMarkdown: Boolean(node.hasMarkdown),
        color: node.color || DEFAULT_ANNOTATION_COLOR,
        images: Array.isArray(node.images) ? [...node.images] : [],
        controls: normalizeProtoDevControls(Array.isArray(node.controls) ? node.controls : [])
      }))
    ),
    updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : Date.now()
  };
}
function isLegacyConfig(config) {
  return "storage" in config;
}
function createLegacySourceLoader(config) {
  return async () => {
    const [data, annotationsMd] = await Promise.all([
      config.storage.load(),
      config.storage.loadAnnotationsMd()
    ]);
    const annotationTexts = parseAnnotationsMarkdown(annotationsMd);
    const mergedData = data ? {
      ...data,
      prototypeName: config.prototypeName,
      pageId: config.pageId,
      nodes: Array.isArray(data.nodes) ? data.nodes.map((node, index) => ({
        ...node,
        index: index + 1,
        annotationText: String(node.annotationText || "").trim() || annotationTexts[node.id] || ""
      })) : []
    } : null;
    const markdownNodeIds = Array.isArray(mergedData?.nodes) ? mergedData.nodes.filter((node) => node.hasMarkdown).map((node) => node.id) : [];
    const markdownEntries = await Promise.all(markdownNodeIds.map(async (nodeId) => [
      nodeId,
      await config.storage.loadMarkdown(nodeId)
    ]));
    const assetMap = Object.fromEntries(
      Array.from(new Set(
        Array.isArray(mergedData?.nodes) ? mergedData.nodes.flatMap((node) => Array.isArray(node.images) ? node.images : []) : []
      )).map((filename) => [filename, config.storage.getAssetUrl(filename)])
    );
    return {
      data: mergedData,
      markdownMap: Object.fromEntries(
        markdownEntries.filter((entry) => typeof entry[1] === "string").map(([nodeId, markdown]) => [nodeId, markdown])
      ),
      assetMap
    };
  };
}
function createAnnotationViewer(config) {
  const listeners = /* @__PURE__ */ new Set();
  const uiListeners = /* @__PURE__ */ new Set();
  const viewerOptions = {
    ...DEFAULT_VIEWER_OPTIONS,
    ...config.options
  };
  const sourceInput = isLegacyConfig(config) ? createLegacySourceLoader(config) : config.source;
  let shadowHost = null;
  let mountedElements = null;
  let overlay = null;
  let tracker = null;
  let markers = null;
  let root = null;
  let appHost = null;
  let markdownCache = /* @__PURE__ */ new Map();
  let assetMap = {};
  let uiSyncVersion = 0;
  let uiState = createEmptyUiState();
  let themeMode = readInitialThemeMode();
  let state = {
    active: false,
    displayMode: config.defaultDisplayMode ?? "bubble",
    data: createEmptyData(),
    selectedId: null,
    colorFilter: null,
    loading: false
  };
  let runtimeSnapshot = {
    state: getStateSnapshotPlaceholder(),
    uiState: cloneUiState(uiState),
    themeMode,
    shadowRoot: null,
    drawerContainer: null
  };
  function getStateSnapshotPlaceholder() {
    return {
      ...state,
      data: cloneData(state.data)
    };
  }
  const getStateSnapshot = () => ({
    ...state,
    data: cloneData(state.data)
  });
  const refreshRuntimeSnapshot = () => {
    runtimeSnapshot = {
      state: getStateSnapshot(),
      uiState: cloneUiState(uiState),
      themeMode,
      shadowRoot: mountedElements?.shadowRoot ?? null,
      drawerContainer: mountedElements?.uiRoot ?? null
    };
  };
  const getRuntimeSnapshot = () => runtimeSnapshot;
  const emitState = () => {
    const snapshot = getStateSnapshot();
    listeners.forEach((listener) => listener(snapshot));
  };
  const emitUi = () => {
    refreshRuntimeSnapshot();
    uiListeners.forEach((listener) => listener());
  };
  const emitAll = () => {
    emitState();
    emitUi();
  };
  const getNodeById = (id) => {
    if (!id) return null;
    return state.data.nodes.find((node) => node.id === id) ?? null;
  };
  const resolveElement = (node) => {
    if (!node) return null;
    try {
      return config.resolveElement ? config.resolveElement(node.locator) : locateElement(node.locator);
    } catch {
      return null;
    }
  };
  const syncUiState = async () => {
    const syncVersion = ++uiSyncVersion;
    const selectedNode = getNodeById(state.selectedId);
    const selectedTarget = selectedNode ? resolveElement(selectedNode) : null;
    tracker?.setSelectionElement(selectedTarget ?? null);
    tracker?.forceUpdate(true);
    if (selectedNode) {
      let markdownText = "";
      if (selectedNode.hasMarkdown) {
        if (!markdownCache.has(selectedNode.id)) {
          markdownCache.set(selectedNode.id, "");
        }
        markdownText = markdownCache.get(selectedNode.id) ?? "";
      }
      if (syncVersion !== uiSyncVersion) return;
      uiState = {
        selectedNode,
        currentTarget: selectedTarget,
        anchorRect: selectedTarget?.getBoundingClientRect() ?? null,
        annotationText: selectedNode.annotationText,
        markdownText,
        images: selectedNode.images.map((filename) => ({
          filename,
          url: assetMap[filename] || ""
        }))
      };
    } else {
      uiState = createEmptyUiState();
    }
    markers?.update(state.data.nodes, state.colorFilter);
    overlay?.markDirty();
    emitUi();
  };
  const handleColorFilterChange = (color) => {
    state = {
      ...state,
      colorFilter: color
    };
    emitState();
    void syncUiState();
  };
  const handleThemeModeChange = (nextMode) => {
    if (themeMode === nextMode) return;
    themeMode = nextMode;
    try {
      window.localStorage.setItem(ANNOTATION_THEME_STORAGE_KEY, nextMode);
    } catch {
    }
    emitUi();
  };
  const handleDisplayModeChange = (nextMode) => {
    if (state.displayMode === nextMode) return;
    state = {
      ...state,
      displayMode: nextMode
    };
    emitAll();
  };
  const subscribeUi = (listener) => {
    uiListeners.add(listener);
    return () => {
      uiListeners.delete(listener);
    };
  };
  const RuntimeApp = () => {
    const snapshot = React22.useSyncExternalStore(subscribeUi, getRuntimeSnapshot, getRuntimeSnapshot);
    const protoState = useProtoDevState();
    const styleCache = React22.useMemo(() => createCache(), []);
    const availableFilterColors = React22.useMemo(() => {
      const seen = /* @__PURE__ */ new Set();
      return snapshot.state.data.nodes.map((node) => String(node.color || "").trim()).filter((color) => {
        const normalized = normalizeColorToken3(color);
        if (!normalized || seen.has(normalized)) {
          return false;
        }
        seen.add(normalized);
        return true;
      });
    }, [snapshot.state.data.nodes]);
    const visibleAnnotationCount = snapshot.state.colorFilter ? snapshot.state.data.nodes.filter(
      (node) => normalizeColorToken3(node.color) === normalizeColorToken3(snapshot.state.colorFilter)
    ).length : snapshot.state.data.nodes.length;
    if (!snapshot.shadowRoot) return null;
    return /* @__PURE__ */ jsx20(StyleProvider, { cache: styleCache, container: snapshot.shadowRoot, children: /* @__PURE__ */ jsx20(
      ConfigProvider2,
      {
        componentSize: "small",
        getPopupContainer: () => snapshot.drawerContainer ?? document.body,
        theme: createRuntimeAntdTheme(snapshot.themeMode),
        children: /* @__PURE__ */ jsx20(App, { children: /* @__PURE__ */ jsx20(
          "div",
          {
            style: {
              position: "fixed",
              inset: 0,
              pointerEvents: "none",
              ...createEditorChromeCssVars(snapshot.themeMode)
            },
            children: /* @__PURE__ */ jsx20(
              AnnotationShell,
              {
                displayMode: snapshot.state.displayMode,
                anchorRect: snapshot.uiState.anchorRect,
                selectedNode: snapshot.uiState.selectedNode,
                currentTarget: snapshot.uiState.currentTarget,
                annotationText: snapshot.uiState.annotationText,
                markdownText: snapshot.uiState.markdownText,
                images: snapshot.uiState.images,
                displayIndex: snapshot.uiState.selectedNode?.index ?? null,
                color: snapshot.uiState.selectedNode?.color ?? DEFAULT_ANNOTATION_COLOR,
                colorFilter: snapshot.state.colorFilter,
                availableFilterColors,
                annotationCount: visibleAnnotationCount,
                drawerContainer: snapshot.drawerContainer,
                themeMode: snapshot.themeMode,
                protoState,
                showToolbar: viewerOptions.showToolbar,
                showThemeToggle: viewerOptions.showThemeToggle,
                showDisplayModeSwitch: viewerOptions.showDisplayModeSwitch,
                showColorFilter: viewerOptions.showColorFilter,
                zIndex: config.options?.zIndex,
                onThemeModeChange: handleThemeModeChange,
                onDisplayModeChange: handleDisplayModeChange,
                onColorFilterChange: handleColorFilterChange,
                onProtoValueChange: (attributeId, value) => {
                  setProtoDevState({ [attributeId]: value });
                },
                onCloseCard: () => {
                  api.selectAnnotation(null);
                }
              }
            )
          }
        ) })
      }
    ) });
  };
  const handleKeyDown = (event) => {
    if (!state.active) return;
    if (event.key !== "Escape") return;
    api.selectAnnotation(null);
  };
  const api = {
    async start() {
      if (state.active) return;
      state = { ...state, loading: true };
      emitAll();
      const loadedSource = await loadAnnotationSource(sourceInput);
      const normalizedData = normalizeLoadedData(loadedSource?.data ?? null);
      const normalizedControls = normalizedData.nodes.flatMap((node) => Array.isArray(node.controls) ? node.controls : []);
      if (normalizedControls.length > 0) {
        registerProtoDevControls(normalizedControls);
      }
      const hasContent = normalizedData.nodes.length > 0 || Object.keys(loadedSource?.markdownMap || {}).length > 0;
      if (!hasContent && !viewerOptions.emptyWhenNoData) {
        state = {
          ...state,
          loading: false,
          active: false,
          data: normalizedData
        };
        emitAll();
        return;
      }
      markdownCache = new Map(Object.entries(loadedSource?.markdownMap || {}));
      assetMap = { ...loadedSource?.assetMap || {} };
      state = {
        ...state,
        active: true,
        loading: false,
        data: normalizedData
      };
      shadowHost = mountShadowHost();
      mountedElements = shadowHost.getElements();
      if (!mountedElements) {
        throw new Error("annotation-shadow-host-mount-failed");
      }
      overlay = createCanvasOverlay({ container: mountedElements.overlayRoot });
      tracker = createPositionTracker({
        onPositionUpdate: (rects) => {
          overlay?.setSelectionRect(rects.selection);
          uiState = {
            ...uiState,
            anchorRect: rects.selection
          };
          emitUi();
        }
      });
      markers = createAnnotationMarkers({
        container: mountedElements.overlayRoot,
        resolveNodeElement: resolveElement,
        onSelect: (id) => {
          api.selectAnnotation(id);
        }
      });
      appHost = document.createElement("div");
      appHost.style.position = "fixed";
      appHost.style.inset = "0";
      appHost.style.pointerEvents = "none";
      appHost.style.background = "transparent";
      mountedElements.uiRoot.append(appHost);
      root = createRoot(appHost);
      root.render(/* @__PURE__ */ jsx20(RuntimeApp, {}));
      window.addEventListener("keydown", handleKeyDown, true);
      await syncUiState();
      emitState();
    },
    stop() {
      if (!state.active && !root && !shadowHost) return;
      window.removeEventListener("keydown", handleKeyDown, true);
      root?.unmount();
      appHost?.remove();
      markers?.dispose();
      tracker?.dispose();
      overlay?.dispose();
      shadowHost?.dispose();
      root = null;
      appHost = null;
      markers = null;
      tracker = null;
      overlay = null;
      shadowHost = null;
      mountedElements = null;
      markdownCache = /* @__PURE__ */ new Map();
      assetMap = {};
      state = {
        ...state,
        active: false,
        selectedId: null
      };
      uiState = createEmptyUiState();
      emitAll();
    },
    getState() {
      return getStateSnapshot();
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(api.getState());
      return () => {
        listeners.delete(fn);
      };
    },
    selectAnnotation(id) {
      state = {
        ...state,
        selectedId: id
      };
      emitState();
      void syncUiState();
    }
  };
  return api;
}

// src/AnnotationViewer.tsx
function AnnotationViewer(props) {
  const {
    source,
    defaultVisible = true,
    defaultDisplayMode,
    resolveElement,
    options
  } = props;
  React23.useEffect(() => {
    if (!defaultVisible) {
      return void 0;
    }
    const viewer = createAnnotationViewer({
      source,
      defaultDisplayMode,
      resolveElement,
      options
    });
    void viewer.start();
    return () => {
      viewer.stop();
    };
  }, [defaultDisplayMode, defaultVisible, options, resolveElement, source]);
  return null;
}

// src/prompt-builder.ts
function formatLocator(locator) {
  const selectors = Array.isArray(locator.selectors) ? locator.selectors.map((selector) => String(selector || "").trim()).filter(Boolean) : [];
  if (selectors.length > 0) {
    return selectors.join(" | ");
  }
  if (Array.isArray(locator.path) && locator.path.length > 0) {
    return locator.path.join(">");
  }
  return locator.fingerprint || "(\u672A\u63D0\u4F9B\u5B9A\u4F4D\u4FE1\u606F)";
}
function formatExistingAnnotation(annotationText) {
  const normalized = String(annotationText || "").trim();
  return normalized || "(\u5F53\u524D\u8FD8\u6CA1\u6709\u771F\u5B9E\u6807\u6CE8\u5185\u5BB9)";
}
function buildAnnotationPrompt(nodes, options = {}) {
  const actionableNodes = nodes.filter((node) => String(node.aiPrompt || "").trim());
  const processedNodeIds = actionableNodes.map((node) => node.id);
  if (actionableNodes.length === 0) {
    return { prompt: "", processedNodeIds };
  }
  const lines = [];
  lines.push("\u8BF7\u6839\u636E\u4EE5\u4E0B\u9875\u9762\u6807\u6CE8\u63D0\u793A\uFF0C\u751F\u6210\u6216\u66F4\u65B0\u771F\u5B9E\u7684\u6807\u6CE8\u5185\u5BB9\u3002");
  lines.push("");
  if (options.prototypeName) {
    lines.push(`\u539F\u578B: ${options.prototypeName}`);
  }
  if (options.pageId) {
    lines.push(`\u9875\u9762 ID: ${options.pageId}`);
  }
  lines.push("\u8F93\u51FA\u8981\u6C42\uFF1A");
  lines.push("1. \u53EA\u5904\u7406\u4E0B\u9762\u5217\u51FA\u7684\u6807\u6CE8\u9879\u3002");
  lines.push("2. \u4E3A\u6BCF\u4E2A\u6807\u6CE8\u8865\u5168\u6216\u4FEE\u6539\u771F\u5B9E\u6807\u6CE8\u5185\u5BB9\uFF0C\u4F7F\u7528\u7B80\u6D01\u6E05\u6670\u7684 Markdown\u3002");
  lines.push("3. \u77ED\u6807\u6CE8\u5199\u5165 annotations.md \u5BF9\u5E94\u7AE0\u8282\uFF1B\u5982\u679C\u5185\u5BB9\u8F83\u957F\uFF0C\u53EF\u8865\u5145\u8BE6\u7EC6\u6587\u6863 annotations/{nodeId}.md\u3002");
  lines.push("4. \u4FDD\u7559\u5DF2\u6709\u771F\u5B9E\u6807\u6CE8\u4E2D\u7684\u6709\u6548\u4FE1\u606F\uFF0C\u4E0D\u8981\u65E0\u6545\u5220\u9664\u3002");
  lines.push("");
  lines.push("\u6807\u6CE8\u5217\u8868\uFF1A");
  actionableNodes.forEach((node, index) => {
    lines.push(`- \u6807\u6CE8\u9879 ${index + 1}`);
    lines.push(`  - \u8282\u70B9 ID: ${node.id}`);
    lines.push(`  - \u5F53\u524D\u5E8F\u53F7: ${node.index}`);
    lines.push(`  - \u5143\u7D20\u5B9A\u4F4D: ${formatLocator(node.locator)}`);
    lines.push(`  - \u5F53\u524D\u771F\u5B9E\u6807\u6CE8: ${formatExistingAnnotation(node.annotationText)}`);
    lines.push(`  - AI \u751F\u6210\u63D0\u793A: ${String(node.aiPrompt || "").trim()}`);
    if (node.hasMarkdown) {
      lines.push(`  - \u5DF2\u5B58\u5728\u8BE6\u7EC6\u6587\u6863: annotations/${node.id}.md`);
    }
  });
  return {
    prompt: lines.join("\n"),
    processedNodeIds
  };
}

// src/ui/genie-brand.tsx
import React24 from "react";
import { AnimatePresence as AnimatePresence2, motion as motion2 } from "motion/react";
import { LoadingOutlined as LoadingOutlined2 } from "@ant-design/icons";
import { Fragment as Fragment5, jsx as jsx21, jsxs as jsxs9 } from "react/jsx-runtime";
function getGenieBrandPalette(themeMode) {
  return themeMode === "dark" ? {
    activeColor: "#00d68f",
    inactiveColor: "#71717a",
    activeBackground: "rgba(0, 143, 93, 0.10)",
    activeInsetShadow: "inset 0 0 8px rgba(0, 143, 93, 0.10)",
    sleepingHoverBackground: "rgba(39, 39, 42, 0.50)",
    sleepingHoverShadow: "inset 0 0 8px rgba(255, 255, 255, 0.03)"
  } : {
    activeColor: "#008f5d",
    inactiveColor: "#a1a1aa",
    activeBackground: "rgba(0, 143, 93, 0.05)",
    activeInsetShadow: "inset 0 0 8px rgba(0, 143, 93, 0.05)",
    sleepingHoverBackground: "#f4f4f5",
    sleepingHoverShadow: "inset 0 0 8px rgba(15, 23, 42, 0.03)"
  };
}
function clamp2(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function AIFace(props) {
  const { state, themeMode, hovered, mousePos, dragVelocity, size } = props;
  const [isBlinking, setIsBlinking] = React24.useState(false);
  const isActive = state !== "sleeping";
  const isWorking = state === "working";
  const isDragging = state === "dragging";
  const { activeColor, inactiveColor } = getGenieBrandPalette(themeMode);
  React24.useEffect(() => {
    if (!isActive) {
      setIsBlinking(false);
      return;
    }
    let disposed = false;
    const blinkInterval = window.setInterval(() => {
      if (disposed || Math.random() <= 0.3) return;
      setIsBlinking(true);
      window.setTimeout(() => {
        if (!disposed) {
          setIsBlinking(false);
        }
      }, 150);
      if (Math.random() > 0.5) {
        window.setTimeout(() => {
          if (disposed) return;
          setIsBlinking(true);
          window.setTimeout(() => {
            if (!disposed) {
              setIsBlinking(false);
            }
          }, 150);
        }, 250);
      }
    }, 3e3);
    return () => {
      disposed = true;
      window.clearInterval(blinkInterval);
    };
  }, [isActive]);
  const eyeHeight = !isActive ? 2 : isDragging ? 7 : isWorking ? 6 : isBlinking ? 0.5 : hovered ? 7.5 : 6;
  const baseEyeY = !isActive ? 11 : isDragging ? 8 : isBlinking ? 12 : 9;
  let offsetX = isActive && hovered && !isDragging ? mousePos.x * 2.5 : 0;
  let offsetY = isActive && hovered && !isDragging ? mousePos.y * 2.5 : 0;
  if (isDragging) {
    offsetX = clamp2(dragVelocity.x / 120, -6, 6);
    offsetY = clamp2(dragVelocity.y / 120, -4, 4);
  }
  const eyeY = baseEyeY + offsetY;
  const windBend = isDragging ? clamp2(-dragVelocity.x / 14, -60, 60) : 0;
  const eyeColor = isActive ? activeColor : inactiveColor;
  const iconSize = Math.max(20, Math.round(size * 0.56));
  return /* @__PURE__ */ jsxs9(
    motion2.svg,
    {
      width: iconSize,
      height: iconSize,
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
      "data-genie-face-state": state,
      style: {
        position: "relative",
        zIndex: 1,
        overflow: "visible",
        display: "block",
        pointerEvents: "none"
      },
      animate: isActive ? {
        y: [0, -2.5, 0, 2.5, 0],
        rotate: [0, -3, 0, 3, 0]
      } : {
        y: 0,
        rotate: 0
      },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
      children: [
        /* @__PURE__ */ jsx21(
          motion2.rect,
          {
            initial: false,
            animate: isDragging ? {
              x: 4 + offsetX,
              y: eyeY - 3,
              width: 6,
              height: 8,
              rx: 3,
              rotate: windBend * 0.2,
              fill: activeColor
            } : isWorking ? {
              x: 4 + offsetX,
              y: eyeY - 2,
              width: 6,
              height: 6,
              rx: 3,
              rotate: 0,
              fill: activeColor
            } : {
              x: (isActive ? 5 : 4) + offsetX,
              y: eyeY,
              width: isActive ? hovered ? 4.5 : 4 : 5,
              height: eyeHeight,
              rx: isActive ? 2 : 1,
              rotate: 0,
              fill: eyeColor
            },
            transition: { type: "spring", stiffness: 400, damping: 25 },
            style: { transformOrigin: "center" }
          }
        ),
        /* @__PURE__ */ jsx21(
          motion2.rect,
          {
            initial: false,
            animate: isDragging ? {
              x: 14 + offsetX,
              y: eyeY - 3,
              width: 6,
              height: 8,
              rx: 3,
              rotate: windBend * 0.2,
              fill: activeColor
            } : isWorking ? {
              x: 14 + offsetX,
              y: eyeY - 2,
              width: 6,
              height: 6,
              rx: 3,
              rotate: 0,
              fill: activeColor
            } : {
              x: 15 + offsetX,
              y: eyeY,
              width: isActive ? hovered ? 4.5 : 4 : 5,
              height: eyeHeight,
              rx: isActive ? 2 : 1,
              rotate: 0,
              fill: eyeColor
            },
            transition: { type: "spring", stiffness: 400, damping: 25 },
            style: { transformOrigin: "center" }
          }
        ),
        /* @__PURE__ */ jsx21(AnimatePresence2, { children: isActive ? /* @__PURE__ */ jsxs9(
          motion2.g,
          {
            initial: { opacity: 0 },
            animate: { opacity: 1, transition: { duration: 0.4 } },
            exit: { opacity: 0, transition: { duration: 0.4, delay: 0.1 } },
            children: [
              /* @__PURE__ */ jsxs9(
                motion2.g,
                {
                  animate: isDragging ? { rotate: windBend } : isWorking ? { rotate: [-2, 2, -2] } : { rotate: [-4, 6, -4] },
                  transition: isDragging ? { type: "spring", stiffness: 200, damping: 10 } : isWorking ? { duration: 0.1, repeat: Infinity } : { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                  style: { transformOrigin: "11px -6px" },
                  children: [
                    /* @__PURE__ */ jsx21(
                      motion2.path,
                      {
                        initial: { d: "M 11 -6 C 15 -10 21 -8 24 -2" },
                        animate: isDragging ? { d: "M 11 -6 Q 7 -16 4 -24" } : isWorking ? { d: "M 11 -6 Q 8 -16 5 -26" } : { d: "M 11 -6 C 11 -16 15 -24 22 -26" },
                        exit: { d: "M 11 -6 C 15 -10 21 -8 24 -2" },
                        transition: { duration: 0.3, ease: "easeInOut" },
                        stroke: activeColor,
                        strokeWidth: "2",
                        fill: "none",
                        strokeLinecap: "round"
                      }
                    ),
                    /* @__PURE__ */ jsx21(
                      motion2.circle,
                      {
                        initial: { cx: 24, cy: -2 },
                        animate: isDragging ? { cx: 4, cy: -24 } : isWorking ? { cx: 5, cy: -26 } : { cx: 22, cy: -26 },
                        exit: { cx: 24, cy: -2 },
                        transition: { duration: 0.3, ease: "easeInOut" },
                        r: "1.5",
                        fill: activeColor
                      }
                    ),
                    /* @__PURE__ */ jsx21(AnimatePresence2, { children: isWorking ? /* @__PURE__ */ jsx21(
                      motion2.circle,
                      {
                        initial: { cx: 5, cy: -26, r: 1, opacity: 0.8 },
                        animate: { r: 8, opacity: 0 },
                        exit: { opacity: 0 },
                        transition: { duration: 0.6, repeat: Infinity, ease: "easeOut" },
                        fill: "none",
                        stroke: activeColor,
                        strokeWidth: "1.5"
                      }
                    ) : null })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs9(
                motion2.g,
                {
                  animate: isDragging ? { rotate: windBend } : isWorking ? { rotate: [-2, 2, -2] } : { rotate: [-3, 5, -3] },
                  transition: isDragging ? { type: "spring", stiffness: 200, damping: 10 } : isWorking ? { duration: 0.1, repeat: Infinity, delay: 0.05 } : { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 },
                  style: { transformOrigin: "13px -5px" },
                  children: [
                    /* @__PURE__ */ jsx21(
                      motion2.path,
                      {
                        initial: { d: "M 13 -5 C 17 -8 23 -5 26 2" },
                        animate: isDragging ? { d: "M 13 -5 Q 17 -15 20 -23" } : isWorking ? { d: "M 13 -5 Q 16 -15 19 -25" } : { d: "M 13 -5 C 13 -12 18 -18 26 -19" },
                        exit: { d: "M 13 -5 C 17 -8 23 -5 26 2" },
                        transition: { duration: 0.3, ease: "easeInOut" },
                        stroke: activeColor,
                        strokeWidth: "2",
                        fill: "none",
                        strokeLinecap: "round"
                      }
                    ),
                    /* @__PURE__ */ jsx21(
                      motion2.circle,
                      {
                        initial: { cx: 26, cy: 2 },
                        animate: isDragging ? { cx: 20, cy: -23 } : isWorking ? { cx: 19, cy: -25 } : { cx: 26, cy: -19 },
                        exit: { cx: 26, cy: 2 },
                        transition: { duration: 0.3, ease: "easeInOut" },
                        r: "1.5",
                        fill: activeColor
                      }
                    ),
                    /* @__PURE__ */ jsx21(AnimatePresence2, { children: isWorking ? /* @__PURE__ */ jsx21(
                      motion2.circle,
                      {
                        initial: { cx: 19, cy: -25, r: 1, opacity: 0.8 },
                        animate: { r: 8, opacity: 0 },
                        exit: { opacity: 0 },
                        transition: { duration: 0.6, repeat: Infinity, ease: "easeOut", delay: 0.2 },
                        fill: "none",
                        stroke: activeColor,
                        strokeWidth: "1.5"
                      }
                    ) : null })
                  ]
                }
              )
            ]
          },
          "hair-tennae"
        ) : null }),
        /* @__PURE__ */ jsx21(AnimatePresence2, { children: isActive && !isBlinking && !isWorking && !isDragging ? /* @__PURE__ */ jsxs9(Fragment5, { children: [
          /* @__PURE__ */ jsx21(
            motion2.circle,
            {
              initial: { opacity: 0, scale: 0 },
              animate: { opacity: 0.5, scale: 1 },
              exit: { opacity: 0, scale: 0 },
              cx: "3",
              cy: "14",
              r: "2",
              fill: activeColor
            }
          ),
          /* @__PURE__ */ jsx21(
            motion2.circle,
            {
              initial: { opacity: 0, scale: 0 },
              animate: { opacity: 0.5, scale: 1 },
              exit: { opacity: 0, scale: 0 },
              cx: "21",
              cy: "14",
              r: "2",
              fill: activeColor
            }
          )
        ] }) : null })
      ]
    }
  );
}
function SleepingZzz(props) {
  const { inactiveColor } = getGenieBrandPalette(props.themeMode);
  return /* @__PURE__ */ jsx21(
    "div",
    {
      "aria-hidden": "true",
      style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "visible"
      },
      children: [0, 1, 2].map((index) => /* @__PURE__ */ jsx21(
        motion2.div,
        {
          style: {
            position: "absolute",
            top: 0,
            right: 0,
            fontSize: 10,
            fontWeight: 700,
            color: inactiveColor,
            lineHeight: 1
          },
          initial: { opacity: 0, y: 0, x: 0, scale: 0.5 },
          animate: {
            opacity: [0, 1, 0],
            y: -10 - index * 6,
            x: 5 + index * 4,
            scale: [0.5, 1, 1.2]
          },
          transition: {
            duration: 3,
            repeat: Infinity,
            delay: index * 1,
            ease: "easeOut"
          },
          children: "z"
        },
        index
      ))
    }
  );
}
function GenieBrandButton(props) {
  const {
    state,
    size = 36,
    disabled = false,
    loading = false,
    title = state === "awake" ? "Genie \u5DF2\u82CF\u9192" : "\u5524\u9192 Genie",
    themeMode = "light",
    dragVelocity = { x: 0, y: 0 },
    onClick
  } = props;
  const [hovered, setHovered] = React24.useState(false);
  const [mousePos, setMousePos] = React24.useState({ x: 0, y: 0 });
  const isDark = themeMode === "dark";
  const isActive = state !== "sleeping";
  const isWorking = state === "working";
  const palette = getGenieBrandPalette(themeMode);
  const handleMouseMove = React24.useCallback(
    (event) => {
      if (!isActive || disabled || state === "dragging") return;
      const rect = event.currentTarget.getBoundingClientRect();
      const x = clamp2((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1);
      const y = clamp2((event.clientY - rect.top) / rect.height * 2 - 1, -1, 1);
      setMousePos({ x, y });
    },
    [disabled, isActive, state]
  );
  const background = isActive ? palette.activeBackground : hovered ? palette.sleepingHoverBackground : "transparent";
  const boxShadow = isActive ? palette.activeInsetShadow : hovered ? palette.sleepingHoverShadow : "none";
  return /* @__PURE__ */ jsxs9(
    "button",
    {
      type: "button",
      "aria-label": title,
      title,
      disabled,
      "data-we-no-drag": "true",
      "data-genie-state": state,
      "data-theme": themeMode,
      onClick,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => {
        setHovered(false);
        setMousePos({ x: 0, y: 0 });
      },
      onMouseMove: handleMouseMove,
      style: {
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        padding: 0,
        border: "none",
        borderRadius: 999,
        background,
        boxShadow,
        color: isActive ? palette.activeColor : palette.inactiveColor,
        cursor: disabled ? "default" : "pointer",
        transition: "transform 220ms ease, box-shadow 240ms ease, background-color 240ms ease",
        overflow: "visible",
        outline: "none",
        pointerEvents: "auto",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none"
      },
      children: [
        /* @__PURE__ */ jsx21(AnimatePresence2, { children: isActive ? /* @__PURE__ */ jsxs9(Fragment5, { children: [
          /* @__PURE__ */ jsx21(
            motion2.div,
            {
              initial: { opacity: 0, scale: 0.8 },
              animate: { opacity: 1, scale: 1 },
              exit: { opacity: 0, scale: 0.8 },
              transition: { duration: 0.5 },
              style: {
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                background: "rgba(0, 143, 93, 0.20)",
                filter: "blur(12px)",
                pointerEvents: "none"
              }
            },
            "genie-face-glow"
          ),
          isWorking ? /* @__PURE__ */ jsx21(
            motion2.div,
            {
              "data-genie-working-ring": "true",
              initial: { opacity: 0.8, scale: 1 },
              animate: { opacity: 0, scale: 1.6 },
              exit: { opacity: 0 },
              transition: { duration: 1.5, repeat: Infinity, ease: "easeOut" },
              style: {
                position: "absolute",
                inset: 0,
                borderRadius: 999,
                border: `1px solid ${isDark ? "rgba(0, 214, 143, 0.40)" : "rgba(0, 143, 93, 0.35)"}`,
                pointerEvents: "none"
              }
            },
            "genie-working-ring"
          ) : null
        ] }) : null }),
        loading ? /* @__PURE__ */ jsx21(
          LoadingOutlined2,
          {
            spin: true,
            style: {
              position: "relative",
              zIndex: 1,
              fontSize: Math.max(16, Math.round(size * 0.42)),
              color: palette.activeColor
            }
          }
        ) : /* @__PURE__ */ jsxs9(Fragment5, { children: [
          /* @__PURE__ */ jsx21(
            AIFace,
            {
              state,
              themeMode,
              hovered,
              mousePos,
              dragVelocity,
              size
            }
          ),
          /* @__PURE__ */ jsx21(AnimatePresence2, { children: !isActive ? /* @__PURE__ */ jsx21(SleepingZzz, { themeMode }) : null })
        ] })
      ]
    }
  );
}
export {
  AnnotationViewer,
  GenieBrandButton,
  ProtoDevPanel,
  buildAnnotationPrompt,
  createAnnotationViewer,
  createProtoDevController,
  registerProtoDevControls as defineProtoDevControls,
  getProtoDevState,
  parseAnnotationMarkdownRecords,
  parseAnnotationsMarkdown,
  serializeAnnotationsMarkdown,
  setProtoDevState,
  subscribeProtoDevState,
  useProtoDevState
};
