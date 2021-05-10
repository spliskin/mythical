// Originally based on https://github.com/gforceg/node-hound
// revamped and retooled, more fault tolerant

const { EventEmitter } = require('events');
const path = require('path');
const fs = require('fs');

const stdlog = typeof window !== undefined && console.log ? console.log : _printsync;

const readdir = (...args) => fs.readdirSync(...args);
function stat(fname) {
    try {
        return fs.statSync(fname) || false;
    } catch(e) {
        return false;
    }
}

// TODO: Attach stat info to the _spydata, i.e. file / directory flag
//       can / will be used to fix when stat fails on deletion(s) / renames

// tracks watchers and changes and emits events.
class Nightshift extends EventEmitter {

    constructor() {
        super();
        this._watchers = new Map();
    }

    isWatcher(key) {
        return this._watchers.has(key);
    }

    _getwatcher(key) {
        return this._watchers.get(key) || false;
    }

    _getWatcherData(src) {
        const w = this._getwatcher(src);
        return w ? w._spydata : false;
    }

    _addWatcher(src) {
        var val = fs.watch(src, this._spy.bind(this, src));
        val._spydata = { lastChange : null };
        this._watchers.set(src, val);
        this.emit('watch', src);
    }

    _removeWatcher(key) {
        var w = this._getwatcher(key);
        if (!w)
            return false;

        w.close();
        delete w._spydata;
        this._watchers.delete(key);

        return true;
    }

    watch(src) {
        src = path.resolve(src);
        if (this.isWatcher(src))
            return false;

        var stats = stat(src);
        if (stats && stats.isDirectory()) {
            for(var file of readdir(src)) {
                this.watch(`${src}${path.sep}${file}`);
            }
        }

        this._addWatcher(src);
        return true;
    }

    _spy(src, event, filename) {
        //stdlog(`**** SPY Event(${event}) -- '${src}' : '${filename}'`);
        var stats = stat(src);
        if (stats) {
            if (stats.isFile()) {
                var data = this._getWatcherData(src);
                if (!data) return;

                var diff = stats.mtime.getTime() - data.lastChange;
                if (data.lastChange === null || diff > 0 && diff > 250) {
                    console.log(`Changed: ${diff}`);
                    this.emit('change', src, stats);
                    data.lastChange = stats.mtime.getTime();
                }
            } else if (stats.isDirectory()) {
                // Check if the dir is new
                if (!this.isWatcher(src))
                    this.emit('create', src, stats);

                // Check files to see if there are any new files
                for(var fname of readdir(src)) {
                    var file = `${src}${path.sep}${fname}`;
                    if (!this.isWatcher(file)) {
                        this.watch(file);
                        this.emit('create', file, stat(file));
                    }
                }
            }
        } else {
            if (this.unwatch(src))
                this.emit('delete', src);
        }
    }

    // Unwatch a file or directory tree.
    unwatch(src) {
        src = path.resolve(src);
        if (!this._removeWatcher(src))
            return false;

        this.emit('unwatch', src);
        var stats = stat(src);
        if (stats && stats.isDirectory()) {
            for(var file of readdir(src)) {
                this.unwatch(`${src}${path.sep}${file}`);
            }
        }

        return true;
    }

    // Unwatch all currently watched files and directories in this watcher.
    clear() {
        for(var file of this._watchers) {
            this.unwatch(file[0]);
        }
    }
}

exports = module.exports = Nightshift;
