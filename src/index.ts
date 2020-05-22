// ref:
// - https://umijs.org/plugins/api
import { IApi } from '@umijs/types';
import winPath from 'slash2';
import serveStatic from 'serve-static';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import less from 'less';
import defaultTheme from './defaultTheme';
import uglifycss from 'uglifycss';

interface themeConfig {
  theme?: string;
  stylePath: string;
  fileName: string;
  key: string;
  modifyVars?: { [key: string]: string };
}

export default function (api: IApi) {
  api.logger.info('use plugin');
  let options: {
    theme: themeConfig[];
  } = defaultTheme;
  // 获取主题 json 配置文件
  const themeConfigPath = winPath(path.join(api.paths.cwd || '', 'config/theme.config.ts'));

  if (existsSync(themeConfigPath)) {
    options = require(themeConfigPath);
  }

  const { cwd, absOutputPath, absNodeModulesPath = '' } = api.paths;
  const outputPath = absOutputPath;
  const themeTemp = winPath(path.join(absNodeModulesPath, '.plugin-theme'));
  // 增加中间件
  api.addMiddewares(() => {
    return serveStatic(themeTemp);
  });

  // dev 配置
  api.onDevCompileDone(() => {
    api.logger.info('cache in :' + themeTemp);
    api.logger.info('💄  build theme');
    // 建立相关的临时文件夹
    try {
      if (existsSync(themeTemp)) {
        rimraf.sync(themeTemp);
      }
      if (existsSync(winPath(path.join(themeTemp, 'theme')))) {
        rimraf.sync(winPath(path.join(themeTemp, 'theme')));
      }

      mkdirSync(winPath(path.join(themeTemp, 'theme')));
    } catch (error) {
      console.log(error);
    }

    // 读取 options 配置，根据配置生成对应资源
    options.theme.forEach(themeOpt => {
      const { fileName, stylePath } = themeOpt;
      const antdLess = readFileSync(stylePath, 'utf-8');
      less.render(antdLess, {}).then(out => {
        const css = uglifycss.processString(out.css);
        writeFileSync(fileName, css);
      });
    });
  })
}
