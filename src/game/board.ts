import { Board, Cell, CellStatus, Coordinates, Ship } from './types';

const createEmptyCell = (x: number, y: number): Cell => ({
  coordinates: { x, y },
  status: 'empty',
});

const cloneBoard = (board: Board): Board => ({
  size: board.size,
  cells: board.cells.map((row) => row.map((cell) => ({ ...cell }))),
  ships: board.ships.map((ship) => ({
    ...ship,
    coordinates: ship.coordinates.map((coord) => ({ ...coord })),
  })),
});

const isWithinBounds = (board: Board, { x, y }: Coordinates): boolean =>
  x >= 0 && y >= 0 && x < board.size && y < board.size;

const getCellStatus = (board: Board, coords: Coordinates): CellStatus | null => {
  if (!isWithinBounds(board, coords)) return null;
  return board.cells[coords.y][coords.x].status;
};

export const createEmptyBoard = (size: number): Board => {
  const cells: Cell[][] = [];
  for (let y = 0; y < size; y += 1) {
    const row: Cell[] = [];
    for (let x = 0; x < size; x += 1) {
      row.push(createEmptyCell(x, y));
    }
    cells.push(row);
  }

  return {
    size,
    cells,
    ships: [],
  };
};

export const canPlaceShipAt = (board: Board, coordinates: Coordinates[]): boolean =>
  coordinates.every((coord) =>
    isWithinBounds(board, coord) && getCellStatus(board, coord) === 'empty',
  );

export const placeShipAt = (board: Board, ship: Ship, coordinates: Coordinates[]): Board => {
  const next = cloneBoard(board);

  const placedShip: Ship = {
    ...ship,
    coordinates: coordinates.map((coord) => ({ ...coord })),
  };

  next.ships = [...next.ships, placedShip];

  coordinates.forEach(({ x, y }) => {
    const cell = next.cells[y][x];
    cell.status = 'ship';
    cell.shipId = ship.id;
  });

  return next;
};

export const placeShipRandomly = (board: Board, ship: Ship): Board => {
  const maxAttempts = board.size * board.size * 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;
    const horizontal = Math.random() < 0.5;

    const maxX = horizontal ? board.size - ship.length : board.size - 1;
    const maxY = horizontal ? board.size - 1 : board.size - ship.length;

    if (maxX < 0 || maxY < 0) {
      break;
    }

    const startX = Math.floor(Math.random() * (maxX + 1));
    const startY = Math.floor(Math.random() * (maxY + 1));

    const coordinates: Coordinates[] = [];
    for (let i = 0; i < ship.length; i += 1) {
      coordinates.push(
        horizontal
          ? { x: startX + i, y: startY }
          : { x: startX, y: startY + i },
      );
    }

    if (canPlaceShipAt(board, coordinates)) {
      return placeShipAt(board, ship, coordinates);
    }
  }

  throw new Error(`Unable to place ship '${ship.id}' on board of size ${board.size}`);
};

export const placeFleetRandomly = (board: Board, ships: Ship[]): Board =>
  ships.reduce((accBoard, ship) => placeShipRandomly(accBoard, ship), board);

export const receiveAttack = (
  board: Board,
  target: Coordinates,
): { board: Board; hit: boolean; sunkShip?: Ship } => {
  if (!isWithinBounds(board, target)) {
    return { board, hit: false };
  }

  const currentStatus = getCellStatus(board, target);

  if (currentStatus === 'hit' || currentStatus === 'miss') {
    return { board, hit: currentStatus === 'hit' };
  }

  const next = cloneBoard(board);
  const cell = next.cells[target.y][target.x];

  if (cell.status === 'ship' && cell.shipId) {
    cell.status = 'hit';

    const shipIndex = next.ships.findIndex((s) => s.id === cell.shipId);
    if (shipIndex === -1) {
      return { board: next, hit: true };
    }

    const ship = next.ships[shipIndex];
    const updatedShip: Ship = {
      ...ship,
      hits: ship.hits + 1,
    };

    next.ships = [
      ...next.ships.slice(0, shipIndex),
      updatedShip,
      ...next.ships.slice(shipIndex + 1),
    ];

    const sunk = updatedShip.hits >= updatedShip.length;
    return sunk
      ? { board: next, hit: true, sunkShip: updatedShip }
      : { board: next, hit: true };
  }

  cell.status = 'miss';
  return { board: next, hit: false };
};

export const allShipsSunk = (board: Board): boolean =>
  board.ships.length > 0 && board.ships.every((ship) => ship.hits >= ship.length);
