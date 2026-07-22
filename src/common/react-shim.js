const R = window.React;
const RJSXRuntime = window.ReactJSXRuntime || {};

export default R;

export const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useContext,
  useReducer,
  useLayoutEffect,
  useImperativeHandle,
  useDebugValue,
  useDeferredValue,
  useTransition,
  useId,
  useSyncExternalStore,
  useInsertionEffect,

  forwardRef,
  memo,
  createElement,
  Fragment,
  Component,
  PureComponent,
  createContext,
  createRef,
  lazy,
  Suspense,
  StrictMode,
  Profiler,
  Children,
  cloneElement,
  isValidElement,
  createFactory,
  startTransition,
  act,
  version,
} = R;

// JSX Runtime exports for modern React
export const jsx = RJSXRuntime.jsx || createElement;
export const jsxs = RJSXRuntime.jsxs || createElement;
export const jsxDEV = RJSXRuntime.jsxDEV || createElement;
