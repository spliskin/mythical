const stdlog = typeof window !== undefined && console.log ? console.log : _printsync;
const onbreak = require('./tools/onbreak.js');
const Nightshift = require('./tools/nightshift');

var shift = new Nightshift();
onbreak(() => {
    console.log("Caught interrupt signal");
    shift.clear();
    process.exit(0);
});

// Add callbacks for file and directory events.  The change event only applies to files.
shift.on('create', file => stdlog(`${file} was created`));
shift.on('delete', file => stdlog(`${file} was deleted`));

shift.on('change', function (file, stats) {
    console.log(`${file} was changed`);
    let cmd = Work.on['change'] || false;
    if (!cmd) {
        stdlog("Nothing to do");
        return;
    }

    cmd(file, stats);
});

shift.on('watch', file => stdlog(`Watching file: '${file}'`));
shift.on('unwatch', file => stdlog(`Forgetting file: '${file}'`));

// Create a directory tree watcher.
shift.watch('./src');
shift.watch('./main.js');
