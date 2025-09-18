#!/usr/bin/env node
// CommonJS 版本 —— node 直接运行，无需 package.json type:module
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

const SRC_DIR = path.resolve('dist/dev/.sourcemap/mp-weixin');
const TARGET_DIR = path.resolve('dist/dev/mp-weixin');
const WATCH = process.argv.includes('--watch');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function findAllMapFiles(dir) {
  const list = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name.endsWith('.js.map')) list.push(p);
    }
  }
  walk(dir);
  return list;
}

function findJsCandidatesByBasename(basename, root) {
  const found = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    const entries = fs.readdirSync(d, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile() && e.name === basename) found.push(p);
    }
  }
  walk(root);
  return found;
}

function syncOnce() {
  if (!fs.existsSync(SRC_DIR)) {
    console.warn(`⚠️ 源目录不存在：${SRC_DIR}（请先执行 dev 构建）`);
    return;
  }
  if (!fs.existsSync(TARGET_DIR)) {
    console.warn(`⚠️ 目标目录不存在：${TARGET_DIR}`);
    return;
  }

  const maps = findAllMapFiles(SRC_DIR);
  console.log(`🔁 找到 ${maps.length} 个 .js.map，开始映射...`);

  maps.forEach(mapPath => {
    const rel = path.relative(SRC_DIR, mapPath); // e.g. "common/vendor.js.map" or "common/common/vendor.js.map"
    const defaultDest = path.join(TARGET_DIR, rel); // naive default
    const defaultJs = defaultDest.replace(/\.map$/, ''); // default .js location

    // 如果默认位置就有对应的 .js，直接复制过去
    if (fs.existsSync(defaultJs)) {
      ensureDir(path.dirname(defaultDest));
      fs.copyFileSync(mapPath, defaultDest);
      console.log(`✅ 匹配（默认）: ${rel} -> ${path.relative(TARGET_DIR, defaultDest)}`);
      return;
    }

    // 否则尝试逐层剥前缀匹配：把 rel 的第一段逐步去掉，看看有没有对应的 js
    const parts = rel.split(path.sep);
    let matched = false;
    for (let i = 1; i < parts.length; i++) {
      const trialRel = path.join(...parts.slice(i)); // 去掉前 i 段
      const trialDest = path.join(TARGET_DIR, trialRel);
      const trialJs = trialDest.replace(/\.map$/, '');
      if (fs.existsSync(trialJs)) {
        ensureDir(path.dirname(trialDest));
        fs.copyFileSync(mapPath, trialDest);
        console.log(`✅ 匹配（剥前缀）: ${rel} -> ${path.relative(TARGET_DIR, trialDest)}`);
        matched = true;
        break;
      }
    }
    if (matched) return;

    // 再 fallback：按 basename 搜索目标目录中可能的 .js（比如 vendor.js）
    const basenameJs = path.basename(mapPath, '.map'); // e.g. vendor.js
    const candidates = findJsCandidatesByBasename(basenameJs, TARGET_DIR);
    if (candidates.length > 0) {
      const chosen = candidates[0];
      const dest = path.join(path.dirname(chosen), path.basename(mapPath));
      ensureDir(path.dirname(dest));
      fs.copyFileSync(mapPath, dest);
      console.log(`✅ 匹配（按 basename 搜索）: ${rel} -> ${path.relative(TARGET_DIR, dest)}`);
      return;
    }

    // 最后回退到默认位置（即使没有 js 也复制，避免缺文件）
    ensureDir(path.dirname(defaultDest));
    fs.copyFileSync(mapPath, defaultDest);
    console.log(`⚠️ 未匹配到对应 .js，已复制到默认位置: ${rel}`);
  });

  console.log('🎉 SourceMap 同步完成');
}

function watchAndSync() {
  console.log(`👀 监听 ${SRC_DIR} 变动，自动同步到 ${TARGET_DIR}`);
  const watcher = chokidar.watch(SRC_DIR, { ignoreInitial: true });
  const deb = (fn, ms = 500) => {
    let t = null;
    return () => { if (t) clearTimeout(t); t = setTimeout(fn, ms); };
  };
  const runner = deb(syncOnce, 800);
  watcher.on('add', runner).on('change', runner).on('unlink', runner);
  // 初始一次
  syncOnce();
}

if (WATCH) watchAndSync();
else syncOnce();
