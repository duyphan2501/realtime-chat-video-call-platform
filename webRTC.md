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
  - gathers local media
  - creates `RTCPeerConnection`
  - sends `webrtc:offer`, `webrtc:answer`, and `webrtc:ice_candidate`
  - handles remote track attachment and connection state
  - owns the active peer connection with an instance guard so duplicate hook mounts do not process the same answer/ICE packet

- `client/hooks/handlers/useCallHandlers.ts`
  - handles `call:incoming`, `call:ended`, `call:rejected`, and media-state events
  - ignores stale terminal events by comparing the event `startedAt` with the active call `ringStartedAt`

- `client/components/call/VideoCall.tsx`
  - renders the active/waiting call UI
  - auto-cancels caller-side unanswered calls after the ring timeout
  - guards delayed terminal resets so an old missed call cannot reset a new callback call

- `client/store/message.store.ts`
  - merges duplicate optimistic/socket messages
  - dedupes identical call-log messages emitted close together

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
2. Client obtains local media (`getUserMedia`).
3. Client creates a new `RTCPeerConnection`.
4. Client adds local audio/video tracks to the peer connection.
5. Client creates an SDP offer and sets it locally.
6. Client emits `webrtc:offer` to the server with:
   - `targetUserId`
   - `offer`
   - `callType` (`audio` or `video`)
   - `startedAt`
   - `conversationId`
7. Server receives `webrtc:offer`.
   - checks `active_calls` in Redis for the target user.
   - if target is busy, emits `call:user_busy` back to the caller and logs a missed call message.
   - otherwise, stores identical call metadata for both caller and callee in Redis under `active_calls`.
   - emits `call:incoming` to `user_{targetUserId}`.
8. Callee receives `call:incoming` and shows the incoming call UI.
9. When callee accepts:
   - client obtains local media and creates a new `RTCPeerConnection`.
   - local tracks are added.
   - client sets the remote description to the received offer.
   - client creates an SDP answer and sets it locally.
   - client emits `webrtc:answer` to the server.
10. Server receives `webrtc:answer`.
   - updates the stored call metadata for both users with `receiverSocketId`.
   - relays `webrtc:answer` to the caller via `user_{targetUserId}`.
11. Caller receives `webrtc:answer` and sets it as the remote description.
12. Both peers exchange ICE candidates.
    - each `RTCPeerConnection.onicecandidate` emits `webrtc:ice_candidate`.
    - server relays the candidate to the target user.
    - if the remote description is not yet set, candidates are queued locally until ready.
13. Once ICE completes and `connectionState` becomes `connected`, the call is established.
14. Media state updates such as mute/unmute or camera on/off are sent via `call:media_state`.

`RTCPeerConnection` is created after local media is acquired. This avoids a race where a shared cleanup path closes the connection while the browser is still resolving camera/microphone access.

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

The server also uses short-lived Redis lock keys for terminal call processing:

- Key: `call_end_lock:{callerId}:{startTime}`
- Value: `"1"` with a short expiry

This prevents both peers from writing duplicate missed/ended call messages if caller auto-cancel and callee auto-decline happen at nearly the same time.

## Special cases and cleanup

- Busy user
  - If `targetUserId` already exists in `active_calls`, the caller is immediately notified with `call:user_busy`.
  - A missed call message is logged for the conversation.

- No answer / caller cancel
  - Caller-side waiting calls auto-cancel after the ring timeout if the call is still in `calling` state and has no `startTime`.
  - Manual end during the unanswered waiting phase is treated as `missed`.
  - Callee-side auto-decline calls `/api/calls/reject` with `status: "missed"` before resetting local state.
  - The server emits terminal events with `startedAt`; clients ignore terminal events whose `startedAt` does not match the active call `ringStartedAt`.
  - Delayed UI reset timers check the active call identity before resetting, so an old missed call cannot immediately end a new Call Back attempt.

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

## ICE / TURN configuration

`client/hooks/useWebRTC.ts` always includes public STUN servers. For calls between a phone and a PC on different networks, STUN is often not enough because some NAT/firewall combinations cannot create a direct peer-to-peer path. In that case the call needs a TURN relay.

Optional client environment variables:

```env
NEXT_PUBLIC_TURN_URLS=turn:turn.example.com:3478,turns:turn.example.com:5349
NEXT_PUBLIC_TURN_USERNAME=your-turn-username
NEXT_PUBLIC_TURN_CREDENTIAL=your-turn-password
NEXT_PUBLIC_FORCE_TURN=false
```

Use `NEXT_PUBLIC_FORCE_TURN=true` only for debugging relay connectivity; it forces WebRTC to use TURN instead of trying direct candidates first.
