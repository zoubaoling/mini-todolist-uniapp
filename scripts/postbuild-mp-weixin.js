#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// -----------------------------
// 配置
// -----------------------------
const WX_CLI_PATH = '/Applications/wechatwebdevtools.app/Contents/MacOS/cli';
const DIST_DIRS = [path.resolve('dist/dev/mp-weixin')];
const DEPENDENCIES = ['tdesign-miniprogram'];

// -----------------------------
// 主逻辑
// -----------------------------
DIST_DIRS.forEach(distDir => {
  if (!existsSync(distDir)) {
    console.warn(`⚠️ dist 目录不存在，跳过: ${distDir}`);
    return;
  }

  console.log(`📦 处理 ${distDir} ...`);

  // 1️⃣ package.json
  const packageJsonPath = path.join(distDir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    const pkg = {
      name: 'mp-weixin-dist',
      version: '1.0.0',
      description: 'dist 自动生成的 package.json',
      dependencies: {},
    };
    DEPENDENCIES.forEach(dep => {
      pkg.dependencies[dep] = '*'; // 保证能安装最新版本
    });
    writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2), 'utf8');
    console.log('✅ 已生成 package.json');
  }

  // 2️⃣ 安装依赖
  console.log('📥 安装依赖...');
  execSync('npm install', { cwd: distDir, stdio: 'inherit' });

  // 3️⃣ project.config.json
  const projectConfigPath = path.join(distDir, 'project.config.json');
  let config = {};
  if (existsSync(projectConfigPath)) {
    config = JSON.parse(readFileSync(projectConfigPath, 'utf8'));
  }
  config.miniprogramRoot = './';
  config.packNpmManually = true;
  config.packNpmRelationList = [
    {
      packageJsonPath: './package.json',
      miniprogramNpmDistDir: './miniprogram_npm',
    },
  ];
  writeFileSync(projectConfigPath, JSON.stringify(config, null, 2), 'utf8');
  console.log('✅ 已更新 project.config.json');

  // 4️⃣ 微信 CLI 构建 npm
  if (!existsSync(WX_CLI_PATH)) {
    console.warn(`⚠️ 未找到微信 CLI: ${WX_CLI_PATH}`);
    console.log('请手动构建 npm');
  } else {
    console.log('🚀 调用微信 CLI 构建 npm...');
    try {
      execSync(`"${WX_CLI_PATH}" --project "${distDir}" --packNpm`, { stdio: 'inherit' });
    } catch (e) {
      console.error('❌ 自动构建 npm 失败，请手动在微信开发者工具执行构建');
    }
  }

  console.log(`🎉 ${distDir} 处理完成`);
});

console.log('✅ 所有目录已处理完成！');
