/* eslint-disable */
let require;
let define;
(function (global) {
  var modules = {};
  let mid = 0;                // 模块id
  let mapDepToModuleOrTask = {};    // 依赖→模块映射map
  window.modules = modules;           // 调试语句
  window.mapDepToModuleOrTask = mapDepToModuleOrTask;  // 调试语句
  define = function define(name, dep, cb, errorFn) {
    // 缺省参数处理
    if (isFunction(name)) {
      // 只有传了回调
      cb = name;
      name = getCurrentModuleName();
    } else if (Array.isArray(name) && isFunction(dep)) {
      // 传了依赖和回调
      cb = dep;
      dep = name;
      name = getCurrentModuleName();
    } else if (isString(name) && Array.isArray(name) && isFunction(cb)) {
      // 传了名字,依赖和回调
    }
    let module = modules[name];
    module.name = name;
    module.dep = dep;
    module.cb = cb;
    module.errorFn = errorFn;
    module.analyzeDep();

  };
  require = function require(dep, cb, errorFn) {
    let module = modules[getCurrentModuleName()];
    module.dep = dep;
    module.cb = cb;
    module.errorFn = errorFn;
    module.analyzeDep();
  }
  function Module(name, dep, cb, errorFn) {
    this.id = mid++;
    this.init(name, dep, cb, errorFn);
    this.fetch();
  }
  Module.prototype.analyzeDep = function () {
    let depCount = this.dep ? this.dep.length : 0;  // 依赖的模块数
    if (depCount === 0) { // 如果不依赖别的模块，直接执行回调。
      this.execute(); 
      return;
    }
    Object.defineProperty(this, 'depCount', {
      get() {
        return depCount;
      },
      set(newDepCount) {
        depCount = newDepCount;
        if (newDepCount === 0) {
          if (this.mid) {
            console.log(`模块${this.name}的依赖已经全部准备好`);
          } else if (this.tid) {
            console.log(`任务${this.tid}的依赖已经全部准备好`);
          }
          this.execute();
        }
      }
    });
    this.dep.forEach((depModuleName) => {
      if (!modules[depModuleName]) {
        let module = new Module(depModuleName);
        modules[depModuleName] = module;
      }
      if (!mapDepToModuleOrTask[depModuleName]) {
        mapDepToModuleOrTask[depModuleName] = [];
      }
      mapDepToModuleOrTask[depModuleName].push(this);
    });
  }
  Module.prototype.execute = function () {
    let arg = (this.dep || []).map((dep) => {
      return modules[dep].exports;
    });

    // 插入require到回调函数的参数列表中
    if (this.requireInDep !== -1 && this.requireInDep !== undefined) {
      arg.splice(this.requireInDep, 0, require);
    }
    this.exports = this.cb.apply(this, arg);
    this.callHook();
  }
  Module.prototype.callHook = function (mStatus) {
    let depedModules = mapDepToModuleOrTask[this.name];
    if (!depedModules) return;
    depedModules.forEach((module) => {
      // setTimeout(() => {
      module.depCount--;
      // });
    });
  };
  Module.prototype.init = function (name, dep, cb, errorFn) {
    this.name = name;
    this.dep = dep;
    this.src = moduleNameToModulePath(name);
    this.cb = cb;
    this.errorFn = errorFn;
  }
  Module.prototype.fetch = function () {
    let scriptNode = document.createElement('script');
    scriptNode.type = 'text/javascript';
    scriptNode.src = this.src;
    document.body.appendChild(scriptNode);
  };
  /**
   * 获取主入口模块的模块名
   * @returns {String} 主入口模块名
   */
  let mainEntryModule = new Module(getMainEntryModuleName());
  modules[mainEntryModule.name] = mainEntryModule;
  /**
   * 获取主入口模块的模块名
   * @returns {String} 主入口模块名
   */
  function getMainEntryModuleName() {
    let dataMain = document.currentScript.getAttribute('data-main');
    return modulePathToModuleName(dataMain);
  }
  /**
   * 将模块名转换成模块路径
   * @param name {String} 模块名
   * @returns {String} 模块路径
   */
  function moduleNameToModulePath(name) {
    let reg = /\w*.js/;
    let output = reg.exec(name);
    if (!output) {
      return `./${name}.js`;
    } else {
      return name;
    }
  }
  function isFunction(fn) {
    return typeof fn === 'function';
  }

  function isString(str) {
    return typeof str === 'string';
  }
  /**
   * 获取当前正在执行的模块的模块名
   * @returns {String}
   */
  function getCurrentModuleName() {
    let src = document.currentScript.getAttribute('src');
    return modulePathToModuleName(src);
  }
  /**
   * 将模块的路径装换成模块名
   * @param path {String} 模块路径
   * @returns {String} 模块名
   */
  function modulePathToModuleName(path) {
    let reg = /\w*.js/;
    let output = reg.exec(path);
    if (!output) {
      return path;
    } else {
      return output[0].split('.')[0];
    }
  }


})(this)
