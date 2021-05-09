"use strict";

var m = require("./index")
if (typeof window !== "undefined") window.m = m
else module["exports"] = m
