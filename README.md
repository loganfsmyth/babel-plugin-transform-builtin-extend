
# Babel Builtin Constructor extension plugin

This is a Babel 6 plugin to enable extending builtin types like "Error" and "Array" and such,
which require special treatment and require static analysis to detect.


## Usage

In your Babel 6 configuration, for example in a `.babelrc` you might have


```
{
    "plugins": [
        ["babel-plugin-transform-builtin-extend", {
            globals: ["Error", "Array"]
        }]
    ]
}
```

which would enable the plugin and configure it to look for any class extending `Error` or `Array` globals.

## IE<=10

On older browsers that do not support reassigning the prototype of an existing object, you will need to
enable the `approximate` mode, which will fall back to the Babel 5 behavior of using simple ES5 inheritance
to approximate extending a class, though your results may vary depending on your goals.


```
{
    "plugins": [
        ["babel-plugin-transform-builtin-extend", {
            globals: ["Error", "Array"],
            approximate: true
        }]
    ]
}
```

## Limitations

This plugin will only reles on assigning `__proto__` for static property inheritance from parent constructors.
If you are relying on this, it will not work on IE<=10 and any other browsers that don't support `__proto__`.
