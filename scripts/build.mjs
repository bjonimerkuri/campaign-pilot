import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

const handlers = ['authorizer', 'createCampaign', 'getCampaign', 'listCampaigns', 'generateCopy'];
const banner = "import { createRequire } from 'module';const require = createRequire(import.meta.url);";

await rm('dist', { recursive: true, force: true });

await Promise.all(
  handlers.map((name) =>
    build({
      entryPoints: [`src/handlers/${name}.ts`],
      outfile: `dist/${name}/index.mjs`,
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      minify: true,
      banner: { js: banner },
    }),
  ),
);

console.log(`Built ${handlers.length} functions into dist/`);
