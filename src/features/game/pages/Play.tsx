import { useEffect, useRef, useState } from 'react';
import {
    ChessBoard,
    ChessBoardHandle,
} from '../../../lib/ljdr-chessboard/ljdr-chessboard.es.js';
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

export default function Play() {
    const boardRef = useRef<ChessBoardHandle>(null);
    const [squareSize, setSquareSize] = useState(() =>
        getResponsiveSquareSize(window.innerWidth)
    );

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
                squareSize={squareSize}
                orientation="white"
                turnColor="white"
            />
        </div>
    );
}
