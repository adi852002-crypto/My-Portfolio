var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../../../../tmp/wr/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../../../../tmp/wr/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../../../../tmp/wr/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x2, y2, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../../../../tmp/wr/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../../../../tmp/wr/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../../../../tmp/wr/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// _worker.js
function A(e) {
  return e.cf ?? {};
}
__name(A, "A");
function g(e, n = 200, r = {}) {
  return new Response(JSON.stringify(e), { status: n, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...r } });
}
__name(g, "g");
var Y = [`CREATE TABLE IF NOT EXISTS events (
     id INTEGER PRIMARY KEY,
     ts INTEGER NOT NULL,          -- ms since epoch
     vid TEXT NOT NULL,            -- anonymous visitor: a hash that changes every day
     sid TEXT,                     -- one page load in one tab
     type TEXT NOT NULL,           -- pageview, leave, open, cta, contact, share, download, lamp, preview, message
     name TEXT,                    -- what was opened / clicked / shared
     path TEXT,
     ref TEXT,                     -- referring host, first page of a visit only
     src TEXT,                     -- where the visit came from, classified
     utm_source TEXT, utm_medium TEXT, utm_campaign TEXT,
     country TEXT, region TEXT, city TEXT, org TEXT,
     device TEXT, browser TEXT, os TEXT, lang TEXT, sw INTEGER,
     dur INTEGER                   -- engaged ms, on leave events
   )`, "CREATE INDEX IF NOT EXISTS events_ts ON events (ts)", "CREATE INDEX IF NOT EXISTS events_vid_ts ON events (vid, ts)", "CREATE INDEX IF NOT EXISTS events_type_ts ON events (type, ts)", "CREATE TABLE IF NOT EXISTS salts (day TEXT PRIMARY KEY, salt TEXT NOT NULL)", `CREATE TABLE IF NOT EXISTS messages (
     id INTEGER PRIMARY KEY,
     ts INTEGER NOT NULL,
     name TEXT NOT NULL, email TEXT NOT NULL, company TEXT, topic TEXT,
     track TEXT, availability TEXT, message TEXT NOT NULL,
     country TEXT, city TEXT, vid TEXT,
     read INTEGER NOT NULL DEFAULT 0
   )`, "CREATE INDEX IF NOT EXISTS messages_ts ON messages (ts)", "CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, ts INTEGER NOT NULL, body TEXT NOT NULL)"];
