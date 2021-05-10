#pragma once
#include "mount-redraw.js"
#include "api/router.js"
//module.exports = require("./api/router")(typeof window !== "undefined" ? window : null, mountRedraw)

var route = _router(typeof window !== "undefined" ? window : null, mountRedraw);
