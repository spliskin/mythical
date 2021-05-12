const fs = require('fs');
const path = require('path');

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function regexIndexOf(str, regex, startpos) {
    var indexOf = str.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

function clamp(val, min, max) {
    return val > max ? max : val < min ? min : val;
}

function serialize(obj) {
    try {
        return JSON.stringify(obj);
    } catch(e) {
        return false;
    }
}

function deserialize(str) {
    try {
        return JSON.parse(str);
    } catch(e) {
        return false;
    }
}

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

function _print(...msg) {
    //process.stdout.write
    return process.write(...msg);
}

function _printsync(...msg) {
    return fs.writeSync(1, ...msg);
}

var _outputasync = false;
var _outputfn = _printsync;
const stdlog = typeof window !== undefined && console.log ? console.log : _outputfn;

function printf(fmt) {
    var args = Array.from(arguments);
    _outputfn(format.call(null, fmt, args.length > 1 ? args.slice(1) : args));
}

function sprintf(fmt) {
    var args = Array.from(arguments);
    return format(fmt, args.length > 1 ? args.slice(1) : args);
}

function matches(text, pattern) {
    var i, rest = null;

    var pos = pattern.indexOf('*');
    if (pos != -1) {
        rest = pattern.substring(pos + 1);
        pattern = pattern.substring(0, pos);
    }

    if (pattern.length > text.length)
        return false;

    // handle the part up to the first *
    for (i = 0; i < pattern.length; i++) {
        if (pattern.charAt(i) != '?' && (pattern.substring(i, i + 1).toUpperCase() != text.substring(i, i + 1).toUpperCase()))
            return false;
    }

    // recurse for the part after the first *, if any
    if (rest == null)
        return pattern.length == text.length;

    for (i = pattern.length; i <= text.length; i++) {
        if (matches(text.substring(i), rest))
            return true;
    }

    return false;
}

function scanPath(searchPath, pattern = "*", recursive=false) {
    var list = [];
    searchPath = path.resolve(searchPath);
    for (var name of fs.readdirSync(searchPath)) {
        var pname = path.join(searchPath, name);
        var info = stat(pname);
        if (info) {
            if (info.isDirectory()) {
                if (recursive) {
                    list = list.concat(scanPath(pname, pattern, recursive));
                    //continue;
                }
            } else if (info.isFile()) {
                if (matches(pname, pattern)) {
                    list.push(pname);
                    //continue;
                } else if (name === pattern) {
                    list.push(pname);
                    //continue;
                }
                // else if (pname.startsWith(pattern)) {
                //    list.push(pname);
                //    continue;
                //}
            }
        }
    }

    return list;
}

function resolvePathPattern(str) {
    if (direxists(str))
        return [ path.normalize(str), '' ];

    var p = path.normalize(str);
    var d = path.resolve(path.dirname(p));
    var f = path.basename(p);
    var ext = getextension(f);

    return [ d, f, ext ];
}

function stat(fname) {
    try {
        return fs.statSync(fname) || false;
    } catch(e) {
        return false;
    }
}

function getextension(fname) {
    var index=fname.lastIndexOf('.');
    if (index == -1)
        return '';

    return fname.slice(index);
}

function fileinfop(str) {
    var [ dirname, fname, ext ] = resolvePathPattern(str);
    if (fname == '.')
        fname = '';
    else if (fname.startsWith('./'))
        fname = fname.slice(2);

    if (!fname.length) {
        return {
            dir: dirname,
            fname: '',
            type: 2,
        };
    }

    return {
        dir: dirname,
        fname: fname,
        ext: ext,
        basename: fname.replace(ext, ''),
        type: 1,
    }
}

function fileinfo(str) {
    var info = stat(str);
    if (!info) return false;
    if (info.isDirectory()) {
        return {
            dir: path.resolve(path.normalize(str)),
            fname: '',
            type: 2,
        };
    } else {
        //if (info.isFile())
        var fname = path.basename(str);
        var ext = getextension(fname);
        return {
            dir: path.resolve(path.normalize(path.dirname(str))),
            fname: fname,
            ext: ext,
            basename: fname.replace(ext, ''),
            type: 1,
        };
    }
}

function fileexists(fname) {
    try {
        fs.closeSync(fs.openSync(fname, 'r'));
    } catch(err) {
        return false;
    }

    return true;
}

function direxists(fname) {
    var info = stat(fname);
    return (info && info.isDirectory());
}

function mkdir(fname, mode=0o755) {
    try {
        fs.mkdirSync(fname, mode);
    } catch(e) {
        throw `Error: Can't create directory '${fname}': ${e}`;
    }
    return true;
}

function loadfile(fname) {
    var content = false;
    try {
        content = fs.readFileSync(fname, 'utf8');
    } catch(e) {
        throw `Error: Can't read file '${fname}': ${e}`;
    }
    return content;
}

function writefile(fname, data='', perms=0o644) {
    var ok=true;
    try {
        fs.writeFileSync(fname, data, { mode: perms });
    } catch(err) {
        throw `Error: Can't write file '${fname}': ${err}`;
    }

    return ok;
}

function cmdparse(opt={}, args = []) {
    if (!opt.hasOwnProperty('commands') || !opt.commands)
        return args;

    var options = Object.assign({
            requiredParms: 0,
            help: false,
            switches: ['--','-','/'],
            commands: false,
            delayed: false,
            listed: false,
        }, opt),
        list=[],
        listed=[],
        delayed={
            _gen: [],
        };

    var start, isopt, k;

    this.delay = function(fn) {
        if (typeof fn !== 'function') return;
        delayed._gen.push(fn);
    };

    this.delayCommand = function(cmd) {
        delayed[cmd] = [];
    };

    this.isDelayed = function(cmd) {
        return delayed.hasOwnProperty(cmd);
    }

    this.listCommand = function(cmd) {
        listed[cmd] = [];
    };

    this.isList = function(cmd) {
        return cmd in listed;
    }

    this.isCommand = function(cmd) {
        return (options.commands.hasOwnProperty(cmd) && typeof options.commands[cmd] === 'function');
    }

    if (Array.isArray(options.delayed)) {
        for(var i of options.delayed) {
            if (this.isCommand(i))
                this.delayCommand(i);
        }
    }

    if (Array.isArray(options.listed)) {
        for(var i of options.listed) {
            if (this.isCommand(i))
                this.listCommand(i);
        }
    }

    if (options.help && typeof options.help === 'function') {
        // wrap any call to a help function with an exit
        var hfn = options.help;
        var fn = () => {
            hfn();
            process.exit(0);
        };
        options.help = fn;
        Object.keys(options.commands).forEach(k => {
            if (options.commands[k] === hfn)
                options.commands[k] = fn.bind(this);
        });
    }

    //if (arg == process.argv) {
    //    args = args.slice(2);
    //}
    if (args.length < options.requiredParms && options.help) {
        options.help();
        process.exit(0);
    }

    for(var i=0; i < args.length; i++) {
        start = options.switches.find(s => args[i].startsWith(s)) || false;
        isopt = start.length ? start.length : 0;
        if (isopt) {
            k = args[i].slice(isopt);
            if (this.isCommand(k)) {
                if (options.commands[k].length) {
                    if (this.isDelayed(k)) {
                        delayed[k] = args.slice(i+1, i+1+options.commands[k].length);
                    }
                    else {
                        options.commands[k].apply(null, args.slice(i+1, i+1+options.commands[k].length));
                    }
                    i += options.commands[k].length;
                }
                else if (this.isList(k)) {
                    // search for next switch here
                    // collect all entries from i to switch pos - 1
                    var nextsw = args.findIndex((arg, idx) => idx > i && options.switches.find(s => arg.startsWith(s)) || false, i+1);
                    var l = args.slice(i+1, nextsw);
                    options.commands[k].apply(null, l);
                    i = nextsw-1;
                }
                else {
                    options.commands[k]();
                }
            } else {
                printf("Unknown switch: '%s'\n", args[i]);
            }
            continue;
        }

        list.push(args[i]);
    }

    for(var k in delayed) {
        if (!delayed.hasOwnProperty(k)) continue;
        if (k === '_gen') {
            delayed._gen.forEach(fn => fn());
        } else {
            if (options.commands[k].length) {
                if (delayed[k].length)
                    options.commands[k].apply(null, delayed[k]);
            } else {
                options.commands[k]();
            }
        }
    }

    return list;
}

// ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------

String.prototype.splice = function(start, len, rep) {
    return this.slice(0, start) + rep + this.slice(start+len);
}

String.prototype.replaceAll = function(search, rep) {
    var i=0, last=0;
    var s='';
    while ((i=this.indexOf(search, last)) != -1) {
        s += this.slice(last, i) + rep;
        i += search.length;
        last = i;
    }
    s += this.slice(last);
    return s;
};

String.prototype.findEnclosure = function(schar, echar, idx=0, info={}) {
    var i=idx, j=0;

    while((i=this.indexOf(schar, i)) != -1) {
        if ((j = this.indexOf(echar, i+1)) != -1) {
            info.start = i;
            info.length = j+1 - i;
            info.key = this.slice(i+1, j);
            return info;
        } else {
            i += schar.length;
        }
    }

    return false;
};

// parameter positional format
// like c# format, {0} {1} {2}, but {allows} {string} keys as well
// takes the string, and either an object or multiple / variadic parameters
String.prototype.pformat = function(o) {
    var i=0, info={},
        str = this;

    if (typeof o != 'object')
        o = Array.from(arguments).slice(1);

    while(str.findEnclosure('{', '}', i, info)) {
        if (o.hasOwnProperty(info.key)) {
            str = str.splice(info.start, info.length, o[info.key]);
            i = info.start + o[info.key].length;
        } else {
            str = str.splice(info.start, info.length, '');
            i = info.start;
        }
    }

    return str;
};

//var msg="testing {0} this funciont:{1} !! {fuck}/ {0} doesn it really {2} or not {1} / {0}";
//console.log(msg.pformat({ fuck: "you", 1: "format", 2: "2", 0: "last" }));
//console.log(msg.pformat("format", "2", "last"));

exports = module.exports = {
    escapeRegExp: escapeRegExp,
    regexIndexOf: regexIndexOf,
    clamp: clamp,
    serialize: serialize,
    deserialize: deserialize,
    format: format,
    stdlog: stdlog,
    printf: printf,
    sprintf: sprintf,
    matches: matches,
    scanPath: scanPath,
    resolvePathPattern: resolvePathPattern,
    stat: stat,
    fileinfo: fileinfo,
    fileinfop: fileinfop,
    getextension: getextension,
    fileexists: fileexists,
    direxists: direxists,
    mkdir: mkdir,
    loadfile: loadfile,
    writefile: writefile,
    cmdparse: cmdparse,
    path: path,
};
