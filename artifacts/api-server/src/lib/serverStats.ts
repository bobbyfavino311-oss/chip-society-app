// Lightweight mutable counters written by the sockets layer,
// read by the health/stats endpoint. No dependencies.

let _connections = 0;
let _rooms = 0;
let _players = 0;
const _startedAt = Date.now();

export const serverStats = {
  incConnections(): void { _connections++; },
  decConnections(): void { if (_connections > 0) _connections--; },
  setRoomStats(rooms: number, players: number): void {
    _rooms = rooms;
    _players = players;
  },
  snapshot() {
    return {
      connections: _connections,
      rooms: _rooms,
      activePlayers: _players,
      uptimeSeconds: Math.floor((Date.now() - _startedAt) / 1000),
    };
  },
};
