const { loadfile, path, fileexists } = require('./io.js');
const npos = -1;

var _quiet=5;
var _errorExit = true;

function error(msg) {
    console.log(msg);
    if (_errorExit)
        process.exit();
}

function _error(loc, msg) {
    error(`Error: ${msg} in ${loc}`);
}

function warn(loc, msg) { //}, level=2) {
//    if (_quiet < level) return;
    console.log(`Warning: ${msg} in ${loc}`);
}

function info(loc, msg) {
    if (_quiet < 2) return;
    console.log(`Info: ${msg} in ${loc}`);
}

Object.filter = function(obj, fn) {
    var o = {};
    for(var k in obj) {
        if (!obj.hasOwnProperty(k)) continue;
        if (fn(k, obj[k]))
            o[k] = obj[k];
    }
    return o;
};

String.prototype.splice = function(start, len, rep) {
    return this.slice(0, start) + rep + this.slice(start+len);
};

String.prototype.cescape = function() {
    var out='';
    for (var i=0, max=this.length; i < max; i++) {
        switch (this.charAt(i)) {
            //case '\a': out += "\\a"; break; // alert (bell)
            case '\b': out += "\\b"; break; // backspace
            case '\v': out += "\\v"; break; // vertical tab
            case '\f': out += "\\f"; break; // form feed
            case '\t': out += "\\t"; break; // horizonal tab
            case '\r': out += "\\r"; break; // carriage return
            case '\n': out += "\\n"; break; // newline / line feed
            default:
                out += this[i];
                break;
        }
    }

    return out;
};

