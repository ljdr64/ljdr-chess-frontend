import { useEffect, useRef, useState } from 'react';
import {
    ChessBoard,
    ChessBoardHandle,
} from '../../../lib/ljdr-chessboard/ljdr-chessboard.es.js';

import { Chess, Move, Square } from 'chess.js';

import '../../../lib/ljdr-chessboard/style.css';
import './promotion.css';

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
    return map;
};

export default function Play() {
    const boardRef = useRef<ChessBoardHandle>(null);
    const gameRef = useRef(new Chess());

    const [pending, setPending] = useState<PendingPromotion | null>(null);
    const [, setRenderTrigger] = useState(false);
    const [squareSize, setSquareSize] = useState(() =>
        getResponsiveSquareSize(window.innerWidth)
    );
    const dests = buildDests(gameRef.current);

    const handleMove = (
        from: string,
        to: string,
        promotion?: 'q' | 'r' | 'b' | 'n'
    ) => {
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
        const move = gameRef.current.move({ from, to, promotion });

        if (move.isEnPassant()) {
            const captureSquare = move.to[0] + (move.color === 'w' ? '5' : '4');
            setTimeout(() => {
                boardRef.current?.deletePiece(captureSquare);
            }, 1);
        }
        if (!move) return;

        if (gameRef.current.turn() === 'b') {
            setTimeout(() => {
                const moves = gameRef.current.moves({
                    verbose: true,
                }) as Move[];
                if (moves.length > 0) {
                    const random =
                        moves[Math.floor(Math.random() * moves.length)];

                    boardRef.current?.move(random.from, random.to);
                    boardRef.current?.set({
                        check: gameRef.current.isCheck(),
                        movable: { dests: buildDests(gameRef.current) },
                    });
                    setTimeout(() => {
                        boardRef.current?.playPremove();
                        boardRef.current?.set({
                            check: gameRef.current.isCheck(),
                        });
                    }, 0);
                }
            }, 1000);
        }
        if (gameRef.current.isCheckmate()) {
            boardRef.current?.stop();
        }
        setRenderTrigger((prev) => !prev);
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

    const roleMap: Record<
        'q' | 'r' | 'b' | 'n',
        'queen' | 'rook' | 'bishop' | 'knight'
    > = {
        q: 'queen',
        r: 'rook',
        b: 'bishop',
        n: 'knight',
    };
    const colorMap: Record<'w' | 'b', 'white' | 'black'> = {
        w: 'white',
        b: 'black',
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

        if (gameRef.current.turn() === 'b') {
            setTimeout(() => {
                const moves = gameRef.current.moves({
                    verbose: true,
                }) as Move[];
                if (moves.length > 0) {
                    const random =
                        moves[Math.floor(Math.random() * moves.length)];

                    boardRef.current?.move(random.from, random.to);
                    boardRef.current?.set({
                        check: gameRef.current.isCheck(),
                        movable: { dests: buildDests(gameRef.current) },
                    });
                    setTimeout(() => {
                        boardRef.current?.playPremove();
                        boardRef.current?.set({
                            check: gameRef.current.isCheck(),
                        });
                    }, 0);
                }
            }, 1000);
        }
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

    return (
        <div className="flex justify-center p-10 min-w-[20rem]">
            <div className="relative">
                <ChessBoard
                    ref={boardRef}
                    id="board-1"
                    fen={gameRef.current.fen()}
                    squareSize={squareSize}
                    orientation="white"
                    turnColor="white"
                    animation={{
                        enabled: true,
                        type: 'normal',
                    }}
                    movable={{
                        free: false,
                        color: 'white',
                        dests,
                        showDests: true,
                    }}
                    premovable={{
                        enabled: true,
                        showDests: true,
                    }}
                    events={{
                        move: (from: string, to: string) => {
                            handleMove(from, to);
                        },
                    }}
                />
                {pending && (
                    <div id="promotion-choice">
                        <div
                            className="ljdr-wrap"
                            onClick={() => cancelPromotion()}
                        >
                            {[
                                { role: 'q', piece: 'queen', top: '0%' },
                                { role: 'n', piece: 'knight', top: '12.5%' },
                                { role: 'r', piece: 'rook', top: '25%' },
                                { role: 'b', piece: 'bishop', top: '37.5%' },
                            ].map(({ role, piece, top }) => (
                                <div
                                    key={`${pending.color}-${role}`}
                                    className="ljdr-square"
                                    style={{
                                        top,
                                        left: `${
                                            (pending.to[0].charCodeAt(0) - 97) *
                                            12.5
                                        }%`,
                                    }}
                                >
                                    <div
                                        key={role}
                                        className={`ljdr-piece white ${piece}`}
                                        onClick={(e) =>
                                            confirmPromotion(
                                                e,
                                                role as 'q' | 'n' | 'r' | 'b'
                                            )
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
