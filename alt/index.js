#pragma once
#ifndef ENFORCE_STRICT
#define ENFORCE_STRICT
'use strict';
#endif
#include "render/hyperscript.js"
#include "request.js"
#include "render/render.js"
#include "api/mount-redraw.js"
#include "api/router.js"
#include "querystring/parse.js"
#include "querystring/build.js"
#include "pathname/parse.js"
#include "pathname/build.js"
#include "render/vnode.js"
#include "censor.js"

#define defnull(o) typeof o !== "undefined" ? o : null
var _window = defnull(window)

var render = _render(_window)
var mountRedraw = _mountRedraw(render, defnull(requestAnimationFrame), defnull(console));
var request = _request(_window, Promise, mountRedraw.redraw)
var route = _router(_window, mountRedraw);

#undef defnull

var m = function() { return hyperscript.apply(this, arguments) }
m.m = hyperscript
m.trust = hyperscript.trust
m.fragment = hyperscript.fragment
m.mount = mountRedraw.mount
m.route = route;
m.render = render
m.redraw = mountRedraw.redraw
m.request = request.request
m.parseQueryString = parseQueryString
m.buildQueryString = buildQueryString
m.parsePathname = parsePathname
m.buildPathname = buildPathname
m.vnode = Vnode;
m.censor = censor;
