#pragma once
#include "util.js"

// Note: this is mildly perf-sensitive.
//
// It does *not* use `delete` - dynamic `delete`s usually cause objects to bail
// out into dictionary mode and just generally cause a bunch of optimization
// issues within engines.
//
// Ideally, I would've preferred to do this, if it weren't for the optimization
// issues:
//
// ```js
// const hasOwn = require("./hasOwn")
// const magic = [
//     "key", "oninit", "oncreate", "onbeforeupdate", "onupdate",
//     "onbeforeremove", "onremove",
// ]
// module.exports = (attrs, extras) => {
//     const result = Object.assign(Object.create(null), attrs)
//     for (const key of magic) delete result[key]
//     if (extras != null) for (const key of extras) delete result[key]
//     return result
// }
// ```

var magic = /^(?:key|oninit|oncreate|onbeforeupdate|onupdate|onbeforeremove|onremove)$/

export function censor(attrs, extras) {
	var result = {}

	if (extras != null) {
		for (var key in attrs) {
			if (hasOwn(attrs, key) && !magic.test(key) && extras.indexOf(key) < 0) {
				result[key] = attrs[key]
			}
		}
	} else {
		for (var key in attrs) {
			if (hasOwn(attrs, key) && !magic.test(key)) {
				result[key] = attrs[key]
			}
		}
	}

	return result
}
