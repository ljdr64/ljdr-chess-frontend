import { useEffect, useRef, useState } from 'react';
import {
    ChessBoard,
    ChessBoardHandle,
} from '../../../lib/ljdr-chessboard/ljdr-chessboard.es.js';

import { Chess, Move } from 'chess.js';

import '../../../lib/ljdr-chessboard/style.css';

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

    const [, setRenderTrigger] = useState(false);
    const [squareSize, setSquareSize] = useState(() =>
        getResponsiveSquareSize(window.innerWidth)
    );
    const dests = buildDests(gameRef.current);

    const handleMove = (from: string, to: string) => {
        const move = gameRef.current.move({ from, to });
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

    return (
        <div className="flex justify-center p-10 min-w-[20rem]">
            <ChessBoard
                ref={boardRef}
                id="board-1"
                fen={gameRef.current.fen()}
                squareSize={squareSize}
                orientation="white"
                turnColor="white"
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
        </div>
    );
}
