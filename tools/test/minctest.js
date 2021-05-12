// Originally based on
// MINCTEST - Minimal Test Library
// This is based on minctest.h (https://codeplea.com/minctest)
//
// Copyright (c) 2014-2017 Lewis Van Winkle
//
// http://CodePlea.com
//
// This software is provided 'as-is', without any express or implied
// warranty. In no event will the authors be held liable for any damages
// arising from the use of this software.
//
// Permission is granted to anyone to use this software for any purpose,
// including commercial applications, and to alter it and redistribute it
// freely, subject to the following restrictions:
//
// 1. The origin of this software must not be misrepresented; you must not
//    claim that you wrote the original software. If you use this software
//    in a product, an acknowledgement in the product documentation would be
//    appreciated but is not required.
// 2. Altered source versions must be plainly marked as such, and must not be
//    misrepresented as being the original software.
// 3. This notice may not be removed or altered from any source distribution.


// MINCTEST - Minimal testing library for Node.js
//
//
// Example:
//
// var l = require("./minctest");
//
// l.run("test1", function(){
//   l.ok('a' == 'a');          //assert true
// });
//
// l.run("test2", function(){
//   l.equal(5, 6);             //compare integers
//   l.fequal(5.5, 5.6);        //compare floats
// });
//
// return l.results();           //show results
//

var LTEST_FLOAT_TOLERANCE = 0.001;
var ltests = 0;
var lfails = 0;

var ltitlePadding = 16;
var ltabsize = 4;
var tablevel = 0;
var lfailures = [];
var lmultiple=false;
var lfinal = false;
var lrun = false;
var lpreruncb = false;

