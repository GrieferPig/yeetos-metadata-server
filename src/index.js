/**
 * YeetOS's metadata server.
 * Distribute ROM-related info such as latestVersion, maximumBlockedVersion, downloadUri, etc.
 * 
 * Author: GrieferPig
 */

// TODO: Rewrite in Rust for efficiency
const process = require('process');
const dirname = process.cwd()

let http = require('http');
let fs = require('fs');
let path = require('path')
let eol = require('os').EOL
let chokidar = require('chokidar');

const LISTEN_PORT = 54088;

const META_DIR = dirname;
const META_FILE_NAME = "yeetos.metadata.json";
const META_FILE_PATH = path.join(META_DIR, META_FILE_NAME);

const LOG_FILE_NAME = `${getTimeStampRaw()}.log`;

let body = "WDNMD NMSL";

async function createServer(port) {
    var server = http.createServer((request, response) => {
        response.write(body);
        response.end();
    })

    server.listen(port, '0.0.0.0');
    return server;
}

async function cli() {
    process.stdin.on('data', data => {
        data = data.toString().replace(/(\r\n|\n|\r)/gm, ""); // remove line breaks
        switch (data) {
            case "stop":
                l("INFO", "User issued stop command, terminating server")
                process.exit(0);
            case "reload":
                reloadCallback();
                break;
            case "clearlog":
                clearLog();
                break;
            default:
                l(ERROR, `unknown command ${data}`);
        }
    });
}

async function fileListener(reload_callback) {
    chokidar.watch(".").on("all", (eventType, file) => {
        if (file === META_FILE_NAME && eventType === "change") {
            l(INFO, `${file} changed, reloading.`);
            reload_callback();
        }
    });
}

function clearLog() {
    let files = fs.readdirSync(dirname);
    let counter = 0;
    files = files.forEach(e => {
        if (e.endsWith(".log") && e !== `${LOG_FILE_NAME}`) {
            fs.unlinkSync(path.join(dirname, e));
            counter++;
        }
    });
    l(INFO, `deleted ${counter} logs`)
}

function reloadCallback() {
    body = fs.readFileSync(META_FILE_PATH);
    l(INFO, `metadata reloaded`)
}

function getTimeStamp() {
    return new Date(getTimeStampRaw()).toLocaleString();
}

function getTimeStampRaw() {
    return Date.now();
}

const INFO = 0;
const WARNING = 1;
const ERROR = 2;

function determineLogLevel(level) {
    switch (level) {
        case INFO:
            return "INFO:"
        case WARNING:
            return "WARINING:"
        case ERROR:
            return "ERROR:"
        default:
            return "INFO:"
    }
}

function l(level, msg) {
    let log_msg = `[${getTimeStamp()}] ${determineLogLevel(level)} ${msg}`;
    console.log(log_msg);
    fs.appendFile(path.join(dirname, LOG_FILE_NAME), log_msg + eol, err => {
        if (err) {
            console.log(`[${getTimeStamp()}] ERROR: write log fault: ${err}`)
        }
    })
}

async function main() {
    let server = createServer(LISTEN_PORT);
    cli();
    fileListener(reloadCallback);
    reloadCallback();
    l(INFO, `Server started at 127.0.0.1:${LISTEN_PORT}`)
    l(INFO, `META_DIR:${META_DIR}, META_FILE_NAME:${META_FILE_NAME}, LOG_FILE_NAME:${LOG_FILE_NAME}`)
}

main();
