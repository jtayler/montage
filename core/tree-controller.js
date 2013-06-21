
var Montage = require("core/core").Montage;
var Map = require("collections/map");

// A tree controller is a view-model that tracks whether each node in a
// corresponding data-model is expanded or collapsed.  It also produces a
// linearization of the visible iterations, transforming hierachical nesting
// into a flat, incrementally-updated array of iterations with the
// corresponding indentation depth.

// Bind a root node from the data model to a tree controller and bind the tree
// controller's iterations to a content controller for a repetition.

var Node = exports.TreeControllerNode = Montage.specialize({

    MEDIAL: {value: {
        ascii: " +-",
        up: true,
        down: true,
        right: true
    }},

    FINAL: {value: {
        ascii: " ^-",
        up: true,
        right: true
    }},

    BEFORE: {value: {
        ascii: " | ",
        up: true,
        down: true
    }},

    BEYOND: {value: {
        ascii: "   "
    }},

    constructor: {
        value: function TreeControllerNode() {
            this.super();

            this.content = null;
            this.expanded = true;
            this.parent = null;
            this.childrenPath = null;
            this.childNodes = [];

            // depth
            this.defineBinding("depth", {"<-": "(parent.depth + 1) ?? 0"});

            // childrenPath -> children
            this.defineBinding("children", {
                "<-": "content.path(childrenPath ?? 'children')"
            });

            // children -> childEntries
            this.defineBinding("childEntries", {
                "<-": "children.enumerate()"
            });

            // childEntries -> childNodes
            this.handleChildEntriesRangeChange(this.childEntries, [], 0);
            this.childEntries.addRangeChangeListener(this, "childEntries");

            // childNodes -> expansion
            this.defineBinding("expansion", {
                "<-": "expanded ? childNodes.flatten{iterations} : []"
            });

            // this + expansion -> iterations
            this.defineBinding("iterations", {
                "<-": "[this].concat(expansion)"
            });

            // line art hints
            this.defineBinding("parentIndex", {"<-": "entry.0"});
            this.defineBinding("last", {"<-": "parentIndex == parent.children.length - 1"});
            this.defineBinding("junction", {
                "<-": "last ? FINAL : MEDIAL"
            });
            this.defineBinding("followingJunction", {
                "<-": "last ? BEYOND : BEFORE"
            });
            this.defineBinding("followingJunctions", {
                "<-": "(parent.followingJunctions ?? []).concat([followingJunction])"
            });
            this.defineBinding("junctions", {
                "<-": "(parent.followingJunctions ?? []).concat([junction])"
            });

        }
    },

    init: {
        value: function (content, childrenPath, parent, entry) {
            this.parent = parent || null;
            this.content = content;
            this.childrenPath = childrenPath;
            this.entry = entry || [0, this];
            return this;
        }
    },

    handleChildEntriesRangeChange: {
        value: function (plus, minus, index) {
            this.childNodes.swap(
                index,
                minus.length,
                plus.map(function (entry) {
                    return new this.constructor().init(
                        entry[1],
                        this.childrenPath,
                        this,
                        entry
                    );
                }, this)
            );
        }
    }

});

exports.TreeController = Montage.specialize({

    content: {
        value: null
    },

    iterations: {
        value: null
    },

    root: {
        value: null
    },

    roots: {
        value: null
    },

    constructor: {
        value: function TreeController() {
            this.super();
            this.roots = new WeakMap();
            this.addOwnPropertyChangeListener("content", this);
            this.iterations = [];
            this.defineBinding("iterations.rangeContent()", {"<-": "root.iterations"});
        }
    },

    handleContentChange: {
        value: function (content) {
            if (!this.roots.has(content)) {
                this.roots.set(
                    content,
                    new this.Node().init(content, this.childrenPath)
                );
            }
            this.root = this.roots.get(content);
        }
    },

    Node: {
        value: Node
    }

});

