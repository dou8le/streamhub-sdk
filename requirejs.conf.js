require.config({
  paths: {
    jquery: '/components/jquery/jquery',
    text: '/components/requirejs-text/text',
    base64: '/components/base64/base64',
    hogan: '/components/hogan/web/builds/2.0.0/hogan-2.0.0.amd',
    hgn: '/components/requirejs-hogan-plugin/hgn',
    json: '/components/requirejs-plugins/src/json',
    jasmine: '/components/jasmine/lib/jasmine-core/jasmine',
    'jasmine-html': '/components/jasmine/lib/jasmine-core/jasmine-html',
    'jasmine-jquery': '/components/jasmine-jquery/lib/jasmine-jquery',
    'event-emitter': '/components/event-emitter/src/event-emitter',
    inherits: '/components/inherits/inherits',
    blanket: '/components/blanket/dist/qunit/blanket',
    'blanket-jasmine': '/components/blanket/dist/jasmine/blanket_jasmine',
    'mout': '/components/mout/src',
    observer: '/components/observer/src/observer',
    debug: '/components/debug/debug'
  },
  packages: [{
    name: "streamhub-sdk",
    location: "/components/streamhub-sdk/src"
  },{
    name: "streamhub-sdk/auth",
    location: "/components/streamhub-sdk/src/auth"
  },{
    name: "streamhub-sdk/collection",
    location: "/components/streamhub-sdk/src/collection"
  },{
    name: "streamhub-sdk/content",
    location: "/components/streamhub-sdk/src/content"
  },{
    name: "streamhub-sdk/modal",
    location: "/components/streamhub-sdk/src/modal"
  },{
    name: "streamhub-sdk/ui",
    location: "/components/streamhub-sdk/src/ui"
  },{
    name: "streamhub-sdk/jquery",
    location: "/components/streamhub-sdk/src",
    main: "jquery"
  },{
    name: "streamhub-sdk-tests",
    location: "tests"
  },{
    name: "stream",
    location: "/components/stream/src"
  },{
    name: "view",
    location: "/components/view/src",
    main: "view"
  },{
    name: "auth",
    location: "/components/auth/src"
  },{
    name: "livefyre-auth",
    location: "/components/livefyre-auth/src"
  },{
    name: "livefyre-auth-tests",
    location: "/components/livefyre-auth/test"
  },{
    name: 'streamhub-share',
    location: '/components/streamhub-share/src',
    main: 'share-button.js'
  },{
    name: 'streamhub-ui',
    location: '/components/streamhub-ui/src'
  },{
    name: "livefyre-bootstrap",
    location: "/components/livefyre-bootstrap/src"
  }],
  shim: {
    jquery: {
        exports: '$'
    },
    jasmine: {
        exports: 'jasmine'
    },
    'jasmine-html': {
        deps: ['jasmine'],
        exports: 'jasmine'
    },
    'blanket-jasmine': {
        exports: 'blanket',
        deps: ['jasmine']
    },
    'jasmine-jquery': {
        deps: ['jquery']
    }
  }
});
