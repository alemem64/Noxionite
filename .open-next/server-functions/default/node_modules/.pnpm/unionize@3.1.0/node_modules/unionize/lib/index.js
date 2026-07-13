"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
function unionize(record, config) {
    var _a = config || {}, _b = _a.value, valProp = _b === void 0 ? undefined : _b, _c = _a.tag, tagProp = _c === void 0 ? 'tag' : _c;
    var creators = {};
    var _loop_1 = function (tag) {
        creators[tag] = (function (value) {
            var _a, _b;
            if (value === void 0) { value = {}; }
            return valProp ? (_a = {}, _a[tagProp] = tag, _a[valProp] = value, _a) : __assign({}, value, (_b = {}, _b[tagProp] = tag, _b));
        });
    };
    for (var tag in record) {
        _loop_1(tag);
    }
    var is = {};
    var _loop_2 = function (tag) {
        is[tag] = (function (variant) { return variant[tagProp] === tag; });
    };
    for (var tag in record) {
        _loop_2(tag);
    }
    function evalMatch(variant, cases, defaultCase) {
        if (defaultCase === void 0) { defaultCase = cases.default; }
        var handler = cases[variant[tagProp]];
        return handler ? handler(valProp ? variant[valProp] : variant) : defaultCase(variant);
    }
    var match = function (first, second) {
        return second ? evalMatch(first, second) : function (variant) { return evalMatch(variant, first); };
    };
    var identity = function (x) { return x; };
    var transform = function (first, second) {
        return second
            ? evalMatch(first, second, identity)
            : function (variant) { return evalMatch(variant, first, identity); };
    };
    var as = {};
    var _loop_3 = function (expectedTag) {
        var _a;
        as[expectedTag] = match((_a = {},
            _a[expectedTag] = function (x) { return x; },
            _a.default = function (val) {
                throw new Error("Attempted to cast " + val[tagProp] + " as " + expectedTag);
            },
            _a));
    };
    for (var expectedTag in record) {
        _loop_3(expectedTag);
    }
    return Object.assign({
        is: is,
        as: as,
        match: match,
        transform: transform,
        _Record: record,
    }, creators);
}
exports.unionize = unionize;
/**
 * Creates a pseudo-witness of a given type. That is, it pretends to return a value of
 * type `T` for any `T`, but it's really just returning `undefined`. This white lie
 * allows convenient expression of the value types in the record you pass to `unionize`.
 */
exports.ofType = function () { return undefined; };
exports.default = unionize;
//# sourceMappingURL=index.js.map