var inherits = require('inherits');
var ContentView = require('streamhub-sdk/content/views/content-view');
var asCardContentView = require('streamhub-sdk/content/views/mixins/card-content-view-mixin');
var asTwitterContentView = require('streamhub-sdk/content/views/mixins/twitter-content-view-mixin');

'use strict';

/**
 * A view for rendering twitter content into an element.
 * @param opts {Object} The set of options to configure this view with (See LivefyreContentView).
 * @exports streamhub-sdk/content/views/twitter-content-view
 * @constructor
 */
var TwitterContentView = function (opts) {
    opts = opts || {};
    this.content = opts.content;

    ContentView.apply(this, arguments);
    asCardContentView(this);
    asTwitterContentView(this);
};
inherits(TwitterContentView, ContentView);

module.exports = TwitterContentView;
