import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { forwardRef, useRef, useState, useEffect, useImperativeHandle, memo } from "react";
const defaultId = "default-id";
const defaultFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const defaultOrientation = "white";
const defaultTurnColor = "white";
const defaultCheck = false;
const defaultLastMove = ["", ""];
const defaultLastMove2 = ["", ""];
const defaultLastMove3 = ["", ""];
const defaultSelected = "";
const defaultCoordinates = true;
const defaultAutoCastle = true;
const defaultSquareSize = 60;
const defaultAnimation = {
  enabled: true,
  duration: 200,
  type: "normal"
};
const defaultMovable = {
  free: true,
  color: "both",
  showDests: true,
  events: {
    after: () => {
    },
    afterNewPiece: () => {
    }
  }
};
const defaultPremovable = {
  enabled: true,
  showDests: true,
  events: {
    set: () => {
    },
    unset: () => {
    }
  }
};
const defaultDraggable = {
  enabled: true,
  distance: 3,
  autoDistance: true,
  showGhost: true,
  deleteOnDropOff: false
};
const defaultEvents = {
  move: () => {
  },
  change: () => {
  },
  select: () => {
  }
};
const movePieceOnBoard = (fromSquare, toSquare, {
  boardMap,
  boardMapIndex,
  freeIndexes
}) => {
  const movingPiece = boardMap.current.get(fromSquare);
  if (!movingPiece) return;
  const existingPieceAtTo = boardMap.current.get(toSquare);
  if (existingPieceAtTo) {
    boardMapIndex.current.delete(existingPieceAtTo.index);
    freeIndexes.current.add(existingPieceAtTo.index);
  }
  boardMapIndex.current.set(movingPiece.index, {
    color: movingPiece.color,
    role: movingPiece.role,
    square: toSquare
  });
  boardMap.current.set(toSquare, movingPiece);
  boardMap.current.delete(fromSquare);
};
const notationToCoords = (square) => {
  const col = square.charCodeAt(0) - "a".charCodeAt(0);
  const row = 8 - parseInt(square[1], 10);
  return [col, row];
};
const coordsToNotation = ([col, row]) => {
  const file = String.fromCharCode("a".charCodeAt(0) + col);
  const rank = (8 - row).toString();
  return `${file}${rank}`;
};
const coordsToPixels = ([col, row], squareSize, orientation) => {
  if (orientation === "black") {
    col = 7 - col;
    row = 7 - row;
  }
  return [col * squareSize, row * squareSize];
};
const pixelsToCoords = ([x, y], squareSize, orientation) => {
  let col = Math.floor(x / squareSize);
  let row = Math.floor(y / squareSize);
  if (orientation === "black") {
    col = 7 - col;
    row = 7 - row;
  }
  return [col, row];
};
const notationToPixels = (square, squareSize, orientation) => coordsToPixels(notationToCoords(square), squareSize, orientation);
const pixelsToNotation = ([x, y], squareSize, orientation) => coordsToNotation(pixelsToCoords([x, y], squareSize, orientation));
const pixelsToTranslate = ([x, y]) => `translate(${x}px, ${y}px)`;
const translateToPixels = (translate) => {
  const match = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(translate);
  return match ? [parseFloat(match[1]), parseFloat(match[2])] : [0, 0];
};
const notationToTranslate = (square, squareSize, orientation) => pixelsToTranslate(notationToPixels(square, squareSize, orientation));
const normalizePixels = (x, y, squareSize) => {
  const normalizedX = Math.floor(x / squareSize) * squareSize;
  const normalizedY = Math.floor(y / squareSize) * squareSize;
  return [normalizedX, normalizedY];
};
const validateIndex = (value) => {
  return typeof value === "number" && Number.isInteger(value) && !isNaN(value);
};
const validateSquare = (square) => {
  return typeof square === "string" && /^[a-h][1-8]$/.test(square) ? square : "";
};
const animateMove = (boardMapCurrent, boardMapIndexCurrent, freeIndexes, pieceRefs, ghostAnimateRef1, ghostAnimateRef2, ghostAnimateRef3, warpAnimateRef, moves, squareSize, orientation, animation, onComplete, onCancel) => {
  var _a;
  const easeMain = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  const ghostLagCurve = (t) => t < 0.5 ? 2 * t * t : 1 - 1 * t;
  const easeGhost1 = (t) => easeMain(t) - 0.3 * ghostLagCurve(t);
  const easeGhost2 = (t) => easeMain(t) - 0.6 * ghostLagCurve(t);
  const easeGhost3 = (t) => easeMain(t) - 0.9 * ghostLagCurve(t);
  if (moves.length === 1) {
    const fromSquare = moves[0].from;
    const toSquare = moves[0].to;
    const pieceCapturedIndex = (_a = boardMapCurrent.current.get(toSquare)) == null ? void 0 : _a.index;
    if (boardMapCurrent.current.has(fromSquare)) {
      const { role, color, index: index2 } = boardMapCurrent.current.get(fromSquare);
      if (validateIndex(index2)) {
        const pieceDiv = pieceRefs.current[index2];
        if (pieceDiv) {
          if (validateIndex(pieceCapturedIndex)) {
            const capturedPieceDiv = pieceRefs.current[pieceCapturedIndex];
            if (capturedPieceDiv) {
              capturedPieceDiv.classList.add("fade");
            }
          }
          pieceDiv.classList.add("animate");
          let startTime;
          let animationFrame;
          const startPos = notationToPixels(
            fromSquare,
            squareSize,
            orientation
          );
          const endPos = notationToPixels(toSquare, squareSize, orientation);
          const ghostRefs = [
            {
              ref: ghostAnimateRef1,
              class: "ghost-animate1",
              opacity: "0.8",
              easing: easeGhost1
            },
            {
              ref: ghostAnimateRef2,
              class: "ghost-animate2",
              opacity: "0.6",
              easing: easeGhost2
            },
            {
              ref: ghostAnimateRef3,
              class: "ghost-animate3",
              opacity: "0.4",
              easing: easeGhost3
            }
          ];
          ghostRefs.forEach(({ ref, class: className, opacity }) => {
            if (ref.current) {
              ref.current.style.visibility = "visible";
              ref.current.style.opacity = opacity;
              ref.current.classList.add(color, role, className);
            }
          });
          if (warpAnimateRef.current) {
            warpAnimateRef.current.style.visibility = "visible";
            warpAnimateRef.current.classList.add(color, role, "warp-animate");
          }
          const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = (timestamp - startTime) / animation.duration;
            const easedProgress = easeMain(progress);
            if (progress < 1) {
              const newX = startPos[0] + (endPos[0] - startPos[0]) * easedProgress;
              const newY = startPos[1] + (endPos[1] - startPos[1]) * easedProgress;
              if (animation.type === "ghosts") {
                ghostRefs.forEach(({ ref, easing }) => {
                  if (ref.current) {
                    const easedProgress2 = easing(progress);
                    const newX2 = startPos[0] + (endPos[0] - startPos[0]) * easedProgress2;
                    const newY2 = startPos[1] + (endPos[1] - startPos[1]) * easedProgress2;
                    ref.current.style.transform = `translate(${newX2}px, ${newY2}px)`;
                  }
                });
              }
              if (animation.type === "warp") {
                if (warpAnimateRef.current) {
                  const newX2 = endPos[0];
                  const newY2 = endPos[1];
                  warpAnimateRef.current.style.transform = `translate(${newX2}px, ${newY2}px)`;
                  warpAnimateRef.current.style.opacity = `${progress * progress}`;
                }
                pieceDiv.style.opacity = `${(progress - 1) * (progress - 1)}`;
                if (validateIndex(pieceCapturedIndex)) {
                  const capturedPieceDiv = pieceRefs.current[pieceCapturedIndex];
                  if (capturedPieceDiv) {
                    capturedPieceDiv.style.opacity = `${(1 - progress) * 0.3}`;
                  }
                }
              }
              pieceDiv.style.transform = `translate(${newX}px, ${newY}px)`;
              animationFrame = requestAnimationFrame(animate);
            } else {
              movePieceOnBoard(fromSquare, toSquare, {
                boardMap: boardMapCurrent,
                boardMapIndex: boardMapIndexCurrent,
                freeIndexes
              });
              if (validateIndex(pieceCapturedIndex)) {
                const capturedPieceDiv = pieceRefs.current[pieceCapturedIndex];
                if (capturedPieceDiv) {
                  capturedPieceDiv.style.display = "none";
                }
              }
              if (animation.type === "ghosts") {
                ghostRefs.forEach(({ ref, class: className }) => {
                  if (ref.current) {
                    ref.current.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
                    ref.current.classList.remove(color, role, className);
                    ref.current.style.visibility = "hidden";
                    ref.current.style.opacity = "";
                  }
                });
              }
              if (animation.type === "warp") {
                if (warpAnimateRef.current) {
                  warpAnimateRef.current.classList.remove(
                    color,
                    role,
                    "warp-animate"
                  );
                  warpAnimateRef.current.style.visibility = "hidden";
                  warpAnimateRef.current.style.opacity = "";
                }
              }
              pieceDiv.classList.remove("animate");
              pieceDiv.style.opacity = "";
              pieceDiv.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
              onComplete == null ? void 0 : onComplete();
            }
          };
          animationFrame = requestAnimationFrame(animate);
          return {
            moves,
            cancel: () => {
              movePieceOnBoard(fromSquare, toSquare, {
                boardMap: boardMapCurrent,
                boardMapIndex: boardMapIndexCurrent,
                freeIndexes
              });
              if (validateIndex(pieceCapturedIndex)) {
                const capturedPieceDiv = pieceRefs.current[pieceCapturedIndex];
                if (capturedPieceDiv) {
                  capturedPieceDiv.style.display = "none";
                }
              }
              cancelAnimationFrame(animationFrame);
              if (animation.type === "ghosts") {
                ghostRefs.forEach(({ ref, class: className }) => {
                  if (ref.current) {
                    ref.current.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
                    ref.current.classList.remove(color, role, className);
                    ref.current.style.visibility = "hidden";
                    ref.current.style.opacity = "";
                  }
                });
              }
              if (animation.type === "warp") {
                if (warpAnimateRef.current) {
                  warpAnimateRef.current.classList.remove(
                    color,
                    role,
                    "warp-animate"
                  );
                  warpAnimateRef.current.style.visibility = "hidden";
                  warpAnimateRef.current.style.opacity = "";
                }
              }
              pieceDiv.classList.remove("animate");
              pieceDiv.style.opacity = "";
              pieceDiv.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
              onCancel == null ? void 0 : onCancel();
            }
          };
        }
      }
    }
    return { moves, cancel: () => {
    } };
  } else if (moves.length >= 2) {
    const moveAnimations = [];
    for (const { from: fromSquare, to: toSquare } of moves) {
      if (fromSquare === "" && toSquare === "") continue;
      const fromPiece = boardMapCurrent.current.get(fromSquare);
      if (!fromPiece) return { moves, cancel: () => {
      } };
      const { index: index2 } = fromPiece;
      if (!validateIndex(index2)) return { moves, cancel: () => {
      } };
      const pieceDiv = pieceRefs.current[index2];
      if (!pieceDiv) return { moves, cancel: () => {
      } };
      const captured = boardMapCurrent.current.get(toSquare);
      const capturedPieceDiv = captured && validateIndex(captured.index) ? pieceRefs.current[captured.index] : void 0;
      if (capturedPieceDiv) capturedPieceDiv.classList.add("fade");
      pieceDiv.classList.add("animate");
      const startPos = notationToPixels(fromSquare, squareSize, orientation);
      const endPos = notationToPixels(toSquare, squareSize, orientation);
      moveAnimations.push({
        fromSquare,
        toSquare,
        pieceDiv,
        startPos,
        endPos,
        capturedPieceDiv
      });
    }
    let sharedStartTime = null;
    let animationFrameId;
    const animateAll = (timestamp) => {
      if (sharedStartTime === null) sharedStartTime = timestamp;
      const progress = (timestamp - sharedStartTime) / animation.duration;
      const eased = easeMain(Math.min(progress, 1));
      moveAnimations.forEach(({ pieceDiv, startPos, endPos }) => {
        const newX = startPos[0] + (endPos[0] - startPos[0]) * eased;
        const newY = startPos[1] + (endPos[1] - startPos[1]) * eased;
        pieceDiv.style.transform = `translate(${newX}px, ${newY}px)`;
      });
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateAll);
      } else {
        moveAnimations.forEach(
          ({ fromSquare, toSquare, pieceDiv, endPos, capturedPieceDiv }) => {
            movePieceOnBoard(fromSquare, toSquare, {
              boardMap: boardMapCurrent,
              boardMapIndex: boardMapIndexCurrent,
              freeIndexes
            });
            if (capturedPieceDiv) capturedPieceDiv.style.display = "none";
            pieceDiv.classList.remove("animate");
            pieceDiv.style.opacity = "";
            pieceDiv.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
          }
        );
        onComplete == null ? void 0 : onComplete();
      }
    };
    animationFrameId = requestAnimationFrame(animateAll);
    return {
      moves,
      cancel: () => {
        cancelAnimationFrame(animationFrameId);
        moveAnimations.forEach(
          ({ fromSquare, toSquare, pieceDiv, endPos, capturedPieceDiv }) => {
            movePieceOnBoard(fromSquare, toSquare, {
              boardMap: boardMapCurrent,
              boardMapIndex: boardMapIndexCurrent,
              freeIndexes
            });
            if (capturedPieceDiv) {
              capturedPieceDiv.style.display = "none";
            }
            pieceDiv.classList.remove("animate");
            pieceDiv.style.opacity = "";
            pieceDiv.style.transform = `translate(${endPos[0]}px, ${endPos[1]}px)`;
          }
        );
        onCancel == null ? void 0 : onCancel();
      }
    };
  } else {
    return { moves: [], cancel: () => {
    } };
  }
};
const fenToIndexedBoardMap = (fen) => {
  const fenPieces = fen.split(" ")[0];
  const newIndexedBoardMap = /* @__PURE__ */ new Map();
  const newBoardMapIndex = /* @__PURE__ */ new Map();
  let row = 0;
  let col = 0;
  let currentLastIndex = 0;
  const DIGITS = "0123456789";
  for (let i = 0; i < fenPieces.length; i++) {
    const char = fenPieces[i];
    if (char === "/") {
      row += 1;
      col = 0;
    } else if (DIGITS.includes(char)) {
      col += parseInt(char, 10);
    } else {
      const file = String.fromCharCode("a".charCodeAt(0) + col);
      const rank = (8 - row).toString();
      const square = `${file}${rank}`;
      const pieceNames = {
        p: "pawn",
        r: "rook",
        n: "knight",
        b: "bishop",
        q: "queen",
        k: "king"
      };
      const color = char === char.toUpperCase() ? "white" : "black";
      const role = pieceNames[char.toLowerCase()];
      const pieceBySquare = { color, role, index: currentLastIndex };
      const pieceByIndex = { color, role, square };
      newIndexedBoardMap.set(square, pieceBySquare);
      newBoardMapIndex.set(currentLastIndex, pieceByIndex);
      currentLastIndex += 1;
      col += 1;
    }
  }
  return [newIndexedBoardMap, newBoardMapIndex, currentLastIndex];
};
const findPieceSquareOnFEN = (fen, piece) => {
  let row = 0;
  let col = 0;
  const DIGITS = "0123456789";
  for (let i = 0; i < fen.length; i++) {
    const char = fen[i];
    if (char === "/") {
      row += 1;
      col = 0;
    } else if (DIGITS.includes(char)) {
      col += parseInt(char);
    } else {
      const file = String.fromCharCode("a".charCodeAt(0) + col);
      const rank = (8 - row).toString();
      if (char === piece) {
        return `${file}${rank}`;
      }
      col += 1;
    }
  }
  return "";
};
const getPositionCheck = (check, turnColor, fen) => {
  const color = check === "white" || check === "black" ? check : check === true ? turnColor : null;
  if (color === "white") return findPieceSquareOnFEN(fen, "K");
  if (color === "black") return findPieceSquareOnFEN(fen, "k");
  return "";
};
const pieceToFEN = (piece) => {
  const roleMap = {
    pawn: "p",
    knight: "n",
    bishop: "b",
    rook: "r",
    queen: "q",
    king: "k"
  };
  const fenChar = roleMap[piece.role.toLowerCase()] || "?";
  return piece.color === "white" ? fenChar.toUpperCase() : fenChar.toLowerCase();
};
const boardMapToFEN = (boardMap) => {
  let fen = "";
  for (let row = 8; row >= 1; row--) {
    let emptyCount = 0;
    for (let col = 0; col < 8; col++) {
      const file = String.fromCharCode("a".charCodeAt(0) + col);
      const square = `${file}${row}`;
      const { role, color } = boardMap[square] || {};
      if (role && color) {
        if (emptyCount > 0) {
          fen += emptyCount.toString();
          emptyCount = 0;
        }
        fen += pieceToFEN({ role, color });
      } else {
        emptyCount++;
      }
    }
    if (emptyCount > 0) {
      fen += emptyCount.toString();
    }
    if (row > 1) {
      fen += "/";
    }
  }
  return fen;
};
const fenToBoardMap = (fen) => {
  const fenPieces = fen.split(" ")[0];
  const newBoardMap = /* @__PURE__ */ new Map();
  let row = 0;
  let col = 0;
  const DIGITS = "0123456789";
  for (let i = 0; i < fenPieces.length; i++) {
    const char = fenPieces[i];
    if (char === "/") {
      row += 1;
      col = 0;
    } else if (DIGITS.includes(char)) {
      col += parseInt(char, 10);
    } else {
      const file = String.fromCharCode("a".charCodeAt(0) + col);
      const rank = (8 - row).toString();
      const square = `${file}${rank}`;
      const pieceNames = {
        p: "pawn",
        r: "rook",
        n: "knight",
        b: "bishop",
        q: "queen",
        k: "king"
      };
      const color = char === char.toUpperCase() ? "white" : "black";
      const role = pieceNames[char.toLowerCase()];
      newBoardMap.set(square, { color, role });
      col += 1;
    }
  }
  return newBoardMap;
};
const posToSquare = ([x, y]) => {
  const file = String.fromCharCode(97 + x);
  const rank = (y + 1).toString();
  return file + rank;
};
const squareToPos = (square) => [
  square.charCodeAt(0) - 97,
  // 'a' = 0
  parseInt(square[1], 10) - 1
  // '1' = 0
];
const allPos = Array.from(
  { length: 8 },
  (_, x) => Array.from({ length: 8 }, (_2, y) => [x, y])
).flat();
const diff = (a, b) => Math.abs(a - b);
const pawn = (color) => (x1, y1, x2, y2) => diff(x1, x2) < 2 && (color === "white" ? y2 === y1 + 1 || y1 <= 1 && y2 === y1 + 2 && x1 === x2 : y2 === y1 - 1 || y1 >= 6 && y2 === y1 - 2 && x1 === x2);
const knight = (x1, y1, x2, y2) => {
  const xd = diff(x1, x2);
  const yd = diff(y1, y2);
  return xd === 1 && yd === 2 || xd === 2 && yd === 1;
};
const bishop = (x1, y1, x2, y2) => {
  return diff(x1, x2) === diff(y1, y2);
};
const rook = (x1, y1, x2, y2) => {
  return x1 === x2 || y1 === y2;
};
const queen = (x1, y1, x2, y2) => {
  return bishop(x1, y1, x2, y2) || rook(x1, y1, x2, y2);
};
const king = (color, rookFiles, canCastle) => (x1, y1, x2, y2) => diff(x1, x2) < 2 && diff(y1, y2) < 2 || y1 === y2 && y1 === (color === "white" ? 0 : 7) && (x1 === 4 && (x2 === 2 && rookFiles.includes(0) || x2 === 6 && rookFiles.includes(7)) || rookFiles.includes(x2));
const rookFilesOf = (pieces, color) => {
  const backrank = color === "white" ? "1" : "8";
  const files = [];
  for (const [square, piece] of pieces) {
    if (square[1] === backrank && piece.color === color && piece.role === "rook") {
      files.push(squareToPos(square)[0]);
    }
  }
  return files;
};
const premove = (pieces, square, canCastle) => {
  const piece = pieces.get(square);
  if (!piece) return [];
  const pos = squareToPos(square), r = piece.role, mobility = r === "pawn" ? pawn(piece.color) : r === "knight" ? knight : r === "bishop" ? bishop : r === "rook" ? rook : r === "queen" ? queen : king(piece.color, rookFilesOf(pieces, piece.color));
  return allPos.filter(
    (pos2) => (pos[0] !== pos2[0] || pos[1] !== pos2[1]) && mobility(pos[0], pos[1], pos2[0], pos2[1])
  ).map(posToSquare);
};
const tryAutoCastle = (from, to, board) => {
  const king2 = board.get(from);
  if (!king2 || king2.role !== "king") {
    return {
      move: { from, to },
      rookMove: { from: "", to: "" },
      castle: false
    };
  }
  const color = king2.color;
  const rank = from[1];
  const fromFile = from[0];
  const toFile = to[0];
  const isLong = toFile === "c";
  const isShort = toFile === "g";
  if (isLong || isShort) {
    const emptyFiles = isLong ? ["d", "c"] : ["f", "g"];
    const rookStart = isLong ? "a" + rank : "h" + rank;
    const kingTarget = toFile + rank;
    const rookTarget = (isLong ? "d" : "f") + rank;
    if (emptyFiles.every((file) => !board.has(file + rank))) {
      const rook2 = board.get(rookStart);
      if ((rook2 == null ? void 0 : rook2.role) === "rook" && rook2.color === color) {
        return {
          move: { from, to: kingTarget },
          rookMove: { from: rookStart, to: rookTarget },
          castle: true
        };
      }
    }
  }
  const targetPiece = board.get(to);
  if ((targetPiece == null ? void 0 : targetPiece.role) === "rook" && targetPiece.color === color && (toFile === "a" || toFile === "h")) {
    const longClick = toFile < fromFile;
    const kingTarget = (longClick ? "c" : "g") + rank;
    const rookTarget = (longClick ? "d" : "f") + rank;
    return {
      move: { from, to: kingTarget },
      rookMove: { from: to, to: rookTarget },
      castle: true
    };
  }
  return { move: { from, to }, rookMove: { from: "", to: "" }, castle: false };
};
const updateBoardToNextMap = (boardMapCurrent, freeIndexes, currentLastIndex, nextBoardMap) => {
  const boardMapPool = new Map(boardMapCurrent.current);
  const newBoardMap = /* @__PURE__ */ new Map();
  for (const [square, pieceNext] of nextBoardMap.entries()) {
    const pieceCurrent = boardMapPool.get(square);
    if (pieceCurrent && pieceCurrent.color === pieceNext.color && pieceCurrent.role === pieceNext.role) {
      newBoardMap.set(square, pieceCurrent);
      boardMapPool.delete(square);
    }
  }
  for (const [square, pieceNext] of nextBoardMap.entries()) {
    if (newBoardMap.has(square)) continue;
    let reused;
    for (const [sq, piece] of boardMapPool.entries()) {
      if (piece.color === pieceNext.color && piece.role === pieceNext.role) {
        reused = piece;
        boardMapPool.delete(sq);
        break;
      }
    }
    if (reused) {
      newBoardMap.set(square, reused);
    } else {
      let index2;
      if (freeIndexes.current.size > 0) {
        const [firstFree] = freeIndexes.current;
        index2 = firstFree;
        freeIndexes.current.delete(firstFree);
      } else {
        index2 = currentLastIndex.current;
        currentLastIndex.current++;
      }
      newBoardMap.set(square, { ...pieceNext, index: index2 });
    }
  }
  return newBoardMap;
};
const createChessBoardRef = (deps) => {
  const {
    boardConfigRef,
    boardMapCurrent,
    boardMapFuture,
    boardMapIndexCurrent,
    boardMapIndexFuture,
    currentLastIndex,
    freeIndexes,
    isMovableEnabledRef,
    pieceRefs,
    ghostRef,
    ghostAnimateRef1,
    ghostAnimateRef2,
    ghostAnimateRef3,
    warpAnimateRef,
    lastAnimationRef,
    selectedPiece,
    setSelectedPiece,
    setIsDragging,
    setIsSelect,
    lastAnimation,
    setLastAnimation,
    setRenderTrigger
  } = deps;
  return {
    set: (config) => {
      let samePieceInSameSquare = true;
      if (config.fen) {
        boardConfigRef.current.fen = config.fen;
        if (lastAnimation) {
          lastAnimation.cancel();
        }
        if (lastAnimationRef.current) {
          lastAnimationRef.current.cancel();
        }
        const nextBoardMap = fenToBoardMap(config.fen);
        const newBoardMap = updateBoardToNextMap(
          boardMapCurrent,
          freeIndexes,
          currentLastIndex,
          nextBoardMap
        );
        if (selectedPiece) {
          const square = selectedPiece.square;
          if (square && boardMapCurrent.current.has(square) && newBoardMap.has(square)) {
            const { color, role, index: index2 } = boardMapCurrent.current.get(square);
            const newPiece = newBoardMap.get(square);
            if (color === newPiece.color && role === newPiece.role && index2 === newPiece.index) {
              samePieceInSameSquare = true;
            }
          }
        }
        boardMapCurrent.current = new Map(newBoardMap);
        boardMapFuture.current = new Map(newBoardMap);
        const orderedEntries = Array.from(newBoardMap.entries()).sort(
          ([, a], [, b]) => a.index - b.index
        );
        boardMapIndexCurrent.current.clear();
        boardMapIndexFuture.current.clear();
        for (const [square, piece] of orderedEntries) {
          const { color, role, index: index2 } = piece;
          boardMapIndexCurrent.current.set(index2, { color, role, square });
          boardMapIndexFuture.current.set(index2, { color, role, square });
        }
      }
      if (config.orientation && config.orientation !== boardConfigRef.current.orientation) {
        samePieceInSameSquare = false;
        boardConfigRef.current.orientation = config.orientation;
      }
      if (config.turnColor) {
        boardConfigRef.current.turnColor = config.turnColor;
      }
      if (config.check) {
        const turn = config.turnColor ?? boardConfigRef.current.turnColor;
        const plainBoard = Object.fromEntries(boardMapFuture.current);
        const fen = boardMapToFEN(plainBoard);
        boardConfigRef.current.check = getPositionCheck(
          config.check,
          turn,
          fen
        );
      }
      if (config.lastMove) {
        const [from, to] = config.lastMove;
        boardConfigRef.current.lastMove = [from, to];
      }
      if (config.lastMove2) {
        const [from, to] = config.lastMove2;
        boardConfigRef.current.lastMove2 = [from, to];
      }
      if (config.lastMove3) {
        const [from, to] = config.lastMove3;
        boardConfigRef.current.lastMove3 = [from, to];
      }
      if (config.selected) {
        boardConfigRef.current.selected = config.selected;
        const piece = config.selected ? boardMapCurrent.current.get(config.selected) : null;
        setSelectedPiece(
          piece ? {
            color: piece.color,
            role: piece.role,
            square: config.selected,
            index: piece.index
          } : null
        );
        boardConfigRef.current.selected = config.selected;
        setIsSelect(!!config.selected);
      }
      if (config.coordinates) {
        boardConfigRef.current.coordinates = config.coordinates;
      }
      if (config.autoCastle) {
        boardConfigRef.current.autoCastle = config.autoCastle;
      }
      if (config.squareSize) {
        boardConfigRef.current.squareSize = config.squareSize;
      }
      if (config.animation) {
        Object.assign(boardConfigRef.current.animation, config.animation);
      }
      if (config.movable) {
        Object.assign(boardConfigRef.current.movable, config.movable);
      }
      if (config.premovable) {
        Object.assign(boardConfigRef.current.premovable, config.premovable);
      }
      if (config.draggable) {
        Object.assign(boardConfigRef.current.draggable, config.draggable);
      }
      if (!samePieceInSameSquare) {
        setIsDragging(false);
        if (!config.selected) {
          setSelectedPiece(null);
          setIsSelect(false);
          boardConfigRef.current.selected = "";
        }
        if (ghostRef.current) {
          ghostRef.current.style.visibility = "hidden";
        }
      }
      setRenderTrigger((v) => !v);
    },
    setPieces: (pieces) => {
      if (lastAnimation) {
        lastAnimation.cancel();
      }
      if (lastAnimationRef.current) {
        lastAnimationRef.current.cancel();
      }
      const nextBoardMap = new Map(
        boardMapFuture.current.entries()
      );
      for (const [square, piece] of pieces.entries()) {
        if (piece === null) {
          nextBoardMap.delete(square);
        } else {
          nextBoardMap.set(square, piece);
        }
      }
      const newBoardMap = updateBoardToNextMap(
        boardMapCurrent,
        freeIndexes,
        currentLastIndex,
        nextBoardMap
      );
      let samePieceInSameSquare = false;
      if (selectedPiece) {
        const square = selectedPiece.square;
        if (square && boardMapCurrent.current.has(square) && newBoardMap.has(square)) {
          const { color, role, index: index2 } = boardMapCurrent.current.get(square);
          const newPiece = newBoardMap.get(square);
          if (color === newPiece.color && role === newPiece.role && index2 === newPiece.index) {
            samePieceInSameSquare = true;
          }
        }
      }
      boardMapCurrent.current = new Map(newBoardMap);
      boardMapFuture.current = new Map(newBoardMap);
      const orderedEntries = Array.from(newBoardMap.entries()).sort(
        ([, a], [, b]) => a.index - b.index
      );
      boardMapIndexCurrent.current.clear();
      boardMapIndexFuture.current.clear();
      for (const [square, piece] of orderedEntries) {
        const { color, role, index: index2 } = piece;
        boardMapIndexCurrent.current.set(index2, { color, role, square });
        boardMapIndexFuture.current.set(index2, { color, role, square });
      }
      if (!samePieceInSameSquare) {
        setIsDragging(false);
        setSelectedPiece(null);
        setIsSelect(false);
        boardConfigRef.current.selected = "";
        if (ghostRef.current) {
          ghostRef.current.style.visibility = "hidden";
        }
      }
      setRenderTrigger((v) => !v);
    },
    selectSquare: (square) => {
      if (square) {
        if (selectedPiece && selectedPiece.square !== square) {
          if (lastAnimation) {
            lastAnimation.cancel();
          }
          if (lastAnimationRef.current) {
            lastAnimationRef.current.cancel();
          }
          movePieceOnBoard(selectedPiece.square, square, {
            boardMap: boardMapFuture,
            boardMapIndex: boardMapIndexFuture,
            freeIndexes
          });
          const animationCurrent = animateMove(
            boardMapCurrent,
            boardMapIndexCurrent,
            freeIndexes,
            pieceRefs,
            ghostAnimateRef1,
            ghostAnimateRef2,
            ghostAnimateRef3,
            warpAnimateRef,
            [{ from: selectedPiece.square, to: square }],
            boardConfigRef.current.squareSize,
            boardConfigRef.current.orientation,
            boardConfigRef.current.animation,
            () => {
              setLastAnimation(null);
              lastAnimationRef.current = null;
            },
            () => {
              setLastAnimation(null);
              lastAnimationRef.current = null;
            }
          );
          setIsSelect(false);
          setSelectedPiece(null);
          boardConfigRef.current.selected = "";
          if (ghostRef.current) {
            ghostRef.current.style.visibility = "hidden";
          }
          lastAnimationRef.current = animationCurrent;
          setLastAnimation(animationCurrent);
          boardConfigRef.current.lastMove = [selectedPiece.square, square];
          boardConfigRef.current.lastMove2 = ["", ""];
          boardConfigRef.current.lastMove3 = ["", ""];
        } else if (boardMapFuture.current.has(square)) {
          const { color, role, index: index2 } = boardMapFuture.current.get(square);
          setIsSelect(true);
          setSelectedPiece({ color, role, square, index: index2 });
          boardConfigRef.current.selected = square;
        }
      } else if (square === null) {
        setIsSelect(false);
        setSelectedPiece(null);
        boardConfigRef.current.selected = "";
      }
    },
    newPiece(piece, square) {
      if (lastAnimation && lastAnimation.moves.some(
        (move) => move.from === square || move.to === square
      )) {
        lastAnimation.cancel();
      }
      if (lastAnimationRef.current && lastAnimationRef.current.moves.some(
        (move) => move.from === square || move.to === square
      )) {
        lastAnimationRef.current.cancel();
      }
      const existing = boardMapFuture.current.get(square);
      if (existing) {
        const index2 = existing.index;
        const PieceSquareData = {
          color: piece.color,
          role: piece.role,
          square
        };
        const PieceIndexData = {
          color: piece.color,
          role: piece.role,
          index: index2
        };
        boardMapIndexCurrent.current.set(index2, PieceSquareData);
        boardMapIndexFuture.current.set(index2, PieceSquareData);
        boardMapCurrent.current.set(square, PieceIndexData);
        boardMapFuture.current.set(square, PieceIndexData);
      } else {
        const index2 = currentLastIndex.current++;
        const PieceSquareData = {
          color: piece.color,
          role: piece.role,
          square
        };
        const PieceIndexData = {
          color: piece.color,
          role: piece.role,
          index: index2
        };
        boardMapIndexCurrent.current.set(index2, PieceSquareData);
        boardMapIndexFuture.current.set(index2, PieceSquareData);
        boardMapCurrent.current.set(square, PieceIndexData);
        boardMapFuture.current.set(square, PieceIndexData);
      }
      boardConfigRef.current.lastMove = [square, ""];
      boardConfigRef.current.lastMove2 = ["", ""];
      boardConfigRef.current.lastMove3 = ["", ""];
      setRenderTrigger((prev) => !prev);
    },
    deletePiece: (square) => {
      var _a, _b, _c, _d, _e;
      const indexCurrent = (_b = (_a = boardMapCurrent.current) == null ? void 0 : _a.get(square)) == null ? void 0 : _b.index;
      const indexFuture = (_d = (_c = boardMapFuture.current) == null ? void 0 : _c.get(square)) == null ? void 0 : _d.index;
      if (validateIndex(indexCurrent) && validateIndex(indexFuture) && indexCurrent === indexFuture) {
        freeIndexes.current.add(indexCurrent);
        boardMapIndexCurrent.current.delete(indexCurrent);
        boardMapIndexFuture.current.delete(indexCurrent);
        boardMapCurrent.current.delete(square);
        boardMapFuture.current.delete(square);
      }
      if (((_e = boardConfigRef.current) == null ? void 0 : _e.selected) === square) {
        setIsDragging(false);
        setIsSelect(false);
        setSelectedPiece(null);
        boardConfigRef.current.selected = "";
        if (ghostRef.current) {
          ghostRef.current.style.visibility = "hidden";
        }
      }
      setRenderTrigger((prev) => !prev);
    },
    playPremove: () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const config = boardConfigRef.current;
      const premove2 = config.premovable.current;
      if (!premove2) return void 0;
      const [from, to] = premove2;
      const isCorrectTurn = config.movable.color === "both" || config.turnColor === config.movable.color;
      const isLegal = ((_b = (_a = config.movable.dests) == null ? void 0 : _a.get(from)) == null ? void 0 : _b.includes(to)) ?? false;
      if (isCorrectTurn && isLegal) {
        let moveOrCastle = [];
        const resultCastle = tryAutoCastle(from, to, boardMapFuture.current);
        if (boardConfigRef.current.autoCastle && resultCastle.castle) {
          moveOrCastle = [
            resultCastle.move,
            { from: "", to: "" },
            { from: "", to: "" },
            resultCastle.rookMove
          ];
        } else {
          moveOrCastle = [{ from, to }];
        }
        const captured = boardMapFuture.current.get(to);
        const capturedPiece = captured ? { color: captured.color, role: captured.role } : null;
        moveOrCastle.forEach(({ from: fromSquare, to: toSquare }) => {
          if (fromSquare !== "" && toSquare !== "") {
            movePieceOnBoard(fromSquare, toSquare, {
              boardMap: boardMapFuture,
              boardMapIndex: boardMapIndexFuture,
              freeIndexes
            });
          }
        });
        (_d = (_c = boardConfigRef.current.events).move) == null ? void 0 : _d.call(_c, from, to, capturedPiece);
        (_f = (_e = boardConfigRef.current.events).change) == null ? void 0 : _f.call(_e);
        config.premovable.current = void 0;
        (_h = (_g = config.premovable.events) == null ? void 0 : _g.unset) == null ? void 0 : _h.call(_g);
        if (boardConfigRef.current.animation.enabled && boardConfigRef.current.animation.duration > 70) {
          if (lastAnimation) {
            lastAnimation.cancel();
          }
          if (lastAnimationRef.current) {
            lastAnimationRef.current.cancel();
          }
          const animationCurrent = animateMove(
            boardMapCurrent,
            boardMapIndexCurrent,
            freeIndexes,
            pieceRefs,
            ghostAnimateRef1,
            ghostAnimateRef2,
            ghostAnimateRef3,
            warpAnimateRef,
            moveOrCastle,
            boardConfigRef.current.squareSize,
            boardConfigRef.current.orientation,
            boardConfigRef.current.animation,
            () => {
              setLastAnimation(null);
              lastAnimationRef.current = null;
            },
            () => {
              setLastAnimation(null);
              lastAnimationRef.current = null;
            }
          );
          lastAnimationRef.current = animationCurrent;
          setLastAnimation(animationCurrent);
        } else {
          moveOrCastle.forEach(({ from: fromSquare, to: toSquare }) => {
            var _a2;
            if (fromSquare !== "" && toSquare !== "") {
              const indexFromSquare = (_a2 = boardMapFuture.current.get(toSquare)) == null ? void 0 : _a2.index;
              if (validateIndex(indexFromSquare)) {
                const pieceDiv = pieceRefs.current[indexFromSquare];
                const toTranslate2 = notationToTranslate(
                  toSquare,
                  boardConfigRef.current.squareSize,
                  boardConfigRef.current.orientation
                );
                if (pieceDiv) {
                  pieceDiv.style.transform = toTranslate2;
                }
                movePieceOnBoard(fromSquare, toSquare, {
                  boardMap: boardMapCurrent,
                  boardMapIndex: boardMapIndexCurrent,
                  freeIndexes
                });
              }
            }
          });
        }
        const toTranslate = notationToTranslate(
          moveOrCastle[0].to,
          boardConfigRef.current.squareSize,
          boardConfigRef.current.orientation
        );
        if (ghostRef.current) {
          ghostRef.current.style.visibility = "hidden";
          ghostRef.current.style.transform = toTranslate;
        }
        boardConfigRef.current.turnColor = boardConfigRef.current.turnColor === "white" ? "black" : "white";
        boardConfigRef.current.check = "";
        boardConfigRef.current.premovable.dests = [];
        boardConfigRef.current.lastMove = [from, to];
        boardConfigRef.current.lastMove2 = ["", ""];
        boardConfigRef.current.lastMove3 = ["", ""];
        return moveOrCastle[0];
      } else {
        const config2 = boardConfigRef.current;
        config2.premovable.current = void 0;
        (_j = (_i = config2.premovable.events) == null ? void 0 : _i.unset) == null ? void 0 : _j.call(_i);
        return void 0;
      }
    },
    cancelPremove: () => {
      var _a, _b;
      const config = boardConfigRef.current;
      config.premovable.current = void 0;
      (_b = (_a = config.premovable.events) == null ? void 0 : _a.unset) == null ? void 0 : _b.call(_a);
    },
    move: (fromSquare, toSquare, render) => {
      var _a, _b, _c, _d, _e;
      const validFrom = validateSquare(fromSquare);
      const validTo = validateSquare(toSquare);
      const existingPieceAtFrom = boardMapFuture.current.has(fromSquare);
      if (validFrom && validTo && existingPieceAtFrom) {
        if (render !== false) {
          let moveOrCastle = [];
          const resultCastle = tryAutoCastle(
            fromSquare,
            toSquare,
            boardMapFuture.current
          );
          if (boardConfigRef.current.autoCastle && resultCastle.castle) {
            moveOrCastle = [
              resultCastle.move,
              { from: "", to: "" },
              { from: "", to: "" },
              resultCastle.rookMove
            ];
          } else {
            moveOrCastle = [{ from: fromSquare, to: toSquare }];
          }
          const captured = boardMapFuture.current.get(toSquare);
          const capturedPiece = captured ? { color: captured.color, role: captured.role } : null;
          moveOrCastle.forEach(({ from: fromSquare2, to: toSquare2 }) => {
            if (fromSquare2 !== "" && toSquare2 !== "") {
              if ((selectedPiece == null ? void 0 : selectedPiece.square) === fromSquare2 || (selectedPiece == null ? void 0 : selectedPiece.square) === toSquare2) {
                const existingPieceAtTo = boardMapFuture.current.has(toSquare2);
                if (existingPieceAtTo) {
                  const indexPieceAtTo = boardMapFuture.current.get(toSquare2).index;
                  if (pieceRefs.current[indexPieceAtTo]) {
                    pieceRefs.current[indexPieceAtTo].style.transform = notationToTranslate(
                      toSquare2,
                      boardConfigRef.current.squareSize,
                      boardConfigRef.current.orientation
                    );
                    pieceRefs.current[indexPieceAtTo].classList.remove("drag");
                  }
                }
                setIsDragging(false);
                setSelectedPiece(null);
                setIsSelect(false);
                boardConfigRef.current.selected = "";
                if (ghostRef.current) {
                  ghostRef.current.style.visibility = "hidden";
                }
              }
              movePieceOnBoard(fromSquare2, toSquare2, {
                boardMap: boardMapFuture,
                boardMapIndex: boardMapIndexFuture,
                freeIndexes
              });
            }
          });
          (_b = (_a = boardConfigRef.current.events).move) == null ? void 0 : _b.call(
            _a,
            fromSquare,
            toSquare,
            capturedPiece
          );
          (_d = (_c = boardConfigRef.current.events).change) == null ? void 0 : _d.call(_c);
          if (boardConfigRef.current.animation.enabled && boardConfigRef.current.animation.duration > 70) {
            if (lastAnimation) {
              lastAnimation.cancel();
            }
            if (lastAnimationRef.current) {
              lastAnimationRef.current.cancel();
            }
            const animationCurrent = animateMove(
              boardMapCurrent,
              boardMapIndexCurrent,
              freeIndexes,
              pieceRefs,
              ghostAnimateRef1,
              ghostAnimateRef2,
              ghostAnimateRef3,
              warpAnimateRef,
              moveOrCastle,
              boardConfigRef.current.squareSize,
              boardConfigRef.current.orientation,
              boardConfigRef.current.animation,
              () => {
                setLastAnimation(null);
                lastAnimationRef.current = null;
              },
              () => {
                setLastAnimation(null);
                lastAnimationRef.current = null;
              }
            );
            lastAnimationRef.current = animationCurrent;
            setLastAnimation(animationCurrent);
          } else {
            moveOrCastle.forEach(({ from: fromSquare2, to: toSquare2 }) => {
              var _a2;
              const indexFromSquare = (_a2 = boardMapFuture.current.get(toSquare2)) == null ? void 0 : _a2.index;
              if (validateIndex(indexFromSquare)) {
                const pieceDiv = pieceRefs.current[indexFromSquare];
                const toTranslate = notationToTranslate(
                  toSquare2,
                  boardConfigRef.current.squareSize,
                  boardConfigRef.current.orientation
                );
                if (pieceDiv) {
                  pieceDiv.style.transform = toTranslate;
                }
                movePieceOnBoard(fromSquare2, toSquare2, {
                  boardMap: boardMapCurrent,
                  boardMapIndex: boardMapIndexCurrent,
                  freeIndexes
                });
              }
            });
          }
          boardConfigRef.current.check = "";
          boardConfigRef.current.turnColor = boardConfigRef.current.turnColor === "white" ? "black" : "white";
          boardConfigRef.current.movable.dests = /* @__PURE__ */ new Map();
          boardConfigRef.current.premovable.dests = [];
          if (!((_e = boardConfigRef.current.premovable.dests) == null ? void 0 : _e.includes(
            boardConfigRef.current.selected
          )) && boardConfigRef.current.premovable.enabled === true && boardConfigRef.current.premovable.showDests === true && boardConfigRef.current.movable.color === (selectedPiece == null ? void 0 : selectedPiece.color) && boardConfigRef.current.turnColor !== (selectedPiece == null ? void 0 : selectedPiece.color)) {
            const newDests = premove(
              boardMapFuture.current,
              boardConfigRef.current.selected
            );
            boardConfigRef.current.premovable.dests = newDests;
          } else {
            boardConfigRef.current.premovable.dests = [];
          }
        }
        boardConfigRef.current.lastMove = [fromSquare, toSquare];
        boardConfigRef.current.lastMove2 = ["", ""];
        boardConfigRef.current.lastMove3 = ["", ""];
        setRenderTrigger((prev) => !prev);
      }
    },
    moves: (moves) => {
      var _a;
      const allMovesValid = moves.every(({ from, to }) => {
        if (from === "" && to === "") return true;
        const validFrom = validateSquare(from);
        const validTo = validateSquare(to);
        const existsAtFrom = boardMapFuture.current.has(from);
        return validFrom && validTo && existsAtFrom;
      });
      if (allMovesValid) {
        const isSelectedInMovesFrom = moves.find(
          ({ from }) => (selectedPiece == null ? void 0 : selectedPiece.square) === from
        );
        const isSelectedInMovesTo = moves.find(
          ({ to }) => (selectedPiece == null ? void 0 : selectedPiece.square) === to
        );
        if (isSelectedInMovesFrom || isSelectedInMovesTo) {
          const toSquare = isSelectedInMovesTo == null ? void 0 : isSelectedInMovesTo.to;
          if (toSquare) {
            const existingPieceAtTo = boardMapFuture.current.has(toSquare);
            if (existingPieceAtTo) {
              const indexPieceAtTo = boardMapFuture.current.get(toSquare).index;
              if (pieceRefs.current[indexPieceAtTo]) {
                pieceRefs.current[indexPieceAtTo].style.transform = notationToTranslate(
                  toSquare,
                  boardConfigRef.current.squareSize,
                  boardConfigRef.current.orientation
                );
                pieceRefs.current[indexPieceAtTo].classList.remove("drag");
              }
            }
          }
          setIsDragging(false);
          setSelectedPiece(null);
          setIsSelect(false);
          boardConfigRef.current.selected = "";
          if (ghostRef.current) {
            ghostRef.current.style.visibility = "hidden";
          }
        }
        const renderMoves = [];
        boardConfigRef.current.lastMove = ["", ""];
        boardConfigRef.current.lastMove2 = ["", ""];
        boardConfigRef.current.lastMove3 = ["", ""];
        for (let i = 0; i < moves.length; i++) {
          const fromSquare = moves[i].from;
          const toSquare = moves[i].to;
          const render = moves[i].render;
          const lastMoveNumber = moves[i].lastMove;
          const result = tryAutoCastle(
            fromSquare,
            toSquare,
            boardMapCurrent.current
          );
          if (lastMoveNumber) {
            if (lastMoveNumber === 1) {
              boardConfigRef.current.lastMove = [
                result.move.from,
                result.move.to
              ];
            }
            if (lastMoveNumber === 2) {
              boardConfigRef.current.lastMove2 = [
                result.move.from,
                result.move.to
              ];
            }
            if (lastMoveNumber === 3) {
              boardConfigRef.current.lastMove3 = [
                result.move.from,
                result.move.to
              ];
            }
          }
          if (render !== false) {
            if (result.castle) {
              renderMoves.push({
                ...result.move,
                ...lastMoveNumber !== void 0 ? { lastMove: lastMoveNumber } : {}
              });
              movePieceOnBoard(result.move.from, result.move.to, {
                boardMap: boardMapFuture,
                boardMapIndex: boardMapIndexFuture,
                freeIndexes
              });
              renderMoves.push({
                ...result.rookMove
              });
              movePieceOnBoard(result.rookMove.from, result.rookMove.to, {
                boardMap: boardMapFuture,
                boardMapIndex: boardMapIndexFuture,
                freeIndexes
              });
            } else {
              renderMoves.push({
                ...result.move,
                ...lastMoveNumber !== void 0 ? { lastMove: lastMoveNumber } : {}
              });
              movePieceOnBoard(fromSquare, toSquare, {
                boardMap: boardMapFuture,
                boardMapIndex: boardMapIndexFuture,
                freeIndexes
              });
            }
          }
        }
        if (lastAnimation) {
          lastAnimation.cancel();
        }
        if (lastAnimationRef.current) {
          lastAnimationRef.current.cancel();
        }
        if (renderMoves.length > 0) {
          if (boardConfigRef.current.animation.enabled && boardConfigRef.current.animation.duration > 70) {
            const animationCurrent = animateMove(
              boardMapCurrent,
              boardMapIndexCurrent,
              freeIndexes,
              pieceRefs,
              ghostAnimateRef1,
              ghostAnimateRef2,
              ghostAnimateRef3,
              warpAnimateRef,
              renderMoves,
              boardConfigRef.current.squareSize,
              boardConfigRef.current.orientation,
              boardConfigRef.current.animation,
              () => {
                setLastAnimation(null);
                lastAnimationRef.current = null;
              },
              () => {
                setLastAnimation(null);
                lastAnimationRef.current = null;
              }
            );
            lastAnimationRef.current = animationCurrent;
            setLastAnimation(animationCurrent);
          } else {
            renderMoves.forEach(({ from: fromSquare, to: toSquare }) => {
              var _a2;
              if (fromSquare !== "" && toSquare !== "") {
                const index2 = (_a2 = boardMapCurrent.current.get(fromSquare)) == null ? void 0 : _a2.index;
                if (validateIndex(index2)) {
                  const pieceDiv = pieceRefs.current[index2];
                  const toTranslate = notationToTranslate(
                    toSquare,
                    boardConfigRef.current.squareSize,
                    boardConfigRef.current.orientation
                  );
                  if (pieceDiv) {
                    pieceDiv.style.transform = toTranslate;
                  }
                  movePieceOnBoard(fromSquare, toSquare, {
                    boardMap: boardMapCurrent,
                    boardMapIndex: boardMapIndexCurrent,
                    freeIndexes
                  });
                }
              }
            });
          }
          boardConfigRef.current.turnColor = boardConfigRef.current.turnColor === "white" ? "black" : "white";
          boardConfigRef.current.check = "";
          boardConfigRef.current.movable.dests = /* @__PURE__ */ new Map();
          boardConfigRef.current.premovable.dests = [];
          if (!((_a = boardConfigRef.current.premovable.dests) == null ? void 0 : _a.includes(
            boardConfigRef.current.selected
          )) && boardConfigRef.current.premovable.enabled === true && boardConfigRef.current.premovable.showDests === true && boardConfigRef.current.movable.color === (selectedPiece == null ? void 0 : selectedPiece.color) && boardConfigRef.current.turnColor !== (selectedPiece == null ? void 0 : selectedPiece.color)) {
            const newDests = premove(
              boardMapFuture.current,
              boardConfigRef.current.selected
            );
            boardConfigRef.current.premovable.dests = newDests;
          } else {
            boardConfigRef.current.premovable.dests = [];
          }
        }
        setRenderTrigger((prev) => !prev);
      }
    },
    cancelMove: () => {
      const prevSelected = selectedPiece;
      setIsDragging(false);
      setSelectedPiece(null);
      setIsSelect(false);
      boardConfigRef.current.selected = "";
      if (ghostRef.current) {
        ghostRef.current.style.visibility = "hidden";
      }
      if (prevSelected) {
        const pieceDiv = pieceRefs.current[prevSelected.index];
        if (pieceDiv) {
          pieceDiv.style.transform = notationToTranslate(
            prevSelected.square,
            boardConfigRef.current.squareSize,
            boardConfigRef.current.orientation
          );
        }
      }
    },
    stop: () => {
      if (lastAnimation) {
        lastAnimation.cancel();
      }
      if (lastAnimationRef.current) {
        lastAnimationRef.current.cancel();
      }
      isMovableEnabledRef.current = false;
      const prevSelected = selectedPiece;
      setIsDragging(false);
      setSelectedPiece(null);
      setIsSelect(false);
      boardConfigRef.current.selected = "";
      if (ghostRef.current) {
        ghostRef.current.style.visibility = "hidden";
      }
      if (prevSelected) {
        const pieceDiv = pieceRefs.current[prevSelected.index];
        if (pieceDiv) {
          pieceDiv.style.transform = notationToTranslate(
            prevSelected.square,
            boardConfigRef.current.squareSize,
            boardConfigRef.current.orientation
          );
        }
      }
    },
    toggleOrientation: () => {
      var _a;
      if (lastAnimation) {
        lastAnimation.cancel();
      }
      if (lastAnimationRef.current) {
        lastAnimationRef.current.cancel();
      }
      setIsDragging(false);
      setSelectedPiece(null);
      setIsSelect(false);
      boardConfigRef.current.selected = "";
      if (ghostRef.current) {
        ghostRef.current.style.visibility = "hidden";
        ghostRef.current.style.transform = "";
      }
      for (const [indexStr, el] of Object.entries(pieceRefs.current)) {
        const index2 = Number(indexStr);
        const square = (_a = boardMapIndexCurrent.current.get(index2)) == null ? void 0 : _a.square;
        if (square && el) {
          const newTransform = notationToTranslate(
            square,
            boardConfigRef.current.squareSize,
            boardConfigRef.current.orientation === "white" ? "black" : "white"
          );
          el.style.transform = newTransform;
        }
      }
      boardConfigRef.current.orientation = boardConfigRef.current.orientation === "white" ? "black" : "white";
      setRenderTrigger((prev) => !prev);
    },
    getOrientation: () => boardConfigRef.current.orientation,
    getPieces: () => {
      const pieces = {};
      boardMapFuture.current.forEach(
        (value, square) => {
          pieces[square] = {
            color: value.color,
            role: value.role
          };
        }
      );
      return pieces;
    },
    getFen: () => {
      const plainBoard = Object.fromEntries(boardMapFuture.current);
      const newFEN = boardMapToFEN(plainBoard);
      return newFEN;
    },
    getMaterialDiff: () => {
      const material = {
        white: {},
        black: {}
      };
      for (const { color, role } of boardMapFuture.current.values()) {
        const side = material[color];
        side[role] = (side[role] ?? 0) + 1;
      }
      return material;
    }
  };
};
const getSquareClasses = (boardConfigRef, boardMapFuture) => {
  var _a, _b, _c, _d, _e, _f, _g;
  const config = boardConfigRef.current;
  const squareClassMap = {};
  const addClass = (square, className) => {
    if (!square) return;
    if (!squareClassMap[square]) squareClassMap[square] = [];
    if (!squareClassMap[square].includes(className))
      squareClassMap[square].push(className);
  };
  if (config.selected && config.movable.showDests === true) {
    (_c = (_b = (_a = config.movable) == null ? void 0 : _a.dests) == null ? void 0 : _b.get(config.selected)) == null ? void 0 : _c.forEach((sq) => {
      addClass(sq, "move-dest");
      if (boardMapFuture.current.has(sq)) addClass(sq, "oc");
    });
  }
  (_e = (_d = config.premovable) == null ? void 0 : _d.dests) == null ? void 0 : _e.forEach((sq) => {
    addClass(sq, "premove-dest");
    if (boardMapFuture.current.has(sq)) addClass(sq, "oc");
  });
  (_g = (_f = config.premovable) == null ? void 0 : _f.current) == null ? void 0 : _g.forEach((sq) => {
    addClass(sq, "current-premove");
  });
  addClass(config.check, "ljdr-check");
  const [from, to] = config.lastMove ?? [];
  const [from2, to2] = config.lastMove2 ?? [];
  const [from3, to3] = config.lastMove3 ?? [];
  const isSelectedInLastMoves = [from, from2, from3, to, to2, to3].includes(
    config.selected
  );
  if (!isSelectedInLastMoves) addClass(config.selected, "select");
  addClass(from, "ljdr-last-move");
  addClass(to, "ljdr-last-move");
  addClass(from2, "ljdr-last-move2");
  addClass(to2, "ljdr-last-move2");
  addClass(from3, "ljdr-last-move3");
  addClass(to3, "ljdr-last-move3");
  if (isSelectedInLastMoves) addClass(config.selected, "select");
  const result = {};
  for (const sq in squareClassMap) {
    result[sq] = squareClassMap[sq].join(" ");
  }
  return result;
};
const ChessBoard = forwardRef(
  ({
    id = defaultId,
    fen = defaultFEN,
    orientation = defaultOrientation,
    turnColor = defaultTurnColor,
    check = defaultCheck,
    lastMove = defaultLastMove,
    lastMove2 = defaultLastMove2,
    lastMove3 = defaultLastMove3,
    selected = defaultSelected,
    coordinates = defaultCoordinates,
    autoCastle = defaultAutoCastle,
    squareSize = defaultSquareSize,
    animation = defaultAnimation,
    movable = defaultMovable,
    premovable = defaultPremovable,
    draggable = defaultDraggable,
    events = defaultEvents
  }, ref) => {
    const animationConfig = { ...defaultAnimation, ...animation };
    const movableConfig = { ...defaultMovable, ...movable };
    const premovableConfig = { ...defaultPremovable, ...premovable };
    const draggableConfig = { ...defaultDraggable, ...draggable };
    const eventsConfig = { ...defaultEvents, ...events };
    const boardConfigRef = useRef({
      id,
      fen,
      orientation,
      turnColor,
      check: getPositionCheck(check, turnColor, fen),
      lastMove,
      lastMove2,
      lastMove3,
      selected,
      coordinates,
      autoCastle,
      squareSize,
      animation: animationConfig,
      movable: movableConfig,
      premovable: premovableConfig,
      draggable: draggableConfig,
      events: eventsConfig
    });
    const isMovableEnabledRef = useRef(true);
    const pieceRefs = useRef({});
    const ghostRef = useRef(null);
    const ghostAnimateRef1 = useRef(null);
    const ghostAnimateRef2 = useRef(null);
    const ghostAnimateRef3 = useRef(null);
    const warpAnimateRef = useRef(null);
    const lastAnimationRef = useRef(null);
    const boardRef = useRef(null);
    const [, setRenderTrigger] = useState(false);
    const [boardMap, boardIndexMap, pieceCount] = fenToIndexedBoardMap(
      boardConfigRef.current.fen
    );
    const freeIndexes = useRef(/* @__PURE__ */ new Set());
    const currentLastIndex = useRef(pieceCount);
    const boardMapCurrent = useRef(new Map(boardMap));
    const boardMapFuture = useRef(new Map(boardMap));
    const boardMapIndexCurrent = useRef(new Map(boardIndexMap));
    const boardMapIndexFuture = useRef(new Map(boardIndexMap));
    const [selectedPiece, setSelectedPiece] = useState(() => {
      const piece = selected ? boardMap.get(selected) : null;
      return piece ? {
        color: piece.color,
        role: piece.role,
        square: selected,
        index: piece.index
      } : null;
    });
    const [isSelect, setIsSelect] = useState(!!selected);
    const [isDragging, setIsDragging] = useState(false);
    const [isTouchStarted, setIsTouchStarted] = useState(false);
    const [lastAnimation, setLastAnimation] = useState(null);
    const [lastOffset, setLastOffset] = useState([0, 0]);
    const [lastMoveType, setLastMoveType] = useState("drag");
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranksRef = useRef(null);
    const filesRef = useRef(null);
    let distancePassed = false;
    useEffect(() => {
      if (isDragging) {
        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mousemove", handleMouseMove, {
          passive: false
        });
        window.addEventListener("touchend", handleTouchEnd);
        window.addEventListener("touchmove", handleTouchMove, {
          passive: false
        });
      }
      return () => {
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener(
          "mousemove",
          handleMouseMove
        );
        window.removeEventListener("touchend", handleTouchEnd);
        window.removeEventListener(
          "touchmove",
          handleTouchMove
        );
      };
    }, [isDragging]);
    useImperativeHandle(
      ref,
      () => createChessBoardRef({
        boardConfigRef,
        boardMapCurrent,
        boardMapFuture,
        boardMapIndexCurrent,
        boardMapIndexFuture,
        currentLastIndex,
        freeIndexes,
        isMovableEnabledRef,
        pieceRefs,
        ghostRef,
        ghostAnimateRef1,
        ghostAnimateRef2,
        ghostAnimateRef3,
        warpAnimateRef,
        lastAnimationRef,
        selectedPiece,
        setSelectedPiece,
        setIsDragging,
        setIsSelect,
        lastAnimation,
        setLastAnimation,
        setRenderTrigger
      })
    );
    const handleMouseDown = (event) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s;
      event.stopPropagation();
      if (!isMovableEnabledRef.current) return;
      let eventType;
      if (event.type === "mousedown") {
        eventType = event;
        setIsTouchStarted(false);
      } else if (event.type === "touchstart") {
        eventType = event.touches[0];
        setIsTouchStarted(true);
      }
      if (event.type === "mousedown" && isTouchStarted) return;
      const rect = (_a = boardRef.current) == null ? void 0 : _a.getBoundingClientRect();
      if (rect) {
        const x = eventType.clientX - rect.left;
        const y = eventType.clientY - rect.top;
        const currentSquare = pixelsToNotation(
          [x, y],
          boardConfigRef.current.squareSize,
          boardConfigRef.current.orientation
        );
        const isMovableSelectedColor = boardConfigRef.current.movable.color === "both" || boardConfigRef.current.movable.color === (selectedPiece == null ? void 0 : selectedPiece.color) && boardConfigRef.current.turnColor === (selectedPiece == null ? void 0 : selectedPiece.color);
        const canMove = selectedPiece && (boardConfigRef.current.movable.free === true || isMovableSelectedColor && ((_c = (_b = boardConfigRef.current.movable.dests) == null ? void 0 : _b.get(selectedPiece.square)) == null ? void 0 : _c.includes(currentSquare)));
        const current = boardMapCurrent.current.get(currentSquare);
        const future = boardMapFuture.current.get(currentSquare);
        const isMovablePieceColor = !((_d = boardConfigRef.current.premovable.dests) == null ? void 0 : _d.includes(currentSquare)) && (boardConfigRef.current.movable.color === "both" || boardConfigRef.current.movable.color === (future == null ? void 0 : future.color));
        if ((selectedPiece == null ? void 0 : selectedPiece.square) === currentSquare && isSelect || !selectedPiece && !isSelect || !canMove) {
          const prevPremovableDests = boardConfigRef.current.premovable.dests;
          if (!((_e = boardConfigRef.current.premovable.dests) == null ? void 0 : _e.includes(currentSquare)) && boardConfigRef.current.premovable.enabled === true && boardConfigRef.current.premovable.showDests === true && boardConfigRef.current.movable.color === (future == null ? void 0 : future.color) && boardConfigRef.current.turnColor !== (future == null ? void 0 : future.color)) {
            const newDests = premove(
              boardMapFuture.current,
              currentSquare
            );
            boardConfigRef.current.premovable.dests = newDests;
          } else {
            boardConfigRef.current.premovable.dests = [];
          }
          if (prevPremovableDests && prevPremovableDests.length > 0 && prevPremovableDests.includes(currentSquare)) {
            if (selectedPiece == null ? void 0 : selectedPiece.square) {
              boardConfigRef.current.premovable.current = [
                selectedPiece.square,
                currentSquare
              ];
              (_g = (_f = boardConfigRef.current.premovable.events).set) == null ? void 0 : _g.call(
                _f,
                selectedPiece.square,
                currentSquare
              );
            }
          } else if (!future || boardConfigRef.current.turnColor === (future == null ? void 0 : future.color) || ((_h = boardConfigRef.current.premovable.current) == null ? void 0 : _h[0]) === currentSquare) {
            boardConfigRef.current.premovable.current = void 0;
            (_j = (_i = boardConfigRef.current.premovable.events).unset) == null ? void 0 : _j.call(_i);
          }
          setRenderTrigger((prev) => !prev);
          setSelectedPiece(null);
          setIsSelect(false);
          boardConfigRef.current.selected = "";
          if (isMovablePieceColor) {
            if (boardMapCurrent.current.has(currentSquare) && (current == null ? void 0 : current.index) === (future == null ? void 0 : future.index)) {
              setIsDragging(true);
              setIsSelect(true);
              if ((selectedPiece == null ? void 0 : selectedPiece.square) === currentSquare) {
                setIsSelect(false);
              }
              const pieceData = boardMapCurrent.current.get(currentSquare);
              if (pieceData) {
                const { index: index2, role, color } = pieceData;
                setSelectedPiece({
                  index: index2,
                  role,
                  color,
                  square: currentSquare
                });
                boardConfigRef.current.selected = currentSquare;
                if (!isSelect || !canMove) {
                  (_k = eventsConfig.select) == null ? void 0 : _k.call(eventsConfig, currentSquare);
                }
              }
              const pieceIndex = boardMapCurrent.current.get(currentSquare).index;
              const pieceDiv = pieceRefs.current[pieceIndex];
              if (pieceDiv) {
                const position = translateToPixels(pieceDiv.style.transform);
                const rect2 = pieceDiv.getBoundingClientRect();
                if (boardConfigRef.current.draggable.enabled) {
                  if (position) {
                    const offsetX = position[0] + eventType.clientX - rect2.left - boardConfigRef.current.squareSize / 2;
                    const offsetY = position[1] + eventType.clientY - rect2.top - boardConfigRef.current.squareSize / 2;
                    setLastOffset([offsetX, offsetY]);
                    if (boardConfigRef.current.draggable.distance === 0 || boardConfigRef.current.draggable.autoDistance && lastMoveType === "drag") {
                      pieceDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                    }
                  }
                  pieceDiv.classList.add("drag");
                  if (ghostRef.current) {
                    const selectedPieceTranslate = notationToTranslate(
                      currentSquare,
                      boardConfigRef.current.squareSize,
                      boardConfigRef.current.orientation
                    );
                    ghostRef.current.style.visibility = "visible";
                    ghostRef.current.style.transform = selectedPieceTranslate;
                    if (ghostRef.current.classList.length > 2) {
                      const firstOldClass = ghostRef.current.classList[1];
                      const secondOldClass = ghostRef.current.classList[2];
                      ghostRef.current.classList.replace(
                        firstOldClass,
                        pieceDiv.classList[1]
                      );
                      ghostRef.current.classList.replace(
                        secondOldClass,
                        pieceDiv.classList[2]
                      );
                    } else {
                      ghostRef.current.classList.add(pieceDiv.classList[1]);
                      ghostRef.current.classList.add(pieceDiv.classList[2]);
                    }
                  }
                }
              }
            } else if (boardMapFuture.current.has(currentSquare)) {
              setIsDragging(true);
              setIsSelect(true);
              const selectedPieceTranslate = notationToTranslate(
                currentSquare,
                boardConfigRef.current.squareSize,
                boardConfigRef.current.orientation
              );
              if (lastAnimation) {
                lastAnimation.cancel();
              }
              if (lastAnimationRef.current) {
                lastAnimationRef.current.cancel();
              }
              const pieceData = boardMapFuture.current.get(currentSquare);
              if (pieceData) {
                const { index: index2, role, color } = pieceData;
                setSelectedPiece({
                  index: index2,
                  role,
                  color,
                  square: currentSquare
                });
                boardConfigRef.current.selected = currentSquare;
                (_l = eventsConfig.select) == null ? void 0 : _l.call(eventsConfig, currentSquare);
                if (ghostRef.current) {
                  ghostRef.current.style.visibility = "visible";
                  ghostRef.current.style.transform = selectedPieceTranslate;
                  if (ghostRef.current.classList.length > 2) {
                    const firstOldClass = ghostRef.current.classList[1];
                    const secondOldClass = ghostRef.current.classList[2];
                    ghostRef.current.classList.replace(firstOldClass, color);
                    ghostRef.current.classList.replace(secondOldClass, role);
                  } else {
                    ghostRef.current.classList.add(color);
                    ghostRef.current.classList.add(role);
                  }
                }
                (_m = pieceRefs.current[index2]) == null ? void 0 : _m.classList.add("drag");
              }
            } else {
              setSelectedPiece(null);
              setIsSelect(false);
              boardConfigRef.current.selected = "";
            }
          }
        } else if (selectedPiece) {
          const fromSquare = selectedPiece.square;
          const toSquare = currentSquare;
          const toTranslate = notationToTranslate(
            currentSquare,
            boardConfigRef.current.squareSize,
            boardConfigRef.current.orientation
          );
          const pieceIndex = boardMapCurrent.current.get(fromSquare).index;
          const pieceDiv = pieceRefs.current[pieceIndex];
          setSelectedPiece(null);
          setIsSelect(false);
          if (canMove) {
            let moveOrCastle = [];
            const resultCastle = tryAutoCastle(
              fromSquare,
              toSquare,
              boardMapFuture.current
            );
            if (boardConfigRef.current.autoCastle && resultCastle.castle) {
              moveOrCastle = [
                resultCastle.move,
                { from: "", to: "" },
                { from: "", to: "" },
                resultCastle.rookMove
              ];
            } else {
              moveOrCastle = [{ from: fromSquare, to: toSquare }];
            }
            const captured = boardMapFuture.current.get(toSquare);
            const capturedPiece = captured ? { color: captured.color, role: captured.role } : null;
            moveOrCastle.forEach(
              ({ from: fromSquare2, to: toSquare2, render }) => {
                if (fromSquare2 !== "" && toSquare2 !== "") {
                  if (render !== false) {
                    movePieceOnBoard(fromSquare2, toSquare2, {
                      boardMap: boardMapFuture,
                      boardMapIndex: boardMapIndexFuture,
                      freeIndexes
                    });
                  }
                }
              }
            );
            (_o = (_n = boardConfigRef.current.events).move) == null ? void 0 : _o.call(
              _n,
              fromSquare,
              toSquare,
              capturedPiece
            );
            (_q = (_p = boardConfigRef.current.events).change) == null ? void 0 : _q.call(_p);
            (_s = (_r = boardConfigRef.current.movable.events).after) == null ? void 0 : _s.call(_r, fromSquare, toSquare);
            if (boardConfigRef.current.animation.enabled && boardConfigRef.current.animation.duration > 70) {
              if (lastAnimation) {
                lastAnimation.cancel();
              }
              if (lastAnimationRef.current) {
                lastAnimationRef.current.cancel();
              }
              const currentAnimation = animateMove(
                boardMapCurrent,
                boardMapIndexCurrent,
                freeIndexes,
                pieceRefs,
                ghostAnimateRef1,
                ghostAnimateRef2,
                ghostAnimateRef3,
                warpAnimateRef,
                moveOrCastle,
                boardConfigRef.current.squareSize,
                boardConfigRef.current.orientation,
                boardConfigRef.current.animation,
                () => {
                  setLastAnimation(null);
                },
                () => {
                  setLastAnimation(null);
                }
              );
              setLastAnimation(currentAnimation);
            } else {
              moveOrCastle.forEach(({ from: fromSquare2, to: toSquare2 }) => {
                if (fromSquare2 !== "" && toSquare2 !== "") {
                  if (pieceDiv) {
                    pieceDiv.style.transform = toTranslate;
                  }
                  movePieceOnBoard(fromSquare2, toSquare2, {
                    boardMap: boardMapCurrent,
                    boardMapIndex: boardMapIndexCurrent,
                    freeIndexes
                  });
                }
              });
            }
            if (ghostRef.current) {
              ghostRef.current.style.visibility = "hidden";
              ghostRef.current.style.transform = toTranslate;
            }
            boardConfigRef.current.turnColor = boardConfigRef.current.turnColor === "white" ? "black" : "white";
            boardConfigRef.current.movable.dests = /* @__PURE__ */ new Map();
            boardConfigRef.current.selected = "";
            boardConfigRef.current.check = "";
            boardConfigRef.current.lastMove = [fromSquare, toSquare];
            boardConfigRef.current.lastMove2 = ["", ""];
            boardConfigRef.current.lastMove3 = ["", ""];
          }
        }
      }
    };
    const handleMouseMove = (event) => {
      let eventType;
      if (event.type === "mousemove") {
        eventType = event;
      } else if (event.type === "touchmove") {
        eventType = event.touches[0];
      }
      if (boardConfigRef.current.draggable.enabled) {
        if (selectedPiece) {
          const draggedIndexPiece = selectedPiece.index;
          const pieceDiv = pieceRefs.current[draggedIndexPiece];
          if (pieceDiv) {
            const position = translateToPixels(pieceDiv.style.transform);
            const rect = pieceDiv.getBoundingClientRect();
            if (position) {
              if (isDragging) {
                const offsetX = position[0] + eventType.clientX - rect.left - boardConfigRef.current.squareSize / 2;
                const offsetY = position[1] + eventType.clientY - rect.top - boardConfigRef.current.squareSize / 2;
                if (distancePassed) {
                  pieceDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                } else {
                  if (Math.hypot(
                    lastOffset[0] - offsetX,
                    lastOffset[1] - offsetY
                  ) > boardConfigRef.current.draggable.distance || boardConfigRef.current.draggable.autoDistance && lastMoveType === "drag") {
                    pieceDiv.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
                    distancePassed = true;
                  }
                }
              }
            }
          }
        }
      }
    };
    const handleMouseUp = () => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      if (!isDragging) return;
      if (selectedPiece) {
        const { index: index2, square } = selectedPiece;
        const pieceDiv = pieceRefs.current[index2];
        if (pieceDiv) {
          const position = translateToPixels(pieceDiv.style.transform);
          const fromSquare = square;
          const normalCoords = normalizePixels(
            position[0] + boardConfigRef.current.squareSize / 2,
            position[1] + boardConfigRef.current.squareSize / 2,
            boardConfigRef.current.squareSize
          );
          const toSquare = pixelsToNotation(
            normalCoords,
            boardConfigRef.current.squareSize,
            boardConfigRef.current.orientation
          );
          const fromTranslate = notationToTranslate(
            square,
            boardConfigRef.current.squareSize,
            boardConfigRef.current.orientation
          );
          const toTranslate = pixelsToTranslate(normalCoords);
          if (position) {
            {
              const isPieceOffBoard = position[0] < -boardConfigRef.current.squareSize / 2 || position[1] < -boardConfigRef.current.squareSize / 2 || position[0] > boardConfigRef.current.squareSize * 7 + boardConfigRef.current.squareSize / 2 || position[1] > boardConfigRef.current.squareSize * 7 + boardConfigRef.current.squareSize / 2;
              if (isPieceOffBoard) {
                if (boardConfigRef.current.draggable.deleteOnDropOff) {
                  const existingPieceAtFuture = boardMapFuture.current.get(fromSquare);
                  const existingPieceAtCurrent = boardMapCurrent.current.get(fromSquare);
                  if (existingPieceAtFuture) {
                    boardMapIndexFuture.current.delete(
                      existingPieceAtFuture.index
                    );
                  }
                  if (existingPieceAtCurrent) {
                    boardMapIndexCurrent.current.delete(
                      existingPieceAtCurrent.index
                    );
                  }
                  boardMapFuture.current.delete(fromSquare);
                  boardMapCurrent.current.delete(fromSquare);
                }
                if (ghostRef.current) {
                  ghostRef.current.style.visibility = "hidden";
                  ghostRef.current.style.transform = toTranslate;
                }
                pieceDiv.style.transform = fromTranslate;
                setSelectedPiece(null);
                boardConfigRef.current.selected = "";
                setIsSelect(false);
              } else {
                pieceDiv.style.transform = toTranslate;
                if (fromSquare === toSquare) {
                  if (!isSelect) {
                    setSelectedPiece(null);
                    boardConfigRef.current.selected = "";
                    boardConfigRef.current.premovable.dests = [];
                  }
                } else {
                  if (boardConfigRef.current.premovable.dests && boardConfigRef.current.premovable.dests.length > 0 && boardConfigRef.current.premovable.dests.includes(toSquare)) {
                    if (selectedPiece == null ? void 0 : selectedPiece.square) {
                      boardConfigRef.current.premovable.current = [
                        fromSquare,
                        toSquare
                      ];
                      boardConfigRef.current.premovable.dests = [];
                      (_b = (_a = boardConfigRef.current.premovable.events).set) == null ? void 0 : _b.call(
                        _a,
                        fromSquare,
                        toSquare
                      );
                    }
                  }
                  const isMovableSelectedColor = boardConfigRef.current.movable.color === "both" || boardConfigRef.current.movable.color === (selectedPiece == null ? void 0 : selectedPiece.color) && boardConfigRef.current.turnColor === (selectedPiece == null ? void 0 : selectedPiece.color);
                  const canMove = boardConfigRef.current.movable.free === true || isMovableSelectedColor && ((_d = (_c = boardConfigRef.current.movable.dests) == null ? void 0 : _c.get(fromSquare)) == null ? void 0 : _d.includes(toSquare));
                  if (!canMove) {
                    if (ghostRef.current) {
                      ghostRef.current.style.visibility = "hidden";
                      ghostRef.current.style.transform = toTranslate;
                    }
                    pieceDiv.style.transform = fromTranslate;
                    setSelectedPiece(null);
                    boardConfigRef.current.selected = "";
                    setIsSelect(false);
                  } else {
                    if (lastAnimation) {
                      lastAnimation.cancel();
                    }
                    if (lastAnimationRef.current) {
                      lastAnimationRef.current.cancel();
                    }
                    let moveOrCastle = [];
                    const resultCastle = tryAutoCastle(
                      fromSquare,
                      toSquare,
                      boardMapFuture.current
                    );
                    if (boardConfigRef.current.autoCastle && resultCastle.castle) {
                      moveOrCastle = [
                        resultCastle.move,
                        { from: "", to: "" },
                        { from: "", to: "" },
                        resultCastle.rookMove
                      ];
                    } else {
                      moveOrCastle = [{ from: fromSquare, to: toSquare }];
                    }
                    const captured = boardMapFuture.current.get(toSquare);
                    const capturedPiece = captured ? { color: captured.color, role: captured.role } : null;
                    moveOrCastle.forEach(
                      ({ from: fromSquare2, to: toSquare2, render }) => {
                        if (fromSquare2 !== "" && toSquare2 !== "") {
                          if (render !== false) {
                            movePieceOnBoard(fromSquare2, toSquare2, {
                              boardMap: boardMapFuture,
                              boardMapIndex: boardMapIndexFuture,
                              freeIndexes
                            });
                          }
                        }
                        boardMapCurrent.current = new Map(
                          boardMapFuture.current
                        );
                        boardMapIndexCurrent.current = new Map(
                          boardMapIndexFuture.current
                        );
                      }
                    );
                    (_f = (_e = boardConfigRef.current.events).move) == null ? void 0 : _f.call(
                      _e,
                      fromSquare,
                      toSquare,
                      capturedPiece
                    );
                    (_h = (_g = boardConfigRef.current.events).change) == null ? void 0 : _h.call(_g);
                    (_j = (_i = boardConfigRef.current.movable.events).after) == null ? void 0 : _j.call(
                      _i,
                      fromSquare,
                      toSquare
                    );
                    setSelectedPiece(null);
                    setIsSelect(false);
                    setLastMoveType("drag");
                    boardConfigRef.current.turnColor = boardConfigRef.current.turnColor === "white" ? "black" : "white";
                    boardConfigRef.current.movable.dests = /* @__PURE__ */ new Map();
                    boardConfigRef.current.premovable.dests = [];
                    boardConfigRef.current.selected = "";
                    boardConfigRef.current.check = "";
                    boardConfigRef.current.lastMove = [fromSquare, toSquare];
                    boardConfigRef.current.lastMove2 = ["", ""];
                    boardConfigRef.current.lastMove3 = ["", ""];
                    if (ghostRef.current) {
                      ghostRef.current.style.visibility = "hidden";
                      ghostRef.current.style.transform = toTranslate;
                    }
                  }
                }
              }
              pieceDiv.classList.remove("drag");
            }
          }
        }
      }
      setIsDragging(false);
    };
    const handleTouchStart = (event) => {
      handleMouseDown(event);
    };
    const handleTouchMove = (event) => {
      handleMouseMove(event);
    };
    const handleTouchEnd = () => {
      handleMouseUp();
    };
    const squareClasses = getSquareClasses(boardConfigRef, boardMapFuture);
    return /* @__PURE__ */ jsx("div", { id, className: "ljdr-wrap", children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: "ljdr-container",
        style: {
          width: `${boardConfigRef.current.squareSize * 8}px`,
          height: `${boardConfigRef.current.squareSize * 8}px`
        },
        children: [
          /* @__PURE__ */ jsxs(
            "div",
            {
              className: "ljdr-board",
              ref: boardRef,
              onMouseDown: (event) => handleMouseDown(event),
              onTouchStart: (event) => handleTouchStart(event),
              children: [
                Object.entries(squareClasses).map(([square, classNames]) => /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `ljdr-square ${classNames}`,
                    style: {
                      transform: notationToTranslate(
                        square,
                        boardConfigRef.current.squareSize,
                        boardConfigRef.current.orientation
                      )
                    }
                  },
                  square
                )),
                Array.from(boardMapIndexCurrent.current.entries()).map(
                  ([index2, piece]) => {
                    const { color, role, square } = piece;
                    if (!piece) return null;
                    const translate = notationToTranslate(
                      square,
                      boardConfigRef.current.squareSize,
                      boardConfigRef.current.orientation
                    );
                    return /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: `ljdr-piece ${color} ${role}`,
                        ref: (el) => {
                          if (el) {
                            pieceRefs.current[index2] = el;
                          } else {
                            delete pieceRefs.current[index2];
                          }
                        },
                        style: { transform: translate },
                        onMouseDown: (event) => handleMouseDown(event),
                        onTouchStart: (event) => handleTouchStart(event)
                      },
                      `${color}-${role}-${index2}`
                    );
                  }
                )
              ]
            }
          ),
          boardConfigRef.current.coordinates && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "coords ranks", ref: ranksRef, children: ranks.map((rank) => /* @__PURE__ */ jsx("div", { className: "coord", children: boardConfigRef.current.orientation === "white" ? rank : boardConfigRef.current.orientation === "black" ? 9 - rank : "" }, rank)) }),
            /* @__PURE__ */ jsx("div", { className: "coords files", ref: filesRef, children: files.map((file, index2) => /* @__PURE__ */ jsx("div", { className: "coord", children: boardConfigRef.current.orientation === "white" ? file : boardConfigRef.current.orientation === "black" ? files[7 - index2] : "" }, file)) })
          ] }),
          boardConfigRef.current.draggable.showGhost && /* @__PURE__ */ jsx(
            "div",
            {
              className: "ljdr-ghost",
              ref: ghostRef,
              style: {
                visibility: "hidden"
              }
            }
          ),
          boardConfigRef.current.animation.enabled && boardConfigRef.current.animation.type === "ghosts" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "ljdr-ghost-animate1",
                ref: ghostAnimateRef1,
                style: {
                  visibility: "hidden"
                }
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "ljdr-ghost-animate2",
                ref: ghostAnimateRef2,
                style: {
                  visibility: "hidden"
                }
              }
            ),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "ljdr-ghost-animate3",
                ref: ghostAnimateRef3,
                style: {
                  visibility: "hidden"
                }
              }
            )
          ] }),
          boardConfigRef.current.animation.enabled && boardConfigRef.current.animation.type === "warp" && /* @__PURE__ */ jsx(
            "div",
            {
              className: "ljdr-warp-animate",
              ref: warpAnimateRef,
              style: {
                visibility: "hidden"
              }
            }
          )
        ]
      }
    ) });
  }
);
const index = memo(ChessBoard);
export {
  index as ChessBoard
};