var S = null;
function b(e) {
  return S || (S = e.batch(Y.map((n) => e.prepare(n))).then(() => {
  }), S.catch(() => {
    S = null;
  })), S;
}
__name(b, "b");
var J = 400 * 24 * 3600 * 1e3;
var C = /* @__PURE__ */ __name((e) => [...new Uint8Array(e)].map((n) => n.toString(16).padStart(2, "0")).join(""), "C");
async function I(e, n) {
  let r = await e.prepare("SELECT salt FROM salts WHERE day = ?").bind(n).first();
  if (r) return r.salt;
  let s = C(crypto.getRandomValues(new Uint8Array(16)).buffer);
  return await e.batch([e.prepare("INSERT OR IGNORE INTO salts (day, salt) VALUES (?, ?)").bind(n, s), e.prepare("DELETE FROM salts WHERE day < ?").bind(n), e.prepare("DELETE FROM events WHERE ts < ?").bind(Date.now() - J)]), (await e.prepare("SELECT salt FROM salts WHERE day = ?").bind(n).first())?.salt ?? s;
}
__name(I, "I");
async function L(e, n, r) {
  let s = new TextEncoder().encode(`${e}|${n}|${r}`);
  return C(await crypto.subtle.digest("SHA-256", s)).slice(0, 20);
}
__name(L, "L");
function _(e) {
  return /iPad|Tablet|PlayBook|Silk|Kindle/i.test(e) || /Android/i.test(e) && !/Mobile/i.test(e) ? "tablet" : /Mobi|iPhone|iPod|Android|Windows Phone/i.test(e) ? "mobile" : "desktop";
}
__name(_, "_");
function U(e) {
  return /Edg(e|A|iOS)?\//.test(e) ? "Edge" : /OPR\/|Opera/.test(e) ? "Opera" : /SamsungBrowser/.test(e) ? "Samsung Internet" : /LinkedInApp/i.test(e) ? "LinkedIn app" : /FBAN|FBAV|Instagram/.test(e) ? "Facebook/Instagram app" : /FxiOS|Firefox\//.test(e) ? "Firefox" : /CriOS|Chrome\//.test(e) ? "Chrome" : /Safari\//.test(e) ? "Safari" : "Other";
}
__name(U, "U");
function P(e) {
  return /iPhone|iPad|iPod/.test(e) ? "iOS" : /Android/.test(e) ? "Android" : /CrOS/.test(e) ? "ChromeOS" : /Windows/.test(e) ? "Windows" : /Mac OS X|Macintosh/.test(e) ? "macOS" : /Linux/.test(e) ? "Linux" : "Other";
}
__name(P, "P");
var x = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|pingdom|uptime|monitor|preview|curl|wget|python|axios|node-fetch|go-http|java\/|phantom|puppeteer|playwright|selenium/i;
var K = [[/LinkedInBot/i, "LinkedIn"], [/WhatsApp/i, "WhatsApp"], [/facebookexternalhit|Facebot/i, "Facebook"], [/Twitterbot/i, "X"], [/Slackbot/i, "Slack"], [/TelegramBot/i, "Telegram"], [/Discordbot/i, "Discord"], [/SkypeUriPreview|Teams/i, "Teams/Skype"], [/Applebot|iMessage/i, "iMessage"], [/Googlebot/i, "Google (crawl)"], [/bingbot/i, "Bing (crawl)"]];
function M(e) {
  for (let [n, r] of K) if (n.test(e)) return r;
  return null;
}
__name(M, "M");
function B(e, n, r) {
  let s = n.toLowerCase();
  if (s) return s.includes("linkedin") ? "LinkedIn" : s.includes("whatsapp") ? "WhatsApp" : s === "email" || s.includes("mail") ? "Email" : s === "copy" || s === "native" ? "Shared link" : s === "x" || s.includes("twitter") ? "X" : n.slice(0, 40);
  let t = e.toLowerCase().replace(/^www\./, "");
  return !t || t === r || t.endsWith("." + r) || t.endsWith(".pages.dev") ? "Direct" : t.includes("linkedin") || t === "lnkd.in" ? "LinkedIn" : /^google\.|\.google\./.test(t) || t.startsWith("google.") ? "Google" : t.includes("bing.") ? "Bing" : t.includes("duckduckgo") ? "DuckDuckGo" : t.includes("yahoo") ? "Yahoo" : t.includes("whatsapp") || t === "wa.me" ? "WhatsApp" : t === "t.co" || t === "x.com" || t.includes("twitter") ? "X" : t.includes("facebook") || t === "fb.me" || t === "l.facebook.com" ? "Facebook" : t.includes("instagram") ? "Instagram" : t.includes("github") ? "GitHub" : t.includes("mail.") || t.includes("outlook") ? "Email" : t.includes("chatgpt") || t.includes("openai") || t.includes("perplexity") || t.includes("claude.ai") || t.includes("gemini") ? "AI assistant" : t.slice(0, 60);
}
__name(B, "B");
var v = null;
var O = /* @__PURE__ */ __name((e) => {
  let n = e.replace(/-/g, "+").replace(/_/g, "/"), r = atob(n + "=".repeat((4 - n.length % 4) % 4));
  return Uint8Array.from(r, (s) => s.charCodeAt(0));
}, "O");
async function z(e) {
  if (v && Date.now() - v.at < 36e5) return v.keys;
  let n = await fetch(`https://${e}/cdn-cgi/access/certs`);
  if (!n.ok) throw new Error("certs");
  let r = await n.json();
  return v = { at: Date.now(), keys: r.keys }, r.keys;
}
__name(z, "z");
async function X(e, n) {
  if (n.DEV_ADMIN === "1") return { email: "dev@localhost" };
  let r = n.ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, ""), s = n.ACCESS_AUD;
  if (!r || !s) return null;
  let t = e.headers.get("cf-access-jwt-assertion") ?? /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(e.headers.get("cookie") ?? "")?.[1];
  if (!t) return null;
  let [c, i, a] = t.split(".");
  if (!c || !i || !a) return null;
  try {
    let l = JSON.parse(new TextDecoder().decode(O(c)));
    if (l.alg !== "RS256") return null;
    let o = (await z(r)).find((f) => f.kid === l.kid);
    if (!o) return null;
    let u = await crypto.subtle.importKey("jwk", o, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("RSASSA-PKCS1-v1_5", u, O(a), new TextEncoder().encode(`${c}.${i}`))) return null;
    let m = JSON.parse(new TextDecoder().decode(O(i)));
    return !(Array.isArray(m.aud) ? m.aud : [m.aud]).includes(s) || !m.exp || m.exp * 1e3 < Date.now() || m.iss && m.iss !== `https://${r}` ? null : { email: m.email ?? "unknown" };
  } catch {
    return null;
  }
}
__name(X, "X");
function W(e, n) {
  let s = Date.now() + n * 6e4;
  return Math.floor(s / 864e5) * 864e5 - (e - 1) * 864e5 - n * 6e4;
}
__name(W, "W");
async function F(e, n, r) {
  let s = W(n, r), t = r * 60, c = "ts >= ?1 AND type != 'preview'", i = /* @__PURE__ */ __name((f, w, h = "COUNT(DISTINCT vid)", T = 10) => e.prepare(`SELECT ${f} AS k, ${h} AS n FROM events
       WHERE ts >= ?1 AND ${w} AND ${f} IS NOT NULL AND ${f} != ''
       GROUP BY k ORDER BY n DESC LIMIT ${T}`).bind(s), "i"), a = { kpi: e.prepare(`SELECT
         COUNT(DISTINCT vid) AS visitors,
         SUM(type = 'pageview') AS pageviews,
         SUM(type = 'open') AS opens,
         SUM(type IN ('contact', 'message')) AS contacts,
         SUM(type = 'message') AS messages,
         SUM(type = 'share') AS shares,
         SUM(type = 'download') AS downloads,
         COALESCE(SUM(CASE WHEN type = 'leave' THEN dur END), 0) AS engaged
       FROM events WHERE ${c}`).bind(s), visits: e.prepare(`SELECT COUNT(*) AS visits FROM (
         SELECT ts - LAG(ts) OVER (PARTITION BY vid ORDER BY ts) AS gap
         FROM events WHERE ${c}
       ) WHERE gap IS NULL OR gap > 1800000`).bind(s), previews: e.prepare("SELECT COUNT(*) AS n FROM events WHERE ts >= ?1 AND type = 'preview'").bind(s), live: e.prepare("SELECT COUNT(DISTINCT vid) AS n FROM events WHERE ts >= ?1 AND type != 'preview'").bind(Date.now() - 5 * 6e4), daily: e.prepare(`SELECT date(ts / 1000 + ${t}, 'unixepoch') AS d,
              COUNT(DISTINCT vid) AS visitors, SUM(type = 'pageview') AS pageviews
       FROM events WHERE ${c} GROUP BY d ORDER BY d`).bind(s), engagedVisitors: e.prepare(`SELECT
         COUNT(DISTINCT CASE WHEN type = 'open' THEN vid END) AS opened,
         COUNT(DISTINCT CASE WHEN type IN ('contact', 'message') THEN vid END) AS contacted
       FROM events WHERE ${c}`).bind(s), sources: i("src", "type = 'pageview'"), referrers: i("ref", "type = 'pageview'"), campaigns: i("utm_campaign", "type = 'pageview'"), countries: i("country", "type = 'pageview'"), cities: i("city || ', ' || country", "type = 'pageview' AND city IS NOT NULL"), orgs: i("org", "type = 'pageview'"), devices: i("device", "type = 'pageview'"), browsers: i("browser", "type = 'pageview'"), systems: i("os", "type = 'pageview'"), languages: i("substr(lang, 1, 2)", "type = 'pageview'"), pages: i("path", "type = 'pageview'", "COUNT(*)"), opens: i("name", "type = 'open'", "COUNT(*)", 20), ctas: i("name", "type = 'cta'", "COUNT(*)"), contactsBy: i("name", "type IN ('contact', 'message')", "COUNT(*)"), sharesBy: i("name", "type = 'share'", "COUNT(*)"), sharedArrivals: i("src", "type = 'pageview' AND utm_medium = 'share'"), previewsBy: i("name", "type = 'preview'", "COUNT(*)"), downloadsBy: i("name", "type = 'download'", "COUNT(*)"), unread: e.prepare("SELECT COUNT(*) AS n FROM messages WHERE read = 0") }, l = Object.keys(a), o = await e.batch(l.map((f) => a[f])), u = Object.fromEntries(l.map((f, w) => [f, o[w].results])), d = u.kpi[0] ?? {}, m = Number(u.visits[0]?.visits ?? 0), p = /* @__PURE__ */ __name((f) => f, "p");
  return { range: { days: n, since: s, tz: r }, kpi: { visitors: Number(d.visitors ?? 0), visits: m, pageviews: Number(d.pageviews ?? 0), avgEngagedMs: m ? Math.round(Number(d.engaged ?? 0) / m) : 0, opens: Number(d.opens ?? 0), contacts: Number(d.contacts ?? 0), messages: Number(d.messages ?? 0), shares: Number(d.shares ?? 0), downloads: Number(d.downloads ?? 0), previews: Number(u.previews[0]?.n ?? 0), live: Number(u.live[0]?.n ?? 0), unread: Number(u.unread[0]?.n ?? 0) }, funnel: { visitors: Number(d.visitors ?? 0), opened: Number(u.engagedVisitors[0]?.opened ?? 0), contacted: Number(u.engagedVisitors[0]?.contacted ?? 0) }, daily: u.daily, lists: { sources: p(u.sources), referrers: p(u.referrers), campaigns: p(u.campaigns), countries: p(u.countries), cities: p(u.cities), orgs: p(u.orgs), devices: p(u.devices), browsers: p(u.browsers), systems: p(u.systems), languages: p(u.languages), pages: p(u.pages), opens: p(u.opens), ctas: p(u.ctas), contacts: p(u.contactsBy), shares: p(u.sharesBy), sharedArrivals: p(u.sharedArrivals), previews: p(u.previewsBy), downloads: p(u.downloadsBy) } };
}
__name(F, "F");
async function G(e, n, r, s = 60) {
  let t = W(n, r), { results: c } = await e.prepare(`SELECT ts, vid, type, name, path, ref, src, utm_source, utm_medium, utm_campaign,
            country, region, city, org, device, browser, os, lang, dur
     FROM events WHERE ts >= ? AND type != 'preview' ORDER BY ts DESC LIMIT 4000`).bind(t).all(), i = /* @__PURE__ */ new Map();
  for (let l of c.reverse()) {
    let o = i.get(l.vid) ?? [];
    o.push(l), i.set(l.vid, o);
  }
  let a = [];
  for (let l of i.values()) {
    let o = [], u = /* @__PURE__ */ __name(() => {
      if (!o.length) return;
      let d = o[0], m = o.find((p) => p.src) ?? d;
      a.push({ start: d.ts, end: o[o.length - 1].ts, engagedMs: o.reduce((p, f) => p + (f.type === "leave" ? f.dur ?? 0 : 0), 0), place: [d.city, d.region, d.country].filter(Boolean).join(", "), country: d.country, org: d.org, device: d.device, browser: d.browser, os: d.os, lang: d.lang, source: m.src ?? "Direct", ref: m.ref, campaign: m.utm_campaign, steps: o.filter((p) => p.type !== "leave").map((p) => ({ ts: p.ts, type: p.type, name: p.name, path: p.path })) }), o = [];
    }, "u");
    for (let d of l) o.length && d.ts - o[o.length - 1].ts > 18e5 && u(), o.push(d);
    u();
  }
  return a.sort((l, o) => o.start - l.start), a.slice(0, s);
}
__name(G, "G");
var k = /* @__PURE__ */ __name((e) => {
  let n = typeof e == "string" ? e : String.fromCharCode(...e);
  return btoa(n).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}, "k");
