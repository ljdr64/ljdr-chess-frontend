import React from 'react';

type PendingPromotion = {
    from: string;
    to: string;
    color: 'w' | 'b';
};

type PromotionRole = 'q' | 'r' | 'b' | 'n';

type PromotionChoiceProps = {
    pending: PendingPromotion;
    orientation: 'white' | 'black';
    cancelPromotion: () => void;
    confirmPromotion: (
        e: React.MouseEvent<HTMLDivElement>,
        role: PromotionRole
    ) => void;
};

const OPTIONS = [
    { role: 'q', piece: 'queen' },
    { role: 'n', piece: 'knight' },
    { role: 'r', piece: 'rook' },
    { role: 'b', piece: 'bishop' },
] as const;

export default function PromotionChoice(props: PromotionChoiceProps) {
    const { pending, orientation, cancelPromotion, confirmPromotion } = props;

    return (
        <div id="promotion-choice">
            <div className="ljdr-wrap" onClick={cancelPromotion}>
                {OPTIONS.map(({ role, piece }, idx) => {
                    const fileIndex = pending.to[0].charCodeAt(0) - 97;
                    const rank = parseInt(pending.to[1]);
                    const orientationIsWhite = orientation === 'white';

                    const colLeft = orientationIsWhite
                        ? fileIndex * 12.5
                        : (7 - fileIndex) * 12.5;

                    const baseTop = orientationIsWhite
                        ? (8 - rank) * 12.5
                        : (rank - 1) * 12.5;

                    const isNormalPromotion =
                        (orientationIsWhite && pending.to[1] === '8') ||
                        (!orientationIsWhite && pending.to[1] === '1');

                    const pieceTop = isNormalPromotion
                        ? `${baseTop + idx * 12.5}%`
                        : `${baseTop - idx * 12.5}%`;

                    return (
                        <div
                            key={`${pending.color}-${role}`}
                            className="ljdr-square"
                            style={{ top: pieceTop, left: `${colLeft}%` }}
                        >
                            <div
                                className={`ljdr-piece ${
                                    pending.color === 'w' ? 'white' : 'black'
                                } ${piece}`}
                                onClick={(e) => confirmPromotion(e, role)}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
