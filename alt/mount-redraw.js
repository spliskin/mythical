#pragma once
#include "render.js"
#include "api/mount-redraw.js"

var mountRedraw = _mountRedraw(render, typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : null, typeof console !== "undefined" ? console : null);
