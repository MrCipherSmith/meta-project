export type TestingStatus = "pass" | "fail" | "error" | "skipped";

export type TestingScript = {
  name: string;
  command: string;
};

export type TestingContext = {
  schemaVersion: 1;
  generatedAt: string;
  frameworks: string[];
  scripts: TestingScript[];
  configs: string[];
  testFiles: string[];
  ciFiles: string[];
  instructionFiles: string[];
  conventions: string[];
  recommendations: string[];
};

export type TestingFailure = {
  file: string | null;
  name: string;
  message: string;
  priority: "P0";
};

export type TestingReport = {
  schemaVersion: 1;
  generatedAt: string;
  status: TestingStatus;
  scope: string;
  runner: string | null;
  command: string | null;
  exitCode: number | null;
  durationMs: number;
  counts: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
  selection: {
    changed: boolean;
    strategies: string[];
    selectedTests: string[];
    changedFiles: string[];
    fallback: "none" | "warn" | "full" | "skipped";
  };
  failures: TestingFailure[];
  relatedFiles: string[];
  relatedSkills: string[];
  rawLogPath: string | null;
};

export type TestingRunInput = {
  cwd: string;
  changed?: boolean;
  since?: string | null;
  scope?: string | null;
  kind?: string | null;
};

export type TestingRunResult = {
  report: TestingReport;
  markdownPath: string;
  jsonPath: string;
};

