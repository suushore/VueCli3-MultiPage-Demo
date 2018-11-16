let path = require('path')
let glob = require('glob')
let fs = require('fs')


const config = {
  pagesRoot: path.resolve(__dirname, 'src/pages'),
  entry: "main.js",
  html: "index.html",
};

const getPageModulesPath = () => {
  const pageModulesPath = glob.sync(`${config.pagesRoot}/*`);
  return pageModulesPath.filter(
    pageModulePath => {
      return fs.statSync(pageModulePath).isDirectory() &&
        fs.existsSync(`${pageModulePath}/${config.entry}`) &&
        fs.existsSync(`${pageModulePath}/${config.html}`)
    }
  );
};

const setPages = () => {
  const pages = {};
  getPageModulesPath().forEach(pageModulePath => {
    const pagename = pageModulePath.split('pages/').pop();
    pages[pagename] = {
      entry: `${pageModulePath}/${config.entry}`,
      template: `${pageModulePath}/${config.html}`,
      filename: pagename === 'index' ? config.html : `${pagename}/${config.html}`,
      title: pagename,
    };
  });
  return pages;
};

const pages = setPages();

module.exports = {
  pages,
  productionSourceMap: false, //关闭SourceMa
  devServer: {
    historyApiFallback: true, //前端路由下刷新网页，从index.html进入。
  },
  chainWebpack: config => {
    // 按需利用import(/* webpackPrefetch: true */ './someAsyncComponent.vue')加载。
    Object.keys(pages).forEach(entryName => {
      config.plugins.delete(`prefetch-${entryName}`);
    });
    //css打包路径，通过MiniCssExtractPlugin插件完成，可以使用chainWebpack的tap修改
    if (process.env.NODE_ENV === 'production') {
      config.plugin('extract-css').tap(() => [{
        filename: '[name]/css/[name].[contenthash:8].css',
        chunkFilename: '[name]/css/[name].[contenthash:8].css'
      }]);
    }
  },
  //js打包路径，通过修改webpack的output配置来完成
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      config.output = {
        path: path.join(__dirname, './dist'),
        filename: '[name]/js/[name].[contenthash:8].js',
        publicPath: '/',
        chunkFilename: '[name]/js/[name].[contenthash:8].js'
      };
    }
  }
};