#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';

// -----------------------------
// 配置区域
// -----------------------------
// 微信开发者工具 CLI 路径，根据你系统修改
const WX_CLI_PATH = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';

// 是否默认自动构建 npm，可通过参数覆盖
let autoBuild = true;
process.argv.slice(2).forEach(arg => {
  if (arg === '--no-build') autoBuild = false;
});

// -----------------------------
// 待处理目录
// -----------------------------
const DIRS = [
  { name: 'dev', path: path.resolve('dist/dev/mp-weixin') },
  // { name: 'build', path: path.resolve('dist/build/mp-weixin') }, // 如需 build 目录可打开
];

// -----------------------------
// 小程序依赖列表（未来可扩展）
// -----------------------------
const MINI_PROGRAM_DEPENDENCIES = [
  'tdesign-miniprogram',
  // 'vant-weapp', // 未来新增依赖可以加这里
];

DIRS.forEach(dir => {
  if (!existsSync(dir.path)) {
    console.log(`⚠️ ${dir.name} 目录不存在，跳过: ${dir.path}`);
    return;
  }

  console.log(`📦 处理 ${dir.name} 目录: ${dir.path}`);

  const packageJsonPath = path.join(dir.path, 'package.json');
  const projectConfigPath = path.join(dir.path, 'project.config.json');

  // 1️⃣ 初始化 package.json
  if (!existsSync(packageJsonPath)) {
    console.log('📦 初始化 package.json...');
    execSync('npm init -y', { cwd: dir.path, stdio: 'inherit' });
  }

  // 2️⃣ 安装小程序依赖
  MINI_PROGRAM_DEPENDENCIES.forEach(pkg => {
    console.log(`📥 安装 ${pkg}...`);
    execSync(`npm install ${pkg}`, { cwd: dir.path, stdio: 'inherit' });
  });

  // 3️⃣ 修改 project.config.json
  if (existsSync(projectConfigPath)) {
    const config = JSON.parse(readFileSync(projectConfigPath, 'utf8'));
    config.miniprogramRoot = './';
    config.packNpmManually = true;
    config.packNpmRelationList = [
      {
        packageJsonPath: './package.json',
        miniprogramNpmDistDir: './miniprogram_npm',
      },
    ];
    writeFileSync(projectConfigPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`🔧 已更新 ${projectConfigPath}`);
  } else {
    console.warn(`⚠️ 未找到 project.config.json，目录: ${dir.path}`);
  }

  // 4️⃣ 自动调用微信开发者工具 CLI 构建 npm
  if (autoBuild) {
    if (!existsSync(WX_CLI_PATH)) {
      console.warn(`⚠️ 未找到微信开发者工具 CLI: ${WX_CLI_PATH}`);
      console.log('请手动构建 npm');
    } else {
      console.log(`🚀 自动调用微信开发者工具 CLI 构建 npm: ${dir.path}`);
      try {
        execSync(`"${WX_CLI_PATH}" --project "${dir.path}" --packNpm`, { stdio: 'inherit' });
      } catch (e) {
        console.error('❌ 自动构建 npm 失败，请手动在微信开发者工具执行构建');
      }
    }
  }

  console.log(`✅ ${dir.name} 目录处理完成\n`);
});

console.log('🎉 所有存在的目录已处理完成！');
console.log(autoBuild ? 'npm 已尝试自动构建。' : '请手动在微信开发者工具构建 npm。');
