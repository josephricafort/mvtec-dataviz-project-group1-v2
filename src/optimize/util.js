import { gzipSizeSync as gzipSize } from "gzip-size";
import pretty from "pretty-bytes";
import columnify from "columnify";
import * as colors from "yoctocolors";

/**
 * Logs a comparison of the uncompressed and compressed filesizes of
 * two strings to the console
 *
 * @param {string} original the raw original dataset (in string format)
 * @param {string} optimized the raw optimized dataset (in string format)
 */
export function compareFileSizes(original, optimized) {
  if (typeof optimized !== "string") throw new Error("Data should be a string");

  const _original = Buffer.from(original, "utf8");
  const _optimized = Buffer.from(optimized, "utf8");

  const logLine = (type, from, to) => ({
    type,
    original: colors.yellow(pretty(from)),
    " ": "→",
    optimized: colors[to <= from ? "green" : "red"](pretty(to)),
    savings: `${((1 - to / from) * 100).toFixed(2)}%`,
  });

  const t = columnify(
    [
      logLine("Uncompressed", _original.byteLength, _optimized.byteLength),
      logLine("Gzipped", gzipSize(_original), gzipSize(_optimized)),
    ],
    {
      config: {
        original: { align: "center" },
        optimized: { align: "center" },
        savings: { align: "right" },
      },
    }
  );

  console.log(t);
}
