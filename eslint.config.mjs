import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/out-tsc',
      '**/target',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Architektur-Regeln (DDD): Welche Schicht darf welche importieren?
      // Jede Lib trägt zwei Tags: `domain:*` (fachlich) und `type:*` (technisch).
      // Verstöße werden beim Lint als Fehler gemeldet.
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Fachliche Grenzen: eine Domäne darf nur sich selbst und "shared" nutzen.
            {
              sourceTag: 'domain:flight',
              onlyDependOnLibsWithTags: ['domain:flight', 'domain:shared'],
            },
            {
              sourceTag: 'domain:initiative',
              onlyDependOnLibsWithTags: ['domain:initiative', 'domain:shared'],
            },
            {
              sourceTag: 'domain:shared',
              onlyDependOnLibsWithTags: ['domain:shared'],
            },
            // Technische Schichten: app -> feature -> ui-composition -> ui -> domain -> util.
            // ui-composition = Blöcke, die aus generischen ui-Elementen zusammengesetzt sind.
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui-composition',
                'type:ui',
                'type:domain',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:ui-composition',
                'type:ui',
                'type:domain',
                'type:util',
                'type:api',
              ],
            },
            {
              sourceTag: 'type:api',
              onlyDependOnLibsWithTags: ['type:ui', 'type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:ui-composition',
              onlyDependOnLibsWithTags: ['type:ui', 'type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:domain', 'type:util'],
            },
            {
              sourceTag: 'type:domain',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
