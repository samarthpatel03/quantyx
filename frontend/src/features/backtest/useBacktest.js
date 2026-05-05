import { useState, useCallback } from "react";
import { runBacktest } from "./backtestEngine.js";

export function useBacktest() {
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);

  const runTest = useCallback(async (config) => {
    setIsRunning(true);
    setError(null);
    try {
      const testResults = runBacktest(config);
      setResults(testResults);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return { results, isRunning, error, runTest, clearResults };
}
