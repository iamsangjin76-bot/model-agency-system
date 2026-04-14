/**
 * Barrel re-export — preserves all existing import paths.
 *
 * Consumers that do `import { authAPI, modelsAPI, ... } from '../services/api'`
 * continue to work without change.
 */

export * from './auth-api';
export * from './domain-api';

// Default export retains the previous shape for any code using
// `import api from '../services/api'` with api.auth / api.models etc.
import { authAPI, refreshAPI } from './auth-api';
import domainApi from './domain-api';

export default {
  auth: authAPI,
  refresh: refreshAPI,
  ...domainApi,
};
