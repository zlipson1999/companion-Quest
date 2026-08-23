import { register } from 'node:module';

register(new URL('./esm-bare-ext.mjs', import.meta.url));
