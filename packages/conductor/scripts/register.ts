import { register } from 'tsconfig-paths/register';
import { compilerOptions } from '../tsconfig.json';

register({
  baseUrl: compilerOptions.baseUrl,
  paths: compilerOptions.paths
});