function format(str, arr) {
    var i = -1;
    function callback(exp, p0, p1, p2, p3, p4) {
        if (exp == '%%') return '%';
        if (arr[++i] === undefined) return undefined;
        exp = p2 ? parseInt(p2.substr(1)) : undefined;
        var base = p3 ? parseInt(p3.substr(1)) : undefined;
        var val;
        switch (p4) {
            case 's': val = arr[i]; break;
            case 'c': val = arr[i][0]; break;
            case 'f': val = parseFloat(arr[i]).toFixed(exp); break;
            case 'p': val = parseFloat(arr[i]).toPrecision(exp); break;
            case 'e': val = parseFloat(arr[i]).toExponential(exp); break;
            case 'x': val = parseInt(arr[i]).toString(base ? base : 16); break;
            case 'd': val = parseFloat(parseInt(arr[i], base ? base : 10).toPrecision(exp)).toFixed(0); break;
        }
        val = typeof (val) == 'object' ? serialize(val) : val.toString(base);
        var sz = parseInt(p1); /* padding size */
        var ch = p1 && p1[0] == '0' ? '0' : ' '; /* isnull? */
        while (val.length < sz) val = p0 !== undefined ? val + ch : ch + val; /* isminus? */
        return val;
    }
    var regex = /%(-)?(0?[0-9]+)?([.][0-9]+)?([#][0-9]+)?([scfpexd%])/g;
    return str.replace(regex, callback);
}

const stdlog = (typeof window !== 'undefined' && typeof console !== 'undefined' && console.log) ? console.log : process.stdout.write.bind(process.stdout);
const sprintf = (fmt, ...args) => format(fmt, arg);
const printf = (fmt, ...args) => stdlog(format(fmt, args));
const serialize = (a) => JSON.stringify(a);
const makeTab = (tlevel = 0) => " ".repeat(ltabsize).repeat(tlevel);

function titlePad(padMax = 16) {
    ltitlePadding = padMax;
}

function tabsize(size = 4) {
    ltabsize = size;
}

function clock(x) {
    if (x) {
        const elapsed = process.hrtime(x);
        return Math.floor(elapsed[0] * 1000 + elapsed[1] * 1e-6);
    }

    return process.hrtime();
}

function caller() {
    var st = new Error().stack;
    st = st.split(/\r?\n/)[3];
    st = st.substr(st.indexOf("at ") + 3);
    return st;
}

function results() {
    if (!lmultiple || (lmultiple && lfinal)) {
        if (!lrun) {
            printf("\nNO TESTS RUN (%d/%d)\n\n", ltests, ltests);
        }
        else if (lfails === 0) {
            printf("\nALL TESTS PASSED (%d/%d)\n\n", ltests, ltests);
        }
        else {
            printf("\nSOME TESTS FAILED (%d/%d)\n\n", ltests - lfails, ltests);
        }
    }
    return lfails !== 0;
}

function final() {
    lfinal=true;
    return results();
}

function setfinalization() {
    lmultiple=true;
    lfinal=false;
}

function bench(cb) {
    lastResult = false;
    let start = clock();
    cb();
    return clock(start);
}

function title(msg) {
    printf(`%-${ltitlePadding}s\n`, `${makeTab(tablevel)}${msg}`);
}

function group(name, cb) {
    printf("%s\n", makeTab(tablevel++) + name);
    cb();
    printf("\n");
    if (lpreruncb !== null && lpreruncb.tablevel == tablevel) {
        lpreruncb = null;
    }
    tablevel--;
}

function beforeEach(cb) {
    lpreruncb = cb;
    lpreruncb.tablevel = tablevel;
}

function run(name, testfunc) {
    lrun = true;

    var tab = makeTab(tablevel);
    var ts = ltests;
    var fs = lfails;
    printf(`%-${ltitlePadding}s`, tab + name);

    if (typeof lpreruncb === 'function')
        lpreruncb();

    var timed = bench(testfunc);
    printf(":: pass: %4d   fail: %4d   %4d ms\n", (ltests - ts) - (lfails - fs), lfails - fs, timed);

    tab = tab + makeTab(1);
    var failed = lfailures.length;
    if (lfailures.length) {
        printf("%sFailures:\n", tab);
        tab = tab + makeTab(1);
        for(var i=0, len=lfailures.length; i < len; i++) {
            printf(`%s%s\n`, tab, lfailures[i]);
        }
        printf("\n");
        lfailures = [];
    }
    return failed;
}

function pass(passed, msg) {
    ltests++;
    if (!passed) {
        lfails++;
        lfailures.push(msg);
        return false;
    }

    return true;
}

function ok(test) {
    pass(test, caller() + ' error');
}

function equal(a, b) {
    pass(a === b, caller() + ' (' + a + ' !== ' + b + ')');
}

function lequal(a, b) {
    pass(a == b, caller() + ' (' + a + ' !== ' + b + ')');
}

function fequal(a, b) {
    pass(Math.abs(a - b) <= LTEST_FLOAT_TOLERANCE, caller() + ' (' + a + ' != ' + b + ')');
}

function exists(obj) {
    return pass(!(obj === (void 0) || typeof (obj) == 'undefined' || obj === null), caller() + " object doesn't exist");
}

function isArray(a) {
    pass(!!a && a.constructor === Array, a.constructor + " isn't an Array");
}

function isNumber(a) {
    pass(!isNaN(parseFloat(a)) && isFinite(a), serialize(a) + " isn't a number");
}

function notEqual(a, b) {
    pass(a !== b, caller() + ' (' + a + ' === ' + b + ')');
}

function lnotEqual(a, b) {
    pass(a != b, caller() + ' (' + a + ' === ' + b + ')');
}

function deepEqual(a, b) {
    var sa = serialize(a);
    var sb = serialize(b);
    pass(sa === sb, sa + ' != ' + sb);
}

function wait(fn) {
    return async () => await new Promise((res) => fn(res))
}

exports = module.exports = {
    printf,
    sprintf,
    titlePad,
    tabsize,
    title,
    results,
    run,
    ok,
    fequal,
    equal,     // equal is a STRICT comparison now as well
    notEqual,  // notEqual is a STRICT comparison
    lequal,    // relaxed equality comparison
    lnotEqual,
    deepEqual,
    exists,
    isNumber,
    isArray,
    group,
    wait,
    final,
    setfinalization,
    bench,
    beforeEach
};
