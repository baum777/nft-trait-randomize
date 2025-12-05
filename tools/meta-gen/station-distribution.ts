/**
 * Station and Archetype distribution for the 333 NFT collection
 */

export interface StationAllocation {
  stationId: number;
  count: number;                // Total NFTs for this station
  bullRatio: number;            // Ratio of Bulls (0-1)
  bearRatio: number;            // Ratio of Bears (0-1)
  hybridCount?: number;         // Optional: Exact number of Hybrids
}

/**
 * Distribution of NFTs across the 12 Hero Journey stations.
 * Total must equal exactly 333.
 *
 * Distribution strategy:
 * - Stations 1-7: 28 NFTs each (196 total)
 * - Station 8 (The Ordeal): 29 NFTs (1 Hybrid at the climax)
 * - Stations 9-12: 27 NFTs each (108 total)
 * - Total: 196 + 29 + 108 = 333 ✓
 *
 * Archetype ratios:
 * - Most stations: 50% Bull / 50% Bear
 * - Station 8: Includes 1 Hybrid (representing the union of forces)
 * - Can be adjusted for specific thematic reasons per station
 */
export const STATION_DISTRIBUTION: StationAllocation[] = [
  // Act I: Departure
  { stationId: 1, count: 28, bullRatio: 0.5, bearRatio: 0.5 },  // Ordinary World
  { stationId: 2, count: 28, bullRatio: 0.5, bearRatio: 0.5 },  // Call to Adventure
  { stationId: 3, count: 28, bullRatio: 0.5, bearRatio: 0.5 },  // Refusal of the Call
  { stationId: 4, count: 28, bullRatio: 0.5, bearRatio: 0.5 },  // Meeting the Mentor

  // Act II: Initiation
  { stationId: 5, count: 28, bullRatio: 0.5, bearRatio: 0.5 },  // Crossing the Threshold
  { stationId: 6, count: 28, bullRatio: 0.5, bearRatio: 0.5 },  // Tests, Allies, Enemies
  { stationId: 7, count: 28, bullRatio: 0.5, bearRatio: 0.5 },  // Approach to the Inmost Cave
  { stationId: 8, count: 29, bullRatio: 0.48, bearRatio: 0.48, hybridCount: 1 },  // The Ordeal (1 Hybrid)
  { stationId: 9, count: 27, bullRatio: 0.5, bearRatio: 0.5 },  // Reward (Seizing the Sword)

  // Act III: Return
  { stationId: 10, count: 27, bullRatio: 0.5, bearRatio: 0.5 }, // The Road Back
  { stationId: 11, count: 27, bullRatio: 0.5, bearRatio: 0.5 }, // Resurrection
  { stationId: 12, count: 27, bullRatio: 0.5, bearRatio: 0.5 }, // Return with the Elixir
];

/**
 * Validates that the station distribution totals exactly 333 NFTs
 */
export function validateStationDistribution(): { valid: boolean; total: number; errors: string[] } {
  const errors: string[] = [];
  let total = 0;

  for (const alloc of STATION_DISTRIBUTION) {
    total += alloc.count;

    // Validate ratios sum correctly
    const hybridCount = alloc.hybridCount || 0;
    const expectedRatio = (alloc.count - hybridCount) / alloc.count;
    const actualRatio = alloc.bullRatio + alloc.bearRatio;

    if (Math.abs(actualRatio - expectedRatio) > 0.01) {
      errors.push(
        `Station ${alloc.stationId}: Bull + Bear ratios (${actualRatio.toFixed(2)}) don't match expected (${expectedRatio.toFixed(2)})`
      );
    }

    // Validate station ID is in valid range
    if (alloc.stationId < 1 || alloc.stationId > 12) {
      errors.push(`Station ${alloc.stationId}: Invalid station ID (must be 1-12)`);
    }
  }

  if (total !== 333) {
    errors.push(`Total NFT count is ${total}, expected 333`);
  }

  // Check for duplicate station IDs
  const stationIds = STATION_DISTRIBUTION.map(a => a.stationId);
  const uniqueIds = new Set(stationIds);
  if (uniqueIds.size !== stationIds.length) {
    errors.push(`Duplicate station IDs found`);
  }

  return {
    valid: errors.length === 0,
    total,
    errors
  };
}

/**
 * Get archetype counts for a station allocation
 */
export function getArchetypeCounts(alloc: StationAllocation): {
  bulls: number;
  bears: number;
  hybrids: number;
} {
  const hybrids = alloc.hybridCount || 0;
  const remaining = alloc.count - hybrids;
  const bulls = Math.round(remaining * alloc.bullRatio);
  const bears = remaining - bulls;

  return { bulls, bears, hybrids };
}
