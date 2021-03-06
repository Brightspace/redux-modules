import {upcase, apiKeys, apiStates, getApiTypes, toApiKey} from './utils';

export const REDUX_MODULE_ACTION_KEY = 'REDUX_MODULES/ACTION'
export const REDUX_MODULE_API_ACTION_KEY = 'REDUX_MODULES/API_ACTION'

let customTypes = {
  api: apiStates
}
/*
 * get the api values
 */
export function apiValues(name, states = apiStates) {
  return apiKeys(name, states)
    .reduce((sum, key) => ({
      ...sum,
      [key]: toApiKey(key)
    }), {});
}

export function createCustomTypes(name, states = []) {
  customTypes[name] = states;
}

export function createConstants(opts) {
  opts = opts || {};
  let separator = opts.separator || '_';

  if (opts.customTypes) {
    Object.keys(opts.customTypes).forEach(key => {
      createCustomTypes(key, opts.customTypes[key])
    });
  }

  if (typeof opts === 'string') {
    opts = {prefix: opts}
  }

  const defineType = (obj, prefix, n, v) => {
    if (typeof n === 'object') {
      // If it's an API type, decorate with the different
      // api states
      Object.keys(n).forEach((key) => {
        if (n.hasOwnProperty(key)) {
          let val = n[key];
          if (val && val.types) {
            let types = Array.isArray(val.types) ? val.types : val.types.split(' ,');
            types.forEach(type => {
              // Define custom types for each
              const states = customTypes[type] || [];
              states.forEach((customKey) => {
                const name = upcase(`${key}${separator}${customKey}`)
                const keyPrefix = upcase([type, customKey].join(separator))
                const valuePrefix = [prefix, type].join(separator);
                // const apiPrefix = `api_${prefix}`;
                defineType(obj, valuePrefix, name);
              });
            })
          }
          if (val && val.api) defineApi(obj, prefix, key, val.states);

          // Don't store objects in static arrays
          if (typeof val === 'object') {
            val = null;
          }

          defineType(obj, prefix, key, v);
        }
      });
    } else {
      v = v || [].concat.apply([], [prefix, n]).join(separator).toUpperCase();
      Object.defineProperty(obj, n, {
        value: v,
        enumerable: true,
        writable: false,
        configurable: false
      });
    }
    return obj;
  };

  const defineApi = (obj, prefix, n, states) => {
    apiKeys(n, states).forEach((apiKey) => {
      const apiPrefix = `api_${prefix}`;
      defineType(obj, apiPrefix, apiKey);
    });
  };


  const definer = (obj, prefix) => {
    return (...definitions) => {
      definitions.forEach((def) => {
        defineType(obj, prefix, def);
      });
      return obj;
    };
  };

  let initialObject = opts.initialObject || {};
  let prefix = opts.prefix || '';
  return definer(initialObject, prefix);
}

export default createConstants;
