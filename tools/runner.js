const path = require('path');
const fs = require('fs');
const test = require("./test/minctest");
const { fileexists, getextension, direxists, mkdir } = require("./io.js");
const spawnSync = require('child_process').spawnSync;

const DEFAULTARGS = ['-strip','-s','-f','-q'];
function jspp(cmd, ...args) {
    var result = spawnSync('tools/jsp.js', args, { stdio: 'inherit' });
    return result.status === null ? result.signal : result.status;
}

jspp.getDefaults = () => DEFAULTARGS;

function resolve(...args) {
    return path.resolve(path.join(__dirname, ...args));
}

function basename(fname) {
    var name = path.basename(fname);
    return name.replace(getextension(name), '');
}

function include(file) {
    eval(fs.readFileSync(file)+'');
}

exports = module.exports = {
    jspp,
    test,
    path,
    basename,
    resolve,
    fileexists,
    getextension,
    direxists,
    mkdir,
    include
};
