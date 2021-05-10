#pragma once
#ifndef ENFORCE_STRICT
#define ENFORCE_STRICT
'use strict';
#endif
#include "hyperscript.js"
#include "request.js"
#include "mount-redraw.js"
#include "render.js"
#include "route.js"
#include "querystring/parse.js"
#include "querystring/build.js"
#include "pathname/parse.js"
#include "pathname/build.js"
#include "render/vnode.js"
#include "util/censor.js"


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