async function Q(e) {
  let n = Math.floor(Date.now() / 1e3), r = k(JSON.stringify({ alg: "RS256", typ: "JWT" })), s = k(JSON.stringify({ iss: e.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: "https://oauth2.googleapis.com/token", iat: n, exp: n + 3600 })), t = e.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""), c = Uint8Array.from(atob(t), (o) => o.charCodeAt(0)), i = await crypto.subtle.importKey("pkcs8", c, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]), a = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", i, new TextEncoder().encode(`${r}.${s}`))), l = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${r}.${s}.${k(a)}` }) });
  if (!l.ok) throw new Error(`Google sign-in failed (${l.status})`);
  return (await l.json()).access_token;
}
__name(Q, "Q");
async function y(e, n, r) {
  let s = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(n)}/searchAnalytics/query`, { method: "POST", headers: { authorization: `Bearer ${e}`, "content-type": "application/json" }, body: JSON.stringify(r) });
  if (s.status === 403) throw new Error("The service account has not been added as a user on this Search Console property.");
  if (!s.ok) throw new Error(`Search Console answered ${s.status}`);
  return (await s.json()).rows ?? [];
}
__name(y, "y");
var $ = /* @__PURE__ */ __name((e) => e.toISOString().slice(0, 10), "$");
async function H(e, n = false) {
  if (!e.GSC_SERVICE_ACCOUNT || !e.GSC_SITE) return { configured: false };
  let r = e.DB, s = `gsc:${e.GSC_SITE}`;
  if (r && !n) {
    let t = await r.prepare("SELECT ts, body FROM cache WHERE key = ?").bind(s).first();
    if (t && Date.now() - t.ts < 216e5) return JSON.parse(t.body);
  }
  try {
    let t = JSON.parse(e.GSC_SERVICE_ACCOUNT), c = await Q(t), i = new Date(Date.now() - 2 * 864e5), a = new Date(i.getTime() - 27 * 864e5), l = { startDate: $(a), endDate: $(i) }, [o, u, d, m, p, f] = await Promise.all([y(c, e.GSC_SITE, { ...l, dimensions: ["date"], rowLimit: 100 }), y(c, e.GSC_SITE, { ...l, dimensions: ["query"], rowLimit: 15 }), y(c, e.GSC_SITE, { ...l, dimensions: ["page"], rowLimit: 10 }), y(c, e.GSC_SITE, { ...l, dimensions: ["country"], rowLimit: 8 }), y(c, e.GSC_SITE, { ...l, dimensions: ["device"], rowLimit: 5 }), y(c, e.GSC_SITE, { ...l, rowLimit: 1 })]), w = f[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 }, h = { configured: true, site: e.GSC_SITE, range: { start: l.startDate, end: l.endDate }, totals: { clicks: w.clicks, impressions: w.impressions, ctr: w.ctr, position: w.position }, daily: o.map((T) => ({ date: T.keys?.[0] ?? "", clicks: T.clicks, impressions: T.impressions })), queries: u, pages: d, countries: m, devices: p, fetchedAt: Date.now() };
    return r && await r.prepare("INSERT OR REPLACE INTO cache (key, ts, body) VALUES (?, ?, ?)").bind(s, Date.now(), JSON.stringify(h)).run(), h;
  } catch (t) {
    return { configured: true, error: t instanceof Error ? t.message : "Could not reach Search Console" };
  }
}
__name(H, "H");
var N = "aniruddhadasgupta.com";
var Z = /* @__PURE__ */ new Set(["pageview", "leave", "open", "cta", "contact", "share", "download", "lamp"]);
var E = /* @__PURE__ */ __name((e, n) => typeof e == "string" && e ? e.slice(0, n) : null, "E");
var R = /* @__PURE__ */ new Map();
function q(e, n, r) {
  let s = Date.now(), t = R.get(e);
  return !t || s - t.at > r ? (R.set(e, { at: s, n: 1 }), R.size > 5e3 && R.clear(), false) : (t.n += 1, t.n > n);
}
__name(q, "q");
function V(e) {
  let n = e.headers.get("origin");
  if (!n) return false;
  try {
    let r = new URL(n).host, s = new URL(e.url).host;
    return r === s || r === N || r === `www.${N}` || r.endsWith(".pages.dev") || r.startsWith("localhost") || r.startsWith("127.0.0.1");
  } catch {
    return false;
  }
}
__name(V, "V");
async function j(e, n) {
  let r = n.DB;
  await b(r);
  let s = e.headers.get("user-agent") ?? "", t = e.headers.get("cf-connecting-ip") ?? e.headers.get("x-forwarded-for") ?? "0.0.0.0", c = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), i = await L(await I(r, c), t, s), a = A(e);
  return { ua: s, vid: i, country: a.country ?? null, region: a.region ?? null, city: a.city ?? null, org: a.asOrganization ?? null, device: _(s), browser: U(s), os: P(s) };
}
__name(j, "j");
var D = `INSERT INTO events
  (ts, vid, sid, type, name, path, ref, src, utm_source, utm_medium, utm_campaign,
   country, region, city, org, device, browser, os, lang, sw, dur)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
