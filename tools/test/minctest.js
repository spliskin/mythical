// This was originall based on minctest.h (https://codeplea.com/minctest)
// Copyright (c) 2014-2017 Lewis Van Winkle
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

function sprintf(str, arr) {
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

const log = (typeof window !== 'undefined' && typeof console !== 'undefined' && console.log) ? console.log : process.stdout.write.bind(process.stdout);
const printf = (fmt, ...args) => log(sprintf(fmt, args));

const TABSIZE = 4;
const _colors = {
    reset: "\x1b[0m",
    fgYellow: "\x1b[33m",
    fgGreen: "\x1b[32m",
    fgRed: "\x1b[31m",
};
const colorize = (str, color=_colors.fgYellow) => `${color}${str}${_colors.reset}`;
const Color = {
    Yellow: (str) => colorize(str, _colors['fgYellow']),
    Green: (str) => colorize(str, _colors['fgGreen']),
    Red: (str) => colorize(str, _colors['fgRed']),
};
const makeTab = (tlevel = 0) => ' '.repeat(TABSIZE * tlevel);
const ellide = (str, length=30) => `...${str.substr(str.length-(length-3))}`;
const serialize = (a) => JSON.stringify(a);

function clock(x=null) {
    if (x) {
        const elapsed = process.hrtime(x);
        return elapsed[0] * 1000 + elapsed[1] * 1e-6;
    }

    return process.hrtime();
}

function caller(stackpos = 0) {
    var st = new Error().stack;
    st = st.split(/\r?\n/)[stackpos]; // stack unwind
    st = st.substr(st.indexOf("at ") + 3);
    return ellide(st);
}

const wait = (fn) => async () => new Promise(fn);

class Stack extends Array {
    top = () => this.length ? this[this.length-1] : null;
}

const TEST_FLOAT_TOLERANCE = 0.001;
var stack = new Stack;
var beforeStack = new Stack;
var ctest = null;
var tablevel = 0;
var titlePadding = 40;
var hasrun = false;
var counts = [ 0, 0, 0 ];

function beforeList() {
    return beforeStack.top() ?? [];
}

class Test {
    constructor(title, cb=()=>{}) {
        this._title = "";
        this.title = title;
        this.fn = cb;
        this.before = [];
        this.list = [];
        this.counts = [ 0, 0, 0 ];
    }

    setTitle(title) {
        this._title = title;
    }

    push(test) {
        this.list.push(test);
    }

    beforeEach(fn) {
        this.before.push(fn);
    }

    async run() {
        stack.push(this);
        const cpad = titlePadding - (TABSIZE*tablevel);
        const tab = makeTab(tablevel++);

        if (this._title.length) {
            printf(`\n${tab}%-${cpad}s\n`, this._title);
        }

        printf(`${tab}%-${cpad}s\n`, `${Color.Yellow(this.title)}`);
        await this.fn();
        if (this.before.length)
            beforeStack.push(this.before);

        for(var t of this.list) {
            for(var b of beforeList()) {
                await b();
            }

            await t.run();

            for(var i=0; i < this.counts.length; i++) {
                this.counts[i] += t.counts[i];
            }
        }

        if (this.before.length)
            beforeStack.pop();

        tablevel--;
        stack.pop();

        return this.counts;
    }

    pass(didpass, msg) {
        const idx = didpass | 0;
        this.counts[idx]++;
        this.counts[2]++;
        if (!didpass) {
            printf("\t%s %s %s\n", Color.Yellow(caller(5)), Color.Red("Failed"), msg);
        }

        return didpass;
    }
}

function collectRun(name, cb=()=>{}) {
    var t = new Test(name, cb);
    stack.push(t);
}

function finalizeRun(name, cb=()=>{}) {
    var t = new Test(name, cb);
    stack.top().push(t);
}

var _run = collectRun;
const run = (...args) => _run(...args);
const group = (...args) => _run(...args);

async function finalize() {
    if (!hasrun) {
        var rstack = stack;
        stack = new Stack;
        _run = finalizeRun;
        hasrun = true;

        for(var t of rstack) {
            await t.run();

            for(var i=0; i < counts.length; i++) {
                counts[i] += t.counts[i];
            }
        }
    }

    return results();
}

function results() {
    const cpad = titlePadding - (TABSIZE*tablevel);
    const [ failed, passed, total ] = counts;

    if (!hasrun) {
        printf('\n%s\n\n', Color.Yellow("NO TESTS RUN"));
    }
    else if (passed === total) {
        printf(`\n%s (${Color.Green('%3d')} / ${Color.Yellow('%3d')})\n\n`, Color.Green("ALL TESTS PASSED"), passed, total);
    }
    else {
        printf(`\n%s (${Color.Red('%3d')} / ${Color.Yellow('%3d')})\n\n`,
        Color.Red("SOME TESTS FAILED"), failed, total);
    }

    return failed !== 0;
}

function reset() {
    stack = new Stack;
    _run = collectRun;
    hasrun = false;
    counts = [ 0, 0, 0 ];
}

const title = (title) => stack.top().setTitle(title);
const beforeEach = (fn) => stack.top().beforeEach(fn);
const pass = (passed, msg) => stack.top().pass(passed, msg);
const ok = (test) => pass(test, Color.Red('NOT OK'));
const equal = (a, b) => pass(a === b, `(${a} !== ${b})`);
const lequal = (a, b) => pass(a == b, `(${a} !== ${b})`);
const fequal = (a, b) => pass(Math.abs(a - b) <= TEST_FLOAT_TOLERANCE, `(${a} != ${b})`);
const exists = (obj) => pass(!(obj === (void 0) || typeof (obj) == 'undefined' || obj === null), `object doesn't exist`);
const isArray = (a) => pass(!!a && a.constructor === Array, `${a.constructor}  isn't an Array`);
const isNumber = (a) => pass(!isNaN(parseFloat(a)) && isFinite(a), `'${serialize(a)}' isn't a number`);
const notEqual = (a, b) => pass(a !== b, `(${a} === ${b})`);
const lnotEqual = (a, b) => pass(a != b, `(${a} === ${b})`);
const deepEqual = (a, b) => {
    const sa = serialize(a);
    const sb = serialize(b);
    pass(sa === sb, `${sa} != ${sb}`);
};

exports = module.exports = {
    printf,
    sprintf,
    reset,
    title,
    group,
    wait,
    finalize,
    beforeEach,

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
};
