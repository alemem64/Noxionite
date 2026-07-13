import React, { forwardRef, useRef, useMemo, useCallback, useImperativeHandle, useState, useEffect, useLayoutEffect } from 'react';
import { omit } from 'jerrypick';

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _arrayWithoutHoles(r) {
  if (Array.isArray(r)) return _arrayLikeToArray(r);
}
function _iterableToArray(r) {
  if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = true,
      o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = true, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _toConsumableArray(r) {
  return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

function index (kapsuleComponent) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    _ref$wrapperElementTy = _ref.wrapperElementType,
    wrapperElementType = _ref$wrapperElementTy === void 0 ? 'div' : _ref$wrapperElementTy,
    _ref$nodeMapper = _ref.nodeMapper,
    nodeMapper = _ref$nodeMapper === void 0 ? function (node) {
      return node;
    } : _ref$nodeMapper,
    _ref$methodNames = _ref.methodNames,
    methodNames = _ref$methodNames === void 0 ? [] : _ref$methodNames,
    _ref$initPropNames = _ref.initPropNames,
    initPropNames = _ref$initPropNames === void 0 ? [] : _ref$initPropNames;
  return /*#__PURE__*/forwardRef(function (props, ref) {
    var domEl = useRef();

    // instantiate the inner kapsule component with the defined initPropNames
    var comp = useMemo(function () {
      var configOptions = Object.fromEntries(initPropNames.filter(function (p) {
        return props.hasOwnProperty(p);
      }).map(function (prop) {
        return [prop, props[prop]];
      }));
      return kapsuleComponent(configOptions);
    }, []);
    useEffectOnce(function () {
      comp(nodeMapper(domEl.current)); // mount kapsule synchronously on this element ref, optionally mapped into an object that the kapsule understands
    }, useLayoutEffect);
    useEffectOnce(function () {
      // invoke destructor on unmount, if it exists
      return comp._destructor instanceof Function ? comp._destructor : undefined;
    });

    // Call a component method
    var _call = useCallback(function (method) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      return comp[method] instanceof Function ? comp[method].apply(comp, args) : undefined;
    } // method not found
    , [comp]);

    // propagate component props that have changed
    var prevPropsRef = useRef({});
    Object.keys(omit(props, [].concat(_toConsumableArray(methodNames), _toConsumableArray(initPropNames)))) // initPropNames or methodNames should not be called
    .filter(function (p) {
      return prevPropsRef.current[p] !== props[p];
    }).forEach(function (p) {
      return _call(p, props[p]);
    });
    prevPropsRef.current = props;

    // bind external methods to parent ref
    useImperativeHandle(ref, function () {
      return Object.fromEntries(methodNames.map(function (method) {
        return [method, function () {
          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }
          return _call.apply(void 0, [method].concat(args));
        }];
      }));
    }, [_call]);
    return /*#__PURE__*/React.createElement(wrapperElementType, {
      ref: domEl
    });
  });
}

//

// Handle R18 strict mode double mount at init
function useEffectOnce(effect) {
  var useEffectFn = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : useEffect;
  var destroyFunc = useRef();
  var effectCalled = useRef(false);
  var renderAfterCalled = useRef(false);
  var _useState = useState(0),
    _useState2 = _slicedToArray(_useState, 2);
    _useState2[0];
    var setVal = _useState2[1];
  if (effectCalled.current) {
    renderAfterCalled.current = true;
  }
  useEffectFn(function () {
    // only execute the effect first time around
    if (!effectCalled.current) {
      destroyFunc.current = effect();
      effectCalled.current = true;
    }

    // this forces one render after the effect is run
    setVal(function (val) {
      return val + 1;
    });
    return function () {
      // if the comp didn't render since the useEffect was called,
      // we know it's the dummy React cycle
      if (!renderAfterCalled.current) return;
      if (destroyFunc.current) destroyFunc.current();
    };
  }, []);
}

export { index as default };