async function ee(e, n) {
  if (!n.DB) return new Response(null, { status: 204 });
  if (!V(e)) return new Response(null, { status: 403 });
  let r = e.headers.get("user-agent") ?? "";
  if (!r || x.test(r)) return new Response(null, { status: 204 });
  let s = await e.text();
  if (s.length > 4e3) return new Response(null, { status: 413 });
  let t;
  try {
    t = JSON.parse(s);
  } catch {
    return new Response(null, { status: 400 });
  }
  let c = String(t.t ?? "");
  if (!Z.has(c)) return new Response(null, { status: 400 });
  let i = await j(e, n);
  if (q(i.vid, 300, 10 * 6e4)) return new Response(null, { status: 204 });
  let a = "";
  try {
    a = t.r ? new URL(String(t.r)).hostname : "";
  } catch {
  }
  let l = E(t.us, 60) ?? "", o = c === "pageview" && t.land === 1, u = o ? B(a, l, N) : null, d = !a || a.replace(/^www\./, "") === N;
  return await n.DB.prepare(D).bind(Date.now(), i.vid, E(t.s, 24), c, E(t.n, 80), E(t.p, 200), o && !d ? a.slice(0, 100) : null, u, o && l || null, o ? E(t.um, 60) : null, o ? E(t.uc, 80) : null, i.country, i.region, i.city, E(i.org, 80), i.device, i.browser, i.os, E(t.l, 16), typeof t.w == "number" ? Math.round(t.w) : null, c === "leave" && typeof t.d == "number" ? Math.min(Math.max(0, Math.round(t.d)), 36e5) : null).run(), new Response(null, { status: 204 });
}
__name(ee, "ee");
var te = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
async function ne(e, n) {
  if (!n.DB) return g({ ok: false, error: "not-configured" }, 503);
  if (!V(e)) return g({ ok: false, error: "origin" }, 403);
  let r = await e.text();
  if (r.length > 12e3) return g({ ok: false, error: "too-long" }, 413);
  let s;
  try {
    s = JSON.parse(r);
  } catch {
    return g({ ok: false, error: "bad-request" }, 400);
  }
  if (s.website || typeof s.elapsed == "number" && s.elapsed < 2500) return g({ ok: true });
  let t = E(s.name, 120)?.trim() ?? "", c = E(s.email, 200)?.trim() ?? "", i = E(s.message, 4e3)?.trim() ?? "";
  if (t.length < 2 || !te.test(c) || i.length < 20) return g({ ok: false, error: "invalid" }, 422);
  let a = await j(e, n);
  if (((await n.DB.prepare("SELECT COUNT(*) AS n FROM messages WHERE vid = ? AND ts > ?").bind(a.vid, Date.now() - 36e5).first())?.n ?? 0) >= 3) return g({ ok: false, error: "rate" }, 429);
  let o = Date.now();
  return await n.DB.batch([n.DB.prepare(`INSERT INTO messages (ts, name, email, company, topic, track, availability, message, country, city, vid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(o, t, c, E(s.company, 160), E(s.topic, 60), E(s.track, 40), E(s.when, 160), i, a.country, a.city, a.vid), n.DB.prepare(D).bind(o, a.vid, E(s.s, 24), "message", E(s.topic, 60) ?? "form", "/contact/", null, null, null, null, null, a.country, a.region, a.city, E(a.org, 80), a.device, a.browser, a.os, null, null, null)]), g({ ok: true });
}
__name(ne, "ne");
async function se(e, n, r) {
  let s = await X(e, n), t = { "x-robots-tag": "noindex" };
  if (!s) return g({ error: "unauthorised" }, 401, t);
  if (!n.DB) return g({ error: "no-database" }, 503, t);
  await b(n.DB);
  let c = new URL(e.url), i = Math.min(Math.max(Number(c.searchParams.get("days")) || 7, 1), 400), a = Math.min(Math.max(Number(c.searchParams.get("tz")) || 330, -720), 840);
  if (r === "/api/admin/me") return g({ email: s.email }, 200, t);
  if (r === "/api/admin/overview") return g(await F(n.DB, i, a), 200, t);
  if (r === "/api/admin/visits") return g(await G(n.DB, i, a), 200, t);
  if (r === "/api/admin/seo") return g(await H(n, c.searchParams.get("fresh") === "1"), 200, t);
  if (r === "/api/admin/messages" && e.method === "GET") {
    let { results: o } = await n.DB.prepare(`SELECT id, ts, name, email, company, topic, track, availability, message, country, city, read
       FROM messages ORDER BY ts DESC LIMIT 200`).all();
    return g(o, 200, t);
  }
  let l = /^\/api\/admin\/messages\/(\d+)$/.exec(r);
  if (l) {
    let o = Number(l[1]);
    if (e.method === "DELETE") return await n.DB.prepare("DELETE FROM messages WHERE id = ?").bind(o).run(), g({ ok: true }, 200, t);
    if (e.method === "POST") {
      let u = await e.json().catch(() => ({}));
      return await n.DB.prepare("UPDATE messages SET read = ? WHERE id = ?").bind(u.read === false ? 0 : 1, o).run(), g({ ok: true }, 200, t);
    }
  }
  return g({ error: "not-found" }, 404, t);
}
__name(se, "se");
async function re(e, n, r, s) {
  if (!n.DB) return;
  await b(n.DB);
  let t = A(e);
  await n.DB.prepare(D).bind(Date.now(), `bot:${r}`, null, "preview", r, s.slice(0, 200), null, null, null, null, null, t.country ?? null, null, null, null, null, null, null, null, null, null).run();
}
__name(re, "re");
var we = { async fetch(e, n, r) {
  let t = new URL(e.url).pathname;
  try {
    if (t === "/api/collect" && e.method === "POST") return await ee(e, n);
    if (t === "/api/contact" && e.method === "POST") return await ne(e, n);
    if (t.startsWith("/api/admin/")) return await se(e, n, t);
    if (t.startsWith("/api/")) return g({ error: "not-found" }, 404);
  } catch (c) {
    return console.error(c), g({ error: "server" }, 500);
  }
  if (e.method === "GET") {
    let c = M(e.headers.get("user-agent") ?? "");
    c && r.waitUntil(re(e, n, c, t).catch(() => {
    }));
  }
  return n.ASSETS.fetch(e);
} };

// ../../../../tmp/wr/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../tmp/wr/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    const body = JSON.stringify(error3);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-yQ6F28/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = we;

// ../../../../tmp/wr/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-yQ6F28/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=bundledWorker-0.24932406359562043.mjs.map
