#pragma once

#include "mount-redraw.js"
//module.exports = require("./request/request")(typeof window !== "undefined" ? window : null, Promise, mountRedraw.redraw)
#include "request/request.js"

var request = _request(typeof window !== "undefined" ? window : null, Promise, mountRedraw.redraw)
