import globals from "globals"
import google from "eslint-config-google"

export default [
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.commonjs,
        ...globals.es2021,
      }
    },
    ...google,
    rules: {
      indent: ['error', 2, { SwitchCase: 1 }],
      'max-len': [
        'error',
        {
          code: 120,
          ignoreComments: true,
          ignoreUrls: true,
          ignoreStrings: true,
        },
      ],
    },
  }
]
