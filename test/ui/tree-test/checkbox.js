
var AbstractCheckbox = require("montage/ui/base/abstract-checkbox").AbstractCheckbox;

exports.Checkbox = AbstractCheckbox.specialize({

    hasTemplate: {value: false},

    enterDocument: {
        value: function(firstTime) {
            if (firstTime) {
                this._element.addEventListener("change", this);
            }
        }
    },

    handleChange: {
        enumerable: false,
        value: function(event) {
            Object.getPropertyDescriptor(this, "checked").set.call(this,
                this.element.checked, true);
            this._dispatchActionEvent();
        }
    }

});

