define([
    'streamhub-sdk/jquery',
    'streamhub-sdk/view',
    'hgn!streamhub-sdk/content/templates/like',
    'inherits'
],
function($, View, likeTemplate, inherits) {
    'use strict';

    /**
     * A view that renders Opines of type LIKE
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the streamed content
     * @param opts.opine {LivefyreOpine} The LivefyreOpine object (Like) to display
     * @exports streamhub-sdk/content/views/like-view
     * @constructor
     */
    var LikeView = function(opts) {
        if (!opts.opine) {
            return;
        }
        this.opine = opts.opine || {};
        this._rendered = false;
        View.call(this);
    };
    inherits(LikeView, View);

    LikeView.prototype.template = likeTemplate;
    LikeView.prototype.elClass = "content-like";

    LikeView.prototype.setElement = function (element) {
        var ret = View.prototype.setElement.apply(this, arguments);
        this.$el.attr('data-like-id', this.opine.id);
        this.$el.attr('data-like-author-id', this.opine.author.id);
        return ret;
    };

    LikeView.prototype.render = function() {
        this._rendered = true;
        var context = $.extend({}, this.opine);
        this.$el.html(this.template(context));
    };

    return LikeView;
});
