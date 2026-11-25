const { buildSync } = require('esbuild');
buildSync({
  entryPoints: [__dirname + '/worker.js'],
  outfile: __dirname + '/../modified/assets/www/quickjs-worker.js',
  bundle: true, minify: true, format: 'iife', target: 'es2020',
  banner: {js: 'function xjWorkerMain() {'},
  footer: {js: '}'},
  define: { 'import.meta.url': 'self.location.href' }
});
