/**
 * Calculate the number of milliseconds until date/time
 *
 * @param {Date | number} date - Target
 * @returns {number} - Number of milliseconds until target
 */
export declare function timeUntil(date: Date | number): number;
/**
 * Use in conjunction with `await` to pause an async script
 *
 * @example
 * ```ts
 * async () => {
 *      ...
 *      await sleep(1000) // Pause for 1 second
 *	    ...
 * }
 * ```
 *
 * @param {number} ms - Time to pause for in milliseconds
 * @returns {Promise<unknown>} - Resolves promise when it's time to resume
 */
export declare function sleep(ms: number): Promise<unknown>;
export declare function formatDate(date: Date | number | string): string;
//# sourceMappingURL=time.d.ts.map