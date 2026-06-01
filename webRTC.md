# Video Call (WebRTC) Flow

This document describes the video/voice call flow in the realtime chat platform. It covers both the client-side WebRTC signaling and server-side Socket.IO relay behavior.

## Overview

The app uses a hybrid architecture:

- WebRTC for peer-to-peer media transport.
- Socket.IO for signaling and call control.
- Redis for active call state and multi-instance coordination.

Call signaling is not handled by a separate signaling server; instead the existing Express + Socket.IO backend relays offer/answer/candidate packets and stores call metadata in Redis.

## Key components

### Client

- `client/hooks/useWebRTC.ts`
  - creates `RTCPeerConnection`
  - gathers local media
  - sends `webrtc:offer`, `webrtc:answer`, and `webrtc:ice_candidate`
  - handles remote track attachment and connection state

### Server

- `server/sockets/webrtc.handler.js`
  - relays signaling messages between peers
  - maintains `active_calls` metadata in Redis
  - checks busy state and emits `call:user_busy` if the target is already in a call

- `server/sockets/index.js`
  - joins sockets to `user_{userId}` rooms
  - emits pending incoming calls on reconnect
  - performs call cleanup on disconnect

## Call flow in words

1. Caller clicks start call.
2. Client obtains local media (`getUserMedia`) and creates a new `RTCPeerConnection`.
3. Client adds local audio/video tracks to the peer connection.
4. Client creates an SDP offer and sets it locally.
5. Client emits `webrtc:offer` to the server with:
   - `targetUserId`
   - `offer`
   - `callType` (`audio` or `video`)
   - `startedAt`
   - `conversationId`
6. Server receives `webrtc:offer`.
   - checks `active_calls` in Redis for the target user.
   - if target is busy, emits `call:user_busy` back to the caller and logs a missed call message.
   - otherwise, stores identical call metadata for both caller and callee in Redis under `active_calls`.
   - emits `call:incoming` to `user_{targetUserId}`.
7. Callee receives `call:incoming` and shows the incoming call UI.
8. When callee accepts:
   - client obtains local media and creates a new `RTCPeerConnection`.
   - local tracks are added.
   - client sets the remote description to the received offer.
   - client creates an SDP answer and sets it locally.
   - client emits `webrtc:answer` to the server.
9. Server receives `webrtc:answer`.
   - updates the stored call metadata for both users with `receiverSocketId`.
   - relays `webrtc:answer` to the caller via `user_{targetUserId}`.
10. Caller receives `webrtc:answer` and sets it as the remote description.
11. Both peers exchange ICE candidates.
    - each `RTCPeerConnection.onicecandidate` emits `webrtc:ice_candidate`.
    - server relays the candidate to the target user.
    - if the remote description is not yet set, candidates are queued locally until ready.
12. Once ICE completes and `connectionState` becomes `connected`, the call is established.
13. Media state updates such as mute/unmute or camera on/off are sent via `call:media_state`.

## Sequence diagram

```
Caller                          Server                        Callee
  |                               |                              |
  |-- create offer -------------->|                              |
  |                               |-- store active_calls ------->|
  |                               |-- emit call:incoming ------->|
  |                               |                              |
  |<-- call:incoming -------------|                              |
  |                               |                              |
  |-- accept call --------------->|                              |
  |                               |-- relay webrtc:answer ----->|
  |                               |                              |
  |<-- webrtc:answer ------------|                              |
  |                               |                              |
  |-- ice_candidate ----------->|                              |
  |                               |-- emit webrtc:ice_candidate ->|
  |                               |                              |
  |<-- ice_candidate ------------|                              |
  |                               |                              |
  |-- connected ----------------->|                              |
  |                               |                              |
```

## Redis active call metadata

The server uses a Redis hash called `active_calls`.

- Key: userId
- Value: JSON string with call metadata

Stored metadata includes:

- `callerId`
- `callerSocketId`
- `receiverSocketId`
- `partnerId`
- `conversationId`
- `callType`
- `startTime`
- `offer`

This enables:

- detecting busy users
- resuming pending incoming calls on reconnect
- cleaning up call state when a user disconnects

## Special cases and cleanup

- Busy user
  - If `targetUserId` already exists in `active_calls`, the caller is immediately notified with `call:user_busy`.
  - A missed call message is logged for the conversation.

- Reconnect / pending call
  - When a socket connects, the server checks Redis for an existing pending call record.
  - If a pending incoming call exists, it emits `call:incoming` again.

- Disconnect cleanup
  - On disconnect, the server removes the socket from `online_user:{userId}`.
  - If no sockets remain for the user, it removes the user from `online_users`.
  - If the disconnected socket was part of an active call, `handleCallCleanup` is triggered.

## Media permissions and device access

- Permission logic is implemented entirely on the client in `client/hooks/useWebRTC.ts`.
- The server does not directly manage camera or microphone access.
- The client requests media with `navigator.mediaDevices.getUserMedia()`:
  - audio is required for all calls.
  - video is requested only for `video` call type.
- If access is denied or no device is found, the hook catches the error and sets call state flags:
  - `hasAudioPermission`
  - `hasVideoPermission`
  - `isCameraUnavailable`
- Permission errors are converted into user-friendly messages for:
  - `NotAllowedError` / `PermissionDeniedError`
  - `NotFoundError` / `DevicesNotFoundError`
- The hook also listens for runtime media device and permission changes:
  - `navigator.mediaDevices.devicechange`
  - permission status changes for `camera` and `microphone`
- If a track ends or permission changes during a call, the client attempts media recovery and updates the UI state.

## Notes

- Signaling is handled through Socket.IO events, not directly through WebRTC.
- Media flows peer-to-peer via WebRTC once the session is established.
- Redis acts as the shared state store so multiple server instances can coordinate call state.
- `user_{userId}` rooms are used for targeted events across sockets and instances.
