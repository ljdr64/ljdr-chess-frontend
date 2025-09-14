import { useEffect, useRef, useState } from 'react';
import { Chess, Move, Square } from 'chess.js';

import {
    ChessBoard,
    ChessBoardHandle,
} from '@/lib/ljdr-chessboard/ljdr-chessboard.es.js';

import PromotionChoice from '@/features/game/components/PromotionChoice';
import { chooseRandomMoves } from '@/features/game/utils/moves.js';

import '@/lib/ljdr-chessboard/style.css';
import '@/features/game/pages/promotion.css';

type PendingPromotion = {
    from: string;
    to: string;
    color: 'w' | 'b';
};

const getResponsiveSquareSize = (width: number): number => {
    if (width >= 1280) return 64;
    if (width >= 1024) return 60;
    if (width >= 900) return 56;
    if (width >= 768) return 52;
    if (width >= 640) return 48;
    if (width >= 480) return 44;
    if (width >= 360) return 40;
    return 36;
};

const buildDests = (game: Chess): Map<string, string[]> => {
    const map = new Map<string, string[]>();
    const verbose = game.moves({ verbose: true }) as Move[];

    for (const m of verbose) {
        if (!map.has(m.from)) map.set(m.from, []);
        map.get(m.from)!.push(m.to);
    }

    const turn = game.turn();

    if (turn === 'w' && game.get('e1')?.type === 'k') {
        const e1Moves = map.get('e1') || [];

        if (e1Moves.includes('g1')) {
            e1Moves.push('h1');
            map.set('e1', e1Moves);
        }

        if (e1Moves.includes('c1')) {
            e1Moves.push('a1');
            map.set('e1', e1Moves);
        }
    }

    if (turn === 'b' && game.get('e8')?.type === 'k') {
        const e8Moves = map.get('e8') || [];

        if (e8Moves.includes('g8')) {
            e8Moves.push('h8');
            map.set('e8', e8Moves);
        }

        if (e8Moves.includes('c8')) {
            e8Moves.push('a8');
            map.set('e8', e8Moves);
        }
    }

    return map;
};

type PlayProps = {
    localPlayer: 'white' | 'black';
    randomMovesCount?: 1 | 2;
};

