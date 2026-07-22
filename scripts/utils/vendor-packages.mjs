import fs from 'node:fs';
import path from 'node:path';

import { runCommandSync } from './command-runtime.mjs';

function toPosixPath(value) {
  return String(value).replace(/\\/g, '/');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(sourcePath, targetPath) {
  const stat = fs.statSync(sourcePath);
  if (stat.isDirectory()) {
    ensureDir(targetPath);
    for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
      copyRecursive(path.join(sourcePath, entry.name), path.join(targetPath, entry.name));
    }
    return;
  }

  ensureDir(path.dirname(targetPath));
  fs.copyFileSync(sourcePath, targetPath);
}

function normalizeCopyEntries(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => String(entry || '').trim())
    .filter(Boolean);
}

function resolvePackageSourceDir(appRoot, pkg) {
  return path.resolve(appRoot, pkg.sourceDir);
}

function resolvePackageOutputDir(appRoot, pkg) {
  return path.resolve(appRoot, pkg.outputDir);
}

function listRequiredVendoredPaths(outputRoot, pkg) {
  const requiredPaths = new Set();

  for (const relativePath of pkg.copy) {
    if (relativePath === 'package.json') {
      requiredPaths.add(path.join(outputRoot, 'package.json'));
      continue;
    }

    requiredPaths.add(path.join(outputRoot, relativePath));
  }

  requiredPaths.add(path.join(outputRoot, pkg.runtimeEntry));
  requiredPaths.add(path.join(outputRoot, pkg.typesEntry));

  return Array.from(requiredPaths);
}

function hasPublishedVendorArtifacts(appRoot, pkg) {
  const outputRoot = resolvePackageOutputDir(appRoot, pkg);
  return listRequiredVendoredPaths(outputRoot, pkg).every((requiredPath) => fs.existsSync(requiredPath));
}

function createVendoredPackageJson(pkg, sourceRoot) {
  const sourcePkgPath = path.join(sourceRoot, 'package.json');
  const sourcePkg = fs.existsSync(sourcePkgPath) ? readJson(sourcePkgPath) : {};
  const requireEntry = fs.existsSync(path.join(sourceRoot, 'dist', 'index.js'))
    ? './dist/index.js'
    : `./${toPosixPath(pkg.runtimeEntry)}`;

  return {
    name: pkg.packageName,
    private: true,
    type: sourcePkg.type || 'module',
    main: requireEntry,
    module: `./${toPosixPath(pkg.runtimeEntry)}`,
    types: `./${toPosixPath(pkg.typesEntry)}`,
    exports: {
      '.': {
        import: {
          types: `./${toPosixPath(pkg.typesEntry)}`,
          default: `./${toPosixPath(pkg.runtimeEntry)}`,
        },
        require: {
          types: `./${toPosixPath(pkg.typesEntry)}`,
          default: requireEntry,
        },
      },
    },
  };
}

function writeVendoredPackageJson(appRoot, pkg) {
  const sourceRoot = resolvePackageSourceDir(appRoot, pkg);
  const outputDir = resolvePackageOutputDir(appRoot, pkg);
  ensureDir(outputDir);
  fs.writeFileSync(
    path.join(outputDir, 'package.json'),
    `${JSON.stringify(createVendoredPackageJson(pkg, sourceRoot), null, 2)}\n`,
    'utf8',
  );
}

