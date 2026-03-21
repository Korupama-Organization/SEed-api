module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/controllers/auth.controller.ts',
    'src/middlewares/auth.middleware.ts',
    'src/middlewares/registration-role-policy.middleware.ts',
    'src/routes/auth.routes.ts',
    'src/utils/jwt.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 70,
      lines: 44,
      statements: 49,
    },
  },
};
