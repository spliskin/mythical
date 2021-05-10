const {
    stdlog,
    printf,
    fileexists,
    direxists,
    mkdir,
    fileinfo,
    fileinfop,
    writefile,
    cmdparse,
    path,
} = require('./io.js');
const { Parser } = require('./proc.js');

function progname() {
    return path.basename(process.argv[process.argv[0].indexOf('node') != -1 ? 1 : 0]);
}

function scanWhile(str, fn, ofs=0) {
    while(ofs < str.length && fn(str.charAt(ofs))) {
        ofs++;
    }
    return ofs;
}

function isDigit(c) {
    return (c >= '0' && c <= '9');
    //switch(c) {
    //    case '0':case '1':case '2':case '3':case '4':
    //    case '5':case '6':case '7':case '8':case '9':
    //        return true;
    //    default: return false;
    //}
}

function isAlpha(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

function isIdentChar(c) {
    return isAlpha(c) || isDigit(c) || c == '_';
}

function isIdentStart(c) {
    return isAlpha(c) || c == '_';
}

function isIdent(str) {
    if (!isIdentStart(str.charAt(0)))
        return false;

    return scanWhile(str, isIdentChar, 1) == str.length;
}

const defaultConfig = {
    ext: 'out',
    hex: false,
    outputPath: false,
    basename: false,
    overwrite: false,
    print: false,
    quiet: 0,
    maxEmptyLines: 1,
    stopOnError: true,
    stripComments: true,
    newline: '\n',
    excludePaths: {},
    defines: {},
    isCommand: true,
    append: [],
};

var config = {};

function fatal(msg) {
    printf("Fatal: %s\n", msg);
    if (config.isCommand)
        process.exit(-2);
    return -2;
}

function log(...args) {
    if (config.quiet > 0)
        stdlog(...args);
}

function isExcluded(path) {
    return config.excludePaths[path] || false ? true : false;
}

function getoutputfilename(info) {
    return path.join(config.outputPath !== false ? config.outputPath : info.dir,
                     (config.basename !== false ? config.basename : info.basename) + '.' +
                     config.ext);
}

function help() {
    var tab = ' '.repeat(4);
    printf("\nusage: %s file [...files] [...options]\n", progname());
    printf("where:[] optional\n");
    printf("      ... one or more,\n");
    printf("      BASE is the file name without extension, i.e. main.js = main\n\n", tab);
    printf("Optional switches, () = default value, starts with '-' or '--' or '/'\n");
    printf("Where:\n");
    printf("%s?, h or help: this help\n", tab);
    printf("%sd           : #define a value, i.e. -d DEBUG=1 would create #define DEBUG 1\n", tab);
    printf("%se      (out): specifies what extension to use for output files\n", tab);
    printf("%sf      (off): forces overwrite of files in output path\n", tab);
    printf("%so (BASE.out): specify output file name\n", tab);
    printf("%sp      (off): prints output to stdout\n", tab);
    printf("%sq      (off): only print errors, silences 'p' if set\n", tab);
    printf("%sr      (off): recursively search for files in file list\n", tab);
    printf("%ss      (off): stop on error\n", tab);
    printf("%sappend      : append line to end of processed output\n", tab);
    printf("%sdir     (./): specifies output path that must exist\n", tab);
    printf("%selimit (  1): limit of empty lines (0 = no limit)\n", tab);
    printf("%shex    (off): constants in enums output in hexadecimal notation\n", tab);
    printf("%sstrip  (off): strips comments from output\n", tab);
    printf("%sispace (  1): empty lines to add between included files and surrounding code\n", tab);
    printf("\n");
}

function setConst(val='') {
    if (!val.length) return;
    var tokens = val.split('=').map(i => i.trim());
    switch(tokens.length) {
        case 0: return fatal(`Error: Definition is empty '${val}`); break;
        case 1: tokens[1]=''; break;
        default: break;
    }

    if (!isIdent(tokens[0]))
        return fatal(`Error: Illegal define: Must be an identifier '${tokens[0]}'`);

    config.defines[tokens[0]] = tokens[1];
}

function isCommand(bool) {
    config.isCommand = bool | 0 ? true : false;
}

function preproc(args, switches=['--','-','/']) {
var list = cmdparse({
    requiredParms: 1,
    help: help,
    switches: switches,
    commands: {
        '?': help,
        'h': help,
        'help': help,
        'p': () => config.print = true,
        'q': (level) => config.quiet = level ?? 0,
        'e': (ext) => {
            config.ext = ext.startsWith('.') ? ext.slice(1) : ext;
        },
        'f': () => config.overwrite = true,
        'x': () => config.stopOnError = true,
        's': () => config.stripComments = true,
        'append': (line) => {
            line = line.trim();
            if (line.length < 1) return
            config.append.push(line);
        },
        'strip': () => config.stripComments = true,
        'hex': () => config.hex = true,
        'd': (def) => setConst(def),
        'o': (fname) => {
            var info = fileinfop(fname);
            if (info.type == 1) {
                if (!info.basename.length)
                    return fatal(`Can't determine output of '${info.fname}'`);

                config.basename = info.basename;
                if (info.ext.length)
                    config.ext = info.ext.startsWith('.') ? info.ext.slice(1) : info.ext;
            }

            config.outputPath = info.dir;
            if (!direxists(config.outputPath)) {
                if (!config.overwrite)
                    return fatal(`Can't create output path, enable with -f: '${config.outputPath}'`);

                mkdir(config.outputPath);
            }
        },
    },
    delayed: ['o', 'e'],
}, args);

for(var fname of list) {
    log(fname);
    var info = fileinfo(fname);
    if (!info)
        return fatal(`File doesn't exist '${fname}' or can't be read`);

    if (info.type != 1)
        return fatal(`'${fname}' isn't a file`);

    if (isExcluded(fname.dir)) {
        printf("Excluding: '%s' :: '%s'\n", dir, pattern);
        continue;
    }

    var out = getoutputfilename(info);
    if (fileexists(out) && !config.overwrite)
        return fatal(`File '${out}' already exists`);

    log(`Parsing '${fname} --> ${out}`);

    var p=null, code=null;
    try {
        p = new Parser(config);
        for(var k in config.defines) {
            if (!config.defines.hasOwnProperty(k)) continue;
            p.define(k, config.defines[k]);
        }

        code = p.parse(fname);
    } catch(err) {
        if (typeof err === 'string')
            console.log(err);

        if (err.msg)
            console.log(err.msg);

        if (err.stack)
            console.log(err.stack);

        return -1;
    }

    var empty = 0;
    var output = code.split("\n").filter(item => {
        var e = item.trim();
        if (!e.length) {
            if (empty++ >= config.maxEmptyLines)
                return false;
        } else if (e == ';') {
            return false;
        } else {
            empty=0;
        }
        return true;
    })
    .join(config.newline);

    delete p;

    log(`Writing ${out}`);
    writefile(out, output);
    log('Done.');
    log('');


    if (config.print) {
        log(`=========================================================================`);
        log(`===== ${out} ===========================================================`);
        log(output);
    }
}
config={};

return 0;
}


const DEFAULTARGS = ['-strip','-s','-f','-q'];
function getDefaults() {
    return DEFAULTARGS;
}

function jspp(args = DEFAULTARGS) {
    var oldIsCommand = preproc.isCommand;
    preproc.isCommand = false;
    config = Object.assign({}, defaultConfig);

    var ret = 0;
    try {
        ret = preproc(args, ['-']);
    } catch(err) {
        ret = -1;
    }

    preproc.isCommand = oldIsCommand;
    return ret;
}

jspp.getDefaults = getDefaults;
jspp.isCommand = isCommand;

exports = module.exports = jspp;
