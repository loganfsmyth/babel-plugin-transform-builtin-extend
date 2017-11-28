'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

exports.default = function (_ref) {
    var t = _ref.types;

    return {
        visitor: {
            Class: function Class(path) {
                // Ensure we have globals to search for.
                var classes = this.opts.globals || [];
                if (classes.length === 0) return;

                // Ensure the class is extending something.
                var superClass = path.get('superClass');
                if (!superClass.node) return;

                // Ensure that the class is extending a variable matching one of the options.
                var matches = classes.some(function (name) {
                    return superClass.isIdentifier({ name: name });
                });
                if (!matches) return;

                // Ensure that this isn't a locally declared variable with the same name.
                if (path.scope.hasBinding(superClass.node.name, true /* noGlobals */)) return;

                var name = this.name || path.scope.generateUidIdentifier('extendableBuiltin');
                if (!this.name) {
                    var helper = (this.opts.approximate ? buildHelperApproximate : buildHelper)({
                        HELPER: name
                    });
                    path.scope.getProgramParent().path.unshiftContainer('body', helper);
                }

                path.get('superClass').replaceWith(t.callExpression(name, [path.get('superClass').node]));
            }
        }
    };
};

var _babelTemplate = require('babel-template');

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Generate a helper that will explicitly set up the prototype chain manually
 * for each constructed instance.
 */
var buildHelper = (0, _babelTemplate2.default)('\n    function HELPER(cls){\n        var setPrototypeOf = Object.setPrototypeOf || (function setPrototypeOf(a, b) {\n            a.__proto__ = b;\n        });\n        var getPrototypeOf = Object.getPrototypeOf || (function getPrototypeOf(a)) {\n            return a.__proto__;\n        });\n        function ExtendableBuiltin(){\n            // Not passing "newTarget" because core-js would fall back to non-exotic\n            // object creation.\n            var instance = new (Function.prototype.bind.apply(cls, arguments))();\n            setPrototypeOf(instance, getPrototypeOf(this));\n            return instance;\n        }\n        ExtendableBuiltin.prototype = Object.create(cls.prototype, {\n            constructor: {\n                value: cls,\n                enumerable: false,\n                writable: true,\n                configurable: true,\n            },\n        });\n\n        setPrototypeOf(ExtendableBuiltin, cls);\n        return ExtendableBuiltin;\n    }\n');

/**
 * Generate a helper that will approximate extending builtins with simple
 * ES5-style inheritance.
 *
 * This is essentially the behavior that was the default in Babel 5.
 */
var buildHelperApproximate = (0, _babelTemplate2.default)('\n    function HELPER(cls){\n        function ExtendableBuiltin(){\n            cls.apply(this, arguments);\n        }\n        ExtendableBuiltin.prototype = Object.create(cls.prototype, {\n            constructor: {\n                value: cls,\n                enumerable: false,\n                writable: true,\n                configurable: true,\n            },\n        });\n        if (Object.setPrototypeOf){\n            Object.setPrototypeOf(ExtendableBuiltin, cls);\n        } else {\n            ExtendableBuiltin.__proto__ = cls;\n        }\n\n        return ExtendableBuiltin;\n    }\n');