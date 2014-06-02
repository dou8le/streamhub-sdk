define([
    'streamhub-sdk/jquery',
    'streamhub-sdk/view',
    'streamhub-sdk/content/views/like-view',
    'hgn!streamhub-sdk/content/templates/liked-by-list',
    'streamhub-sdk/content/types/livefyre-opine',
    'inherits'],
function($, View, LikeView, likedByListTemplate, LivefyreOpine, inherits) {
    'use strict';
    
    var DEFAULT_LABELS = {
        'viewAll': 'and {more} more'
    };

    /**
     * A View that displays the avatars of Likes.
     * @param opts {Object} A set of options to config the view with
     * @param opts.el {HTMLElement} The element in which to render the content
     * @param opts.content {Content} The content instance of which to display its likes
     * @param opts.limit {(Integer|Boolean)} Number of Likes to display by default.  Set to false to display all.
     * @param opts.labels {Object} Custom text labels
     * @param opts.labels.viewAll {String} Text for link to display all Likes.  Use string placeholder {more} to display number of items not shown.
     * @exports streamhub-sdk/views/liked-by-list-view
     * @constructor
     */
    var LikedByListView = function(opts) {
        var self = this;
        opts = opts || {};
        this._rendered = false;
        this._limit = ('limit' in opts) ? opts.limit : 6; // false to display all
        this._labels = $.extend({}, DEFAULT_LABELS, opts.labels || {});
        this.likeViews = { 'added': [], 'queued': [] };
        this.content = opts.content;

        View.call(this, opts);

        // Add the Likes that come in initial payload
        var likes = this.content.getLikes().reverse();
        for (var i=0; i < likes.length; i++) {
            this._addOrQueue(likes[i]);
        }

        /* New Like:
            - Prepend Like to list
            - If list length now exceeds this._limit:
                - Remove Like from end of displayed list and add to beginning of queue
        */
        this.content.on('opine', function(opine) {
            if(opine.relType === LivefyreOpine.enums.type.indexOf('LIKE')) {
                self.add(opine, true);
                if(self._limit && self.likeViews.added.length > self._limit) {
                    var toMove = self.likeViews.added.pop();
                    self.likeViews.queued.unshift(toMove.opine);
                    toMove.destroy();
                }
                self._renderMoreLink();
            }
        });

        /* Removed Like:
            - If all Likes are being displayed:
                - Remove Like from list
            - If only a subset of Likes is being displayed:
                - If the Like is queued, just remove from queue
                - If the Like is displayed, remove the Like from the list
                    - If there is a queue, remove Like from beginning of queue and add to end of list
        */
        this.content.on('removeOpine', function(opine) {
            if(opine.relType === LivefyreOpine.enums.type.indexOf('LIKE')) {

                var toRemove = self.getLikeView(opine);
                if (! toRemove) {
                    return false;
                }
                if(toRemove instanceof LivefyreOpine) {
                    self.likeViews.queued.splice(self.likeViews.queued.indexOf(toRemove), 1);
                } else {
                    self.likeViews.added.splice(self.likeViews.added.indexOf(toRemove), 1);
                    toRemove.destroy();
                    if(self.queued() > 0) {
                        var toAdd = self.likeViews.queued.shift();
                        self.add(toAdd);
                    }
                }
                self._renderMoreLink();
            }
        });
    };
    inherits(LikedByListView, View);

    LikedByListView.prototype.template = likedByListTemplate;
    LikedByListView.prototype.elClass = 'content-liked-by-list';
    LikedByListView.prototype.viewAllSelector = '.content-liked-by-all';
    LikedByListView.prototype.likeSelector = '.content-like';
    LikedByListView.prototype.listLengthAttribute = 'data-hub-list-length';

    LikedByListView.prototype.events = View.prototype.events.extended({
        'viewAllLikesClicked.hub': function(e) {
            this._limit = false;
            for(var i=0; i<this.likeViews.queued.length; i++) {
                this.add(this.likeViews.queued[i]);
            }
            this.likeViews.queued.length = 0;
            e.target.remove();
        }
    });

    /**
     * Set the element for the view to render in.
     * You will probably want to call .render() after this, but not always.
     * @param element {HTMLElement} The element to render this View in
     * @returns this
     */
    LikedByListView.prototype.setElement = function(element) {
        var ret = View.prototype.setElement.apply(this, arguments);
        this.$el.attr(this.listLengthAttribute, this.count());
        return ret;
    };

    LikedByListView.prototype.render = function() {
        var self = this;
        View.prototype.render.call(this);
        if(!this._rendered) {
            $.each(self.likeViews.added, function (i, likeView) {
                self._insert(likeView);
                likeView.render();
            });
        }
        this._renderMoreLink();
        this._rendered = true;
    };

    LikedByListView.prototype._renderMoreLink = function() {
        var $moreEl = this.$el.find(this.viewAllSelector);
        if(this._limit && this.queued() > 0) {
            $moreEl.html(this._labels.viewAll.replace(/\{more\}/, this.queued()));
            $moreEl.click(function(e) {
                $(e.target).trigger('viewAllLikesClicked.hub');
            }.bind(this));
        } else {
            $moreEl.empty();
            $moreEl.unbind('click');
        }
    };

    /**
     * Appends a new LikeView
     * @param likeView {LikeView} A LikeView instance to insert into the view
     * @param prepend {Boolean} Prepends LikeView before all other LikeViews in view if true
     */
    LikedByListView.prototype._insert = function(likeView, prepend) {
        if(prepend) {
            this.$el.prepend(likeView.$el);
        } else {
            this.$el.append(likeView.$el);
        }
    };

    /**
     * Adds or queues a Like according to this._limit setting
     * @param like {LivefyreOpine} A LivefyreOpine of type LIKE
     */
    LikedByListView.prototype._addOrQueue = function(like) {
        if(!like || this.getLikeView(like)) {
            return false;
        }
        if(this._limit === false || this.count() < this._limit) {
            return this.add(like);
        } else {
            this.queue(like);
            return false;
        }
    };

    /**
     * Adds a Like to the View, creating a LikeView for the Like and inserting it into the DOM if View has been rendered
     * @param like {LivefyreOpine} A LivefyreOpine of type LIKE
     * @param prepend {Boolean} Prepends LikeView before all other LikeViews in view if true
     */
    LikedByListView.prototype.add = function(like, prepend) {
        if(!like) {
            return false;
        }

        var likeView = this._createLikeView(like);
        if(prepend) {
            this.likeViews.added.unshift(likeView);
        } else {
            this.likeViews.added.push(likeView);
        }

        // Insert in .el
        if (this.el) {
            this._insert(likeView, prepend);
            // Update list length attribute
            this.$el.attr(this.listLengthAttribute, this.count());
        }

        if (this._rendered) {
            likeView.render();
        }
        return likeView;
    };

    /**
     * Adds a Like to the queue of unrendered Likes
     * @param like {LivefyreOpine} A LivefyreOpine of type LIKE
     */
    LikedByListView.prototype.queue = function(like) {
        if(!this.getLikeView(like)) {
            this.likeViews.queued.push(like);
        }
    };

    /**
     * Creates the view to render the Like 
     * @param opts {Object} Options for the LikeView constructor
     * @param opts.like {LivefyreOpine} A LivefyreOpine of type LIKE
     * @returns {LikeView} 
     */
    LikedByListView.prototype._createLikeView = function(like) {
        var likeView = new LikeView({ 'opine': like });
        return likeView;
    };

    /**
     * Locate a LikeView or LivefyreOpine in this.likeViews
     * @param like {(LikeView|LivefyreOpine)} The Like to search for.
     * @returns {(LikeView|LivefyreOpine|null)} The Like, or null.
     */
    LikedByListView.prototype.getLikeView = function(like) {
        var allLikes = [].concat(this.likeViews.added, this.likeViews.queued);
        for (var i=0; i < allLikes.length; i++) {
            var likeView = allLikes[i];
            if (like === likeView || likeView.opine && like === likeView.opine) {
                return likeView;
            }
        }
        return null;
    };

    /**
     * A count of the number of displayed likes for this content item
     * @returns {int} The number of displayed likes for this content item
     */
    LikedByListView.prototype.count = function() {
        return this.likeViews.added.length;
    };

    /**
     * A count of the number of queued likes for this content item
     * @returns {int} The number of queued likes for this content item
     */
    LikedByListView.prototype.queued = function() {
        return this.likeViews.queued.length;
    };

    /**
     * A count of the total number of likes for this content item
     * @returns {int} The total number of likes for this content item
     */
    LikedByListView.prototype.total = function() {
        return this.likeViews.added.length + this.likeViews.queued.length;
    };

    LikedByListView.prototype.destroy = function() {
        View.prototype.destroy.call(this);
    };

    return LikedByListView;
});
