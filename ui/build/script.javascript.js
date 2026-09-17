const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const rollup = require('rollup')
const uglify = require('uglify-js')
const buble = require('@rollup/plugin-buble')
const json = require('@rollup/plugin-json')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const replace = require('@rollup/plugin-replace')
const typescript = require('@rollup/plugin-typescript')

const { version } = require('../package.json')

const buildConf = require('./config')
const buildUtils = require('./utils')

const ignoreCssImports = {
  name: 'ignore-css-imports',
  load (id) {
    if (id.endsWith('.css')) {
      return 'export default undefined'
    }
  }
}

const rollupPlugins = [
  replace({
    preventAssignment: false,
    values: {
      __UI_VERSION__: `'${ version }'`
    }
  }),
  typescript({
    tsconfig: false,
    include: ['src/**/*.ts'],
    exclude: ['dev/**', '**/*.d.ts'],
    compilerOptions: {
      allowSyntheticDefaultImports: true,
      esModuleInterop: true,
      target: 'ES2020',
      module: 'ESNext'
    }
  }),
  ignoreCssImports,
  nodeResolve({
    extensions: ['.ts', '.js'],
    preferBuiltins: false
  }),
  commonjs(),
  json(),
    // Skip buble - TypeScript plugin handles transpilation to ES2020
]

const builds = [
  {
    rollup: {
      input: {
        input: pathResolve('../src/index.esm.ts')
      },
      // the map adapter (OpenLayers) is a dynamic import of the geo renderer:
      // a directory output keeps it in its own chunk, loaded on demand
      output: {
        dir: pathResolve('../dist'),
        entryFileNames: 'index.esm.js',
        chunkFileNames: '[name].esm.js',
        format: 'es'
      }
    },
    build: {
      // unminified: true,
      minified: true
    }
  },
  {
    rollup: {
      input: {
        input: pathResolve('../src/index.common.ts')
      },
      output: {
        dir: pathResolve('../dist'),
        entryFileNames: 'index.common.js',
        chunkFileNames: '[name].common.js',
        format: 'cjs'
      }
    },
    build: {
      // unminified: true,
      minified: true
    }
  },
  {
    rollup: {
      input: {
        input: pathResolve('../src/asf/index.ts')
      },
      output: {
        file: pathResolve('../dist/asf.esm.js'),
        format: 'es'
      }
    },
    build: {
      minified: true
    }
  },
  {
    rollup: {
      input: {
        input: pathResolve('../src/asf/index.ts')
      },
      output: {
        file: pathResolve('../dist/asf.common.js'),
        format: 'cjs'
      }
    },
    build: {
      minified: true
    }
  },
  {
    rollup: {
      input: {
        input: pathResolve('../src/index.umd.ts')
      },
      output: {
        name: 'qJsonForm',
        file: pathResolve('../dist/index.umd.js'),
        format: 'umd',
        // no code splitting in a UMD bundle
        inlineDynamicImports: true
      }
    },
    build: {
      unminified: true,
      minified: true,
      minExt: true
    }
  }
]

// Add your asset folders here, if needed
// addAssets(builds, 'icon-set', 'iconSet')
// addAssets(builds, 'lang', 'lang')

build(builds)

/**
 * Helpers
 */

function pathResolve (_path) {
  return path.resolve(__dirname, _path)
}

// eslint-disable-next-line no-unused-vars
function addAssets (builds, type, injectName) {
  const
    files = fs.readdirSync(pathResolve('../../ui/src/components/' + type)),
    plugins = [ buble(/* bubleConfig */) ],
    outputDir = pathResolve(`../dist/${type}`)

    fse.mkdirp(outputDir)

  files
    .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
    .forEach(file => {
      const baseName = file.substring(0, file.lastIndexOf('.'))
      const name = baseName.replace(/-([a-z])/g, g => g[1].toUpperCase())
      builds.push({
        rollup: {
          input: {
            input: pathResolve(`../src/components/${type}/${file}`),
            plugins
          },
          output: {
            file: addExtension(pathResolve(`../dist/${type}/${file}`), 'umd'),
            format: 'umd',
            name: `qJsonForm.${injectName}.${name}`
          }
        },
        build: {
          minified: true
        }
      })
    })
}

function build (builds) {
  return Promise
    .all(builds.map(genConfig).map(buildEntry))
    .catch(buildUtils.logError)
}

function genConfig (opts) {
  Object.assign(opts.rollup.input, {
    plugins: rollupPlugins,
    external: [ 'vue', 'quasar' ],
    // the entry chunk may export what the map chunk shares with it (no facade)
    preserveEntrySignatures: 'allow-extension'
  })

  Object.assign(opts.rollup.output, {
    banner: buildConf.banner,
    globals: { vue: 'Vue', quasar: 'Quasar' }
  })

  return opts
}

function addExtension (filename, ext = 'min') {
  const insertionPoint = filename.lastIndexOf('.')
  return `${filename.slice(0, insertionPoint)}.${ext}${filename.slice(insertionPoint)}`
}

function buildEntry (config) {
  return rollup
    .rollup(config.rollup.input)
    .then(bundle => bundle.generate(config.rollup.output))
    .then(({ output }) => Promise.all(
      output
        .filter(chunk => chunk.type === 'chunk')
        .map(chunk => buildChunk(config, chunk))
    ))
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}

// the file of a chunk: the `file` of a single-file output, else the chunk
// name in the output `dir`
function chunkFile (config, chunk) {
  return config.rollup.output.file || path.join(config.rollup.output.dir, chunk.fileName)
}

function buildChunk (config, chunk) {
  const file = chunkFile(config, chunk)
  const code = config.rollup.output.format === 'umd'
    ? injectVueRequirement(chunk.code)
    : chunk.code

  return Promise.resolve(
    config.build.unminified
      ? buildUtils.writeFile(file, code)
      : code
  )
    .then(code => {
      if (!config.build.minified) {
        return code
      }

      const minified = uglify.minify(code, {
        compress: {
          pure_funcs: ['makeMap']
        }
      })

      if (minified.error) {
        return Promise.reject(minified.error)
      }

      return buildUtils.writeFile(
        config.build.minExt === true
          ? addExtension(file)
          : file,
        buildConf.banner + minified.code,
        true
      )
    })
}

function injectVueRequirement (code) {
  const index = code.indexOf(`Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue`)

  if (index === -1) {
    return code
  }

  const checkMe = ` if (Vue === void 0) {
    console.error('[ Quasar ] Vue is required to run. Please add a script tag for it before loading Quasar.')
    return
  }
  `

  return code.substring(0, index - 1) +
    checkMe +
    code.substring(index)
}
