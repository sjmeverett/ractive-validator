

export default class ObjectModel {
  constructor(model) {
    this.model = model || {};
  }


  get(keypath) {
    if (!keypath) {
      return this.model;
    }

    // expand wildcards etc to get a list of keypaths
    let paths = this.expandKeypath(keypath);

    // map the list of keypaths to the values therein
    let _this = this;
    let results = paths.map(function (keypath) {
      let {object, child} = _this.getObj(_this.model, keypath);
      return object[child];
    });

    //return the list of values, or if it's just one, the value on its own
    return results.length === 1 ? results[0] : results;
  }


  set(keypath, value) {
    // expand wilcards etc to get a list of keypaths
    let paths = this.expandKeypath(keypath);

    // set the value at each keypath to the given value
    for (let i in paths) {
      let {object, child} = this.getObj(this.model, keypath);
      object[child] = value;
    }
  }


  expandKeypath(keypath, paths=[]) {
    let [match, start, path, remainder] = keypath.match(/^(([^\*]+)\.)?\*(\..*)?$/) || [];

    if (match) {
      // wilcard present, keep recursing
      let ks = this.get(path);

      for (let k in ks) {
        this.expandKeypath(start + k + remainder, paths);
      }
    } else {
      paths.push(keypath);
    }

    return paths;
  }


  getObj(obj, keypath) {
    let pos = keypath.indexOf('.');

    if (pos === -1) {
      // simple path, return the reference
      return {
        object: obj,
        child: keypath
      };

    } else {
      // path with at least 1 child, recurse
      // match the parent, immediate child, and remaining keypaths
      let [match, parent, remainder, child] = keypath.match(/^([^\.]+)\.(([^\.]+).*)$/);

      // if it doesn't exist, create it
      if (!obj.hasOwnProperty(parent)) {
        obj[parent] = isNaN(parseInt(child)) ? {} : [];
      }

      return this.getObj(obj[parent], remainder);
    }
  }
};
