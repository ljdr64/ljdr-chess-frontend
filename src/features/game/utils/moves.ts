import type { Move } from 'chess.js';

/**
 * Choose 1 or 2 distinct moves for Random Chess variant.
 */
export const chooseRandomMoves = (
    moves: Move[],
    count: 1 | 2
): [Move, Move | null] => {
    if (moves.length === 0) return [null as any, null];

    const first = moves[Math.floor(Math.random() * moves.length)];

    if (count === 1) {
        return [first, null];
    }

    const candidates = moves.filter(
        (m) =>
            m !== first &&
            m.from !== first.from &&
            m.to !== first.to &&
            m.captured === undefined
    );

    if (candidates.length === 0) {
        return [first, null];
    }

    const second = candidates[Math.floor(Math.random() * candidates.length)];

    return [first, second];
};