String.prototype.findEnclosure = function(schar, echar, idx=0, info={}) {
    var i=idx, j=0;

    while((i=this.indexOf(schar, i)) != -1) {
        if (isWhitespace(this.charAt(i+1))) {
            i += schar.length;
            continue;
        }
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
    function skipWhitespace(str) {
        var i=0;
        while (isWhitespace(str.charAt(i)) && i < str.length) {
            i++;
        }
        return i;
    }

    var i=0, info={},
        str = this;

    if (typeof o != 'object')
        o = Array.from(arguments).slice(1);

    while(str.findEnclosure('{', '}', i, info)) {
        var offset = skipWhitespace(info.key);
        //if (info.key.length < 1) {
        if (info.key.length < 1 || offset == info.key.length) {
            i = info.start + info.length;
            continue;
        }

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

function dirname(fname, add='') {
    var p = path.dirname(fname);

    if (p.startsWith('/'))
        return p;

    if (p.endsWith('/'))
        p = p.slice(0, -1);

    if (p == '.')
        p = '';

    if (!add.length)
        return p;

    if (p.startsWith(add))
        return p;

    if (add.endsWith(p))
        return add;

    return path.join(add, p);
}

function isDigit(c) {
    switch(c) {
        case '0':case '1':case '2':case '3':case '4':
        case '5':case '6':case '7':case '8':case '9':
            return true;
        default: return false;
    }
}

function isAlpha(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

function isIdentChar(c) {
    return isAlpha(c) || isDigit(c) || c == '_' || c == '$';
}

function isWhitespace(c) {
    switch(c) {
        case ' ':
        case '\a':
        case '\b':
        case '\f':
        case '\t':
        case '\v': return true;
        default: return false;
    }
}

function depthFind(str, schar='(', echar=')', index=0) {
    var depth=1, last=-1;
    if (!str.startsWith(schar, index++))
        return -1;

    while (depth && index < str.length) {
        if (str.startsWith(schar, index) && !checkInString(str, index)) {
            depth++;
            last=-1;
        } else if (str.startsWith(echar, index) && !checkInString(str, index)) {
            depth--;
            last=index;
            if (!depth) break;
        }
        index++;
    }

    return depth ? -2 : last;
}

function checkInString(line, index) {
    var start = line.indexOf('"'),
        end=start+1;

    while (start != npos && start < index) {
        while ((end = line.indexOf('"', end)) != npos) {
            if (line.charAt(end-1) != '\\')
                break;
            end++;
        }

        if (end == npos) break;
        if (index >= start && index <= end)
            return true;

        start = line.indexOf('"', end+1);
        end=start+1;
    }

    return false;
}

// converts and assignment list in the str to an object
function listToObject(str) {
    str = str.trim().replace(/=/g, ':');
    var o;
    if (str.length) {
        try {
            eval(`o = { ${str} };`);
        } catch (e) {
            o={};
        }
    }

    return o;
}

function listToArray(str) {
    str = str.trim();
    if (str.length) {
        var a = [];
        var depth=0;
        var pos=0;
        for(var i=0; i < str.length; i++) {
            var c = str.charAt(i);
            if (c == '(') {
                depth++;
            } else if (c == ')') {
                depth--;
            } else if (!depth && c == ',' && !checkInString(str, i)) {
                a.push(str.slice(pos, i).trim());
                pos=i+1;
            }
        }

        a.push(str.slice(pos).trim());
        return a;
    }

    return [];
}

class Stack {
    constructor() {
        this.list = [];
    }

    get length() {
        return this.list.length;
    }

    empty() {
        return this.list.length <= 0;
    }

    push(val) {
        this.list.push(val);
    }

    pop() {
        return this.empty() ? null : this.list.pop();
    }

    top() {
        if (!this.empty())
            return this.list[this.list.length-1];

        return null;
    }
}

class Parser {
    constructor(config=false) {
        this.raw_codes = false;
        this.line = '';
        this.ofs = 0;
        this.lnum = 0;
        this.llist = false;
        this.processed_code = '';
        this.should_read = true;
        this.macros = new Map;
        this.trimmed = {};
        this.should_read_stack = new Stack();
        this.ofs_stack = new Stack();
        this.macro_stack = {};
        this.includedFiles = {};
        this.defineNonIdent = false;
        this.appendDoc = [];
        this.includeDepth = 0;
        this.trimTop = false;
        this.trimNext = false;

        this.exports = {};
        this.macro_export = this.macro_export.bind(this);

        this.includePaths = [];
        this.addIncludeSearchPath = this.addIncludeSearchPath.bind(this);
        this.includeResolve = this.includeResolve.bind(this);

        this.config = {
            hex: false,
            maxEmptyLines: 1,
            stopOnError: false,
            stripComments: false,
            quiet: _quiet,
            newline: '\n',
            append: false,
            target: 'browser',
            includePaths: false,
        };
        Object.assign(this.config,
            Object.filter(config || {}, function(name, v) {
                return this.hasOwnProperty(name);
            }.bind(this.config))
        );

        if (this.config.stopOnError)
            _errorExit=true;

        _quiet = this.config.quiet;

        if (config.append && Array.isArray(config.append)) {
            this.appendDoc = [ ...this.appendDoc, ...config.append ];
        }

        if (Array.isArray(config.includePaths)) {
            for(var p of config.includePaths) {
                this.addIncludeSearchPath(p);
            }
        }

        var date = new Date();
        this.redef('__TIME__', date.toLocaleTimeString());
        this.redef('__DATE__', date.toLocaleDateString());
        this.redef('__LINE__', 0);
        this.redef('__FILE__', '');
        this.redef('export', this.macro_export);
        this.redef('undefined', 'void(0)');
    }

    isDefined(key) {
        return this.macros.has(key);
    }

    getMacro(key) {
        return !this.isDefined(key) ? null : this.macros.get(key);
    }

    push_macro(m) {
        var macro = this.getMacro(m);
        if (macro !== null) {
            if (!this.macro_stack.hasOwnProperty(m))
                this.macro_stack[m] = new Stack;

            this.macro_stack[m].push(macro);
        }
    }

    pop_macro(m) {
        if (this.macro_stack.hasOwnProperty(m))
            this.macros.set(m, this.macro_stack[m].pop());
    }

    isIncluded(fname) {
        var alt = path.join(this.currentPath, fname);
        return fname in this.includedFiles ||
               alt in this.includedFiles;
    }

    get currentPath() {
        return this.macros.get('__PATH__') || ''; //this.path_stack.top() || '';
    }

    get currentFile() {
        return this.macros.get('__FILE__') || ''; //this.file_stack.top() || '';
    }

    get currentLine() {
        return this.macros.get('__LINE__') || '??'; //this.file_stack.top() || '';
    }

    loc() {
        return `${this.currentFile}:${this.currentLine}`;
    }

    fixup(fname) {
        return path.join(dirname(fname, this.currentPath), path.basename(fname));
    }

    load(fname) {
        return loadfile(fname);
    }

    eos(ofs=this.ofs) {
        return ofs < 0 || ofs >= this.line.length
    }

    peek(ofs=this.ofs) {
        return this.eos(ofs) ? 0 : this.line.charAt(ofs);
    }

    next(delim=' ', ofs=this.ofs) {
        var index = this.line.indexOf(delim, ofs);
        if (index == npos)
            index = this.line.length;

        var token = this.substr(ofs, index);
        this.ofs = index+1;

        return token;
    }

    scanWhile (fn, ofs=this.ofs) {
        while(fn(this.peek(ofs))) {
            ofs++;
        }
        return ofs;
    }

    rscanWhile(fn, ofs=this.ofs) {
        while(!this.eos(ofs) && fn(this.peek(ofs))) {
            ofs--;
        }
        if (ofs < 0) return 0;
        return ofs;
    }

    skipWhitespace(ofs=this.ofs) {
        return (this.ofs = this.scanWhile(isWhitespace, ofs));
    }

    substr(ofs=this.ofs, end=this.line.length) {
        return this.line.slice(ofs, end);
    }

    getIdent(ofs=this.ofs, info={}) {
        var pos = this.scanWhile(isIdentChar, ofs);
        if (pos == ofs)
            return false;

        var token = this.substr(ofs, pos);
        this.ofs = pos;
        return token;
    }

    getEnclosure(start='(', end=')', index=this.ofs) {
        var last = depthFind(this.line, start, end, index), span;
        switch(last) {
            case -1: return -1;
            case -2: return -2;
            default:
                span = this.line.slice(index+1, last);
                this.ofs = last+1;
                return span;
        }
    }

    getLine() {
        if (this.lnum < this.llist.length) {
            this.ofs = 0;
            this.line = this.llist[this.lnum];
            this.redef('__LINE__', ++this.lnum);
            return this.line;
        }

        return false;
    }

    nextLine() {
        var l = this.getLine();
        if (this.isComment()) return;
        return l;
    }

    parse(fname) {
        //const cpath = this.currentPath;
        //const base = path.basename(fname);
        const dname = dirname(fname);//, this.currentPath);
        //const fixed = path.join(dirname(fname, this.currentPath), path.basename(fname));

        //console.log(`Filename    : ${fname}`);
        //console.log(`Current Path: ${cpath}`);
        //console.log(`Basename    : ${base}`);
        //console.log(`Dirname     : ${dname}`);
        //console.log(`fixed       : ${fixed}`);
        //console.log();
        this.addIncludeSearchPath(dname);

        //fname = this.fixup(fname);
        var raw = this.load(fname);
        this.llist = raw.split(/\r\n|\r|\n/);
        this.lnum = 0;

        this.redef('__FILE__', fname);
        this.redef('__PATH__', dirname(fname));
        this.redef('__INCLUDE_LEVEL__', this.includeDepth);

        while (this.nextLine() !== false) {
            this.process_instruction();
        }

        this.genExports();

        if (!this.includeDepth)
            this.finalize();

        return this.processed_code;
    }

    finalize() {
        for(var line of this.appendDoc) {
            this.append(line);
        }

        if (this.trimTop)
            this.processed_code = this.processed_code.trimLeft();
    }

    process_instruction() {
        var index, directive;
        this.skipWhitespace();

        if (this.peek() === '#') {
            this.ofs++;
            directive = this.next(' ');

            switch(directive) {
                case 'else':
                    return this.macro_else();
                case 'endif':
                    return this.macro_end_if();
                case 'error':
                    return this.macro_error();
                case 'warn':
                    return this.macro_warn();
                case "ifdef":
                    return this.macro_if_def();
                case "ifndef":
                    return this.macro_if_not_def();
                case "undef":
                    return this.macro_undef();
                default: break;
            }

            if (this.should_read) {
                switch(directive) {
                    case 'pragma':
                        return this.macro_pragma();
                    case 'include':
                        return this.macro_include();
                    case "define":
                        return this.macro_define();
                    case "if":
                        return this.macro_if();
                    default:
                        return error(`Macro error: '${directive}' in ${this.loc()}`);
                }
            }
        } else if ((index=this.line.indexOf('enum')) != npos) {
            if (!this.checkMiddle('enum', index)) {
                this.ofs = index + 4;
                this.macro_enum();
            } else {
                this.process_normal_code();
            }
        } else if (this.should_read) {
            this.process_normal_code();
        }
    }

    isComment() {
        var r = 0;
        var index=this.line.indexOf("//");
        // don't increment r for lines you want to process
        if (index != npos && !checkInString(this.line, index)) {
            if (this.config.stripComments) {
                if (index < 1 || this.line.charAt(index-1) !== '\\') {
                    this.line = this.line.slice(0, index);
                }
            }
        }

        if (this.config.stripComments)
            r += this.stripBlockComments();

        return r != 0;
    }

    stripBlockComments() {
        var start = this.line.indexOf('/*'), end=-1;
        if (start == npos || checkInString(this.line, start)) return 0;

        var lnum = this.lnum;
        var i = this.lnum-1, r=1;

        end = this.line.indexOf('*/');
        if (end != npos) {
            this.llist[i] = this.llist[i].slice(0, start, end+2);
            this.line = this.llist[i];
            return !this.line.length;
        }

        this.llist[i] = this.llist[i].slice(0, start);
        this.line = this.llist[i];
        if (this.line.length)
            r--;

        var found=false;
        // Find the end of the comment
        for(; i < this.llist.length; i++) {
            end = this.llist[i].indexOf('*\/');
            if (end != npos) {
                this.llist[i] = this.llist[i].slice(end+2);
                found = true;
                break;
            } else if (start != npos) {
                start = npos;
            } else {
                this.llist[i]='';
            }
        }

        if (!found)
            error(`Unterminated block comment at line ${lnum}`);

        return r;
    }

    doreplace() {
        if (!this.line.length) return;
        var idx, r;
        var ex = this.line.indexOf('APIEXPORT') != -1;
        do {
            r=0;
            for(var [ k, v ] of this.macros) {
                if (v.isMacro) {
                    if (ex && k == 'APIEXPORT') {
                        //console.log("Processing APIEXPORT");
                        r += this.replace_function(v);
                    } else {
                        r += this.replace_function(v);
                    }
                    r += this.clean_paste();
                } else if (v.isScoped) {
                    r += this.replace_scoped(v);
                } else {
                    r += this.replace_macro(k, v);
                    r += this.clean_paste();
                }
            }
        } while(r);
    }

    clean_paste() {
        var index=0, ofs, r=0;
        while ((index = this.line.indexOf('##'), index) != npos) {
            ofs = this.rscanWhile(isWhitespace, index-1);
            var len = index - 1 - ofs;
            if (len) {
                this.line = this.line.splice(ofs+1, len, '');
                index = ofs+len;
            }

            ofs = this.scanWhile(isWhitespace, index+2);
            len = ofs - index;
            this.line = this.line.splice(index, len, '');
            r++;
        }
        return r;
    }

    process_normal_code() {
        this.doreplace();
        this.append(this.line);
    }

    append(line) {
        this.processed_code = this.processed_code + line + this.config.newline;
    }

    addexport(from, to=from) {
        if (from in this.exports)
            error(`Duplicate export '${from}' in ${this.loc()}`);

        this.exports[from] = to;
    }

    replace_scoped(def) {
        var r=0, index, start;

        while ((index = this.line.indexOf(def.name, index)) != npos) {
            if (this.checkMiddle(def.name, index)) {
                index += def.name.length;
                continue;
            }
            start = index;
            index += def.name.length;

            if (this.peek(index) == '.') {
                var member = this.getIdent(index+1);
                if (!member)
                    continue;

                if (!def.value.hasOwnProperty(member)) {
                    error(`${def.name} doesn't have a member ${member} in ${this.loc()}`);
                    return r;
                }

                this.line = this.line.splice(start, this.ofs - start, def.value[member]);
                index = this.ofs = start + def.value[member].length + 1;
                r++;
            }
        }

        return r;
    }

    checkInString(str, index) {
        return checkInString(str, index);
/*
        var start = this.line.indexOf('"'),
            end=start+1;

        while (start != npos && start < index) {
            while ((end = this.line.indexOf('"', end)) != npos) {
                if (this.line.charAt(end-1) != '\\')
                    break;
                end++;
            }

            if (index >= start && index <= end)
                return true;

            start = this.line.indexOf('"', end+1);
            end=start+1;
        }

        return false;
*/
    }

    // Check that the constant isn't in a middle of a word and add the constant if not
    checkMiddle(str, index) {
        var c1 = this.peek(index - 1);
        var c2 = this.peek(index + str.length);
        return (
            c1 == '.' ||
            isIdentChar(c1) ||
            isIdentChar(c2) ||
            this.checkInString(this.line, index)
        );
    }

    replace_macro(name, val) {
        if (!this.line.length || !name || !name.length)
            return 0;

        if (typeof val == 'function') {
            return val();
        }

        var index, r=0;
        while ((index = this.line.indexOf(name, index)) != npos) {
            if (this.checkMiddle(name, index)) {
                index += name.length;
                continue;
            }

            this.line = this.line.splice(index, name.length, val);
            index += val.length;
            if (name in this.trimmed) {
                var ofs = index;
                while(this.line.charAt(ofs) == ' '){
                    ofs++;
                }

                if (ofs !== index) {
                    this.line = this.line.substr(0, index) + this.line.substr(ofs);
                }
            }
            r++;
        }

        return r;
    }

    replace_function(def) {
        if (!this.line.length || !def ||  !def.name.length)
            return 0;

        if (!def.isMacro) {
            error(`Preprocessor internal error: calling replace_function with a non functional definition ${def.name}`);
            return 0;
        }

        var r=0, index=0, end, params, args, text;
        while ((index = this.line.indexOf(def.name, index)) != npos) {
            if (this.checkMiddle(def.name, index)) {
                index += def.name.length;
                continue;
            }

            this.ofs_stack.push(this.ofs);
            this.ofs = index + def.name.length;
            args = {};

            var c = this.peek(this.ofs);
            var res = this.getEnclosure('(', ')');
            if (typeof res == 'string') {
                end = this.ofs;
                params = listToArray(res);

                if (def.args) {
                    if (def.varg) {
                        args['...'] = params.slice(def.args.length).join(', ');
                        params = params.slice(0, def.args.length);
                    }

                    if (params.length < def.required) {
                        this.ofs = this.ofs_stack.pop();
                        error(`Not enough parameters for macro ${def.name} in ${this.loc()}`);
                        return r;
                    } else if (params.length > def.required && !def.varg) {
                        this.ofs = this.ofs_stack.pop();
                        error(`Too many parameters for macro ${def.name} in ${this.loc()}`);
                        return r;
                    }

                    for(var i=0; i < def.required; i++) {
                        args[def.args[i]] = params[i];
                    }

                    //if (!def.varg) {
                    //    text = def.value;
                    //} else {
                    text = def.value.pformat(args);
                    //}
                } else {
                    text = def.value;
                }

                this.line = this.line.splice(index, end - index, text);
                index += text.length;
                r++;
            } else {
                index = this.ofs;
            }

            this.ofs = this.ofs_stack.pop();
        }

        return r;
    }

    templateizeMacro(def) {
        if (!def.value.length)
            return def;

        if (def.args) {
            this.ofs_stack.push(this.ofs);
            var line = this.line, index=0;
            this.ofs = 0;
            this.line = def.value;

            for(var arg of def.args) {
                while((index = this.line.indexOf(arg, index)) != npos) {
                    if (index == npos || this.checkMiddle(arg, index)) {
                        index += arg.length;
                        continue;
                    }

                    var len = arg.length;
                    var v = `{${arg}}`;
                    if (this.line.charAt(index-1) === '#' && this.line.charAt(index-2) !== '#') {
                        index--;
                        len++;
                        v = `"${v}"`;
                    }

                    this.line = this.line.splice(index, len, v);
                    index += v.length;
                }
            }
            def.value = this.line;

            this.ofs = this.ofs_stack.pop();
            this.line = line;
        }

        return def;
    }

    macro_error() {
        var msg = this.line.splice(this.ofs);
        if (!msg.length)
            return _error(this.loc, 'empty #error');

        return error(this.loc, msg);
    }

    macro_warn() {
        var msg = this.line.splice(this.ofs);
        if (!msg.length)
            return _error(this.loc, 'empty #warn');

        return warn(this.loc, msg);
    }

    macro_pragma() {
        var name = this.next();
        if (name.length < 1)
            return error("empty #pragma");

        switch(name) {
            case 'once':
                this.includedFiles[this.currentFile] = true;
                break;
            case 'extend':
                this.defineNonIdent = true;
                break;
            case 'trim':
                this.trimNext = !this.trimNext;
                break;
            case 'trimtop':
                this.trimTop = true;
                break;
            case 'enumproc':
                this.pragma_enum_proc();
                break;
            case 'onfinalize':
                this.doreplace();
                var s = this.line.slice(this.ofs);
                if (s.trim().length)
                    this.appendDoc.push(s);
                break;
            default:
                return error(`Unsupported / unknown pragma '${name}'`);
        }
    }

    pragma_enum_proc() {
        var name = this.next(),
            max = this.next();

        if (name.length < 1)
            return error(`pragma enumproc requires an enum type to be specified in ${this.loc()}`);

        if (max.length < 1)
            return error(`pragma enumproc requires enum max to be specified in ${this.loc()}`);

        var macro = this.getMacro(name);
        if (!macro)
            return error(`pragma enumproc '${name}' isn't defined ${this.loc()}`);

        if (!macro.isScoped)
            return error(`pragma enumproc '${name}' isn't an enum ${this.loc()}`);

        var out = [];
        for(var k in macro.value) {
            if (!macro.value.hasOwnProperty(k)) continue;
            if (k == '_ENUM_MAX_') {
                out[macro.value[k]] = max;
            } else {
                out[macro.value[k]] = k;
            }
        }
        //out.forEach((item,v) => console.log(`${item} : ${v},`));
        for(var i=0, m=out.length; i < m; i++) {
            console.log(`${out[i]} : ${i},`);
        }
        console.log("done");
    }

    macro_include() {
        var fname = this.next();
        if (fname.length < 1)
            return error("#include missing file to include");

        var c = fname.charAt(0), cb='', ce='';
        if (c == '<' || c == '"') {
            switch(c) {
                case '<': cb='<'; ce='>'; break;
                case '"': cb='"'; ce='"'; break;
            }
            fname = fname.slice(1, -1);
        } else {
            return error(`#include requires filename to be enclosed in either < or "`);
        }

        this.includeFile(fname);
    }

    macro_enum() {
        this.skipWhitespace();
        var ident = this.getIdent();

        // Default options
        var opt = {
            start: 0,
            step: 1,
        },
        options,
        str = '';

        this.skipWhitespace();
        options = this.getEnclosure('<', '>');
        switch (options) {
            case -1: break;
            case -2: return error(`Template argument list isn't closed in ${this.loc()} at ${text}`);
            default: Object.assign(opt, listToObject(options)); break;
        }

        this.skipWhitespace();
        if (this.peek() != '{')
            if (ident) {
                return error(`enum syntax error in '${ident}', expecting '{' in ${this.loc()}`);
            } else {
                return error(`enum syntax error expected '{' in ${this.loc()}`);
            }

        // save config, make sure comments are stripped for enum eval
        var strip = this.config.stripComments;
        this.config.stripComments = true;

        // Get all names of constants to create
        while (this.nextLine() !== false) {
            var l = this.line.trim();
            if (l.startsWith('}')) {
                this.line = this.line.trimLeft();
                break;
            }
            if (this.line.length)
                str += this.line;
        }

        // restore config
        this.config.stripComments = strip;

        if (!(this.line.startsWith('};') || this.line.startsWith('}')))
            return error(`enum wasn't closed, expected '}' in ${this.loc()}`);

        // Create an array of constant names
        var list = str.split(',').map(item => item.trim()).filter(item => item.length);

        if (!ident) {
            // Create the constants and add their value
            for (var i = 0, max = list.length; i < max; i++) {
                var k = list[i];
                if (this.isDefined(k))
                    return error(`'${k}' is already defined in ${this.loc()}`);

                this.macros.set(k, this.enumVal(i, opt.start, opt.step));
            }
        } else {
            if (this.isDefined(ident))
                return error(`'${ident}' is already defined in ${this.loc()}`);

            var def = {
                name: ident,
                args: false,
                required: 0,
                varg: 0,
                isMacro: false,
                isScoped: true,
                value: {},
            };

            // Create a object for the enum values to simulate a scope
            for (var i = 0, max = list.length; i < max; i++) {
                def.value[list[i]] = this.enumVal(i, opt.start, opt.step);
            }

            this.macros.set(ident, def);
        }
    }

    enumVal(index, start=0, step=1) {
        var v = start + index * step;
        if (this.config.hex)
            return '0x' + v.toString(16);

        return v.toString();
    }

    parse_define() {
        var args = false,
            variadic = false,
            req = 0,
            ident = this.getIdent();

        if (!ident) {
            if (this.defineNonIdent) {
                var at = this.scanWhile((c) => c != '(', this.ofs);
                ident = this.substr(this.ofs, at).trim();
                this.ofs = at;
                if (!ident.length) {
                    error(`Invalid #define, empty at line ${this.lnum}`);
                }
            } else {
                error(`Invalid #define, requires an identifier`);
            }
        }

        if (this.peek() == '(') {
            var res = this.getEnclosure('(', ')');
            switch(res) {
                case -1:
                    return error(`Macro error, can't find parameter list at '${ident}'`);
                case -2:
                    return error(`Invalid #define '${ident}', unclosed parenthesis`);
                default:
                    args = listToArray(res);
                    for(var i=0; i < args.length; i++) {
                        if (args[i] === '...') {
                            if (i != args.length-1)
                                return error(`Error: Variadic parameter in ${ident} must be the last parameter`);

                            if (variadic !== false && variadic > 1)
                                return error(`Error: There can be only one variadic parameter in '${ident}'`);

                            variadic=i;
                        }
                    }
                    req = variadic !== false ? variadic : args.length;
                    break;
            }
        }

        var m =this.templateizeMacro({
            name: ident,
            args: args,
            required: req,
            varg: variadic !== false ? 1 : 0,
            isMacro: args !== false,
            isScoped: false,
            value: this.getEscapedTextBlock(),
        });

        if (variadic !== false)
            m.args.pop();

        return m;
    }

    getEscapedTextBlock() {
        var config = this.config;
        function appendnl(base, str) {
            return str.length ? base + str + config.newline : base;
        }

        var text = '';
        while(this.peek(this.line.length-1) == '\\') {
            text = appendnl(text, this.substr(this.ofs, this.line.length-1));
            if (!this.nextLine())
                break;
        }

        return (text + this.substr()).trim();
    }

    define(name, val) {
        if (this.isDefined(name))
            return error(`${name} already defined`);

        this.macros.set(name, val);
        if (this.trimNext)
            this.trimmed[name] = 1;
    }

    redef(name, val) {
        this.macros.set(name, val);
    }

    undef(name) {
        if (!this.isDefined(name))
            return;

        this.macros.delete(name);
    }

    macro_export() {
        if (!this.line.startsWith('export ')) return 0;

        const start = this.ofs;
        this.line = this.line.splice(start, 'export'.length+1, '');
        if (this.config.target == 'node') {
            const id = this.getIdent(this.ofs);
            switch(id) {
                case 'let':
                case 'var':
                case 'const':
                case 'class':
                case 'function':
                    const name = this.getIdent(this.ofs+1);
                    this.ofs = start;
                    this.addexport(name);
                    return 1;
                default:
                    error(`export: Expected identifier at line ${this.loc()}`);
                    return 0;
            }
        }
    }

    macro_define() {
        var def = this.parse_define();
        if (!(def.isScoped || def.isMacro)) {
            this.define(def.name, def.value);
        } else {
            this.macros.set(def.name, def);
        }
    }

    macro_undef() {
        var name = this.next();
        if (name.length < 1)
            return error("#undef missing identifier");

        this.undef(name);
    }

    macro_else() {
        this.should_read = !this.should_read;
    }

    macro_if_def() {
        var name = this.next();
        if (name.length < 1)
            return error('#ifdef missing identifier');

        this.should_read_stack.push(this.should_read);
        this.should_read = this.isDefined(name);
    }

    macro_if_not_def() {
        if (!this.should_read) return;
        var name = this.next();
        if (name.length < 1)
            return error("#ifndef missing identifier");

        this.should_read_stack.push(this.should_read);
        this.should_read = (!this.isDefined(name));
    }

    macro_if() {
        var name = this.next();
        this.should_read_stack.push(this.should_read);
        //while (this.macros.count(name) != 0)
        //    macro_name = this.getMacro(name);

        //old: (name == "1");

        this.should_read = ['1','0','__INCLUDE_LEVEL__'].indexOf(name) != -1;
    }

    macro_end_if() {
        this.should_read = this.should_read_stack.top() || true;
        this.should_read_stack.pop();
    }

    addIncludeSearchPath(path) {
        if (!(path in this.includePaths)) {
            this.includePaths[path] = 1;
            //console.log(`Added '${path}' to include search paths`);
        }
    }

    includeResolve(fname) {
        for(const check in this.includePaths) {
            const attempt = path.join(check, fname);
            //console.log(`Attempting '${fname}' --> ${attempt}`);
            if (fileexists(attempt)) {
                //console.log(`Resolved Include '${fname}' --> ${attempt}`);
                return attempt;
            }
        }

        warn(this.loc(), `Couldn't resolve include ${fname}`);
        return fname;
    }

    includeFile(fname) {
        //console.log(`CHECKING INCLUDE: ${fname}`);
        const filename = this.includeResolve(fname);

        if (this.isIncluded(filename)) {
            info(this.loc(), `Skipping already included file '${filename}'`);
            return;
        }

        // save state: some of the state is designed to change file to file
        //             so we are only saving what is important for this file
        this.push_macro('__FILE__');
        this.push_macro('__LINE__');
        this.push_macro('__PATH__');
        this.push_macro('__INCLUDE_LEVEL__');

        var temp_should_read = this.should_read;
        var temp_should_read_stack = this.should_read_stack;
        var temp_ofsstack = this.ofs_stack;
        var temp_macrostack = this.macro_stack;
        var cline = this.lnum;
        var list = this.llist;

        // change to new state
        this.should_read_stack = new Stack();
        this.ofs_stack = new Stack();
        this.macro_stack = new Stack();

        this.includeDepth++;

        this.parse(filename);

        // restore state for current file
        this.lnum = cline;
        this.llist = list;
        this.macro_stack = temp_macrostack;
        this.ofs_stack = temp_ofsstack;
        this.should_read_stack = temp_should_read_stack;
        this.should_read = temp_should_read;

        this.includeDepth--;
        this.pop_macro('__INCLUDE_LEVEL__');
        this.pop_macro('__FILE__');
        this.pop_macro('__LINE__');
        this.pop_macro('__PATH__');
        this.defineNonIdent = false;
    }

    genExports() {
        var data = '';
        for(const k in this.exports) {
            if (data) data = data + this.config.newline;
            if (k == this.exports[k]) {
                data = data + `\t${k},`;
            } else {
                data = data + `\t${this.exports[k]}: ${k},`;
            }
        }
        if (data.length) {
            const block = `exports = module.exports = {
${data}
};`;
            this.append(block);
            this.exports = {};
        }
    }
}

exports = module.exports = {
    Parser,
    listToArray,
};