function writeVendorMetadata(appRoot, aliases) {
  const vendorRoot = path.resolve(appRoot, 'vendor');
  ensureDir(vendorRoot);

  fs.writeFileSync(
    path.join(vendorRoot, 'vendor-aliases.generated.json'),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      packages: aliases.map(({ packageName, outputDirRelative, runtimeEntryRelative, typesEntryRelative }) => ({
        packageName,
        outputDirRelative,
        runtimeEntryRelative,
        typesEntryRelative,
      })),
    }, null, 2)}\n`,
    'utf8',
  );

  const paths = Object.fromEntries(
    aliases.map((alias) => [alias.packageName, [`./${alias.typesEntryRelative}`]]),
  );
  fs.writeFileSync(
    path.join(vendorRoot, 'vendor-tsconfig-paths.generated.json'),
    `${JSON.stringify({
      compilerOptions: {
        baseUrl: '.',
        paths,
      },
    }, null, 2)}\n`,
    'utf8',
  );

  const baseTsconfigPath = path.resolve(appRoot, 'tsconfig.base.json');
  const baseTsconfig = fs.existsSync(baseTsconfigPath) ? readJson(baseTsconfigPath) : {};
  const basePaths = baseTsconfig?.compilerOptions?.paths && typeof baseTsconfig.compilerOptions.paths === 'object'
    ? baseTsconfig.compilerOptions.paths
    : {};
  fs.writeFileSync(
    path.join(vendorRoot, 'vendor-tsconfig.generated.json'),
    `${JSON.stringify({
      extends: '../tsconfig.base.json',
      compilerOptions: {
        baseUrl: '..',
        paths: {
          ...basePaths,
          ...paths,
        },
      },
    }, null, 2)}\n`,
    'utf8',
  );

  const declarationLines = aliases.flatMap((alias) => [
    `declare module '${alias.packageName}' {`,
    `  export * from './${alias.typesModuleSpecifier}';`,
    '}',
    '',
  ]);
  fs.writeFileSync(
    path.join(vendorRoot, 'vendor-modules.generated.d.ts'),
    `${declarationLines.join('\n')}\n`,
    'utf8',
  );
}

function buildPackageCommand(pkg) {
  if (!Array.isArray(pkg.buildCommand) || pkg.buildCommand.length === 0) {
    return null;
  }
  return {
    command: pkg.buildCommand[0],
    args: pkg.buildCommand.slice(1),
  };
}

function runBuildForPackage(appRoot, pkg) {
  const sourceRoot = resolvePackageSourceDir(appRoot, pkg);
  const commandSpec = buildPackageCommand(pkg);
  if (!commandSpec) {
    return;
  }

  const result = runCommandSync({
    command: commandSpec.command,
    args: commandSpec.args,
    cwd: sourceRoot,
    timeoutMs: 10 * 60 * 1000,
    maxBuffer: 20 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    const stdout = result.stdout.trim();
    throw new Error(
      [
        `Failed to build vendored package "${pkg.packageName}".`,
        stderr || stdout || `Command exited with status ${result.status}.`,
      ].join('\n'),
    );
  }
}

export function loadVendorPackagesConfig(appRoot) {
  const configPath = path.resolve(appRoot, 'vendor-packages.config.json');
  const rawConfig = readJson(configPath);
  const packages = Array.isArray(rawConfig.packages) ? rawConfig.packages : [];

  return {
    packages: packages.map((pkg) => ({
      packageName: String(pkg.packageName),
      sourceDir: String(pkg.sourceDir),
      outputDir: toPosixPath(String(pkg.outputDir)),
      runtimeEntry: toPosixPath(String(pkg.runtimeEntry)),
      typesEntry: toPosixPath(String(pkg.typesEntry)),
      copy: normalizeCopyEntries(pkg.copy),
      buildCommand: Array.isArray(pkg.buildCommand) ? pkg.buildCommand.map((part) => String(part)) : [],
    })),
  };
}

export function createVendorAliases(appRoot, config) {
  return config.packages.map((pkg) => {
    const outputDirRelative = toPosixPath(pkg.outputDir);
    const runtimeEntryRelative = toPosixPath(path.posix.join(outputDirRelative, pkg.runtimeEntry));
    const typesEntryRelative = toPosixPath(path.posix.join(outputDirRelative, pkg.typesEntry));
    const vendorRoot = path.resolve(appRoot, 'vendor');
    const typesModuleSpecifier = toPosixPath(
      path.relative(vendorRoot, path.resolve(appRoot, typesEntryRelative)).replace(/\.d\.ts$/u, ''),
    );

    return {
      packageName: pkg.packageName,
      sourceDirAbsolute: resolvePackageSourceDir(appRoot, pkg),
      outputDirAbsolute: resolvePackageOutputDir(appRoot, pkg),
      outputDirRelative,
      runtimeEntryAbsolute: path.resolve(appRoot, runtimeEntryRelative),
      runtimeEntryRelative,
      typesEntryAbsolute: path.resolve(appRoot, typesEntryRelative),
      typesEntryRelative,
      typesModuleSpecifier,
    };
  });
}

export function buildVendorImportMap(appRoot, config) {
  const paths = Object.fromEntries(
    createVendorAliases(appRoot, config).map((alias) => [alias.packageName, [`./${alias.typesEntryRelative}`]]),
  );
  return {
    paths,
    compilerOptions: {
      baseUrl: '.',
      paths,
    },
  };
}

export function syncVendorPackages(appRoot, config, options = {}) {
  const shouldBuild = options.shouldBuild !== false;
  const onBuildPackage = typeof options.onBuildPackage === 'function' ? options.onBuildPackage : runBuildForPackage;

  for (const pkg of config.packages) {
    const sourceRoot = resolvePackageSourceDir(appRoot, pkg);
    const outputRoot = resolvePackageOutputDir(appRoot, pkg);

    if (!fs.existsSync(sourceRoot)) {
      if (hasPublishedVendorArtifacts(appRoot, pkg)) {
        continue;
      }
      throw new Error(`Vendor source package not found: ${sourceRoot}`);
    }

    if (shouldBuild) {
      onBuildPackage(appRoot, pkg);
    }

    fs.rmSync(outputRoot, { recursive: true, force: true });
    ensureDir(outputRoot);

    for (const relativePath of pkg.copy) {
      if (relativePath === 'package.json') {
        writeVendoredPackageJson(appRoot, pkg);
        continue;
      }

      const sourcePath = path.join(sourceRoot, relativePath);
      const targetPath = path.join(outputRoot, relativePath);
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Vendor artifact not found for ${pkg.packageName}: ${sourcePath}`);
      }
      copyRecursive(sourcePath, targetPath);
    }
  }

  const aliases = createVendorAliases(appRoot, config);
  writeVendorMetadata(appRoot, aliases);

  return {
    packages: aliases,
  };
}
