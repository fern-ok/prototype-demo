// react-dom-shim.js
const RD = window.ReactDOM;

export default RD;

// ReactDOM 18+ (createRoot / hydrateRoot)
export const {
  createRoot,
  hydrateRoot,

  // ReactDOM 17 兼容 API（一些环境仍然可能需要）
  render,
  hydrate,
  unmountComponentAtNode,
  findDOMNode,

  // Server side features (如果 CDN 提供)
  createPortal,

  // React 18 Transition API（可能存在）
  flushSync,
  unstable_batchedUpdates,
  unstable_renderSubtreeIntoContainer,
} = RD;