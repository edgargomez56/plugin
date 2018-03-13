"use strict";

requirejs.config({
    waitSeconds: 30,
    paths: {
        'knockout': 'lib/knockout/dist/knockout',
        'signals': 'lib/signals/dist/signals.min',

        'domReady': 'lib/requirejs-domready/domReady',

        'ofsc-connector': 'ofsc-connector',
        'plugin-app': 'plugin-app'
    },
    map: {
        '*': {
            'css': 'lib/require-css/css.min',
            'text': 'lib/requirejs-text/text'
        }
    }
});

require(['plugin-app/app', 'domReady!'], (PluginApp) => {
    let app = new PluginApp(document.querySelector('body'));
    app.start();

    // for debug:
    window.app = app;
});