export default function Play({ localPlayer, randomMovesCount = 1 }: PlayProps) {
    const boardRef = useRef<ChessBoardHandle>(null);
    const gameRef = useRef(new Chess());
    const randomPromotionRef = useRef<'q' | 'r' | 'b' | 'n' | undefined>(
        undefined
    );
    const randomPromotionRef2 = useRef<'q' | 'r' | 'b' | 'n' | undefined>(
        undefined
    );
    const startedRef = useRef(false);

    const [pending, setPending] = useState<PendingPromotion | null>(null);
    const [, setRenderTrigger] = useState(false);
    const [squareSize, setSquareSize] = useState(() =>
        getResponsiveSquareSize(window.innerWidth)
    );
    const dests = buildDests(gameRef.current);

    const roleMap: Record<
        'p' | 'k' | 'q' | 'r' | 'b' | 'n',
        'pawn' | 'king' | 'queen' | 'rook' | 'bishop' | 'knight'
    > = {
        p: 'pawn',
        k: 'king',
        q: 'queen',
        r: 'rook',
        b: 'bishop',
        n: 'knight',
    };
    const colorMap: Record<'w' | 'b', 'white' | 'black'> = {
        w: 'white',
        b: 'black',
    };

    const remotePlayer: 'white' | 'black' =
        localPlayer === 'white' ? 'black' : 'white';

    useEffect(() => {
        if (startedRef.current) return;
        startedRef.current = true;

        if (localPlayer === 'black') {
            playRandomMoves('white', randomMovesCount);
        }
    }, []);

    const handleMove = (
        playerColor: 'white' | 'black',
        from: string,
        to: string
    ) => {
        if (playerColor === localPlayer) {
            const piece = gameRef.current.get(from as Square);
            if (piece?.type === 'p') {
                const rank = to[1];
                if (
                    (piece.color === 'w' && rank === '8') ||
                    (piece.color === 'b' && rank === '1')
                ) {
                    setPending({ from, to, color: piece.color });
                    return;
                }
            }

            if (piece?.type === 'k') {
                const castleMap: Record<string, Record<string, string>> = {
                    e1: { h1: 'g1', a1: 'c1' },
                    e8: { h8: 'g8', a8: 'c8' },
                };

                if (castleMap[from] && castleMap[from][to]) {
                    to = castleMap[from][to];
                }
            }

            const move = gameRef.current.move({ from, to });

            if (!move) return;

            if (move.isEnPassant()) {
                const captureSquare =
                    move.to[0] + (move.color === 'w' ? '5' : '4');
                setTimeout(() => {
                    boardRef.current?.deletePiece(captureSquare);
                }, 1);
            }

            if (gameRef.current.isCheckmate()) {
                boardRef.current?.stop();
            }

            playRandomMoves(remotePlayer, randomMovesCount);
        } else if (playerColor === remotePlayer) {
            const move = gameRef.current.move({
                from,
                to,
                promotion: randomPromotionRef.current,
            });

            if (!move) return;

            if (randomPromotionRef.current) {
                const colorPiece = remotePlayer;
                const rolePiece = roleMap[randomPromotionRef.current];
                setTimeout(() => {
                    boardRef.current?.newPiece(
                        { color: colorPiece, role: rolePiece },
                        to
                    );
                    boardRef.current?.set({ lastMove: [from, to] });
                }, 1);
            }

            if (move.isEnPassant()) {
                const captureSquare =
                    move.to[0] + (move.color === 'w' ? '5' : '4');
                setTimeout(() => {
                    boardRef.current?.deletePiece(captureSquare);
                }, 1);
            }

            if (gameRef.current.isCheckmate()) {
                boardRef.current?.stop();
            }
        }

        setRenderTrigger((prev) => !prev);
    };

    const confirmPromotion = (
        e: React.MouseEvent<HTMLDivElement>,
        role: 'q' | 'r' | 'b' | 'n'
    ) => {
        e.stopPropagation();
        if (!pending) return;
        const mv = gameRef.current.move({
            from: pending.from,
            to: pending.to,
            promotion: role,
        });
        const colorPiece = colorMap[pending.color];
        const rolePiece = roleMap[role];

        if (mv) {
            boardRef.current?.newPiece(
                { color: colorPiece, role: rolePiece },
                pending.to
            );
            boardRef.current?.set({ lastMove: [pending.from, pending.to] });
        }
        setPending(null);

        playRandomMoves(remotePlayer, randomMovesCount);
    };

    const cancelPromotion = () => {
        if (!pending) return;

        const pieces = new Map<
            string,
            { role: string; color: string } | null
        >();

        const colorPiece = colorMap[pending.color];
        pieces.set(pending.from, { role: 'pawn', color: colorPiece });

        const captured = gameRef.current.get(pending.to as Square);
        if (captured) {
            const colorCaptured = colorMap[captured.color as 'w' | 'b'];
            const roleCaptured =
                roleMap[captured.type as 'q' | 'r' | 'b' | 'n'];
            pieces.set(pending.to, {
                color: colorCaptured,
                role: roleCaptured,
            });
        } else {
            pieces.set(pending.to, null);
        }
        boardRef.current?.setPieces(pieces);
        boardRef.current?.set({
            turnColor: gameRef.current.turn() === 'w' ? 'white' : 'black',
            movable: { dests: buildDests(gameRef.current) },
            lastMove: ['', ''],
        });
        setPending(null);
    };

    const playRandomMoves = (color: 'white' | 'black', count: 1 | 2) => {
        setTimeout(() => {
            const moves = gameRef.current.moves({
                verbose: true,
            }) as Move[];
            if (moves.length > 0) {
                const [random, random2] = chooseRandomMoves(moves, count);

                randomPromotionRef.current = random.promotion as
                    | 'q'
                    | 'r'
                    | 'b'
                    | 'n'
                    | undefined;

                if (random2 && !random.captured) {
                    boardRef.current?.set({
                        fen: gameRef.current.fen(),
                    });
                    boardRef.current?.moves([
                        {
                            from: random.from,
                            to: random.to,
                            lastMove: 1,
                        },
                        {
                            from: random2.from,
                            to: random2.to,
                            lastMove: 2,
                        },
                    ]);
                    randomPromotionRef2.current = random2.promotion as
                        | 'q'
                        | 'r'
                        | 'b'
                        | 'n'
                        | undefined;
                } else {
                    boardRef.current?.move(random.from, random.to);
                }
                boardRef.current?.set({
                    check: gameRef.current.isCheck(),
                    movable: { dests: buildDests(gameRef.current) },
                });

                if (random.promotion) {
                    const rolePiece =
                        roleMap[random.promotion as 'q' | 'r' | 'b' | 'n'];
                    boardRef.current?.newPiece(
                        { color, role: rolePiece },
                        random.to
                    );
                    boardRef.current?.set({
                        lastMove: [random.from, random.to],
                    });
                }
                if (random2 && random2.promotion) {
                    const rolePiece =
                        roleMap[random2.promotion as 'q' | 'r' | 'b' | 'n'];
                    boardRef.current?.newPiece(
                        { color, role: rolePiece },
                        random2.to
                    );
                    boardRef.current?.set({
                        lastMove2: [random2.from, random2.to],
                    });
                }

                setTimeout(() => {
                    boardRef.current?.playPremove();
                    if (random2 && !random.captured) {
                        boardRef.current?.set({
                            check: gameRef.current.isCheck(),
                            lastMove: [random.from, random.to],
                            lastMove2: [random2.from, random2.to],
                        });
                    } else {
                        boardRef.current?.set({
                            check: gameRef.current.isCheck(),
                        });
                    }
                }, 0);

                setRenderTrigger((prev) => !prev);
            }
        }, 1000);
    };

    useEffect(() => {
        boardRef.current?.set({
            check: gameRef.current.isCheck(),
        });
    }, [gameRef.current.turn()]);

    useEffect(() => {
        const handleResize = () => {
            const newSize = getResponsiveSquareSize(window.innerWidth);
            setSquareSize(newSize);
            boardRef.current?.set({ squareSize: newSize });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex justify-center p-10 min-w-[20rem]">
            <div className="relative">
                <ChessBoard
                    ref={boardRef}
                    id="board-1"
                    fen={gameRef.current.fen()}
                    squareSize={squareSize}
                    orientation={localPlayer}
                    turnColor="white"
                    animation={{
                        enabled: true,
                        type: 'normal',
                    }}
                    movable={{
                        free: false,
                        color: localPlayer,
                        dests,
                        showDests: true,
                    }}
                    premovable={{
                        enabled: true,
                        showDests: true,
                    }}
                    events={{
                        move: (from: string, to: string) => {
                            if (gameRef.current.turn() === 'w') {
                                handleMove('white', from, to);
                            } else {
                                handleMove('black', from, to);
                            }
                        },
                        moves: (moves: [{ from: string; to: string }]) => {
                            if (gameRef.current.turn() === 'w') {
                                handleMove('white', moves[0].from, moves[0].to);
                            } else {
                                handleMove('black', moves[0].from, moves[0].to);
                            }
                        },
                    }}
                />
                {pending && (
                    <PromotionChoice
                        pending={pending}
                        orientation={
                            boardRef.current?.getOrientation() ?? 'white'
                        }
                        cancelPromotion={cancelPromotion}
                        confirmPromotion={confirmPromotion}
                    />
                )}
            </div>
        </div>
    );
}
