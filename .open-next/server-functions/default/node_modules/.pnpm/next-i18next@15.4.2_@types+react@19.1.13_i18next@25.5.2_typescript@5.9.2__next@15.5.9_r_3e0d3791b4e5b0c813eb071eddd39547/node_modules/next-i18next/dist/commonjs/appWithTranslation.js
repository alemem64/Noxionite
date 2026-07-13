"use strict";

require("core-js/modules/es.symbol.js");
require("core-js/modules/es.array.filter.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.object.get-own-property-descriptor.js");
require("core-js/modules/es.array.for-each.js");
require("core-js/modules/web.dom-collections.for-each.js");
require("core-js/modules/es.object.get-own-property-descriptors.js");
require("core-js/modules/es.object.define-properties.js");
require("core-js/modules/es.object.define-property.js");
require("core-js/modules/es.array.iterator.js");
require("core-js/modules/es.string.iterator.js");
require("core-js/modules/es.weak-map.js");
require("core-js/modules/web.dom-collections.iterator.js");
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _typeof = require("@babel/runtime/helpers/typeof");
Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Trans", {
  enumerable: true,
  get: function get() {
    return _reactI18next.Trans;
  }
});
exports.globalI18n = exports.appWithTranslation = void 0;
Object.defineProperty(exports, "useTranslation", {
  enumerable: true,
  get: function get() {
    return _reactI18next.useTranslation;
  }
});
Object.defineProperty(exports, "withTranslation", {
  enumerable: true,
  get: function get() {
    return _reactI18next.withTranslation;
  }
});
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
require("core-js/modules/es.object.keys.js");
var _react = _interopRequireWildcard(require("react"));
var _hoistNonReactStatics = _interopRequireDefault(require("hoist-non-react-statics"));
var _reactI18next = require("react-i18next");
var _createConfig = require("./config/createConfig");
var _createClient = _interopRequireDefault(require("./createClient"));
var _utils = require("./utils");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != _typeof(e) && "function" != typeof e) return { "default": e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n["default"] = e, t && t.set(e, n), n; }
var __jsx = _react["default"].createElement;
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var globalI18n = exports.globalI18n = null;
var addResourcesToI18next = function addResourcesToI18next(instance, resources) {
  if (resources && instance.isInitialized) {
    for (var _i = 0, _Object$keys = Object.keys(resources); _i < _Object$keys.length; _i++) {
      var locale = _Object$keys[_i];
      for (var _i2 = 0, _Object$keys2 = Object.keys(resources[locale]); _i2 < _Object$keys2.length; _i2++) {
        var _instance$store;
        var ns = _Object$keys2[_i2];
        if (!(instance !== null && instance !== void 0 && (_instance$store = instance.store) !== null && _instance$store !== void 0 && _instance$store.data) || !instance.store.data[locale] || !instance.store.data[locale][ns]) {
          instance.addResourceBundle(locale, ns, resources[locale][ns], true, true);
        }
      }
    }
  }
};
var appWithTranslation = exports.appWithTranslation = function appWithTranslation(WrappedComponent) {
  var configOverride = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var AppWithTranslation = function AppWithTranslation(props) {
    var _nextI18Next$initialL, _props$router;
    var _ref = props.pageProps || {},
      _nextI18Next = _ref._nextI18Next; // pageProps may be undefined on strange setups, i.e. https://github.com/i18next/next-i18next/issues/2109
    var locale = (_nextI18Next$initialL = _nextI18Next === null || _nextI18Next === void 0 ? void 0 : _nextI18Next.initialLocale) !== null && _nextI18Next$initialL !== void 0 ? _nextI18Next$initialL : props === null || props === void 0 || (_props$router = props.router) === null || _props$router === void 0 ? void 0 : _props$router.locale;
    var ns = _nextI18Next === null || _nextI18Next === void 0 ? void 0 : _nextI18Next.ns;
    var instanceRef = (0, _react.useRef)(null);

    /**
     * Memoize i18n instance and reuse it rather than creating new instance.
     * When the locale or resources are changed after instance was created,
     * we will update the instance by calling addResourceBundle method on it.
     */
    var i18n = (0, _react.useMemo)(function () {
      var _userConfig$i18n;
      if (!_nextI18Next && !configOverride) return null;
      var userConfig = configOverride !== null && configOverride !== void 0 ? configOverride : _nextI18Next === null || _nextI18Next === void 0 ? void 0 : _nextI18Next.userConfig;
      if (!userConfig) {
        throw new Error('appWithTranslation was called without a next-i18next config');
      }
      if (!(userConfig !== null && userConfig !== void 0 && userConfig.i18n)) {
        throw new Error('appWithTranslation was called without config.i18n');
      }
      if (!(userConfig !== null && userConfig !== void 0 && (_userConfig$i18n = userConfig.i18n) !== null && _userConfig$i18n !== void 0 && _userConfig$i18n.defaultLocale)) {
        throw new Error('config.i18n does not include a defaultLocale property');
      }
      var _ref2 = _nextI18Next || {},
        initialI18nStore = _ref2.initialI18nStore;
      var resources = configOverride !== null && configOverride !== void 0 && configOverride.resources ? configOverride.resources : initialI18nStore;
      if (!locale) locale = userConfig.i18n.defaultLocale;
      var instance = instanceRef.current;
      if (instance) {
        addResourcesToI18next(instance, resources);
      } else {
        instance = (0, _createClient["default"])(_objectSpread(_objectSpread(_objectSpread({}, (0, _createConfig.createConfig)(_objectSpread(_objectSpread({}, userConfig), {}, {
          lng: locale
        }))), {}, {
          lng: locale
        }, ns && {
          ns: ns
        }), {}, {
          resources: resources
        })).i18n;
        addResourcesToI18next(instance, resources);
        exports.globalI18n = globalI18n = instance;
        instanceRef.current = instance;
      }
      return instance;
    }, [_nextI18Next, locale, ns]);

    /**
     * Since calling changeLanguage method on existing i18n instance cause state update in react,
     * we need to call the method in `useLayoutEffect` to prevent state update in render phase.
     */
    (0, _utils.useIsomorphicLayoutEffect)(function () {
      if (!i18n || !locale) return;
      i18n.changeLanguage(locale);
    }, [i18n, locale]);
    return i18n !== null ? __jsx(_reactI18next.I18nextProvider, {
      i18n: i18n
    }, __jsx(WrappedComponent, props)) : __jsx(WrappedComponent, (0, _extends2["default"])({
      key: locale
    }, props));
  };
  return (0, _hoistNonReactStatics["default"])(AppWithTranslation, WrappedComponent);
};