#pragma once
#ifndef ENFORCE_STRICT
#define ENFORCE_STRICT
'use strict';
#endif
#ifndef TARGET_NODE
#define target window
#else
#define target module.exports
#endif
(function() {
#include "index.js"

target.m = m
})();

#undef target
