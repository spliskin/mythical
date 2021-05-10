const fs = require('fs');
const path = require('path');
const test = require(path.resolve('./tools/test/minctest.js'));
test.setfinalization();

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

function scanPath(searchPath, pattern = "*") {
    var list = [];
    searchPath = path.resolve(searchPath);
    for (var name of fs.readdirSync(searchPath)) {
        name = path.join(searchPath, name);
        var info = fs.statSync(name);
        if (info) {
            if (info.isDirectory()) {
                list = list.concat(scanPath(name, pattern));
            } else if (info.isFile() && matches(name, pattern)) {
                list.push(name);
            }
        }
    }

    return list;
}

function resolvePathPattern(str) {
    var a = path.normalize(str).split(path.sep);
    return {
        path: path.resolve(path.join.apply(null, a.slice(0, -1))).replace("'", ''),
        pattern: a.slice(-1).shift().replace("'", '')
    };
}

//var cwd = process.cwd();
for (var i = 2, len = process.argv.length; i < len; i++) {
    var info = resolvePathPattern(process.argv[i]);
    var list = scanPath(info.path, info.pattern);
    for (var f of list) {
        require(f);
    }
}

process.exit(test.final());