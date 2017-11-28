import template from 'babel-template';

/**
 * Generate a helper that will explicitly set up the prototype chain manually
 * for each constructed instance.
 */
const buildHelper = template(`
  function HELPER(cls){
    var setPrototypeOf = Object.setPrototypeOf || (function setPrototypeOf(a, b) {
      a.__proto__ = b;
    });
    var getPrototypeOf = Object.getPrototypeOf || (function getPrototypeOf(a) {
      return a.__proto__;
    });
    function ExtendableBuiltin(){
      // Not passing "newTarget" because core-js would fall back to non-exotic
      // object creation.
      var instance = new (Function.prototype.bind.apply(cls, arguments))();
      setPrototypeOf(instance, getPrototypeOf(this));
      return instance;
    }
    ExtendableBuiltin.prototype = Object.create(cls.prototype, {
      constructor: {
        value: cls,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });

    setPrototypeOf(ExtendableBuiltin, cls);
    return ExtendableBuiltin;
  }
`);

/**
 * Generate a helper that will approximate extending builtins with simple
 * ES5-style inheritance.
 *
 * This is essentially the behavior that was the default in Babel 5.
 */
const buildHelperApproximate = template(`
  function HELPER(cls){
    function ExtendableBuiltin(){
      cls.apply(this, arguments);
    }
    ExtendableBuiltin.prototype = Object.create(cls.prototype, {
      constructor: {
        value: cls,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
    if (Object.setPrototypeOf){
      Object.setPrototypeOf(ExtendableBuiltin, cls);
    } else {
      ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
  }
`);

export default function({types: t}){
  return {
    visitor: {
      Class(path){
        // Ensure we have globals to search for.
        const classes = this.opts.globals || [];
        if (classes.length === 0) return;

        // Ensure the class is extending something.
        const superClass = path.get('superClass');
        if (!superClass.node) return;

        // Ensure that the class is extending a variable matching one of the options.
        const matches = classes.some(name => superClass.isIdentifier({name}));
        if (!matches) return;

        // Ensure that this isn't a locally declared variable with the same name.
        if (path.scope.hasBinding(superClass.node.name, true /* noGlobals */)) return;

        const name = this.name || path.scope.generateUidIdentifier('extendableBuiltin');
        if (!this.name){
          const helper = (this.opts.approximate ? buildHelperApproximate : buildHelper)({
            HELPER: name,
          });
          path.scope.getProgramParent().path.unshiftContainer('body', helper);
        }

        path.get('superClass').replaceWith(t.callExpression(name, [
          path.get('superClass').node,
        ]));
      }
    }
  };
}
