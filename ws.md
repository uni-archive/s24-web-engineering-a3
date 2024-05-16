# Artmart WebSocket Protocol

To facilitate real-time communication during the shared framing experience, the Artmart server offers a WebSocket protocol.

Clients connect to a WebSocket via one of two endpoints, depending on their role:

WebSocket Endpoint          | Client Role
----------------------------|------------
`/framing/shared/create`    | Host
`/framing/shared/join/{id}` | Guest

A host creates a shared framing session, while a guest can join an existing session. Every session has exactly one host and can have multiple guests. When the host leaves, the session is terminated for all clients.

After establishing a WebSocket connection, server and client communicate via JSON-encoded messages in the following format:

```json
{
  "op": <operation>,
  "data": <payload>
}
```

There are six possible operations:

Operation      | Direction             | Description
---------------|-----------------------|------------
`init`         | Host → Server         | Initiate a new session.
`ready`        | Host ← Server → Guest | The session is ready.
`update_state` | Host ↔ Server ↔ Guest | The framing state has changed.
`update_users` | Host ← Server → Guest | The list of active users has changed.
`done`         | Host → Server → Guest | The session has been terminated.
`error`        | Host ← Server → Guest | An error occurred.

## Session Lifecycle

### Host

1. The host opens a WebSocket to the `/framing/shared/create` endpoint.
2. The host sends an `init` message to the server with the initial framing state.
3. The server sends a `ready` message to the host which includes the session's shareable identifier. The host can now share the session identifier via third channels, allowing guests to join.
4. The server sends `update_state` and `update_users` messages to the host whenever the framing state or the list active users has changed.
5. The host sends `update_state` messages to the server whenever the framing changes.
6. The host sends a `done` message to the server when the framed artwork is put into the shopping cart. The session ends for all clients.

### Guest

1. After receiving a session identifier from a host, the guest opens a WebSocket to the `/framing/shared/join/{id}` endpoint.
2. The server sends a `ready` message to the guest, followed by `update_state` and `update_user` messages.
3. The server sends `update_state` and `update_users` messages to the guest whenever the framing state or the list of active users has changed.
4. The guest sends an `update_state` messages to the server whenever the framing changes.
5. The server sends a `done` message to the guest when session ends.

## `init`

Sent by the host to initiate the session. Contains the identifier of the artwork to be framed and the initial frame parameters.

```json
{
  "op": "init",
  "data": {
    "artworkId": 436085,
    "state": {
      "printSize": "M",
      "frameStyle": "classic",
      "frameWidth": 40,
      "matColor": "cerulean",
      "matWidth": 15  
    }      
  }
}
```

Field        | Type   | Description
-------------|--------|------------
`artworkId`  | number | Artwork identifier
`printSize`  | string | Size of the print. One of `S`, `M` or `L`.
`frameStyle` | string | One of the frame styles returned by `GET /frames`.
`frameWidth` | number | Frame width in millimeters, in the range [20, 50].
`matColor`   | string | One of the color names returned by `GET /mats`. *Optional, if `matWidth` is 0.*
`matWidth`   | number | Mat width in millimeters, in the range [0, 100].

## `ready`

Sent by the server to a client after they join or initialized a new session to indicate the session is ready for them. Includes the client's username.

```json
{
  "op": "ready",
  "data": {
    "sessionId": "Rwup456cUZuj53whxN-2n",
    "artworkId": 436085,
    "username": "Hilma"
  }
}
```

Field       | Type   | Description
------------|--------|------------
`sessionId` | string | Framing session identifier
`artworkId` | number | Artwork identifier
`username`  | string | Assigned display name for the client.

## `update_state`

An `update_state`  operation is either sent from the host or any client to the server or is broadcast from the server to any client to indicate that the frame parameters have changed

```json
{
  "op": "update_state",
  "data": {
    "printSize": "M",
    "frameStyle": "classic",
    "frameWidth": 40,
    "matColor": "cerulean",
    "matWidth": 15
  }
}
```

Field        | Type   | Description
-------------|--------|------------
`printSize`  | string | Size of the print. One of `S`, `M` or `L`.
`frameStyle` | string | One of the frame styles returned by `GET /frames`.
`frameWidth` | number | Frame width in millimeters, in the range [20, 50].
`matColor`   | string | One of the color names returned by `GET /mats`. *Optional, if `matWidth` is 0.*
`matWidth`   | number | Mat width in millimeters, in the range [0, 100].

## `update_users`

Sent by the server to all clients when the list of active users in the session has changed.

```json
{
  "op": "update_users",
  "data": {
    "usernames": ["Hilma","Michelangelo","Frida"]
  }
}
```

Field       | Type            | Description
------------|-----------------|------------
`usernames` | list of strings | Display names of all active users.

## `done`

Sent by the host to the server and by the server to all guests, to indicate the session has ended.

```json
{
  "op": "done",
  "data": {
    "success": true
  }
}
```

Field     | Type    | Description
----------|---------|------------
`success` | boolean | If `true`, the framing session has ended with the host putting the framed artwork into the shopping cart.

## `error`

Sent by the server when some error has occurred, e.g., a client has sent an invalid payload.

```json
{
  "op": "error",
  "data": {
    "message": "Invalid payload"
  }
}
```

Field     | Type   | Description
----------|--------|------------
`message` | string | An error message.
