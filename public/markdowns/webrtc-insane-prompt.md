# 🔥 THE WEBRTC GAUNTLET — MASTER IT BY BUILDING IT

> **Stack:** Node.js · TypeScript · pnpm
> **Vibe:** Zero hand-holding. Code first. Break things. Fix things. Own it.

---

## 🗺️ ROADMAP AT A GLANCE

| Phase | What You Build | APIs You'll Touch |
|---|---|---|
| 1 | Signaling Server | WebSocket, Node.js |
| 2 | First RTCPeerConnection | RTCPeerConnection, SDP, Perfect Negotiation |
| 3 | Full Mesh Room | Multi-peer orchestration |
| 4 | Chat + File Transfer | RTCDataChannel, bufferedAmountLowThreshold |
| 5 | Screen Share | getDisplayMedia, replaceTrack |
| 6 | ICE / STUN / TURN | ICE candidates, coturn |
| 7 | Transceiver Control | RTCRtpTransceiver, direction management |
| 8 | Adaptive Bitrate | RTCRtpSender.setParameters, simulcast |
| 9 | Connection State Machine | restartIce, exponential backoff |
| 10 | Insertable Streams | MediaStreamTrackProcessor, TrackGenerator |
| 11 | Stats Dashboard | getStats(), inbound/outbound-rtp |
| 12 | Recording | MediaRecorder, codec selection |
| 13 | Final Boss | SDP munging, E2EE, TURN health check, visibility |

---

## 🧠 WHAT IS WEBRTC — IN 60 SECONDS (then we never look back)

WebRTC (Web Real-Time Communication) is a browser API + protocol suite that lets two peers **talk directly to each other** — audio, video, data — without a server in the middle (after the initial handshake).

Three things make it work:
- **Signaling** — peers exchange metadata (via YOUR server, WebRTC doesn't care how)
- **ICE / STUN / TURN** — punches through NAT/firewalls to find a real network path
- **DTLS + SRTP** — encrypts everything, always, non-negotiable

That's it. Everything else is just these three ideas getting complicated. Now let's build.

---

## 🏗️ THE PROJECT: `FullMesh` — A Browser-Based P2P Collaboration Room

You're building a **multi-peer video/audio/data room** from absolute scratch. No libraries that hide WebRTC from you. No shortcuts.

By the end, your app will have:
- Multi-peer video/audio calls (full mesh topology)
- Real-time peer-to-peer chat (DataChannel)
- File transfer between peers (DataChannel binary)
- Screen sharing with dynamic track replacement
- RTCRtpTransceiver direction control (sendonly / recvonly / inactive)
- Adaptive bitrate + simulcast
- ICE restart state machine with exponential backoff
- Insertable Streams (real-time video filters, blur, E2EE hooks)
- Connection state observability dashboard
- TURN server integration + health check
- Recording via MediaRecorder
- Stats API visualization
- Page visibility handling (auto-pause tracks in background)

---

## 📁 REPO STRUCTURE — SET THIS UP FIRST

```
fullmesh/
├── apps/
│   ├── server/          # Node.js signaling server (TypeScript)
│   └── client/          # Vanilla TS frontend (no framework — raw WebRTC)
├── packages/
│   └── shared/          # Shared types between server and client
├── pnpm-workspace.yaml
└── turbo.json           # optional, your call
```

```bash
mkdir fullmesh && cd fullmesh
pnpm init
mkdir -p apps/server apps/client/src/features packages/shared/src
```

`pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## PHASE 1 — SIGNALING SERVER
### 🎯 Concept: WebRTC is peer-to-peer but peers need to FIND each other first

The signaling server is a dumb message relay. It passes **SDP offers/answers** and **ICE candidates** between peers. Once peers are connected, your server is completely out of the picture. It doesn't touch your media. It doesn't know your video codec. It just routes JSON.

### 🔨 BUILD IT

```bash
cd apps/server
pnpm init
pnpm add ws typescript tsx @types/ws @types/node
```

`apps/server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

`packages/shared/src/types.ts` — define ALL signal message types here:
```typescript
export type SignalType =
  | 'join'
  | 'user-joined'
  | 'user-left'
  | 'room-state'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'error';

export interface SignalMessage {
  type: SignalType;
  from?: string;
  to?: string;       // undefined = broadcast
  roomId?: string;
  payload?: unknown;
}

export interface RoomState {
  peers: string[];   // peer IDs already in room
}
```

`apps/server/src/index.ts`:
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { SignalMessage } from '@fullmesh/shared';

const PORT = 8080;
const wss = new WebSocketServer({ port: PORT });

// roomId -> Map<peerId, WebSocket>
const rooms = new Map<string, Map<string, WebSocket>>();

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

function broadcast(room: Map<string, WebSocket>, message: SignalMessage, excludeId?: string) {
  const data = JSON.stringify(message);
  room.forEach((ws, peerId) => {
    if (peerId !== excludeId && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

function sendTo(room: Map<string, WebSocket>, targetId: string, message: SignalMessage) {
  const ws = room.get(targetId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  let myId: string | null = null;
  let myRoom: string | null = null;

  ws.on('message', (raw) => {
    let msg: SignalMessage;
    try { msg = JSON.parse(raw.toString()); }
    catch { return; }

    if (msg.type === 'join') {
      myId = generateId();
      myRoom = msg.roomId ?? 'default';

      if (!rooms.has(myRoom)) rooms.set(myRoom, new Map());
      const room = rooms.get(myRoom)!;

      // Tell the new peer who's already here
      ws.send(JSON.stringify({
        type: 'room-state',
        from: 'server',
        payload: { peerId: myId, peers: [...room.keys()] }
      } satisfies SignalMessage));

      // Tell existing peers someone joined
      broadcast(room, { type: 'user-joined', from: myId, payload: { peerId: myId } });

      room.set(myId, ws);
      console.log(`[${myRoom}] ${myId} joined. Total: ${room.size}`);
      return;
    }

    if (!myId || !myRoom) return;
    const room = rooms.get(myRoom);
    if (!room) return;

    // Relay offer / answer / ice-candidate to target peer
    if (msg.type === 'offer' || msg.type === 'answer' || msg.type === 'ice-candidate') {
      if (msg.to) sendTo(room, msg.to, { ...msg, from: myId });
    }
  });

  ws.on('close', () => {
    if (!myId || !myRoom) return;
    const room = rooms.get(myRoom);
    if (!room) return;
    room.delete(myId);
    broadcast(room, { type: 'user-left', from: myId, payload: { peerId: myId } });
    console.log(`[${myRoom}] ${myId} left. Total: ${room.size}`);
    if (room.size === 0) rooms.delete(myRoom);
  });
});

console.log(`Signaling server → ws://localhost:${PORT}`);
```

Run: `pnpm tsx src/index.ts`

**🔬 CHECKPOINT:** Open two browser tabs. Connect both via `new WebSocket('ws://localhost:8080')`. Send a `join` message from each. Console-log every message both ways. Confirm `room-state`, `user-joined`, `user-left` all fire correctly. **Do not touch RTCPeerConnection until this works perfectly.**

---

## PHASE 2 — YOUR FIRST RTCPeerConnection
### 🎯 Concept: SDP — the contract between two peers

SDP (Session Description Protocol) is an ugly text blob describing what a peer **can and wants to do** — codecs, resolution, bandwidth, directions. An **offer** is "here's what I support", an **answer** is "here's what I'll accept".

The **perfect negotiation pattern** is the modern, correct way. It prevents **glare** — the situation where both peers send offers simultaneously and get confused. One peer is **polite** (backs off), one is **impolite** (holds its ground). The newcomer to a room is always polite.

### 🔨 BUILD IT

`apps/client/src/peer-connection.ts`:
```typescript
import { SignalMessage } from '@fullmesh/shared';

export type SendSignal = (msg: Omit<SignalMessage, 'from'>) => void;

export class PeerConnection {
  private pc: RTCPeerConnection;
  private makingOffer = false;
  private ignoreOffer = false;

  public onTrack?: (event: RTCTrackEvent) => void;
  public onDataChannel?: (channel: RTCDataChannel) => void;
  public onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  public onIceStateChange?: (state: RTCIceConnectionState) => void;

  constructor(
    public readonly remotePeerId: string,
    private localStream: MediaStream,
    private sendSignal: SendSignal,
    private isPolite: boolean
  ) {
    this.pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // TURN added in Phase 6
      ]
    });

    this.setupLocalTracks();
    this.setupNegotiation();
    this.setupICE();
    this.setupTrackHandling();
  }

  private setupLocalTracks() {
    for (const track of this.localStream.getTracks()) {
      this.pc.addTrack(track, this.localStream);
    }
  }

  private setupNegotiation() {
    // Perfect negotiation — fires whenever tracks are added/removed
    this.pc.onnegotiationneeded = async () => {
      try {
        this.makingOffer = true;
        await this.pc.setLocalDescription(); // browser auto-creates offer
        this.sendSignal({
          type: 'offer',
          to: this.remotePeerId,
          payload: { sdp: this.pc.localDescription }
        });
      } catch (err) {
        console.error('onnegotiationneeded error:', err);
      } finally {
        this.makingOffer = false;
      }
    };
  }

  private setupICE() {
    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          to: this.remotePeerId,
          payload: { candidate }
        });
      }
    };

    // Print every state change — you WILL need this for debugging
    this.pc.oniceconnectionstatechange = () => {
      console.log(`[${this.remotePeerId}] ICE:`, this.pc.iceConnectionState);
      this.onIceStateChange?.(this.pc.iceConnectionState);
    };

    this.pc.onicegatheringstatechange = () => {
      console.log(`[${this.remotePeerId}] Gathering:`, this.pc.iceGatheringState);
    };

    this.pc.onconnectionstatechange = () => {
      console.log(`[${this.remotePeerId}] Connection:`, this.pc.connectionState);
      this.onConnectionStateChange?.(this.pc.connectionState);
    };

    this.pc.onsignalingstatechange = () => {
      console.log(`[${this.remotePeerId}] Signaling:`, this.pc.signalingState);
    };
  }

  private setupTrackHandling() {
    this.pc.ontrack = (event) => this.onTrack?.(event);
    this.pc.ondatachannel = (event) => this.onDataChannel?.(event.channel);
  }

  async handleSignal(msg: SignalMessage) {
    if (msg.type === 'offer') {
      const offerSdp = (msg.payload as any).sdp as RTCSessionDescriptionInit;
      const offerCollision = this.makingOffer || this.pc.signalingState !== 'stable';

      this.ignoreOffer = !this.isPolite && offerCollision;
      if (this.ignoreOffer) return; // impolite peer ignores colliding offer

      await this.pc.setRemoteDescription(offerSdp);
      await this.pc.setLocalDescription(); // auto-creates answer
      this.sendSignal({
        type: 'answer',
        to: this.remotePeerId,
        payload: { sdp: this.pc.localDescription }
      });
    }

    if (msg.type === 'answer') {
      const answerSdp = (msg.payload as any).sdp as RTCSessionDescriptionInit;
      if (this.pc.signalingState !== 'stable') {
        await this.pc.setRemoteDescription(answerSdp);
      }
    }

    if (msg.type === 'ice-candidate') {
      const candidate = (msg.payload as any).candidate as RTCIceCandidateInit;
      try {
        await this.pc.addIceCandidate(candidate);
      } catch (err) {
        if (!this.ignoreOffer) console.error('ICE candidate error:', err);
      }
    }
  }

  createDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
    return this.pc.createDataChannel(label, options);
  }

  getRawPC(): RTCPeerConnection { return this.pc; }

  close() { this.pc.close(); }
}
```

**🔬 CHECKPOINT:** Get two tabs showing each other's camera. Print `this.pc.localDescription?.sdp` to the console. Find the `m=video` section. Find `a=rtpmap` (codec list). Find `a=candidate` lines (ICE). Read it. You should know what you're looking at by the end of Phase 6.

---

## PHASE 3 — FULL MESH ROOM MANAGER
### 🎯 Concept: N peers = N*(N-1)/2 direct connections

4 people = 6 connections. 6 people = 15. This is why real apps use SFU servers beyond ~6 peers — but building mesh first is how you *understand* why SFUs exist. Do not skip this.

`apps/client/src/room.ts`:
```typescript
import { SignalMessage, RoomState } from '@fullmesh/shared';
import { PeerConnection } from './peer-connection';

export class Room {
  private ws: WebSocket;
  public myId: string | null = null;
  private peers = new Map<string, PeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private localStream!: MediaStream;

  public onPeerAdded?: (peerId: string, stream: MediaStream) => void;
  public onPeerRemoved?: (peerId: string) => void;
  public onData?: (fromPeerId: string, data: string | ArrayBuffer) => void;

  constructor(private signalingUrl: string, private roomId: string) {
    this.ws = new WebSocket(signalingUrl);
    this.ws.onopen = () => this.send({ type: 'join', roomId: this.roomId });
    this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
    this.ws.onerror = (err) => console.error('WS error:', err);
  }

  async init(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, frameRate: 30 },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    return this.localStream;
  }

  private send(msg: Omit<SignalMessage, 'from'>) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private handleMessage(msg: SignalMessage) {
    switch (msg.type) {
      case 'room-state': {
        const state = msg.payload as RoomState & { peerId: string };
        this.myId = state.peerId;
        // Connect to everyone already in the room — we are polite (newcomer)
        state.peers.forEach(peerId => this.createPC(peerId, true));
        break;
      }
      case 'user-joined': {
        const { peerId } = msg.payload as { peerId: string };
        if (peerId !== this.myId) {
          // They joined after us — we are impolite (established peer)
          this.createPC(peerId, false);
        }
        break;
      }
      case 'user-left': {
        const { peerId } = msg.payload as { peerId: string };
        this.removePeer(peerId);
        break;
      }
      case 'offer':
      case 'answer':
      case 'ice-candidate': {
        this.peers.get(msg.from!)?.handleSignal(msg);
        break;
      }
    }
  }

  private createPC(remotePeerId: string, isPolite: boolean) {
    if (this.peers.has(remotePeerId)) return;

    const pc = new PeerConnection(
      remotePeerId,
      this.localStream,
      (msg) => this.send(msg),
      isPolite
    );

    pc.onTrack = (event) => {
      const [stream] = event.streams;
      this.onPeerAdded?.(remotePeerId, stream);
    };

    // Connection state machine handled in Phase 9
    pc.onConnectionStateChange = (state) => {
      console.log(`[${remotePeerId}] state: ${state}`);
    };

    // DataChannel: only the impolite peer creates it (one side only!)
    if (!isPolite) {
      const channel = pc.createDataChannel('main', { ordered: true });
      this.wireDataChannel(remotePeerId, channel);
    } else {
      pc.onDataChannel = (channel) => this.wireDataChannel(remotePeerId, channel);
    }

    this.peers.set(remotePeerId, pc);
  }

  private wireDataChannel(peerId: string, channel: RTCDataChannel) {
    this.dataChannels.set(peerId, channel);
    channel.onopen = () => console.log(`DC open: ${peerId}`);
    channel.onmessage = (e) => this.onData?.(peerId, e.data);
    channel.onclose = () => this.dataChannels.delete(peerId);
  }

  private removePeer(peerId: string) {
    this.peers.get(peerId)?.close();
    this.peers.delete(peerId);
    this.dataChannels.delete(peerId);
    this.onPeerRemoved?.(peerId);
  }

  sendToAll(data: string) {
    this.dataChannels.forEach(ch => {
      if (ch.readyState === 'open') ch.send(data);
    });
  }

  sendToPeer(peerId: string, data: string | ArrayBuffer) {
    const ch = this.dataChannels.get(peerId);
    if (ch?.readyState === 'open') ch.send(data as string);
  }

  getLocalStream() { return this.localStream; }
  getPeers() { return this.peers; }
  getDataChannels() { return this.dataChannels; }
}
```

**🔬 CHECKPOINT:** Three browser tabs, all in the same room. All three see each other's cameras. Watch the console — you should see 3 ICE connections established (A↔B, A↔C, B↔C).

---

## PHASE 4 — DATA CHANNELS: CHAT + FILE TRANSFER
### 🎯 Concept: RTCDataChannel is SCTP under the hood — you pick the delivery guarantees

- Chat → `{ ordered: true }` — like TCP, delivery guaranteed
- Game state → `{ ordered: false, maxRetransmits: 0 }` — like UDP, fire and forget
- File chunks → `{ ordered: true }` but you MUST handle backpressure manually

### 🔨 CHAT

`apps/client/src/features/chat.ts`:
```typescript
export interface ChatMessage {
  type: 'chat';
  from: string;
  text: string;
  timestamp: number;
}

export class ChatManager {
  constructor(
    private room: { sendToAll: (data: string) => void; myId: string | null }
  ) {}

  send(text: string) {
    const msg: ChatMessage = {
      type: 'chat',
      from: this.room.myId ?? 'unknown',
      text,
      timestamp: Date.now()
    };
    this.room.sendToAll(JSON.stringify(msg));
    return msg; // so the local UI can render it immediately
  }
}
```

### 🔨 FILE TRANSFER (the hard part — backpressure matters)

`apps/client/src/features/file-transfer.ts`:
```typescript
const CHUNK_SIZE = 64 * 1024; // 64KB per chunk

export interface FileMetadata {
  transferId: string;
  name: string;
  size: number;
  type: string;
  totalChunks: number;
}

export class FileTransfer {
  private incoming = new Map<string, {
    meta: FileMetadata;
    chunks: ArrayBuffer[];
    received: number;
  }>();

  onProgress?: (transferId: string, received: number, total: number) => void;
  onComplete?: (transferId: string, file: File) => void;

  // ─── SENDING ───────────────────────────────────────────────────
  async sendFile(file: File, channel: RTCDataChannel) {
    const transferId = crypto.randomUUID();
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Step 1: send metadata
    channel.send(JSON.stringify({
      type: 'file-meta',
      payload: { transferId, name: file.name, size: file.size, type: file.type, totalChunks }
    }));

    // Step 2: send chunks, respecting buffer limits
    for (let i = 0; i < totalChunks; i++) {
      const blob = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkBuffer = await blob.arrayBuffer();

      // Wait if channel is backed up
      if (channel.bufferedAmount > CHUNK_SIZE * 8) {
        await new Promise<void>(resolve => {
          channel.bufferedAmountLowThreshold = CHUNK_SIZE * 2;
          channel.onbufferedamountlow = () => {
            channel.onbufferedamountlow = null;
            resolve();
          };
        });
      }

      // Pack: header (JSON + newline) + binary chunk
      const header = new TextEncoder().encode(
        JSON.stringify({ type: 'file-chunk', transferId, index: i }) + '\n'
      );
      const packet = new Uint8Array(header.byteLength + chunkBuffer.byteLength);
      packet.set(header, 0);
      packet.set(new Uint8Array(chunkBuffer), header.byteLength);
      channel.send(packet.buffer);

      this.onProgress?.(transferId, i + 1, totalChunks);
    }

    // Step 3: signal end
    channel.send(JSON.stringify({ type: 'file-end', transferId }));
  }

  // ─── RECEIVING ─────────────────────────────────────────────────
  handleMessage(data: string | ArrayBuffer) {
    if (typeof data === 'string') {
      const msg = JSON.parse(data);

      if (msg.type === 'file-meta') {
        this.incoming.set(msg.payload.transferId, {
          meta: msg.payload,
          chunks: new Array(msg.payload.totalChunks),
          received: 0
        });
      }

      if (msg.type === 'file-end') {
        const transfer = this.incoming.get(msg.transferId);
        if (!transfer) return;
        const blob = new Blob(transfer.chunks, { type: transfer.meta.type });
        this.onComplete?.(msg.transferId, new File([blob], transfer.meta.name));
        this.incoming.delete(msg.transferId);
      }
      return;
    }

    // Binary — split header from chunk data
    const view = new Uint8Array(data as ArrayBuffer);
    const nl = view.indexOf(10); // '\n'
    const header = JSON.parse(new TextDecoder().decode(view.slice(0, nl)));
    const chunkData = (data as ArrayBuffer).slice(nl + 1);

    const transfer = this.incoming.get(header.transferId);
    if (!transfer) return;
    transfer.chunks[header.index] = chunkData;
    transfer.received++;
    this.onProgress?.(header.transferId, transfer.received, transfer.meta.totalChunks);
  }
}
```

**🔬 CHECKPOINT:** Transfer a 100MB file. Watch `channel.bufferedAmount` spike in DevTools. Understand why the `bufferedAmountLowThreshold` check exists. Remove it and watch things break.

---

## PHASE 5 — SCREEN SHARING + DYNAMIC TRACK REPLACEMENT
### 🎯 Concept: replaceTrack() swaps media mid-call with ZERO renegotiation

The `RTCRtpSender.replaceTrack()` API is elegant — it swaps the underlying track without tearing down the connection or triggering a new offer/answer cycle. The remote peer's `<video>` just... changes.

`apps/client/src/features/screen-share.ts`:
```typescript
export class ScreenShare {
  private screenStream: MediaStream | null = null;
  private videoSender: RTCRtpSender | null = null;
  private originalTrack: MediaStreamTrack | null = null;

  constructor(private getPCs: () => Map<string, { getRawPC(): RTCPeerConnection }>) {}

  async start(): Promise<MediaStream> {
    this.screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: 'monitor', frameRate: 30 },
      audio: true // system audio if available
    });

    const screenTrack = this.screenStream.getVideoTracks()[0];

    // Replace on ALL peer connections simultaneously
    for (const [, pc] of this.getPCs()) {
      const sender = pc.getRawPC().getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        if (!this.videoSender) {
          this.videoSender = sender;
          this.originalTrack = sender.track;
        }
        await sender.replaceTrack(screenTrack); // no renegotiation!
      }
    }

    // Handle user clicking "Stop sharing" in the browser's own UI
    screenTrack.onended = () => this.stop();

    return this.screenStream;
  }

  async stop() {
    if (this.originalTrack && this.videoSender) {
      for (const [, pc] of this.getPCs()) {
        const sender = pc.getRawPC().getSenders().find(s => s.track?.kind === 'video');
        if (sender) await sender.replaceTrack(this.originalTrack);
      }
    }
    this.screenStream?.getTracks().forEach(t => t.stop());
    this.screenStream = null;
  }

  isSharing() { return !!this.screenStream; }
}
```

**🔬 EXPERIMENT:** Call `replaceTrack(null)`. What happens on the remote side? Try replacing a video sender with an audio track. Read the error. Know your constraints.

---

## PHASE 6 — ICE, STUN & TURN
### 🎯 Concept: Why your app works on localhost but fails in the real world

STUN = tells your peer its own public IP (can't relay media).
TURN = relays your media through a server when direct path is impossible (symmetric NAT, corporate firewall).

Without TURN, ~15-20% of real-world connections silently fail. Build it anyway and then add TURN.

### ICE Candidate Types — Know All Three

```typescript
this.pc.onicecandidate = ({ candidate }) => {
  if (candidate) {
    // 'host'  = your local network IP (192.168.x.x)
    // 'srflx' = your public IP via STUN (server-reflexive)
    // 'relay' = TURN relay address (last resort, always works)
    console.log('Type:', candidate.type);
    console.log('Protocol:', candidate.protocol); // udp | tcp
    console.log('Address:', candidate.address);
    console.log('Port:', candidate.port);
  } else {
    // null candidate = gathering complete
    console.log('Full local SDP with candidates:');
    console.log(this.pc.localDescription?.sdp);
  }
};
```

### Run Your Own TURN Server

```bash
docker run -d --network=host coturn/coturn \
  -n --log-file=stdout \
  --min-port=49152 --max-port=65535 \
  --lt-cred-mech \
  --user=fullmesh:secret \
  --realm=fullmesh.local
```

Add to your PeerConnection config:
```typescript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:localhost:3478',
    username: 'fullmesh',
    credential: 'secret'
  }
]
```

### Force TURN-Only (Test Your Server)

```typescript
const pc = new RTCPeerConnection({
  iceServers: [{ urls: 'turn:...', username: '...', credential: '...' }],
  iceTransportPolicy: 'relay' // ONLY relay — proves TURN works
});
```

**🔬 CHECKPOINT:** Open `chrome://webrtc-internals` while on a call. Find the active candidate pair. Confirm it shows `relay` when on a restricted network. Compare RTT vs a direct `host` connection.

---

## PHASE 7 — TRANSCEIVER DIRECTION CONTROL
### 🎯 Concept: RTCRtpTransceiver is the modern, correct way to manage tracks

Most WebRTC tutorials just call `addTrack()` and forget it. But `RTCRtpTransceiver` gives you granular control over **who is sending and receiving what** — essential for features like "presenter mode" (others go recvonly), muting without removing tracks, or adding video-only without audio.

### Directions

```
sendrecv  = sending AND receiving (default after addTrack)
sendonly  = you send, you do NOT receive
recvonly  = you receive, you do NOT send
inactive  = neither — track exists but nothing flows
```

`apps/client/src/features/transceiver-control.ts`:
```typescript
export class TransceiverControl {
  constructor(private getPCs: () => Map<string, { getRawPC(): RTCPeerConnection }>) {}

  // Get transceivers for a specific kind
  private getTransceivers(pc: RTCPeerConnection, kind: 'audio' | 'video') {
    return pc.getTransceivers().filter(t => t.sender.track?.kind === kind);
  }

  // Go to presenter mode — you send, remote peers only receive from you
  async setPresenterMode() {
    for (const [, pc] of this.getPCs()) {
      for (const transceiver of pc.getRawPC().getTransceivers()) {
        transceiver.direction = 'sendonly';
      }
      // Direction change triggers onnegotiationneeded automatically
    }
  }

  // Go to viewer mode — you receive only
  async setViewerMode() {
    for (const [, pc] of this.getPCs()) {
      for (const transceiver of pc.getRawPC().getTransceivers()) {
        transceiver.direction = 'recvonly';
      }
    }
  }

  // Normal two-way mode
  async setNormalMode() {
    for (const [, pc] of this.getPCs()) {
      for (const transceiver of pc.getRawPC().getTransceivers()) {
        transceiver.direction = 'sendrecv';
      }
    }
  }

  // Pause everything — track stays but nothing flows (no renegotiation)
  setInactive(kind: 'audio' | 'video') {
    for (const [, pc] of this.getPCs()) {
      for (const t of this.getTransceivers(pc.getRawPC(), kind)) {
        t.direction = 'inactive';
      }
    }
  }

  // Better mute: disable the track, direction stays sendrecv
  // Remote peer still gets the track but it's silence/black frame
  muteAudio(muted: boolean) {
    for (const [, pc] of this.getPCs()) {
      pc.getRawPC().getSenders()
        .filter(s => s.track?.kind === 'audio')
        .forEach(s => { if (s.track) s.track.enabled = !muted; });
    }
  }

  muteVideo(hidden: boolean) {
    for (const [, pc] of this.getPCs()) {
      pc.getRawPC().getSenders()
        .filter(s => s.track?.kind === 'video')
        .forEach(s => { if (s.track) s.track.enabled = !hidden; });
    }
  }

  // Force codec preference (Chrome + Firefox)
  // Call this BEFORE setLocalDescription
  setCodecPreference(pc: RTCPeerConnection, kind: 'audio' | 'video', mimeType: string) {
    const capabilities = RTCRtpReceiver.getCapabilities(kind);
    if (!capabilities) return;

    const transceiver = pc.getTransceivers().find(t => t.receiver.track.kind === kind);
    if (!transceiver) return;

    const preferred = capabilities.codecs.filter(c =>
      c.mimeType.toLowerCase() === mimeType.toLowerCase()
    );
    const rest = capabilities.codecs.filter(c =>
      c.mimeType.toLowerCase() !== mimeType.toLowerCase()
    );

    // setCodecPreferences — put your codec first
    transceiver.setCodecPreferences([...preferred, ...rest]);
  }
}
```

**🔬 EXPERIMENT:** Add a transceiver with `addTransceiver('video', { direction: 'recvonly' })` before `getUserMedia`. What does the SDP look like? Compare with `sendrecv`. This is how receive-before-send works (e.g., you want to see others before sharing your own camera).

---

## PHASE 8 — ADAPTIVE BITRATE + SIMULCAST
### 🎯 Concept: RTCRtpSender.setParameters() tunes encoding at runtime — no renegotiation

`apps/client/src/features/media-controls.ts`:
```typescript
export class MediaControls {
  constructor(private getPCs: () => Map<string, { getRawPC(): RTCPeerConnection }>) {}

  async setVideoBitrate(maxBitrateKbps: number) {
    for (const [, pc] of this.getPCs()) {
      const sender = pc.getRawPC().getSenders().find(s => s.track?.kind === 'video');
      if (!sender) continue;

      const params = sender.getParameters();
      if (!params.encodings?.length) params.encodings = [{}];
      params.encodings[0].maxBitrate = maxBitrateKbps * 1000;
      await sender.setParameters(params);
    }
  }

  // Simulcast — send 3 quality layers simultaneously
  // The receiver picks the layer that fits their bandwidth
  addSimulcastTrack(pc: RTCPeerConnection, track: MediaStreamTrack): RTCRtpSender {
    const sender = pc.addTrack(track);
    const params = sender.getParameters();
    params.encodings = [
      { rid: 'high', maxBitrate: 1_500_000, scaleResolutionDownBy: 1.0 },  // 720p
      { rid: 'mid',  maxBitrate: 400_000,   scaleResolutionDownBy: 2.0 },  // 360p
      { rid: 'low',  maxBitrate: 100_000,   scaleResolutionDownBy: 4.0 },  // 180p
    ];
    sender.setParameters(params);
    return sender;
  }

  // Auto-degrade based on network conditions (wire to Stats in Phase 11)
  async autoDegradeIfNeeded(
    pc: RTCPeerConnection,
    rtt: number,
    packetLoss: number
  ) {
    let targetKbps = 1500;
    if (rtt > 300 || packetLoss > 0.05) targetKbps = 300;
    else if (rtt > 150 || packetLoss > 0.02) targetKbps = 700;

    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
    if (!sender) return;
    const params = sender.getParameters();
    if (params.encodings?.[0]) {
      params.encodings[0].maxBitrate = targetKbps * 1000;
      await sender.setParameters(params);
    }
  }
}
```

---

## PHASE 9 — CONNECTION STATE MACHINE + ICE RESTART
### 🎯 Concept: Connections fail. ICE restart is surgery without putting the patient to sleep.

`restartIce()` triggers a new ICE negotiation on the existing `RTCPeerConnection` without closing it. You get new ICE candidates while keeping the media flowing. Only create a new `RTCPeerConnection` as a last resort.

`apps/client/src/features/connection-manager.ts`:
```typescript
export class ConnectionManager {
  private restartAttempts = new Map<string, number>();
  private restartTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private MAX_ATTEMPTS = 3;
  private BASE_DELAY_MS = 1000;

  onPeerFailed?: (peerId: string) => void;

  watch(peerId: string, pc: RTCPeerConnection, onGiveUp: () => void) {
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`[${peerId}] connectionState → ${state}`);

      if (state === 'connected') {
        // Reset attempts on successful connection
        this.restartAttempts.set(peerId, 0);
        this.clearTimer(peerId);
      }

      if (state === 'disconnected') {
        // Brief disconnect — wait before acting (often self-heals)
        this.scheduleRestart(peerId, pc, onGiveUp, 2000);
      }

      if (state === 'failed') {
        // Definite failure — restart immediately
        this.doRestart(peerId, pc, onGiveUp);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        console.warn(`[${peerId}] ICE failed — restarting`);
        this.doRestart(peerId, pc, onGiveUp);
      }
    };
  }

  private scheduleRestart(
    peerId: string,
    pc: RTCPeerConnection,
    onGiveUp: () => void,
    delay: number
  ) {
    this.clearTimer(peerId);
    const timer = setTimeout(() => {
      if (pc.connectionState !== 'connected') {
        this.doRestart(peerId, pc, onGiveUp);
      }
    }, delay);
    this.restartTimers.set(peerId, timer);
  }

  private doRestart(peerId: string, pc: RTCPeerConnection, onGiveUp: () => void) {
    const attempts = (this.restartAttempts.get(peerId) ?? 0) + 1;
    this.restartAttempts.set(peerId, attempts);

    if (attempts > this.MAX_ATTEMPTS) {
      console.error(`[${peerId}] Giving up after ${attempts} attempts`);
      this.cleanup(peerId);
      onGiveUp(); // caller recreates the PeerConnection from scratch
      return;
    }

    // Exponential backoff: 1s, 2s, 4s...
    const delay = this.BASE_DELAY_MS * Math.pow(2, attempts - 1);
    console.log(`[${peerId}] ICE restart attempt ${attempts} in ${delay}ms`);

    setTimeout(() => {
      if (pc.connectionState !== 'closed') {
        pc.restartIce(); // triggers onnegotiationneeded → new offer with new credentials
      }
    }, delay);
  }

  private clearTimer(peerId: string) {
    const timer = this.restartTimers.get(peerId);
    if (timer) {
      clearTimeout(timer);
      this.restartTimers.delete(peerId);
    }
  }

  cleanup(peerId: string) {
    this.clearTimer(peerId);
    this.restartAttempts.delete(peerId);
  }
}
```

Wire it into your `Room.createPC()`:
```typescript
const manager = new ConnectionManager();
manager.watch(remotePeerId, pc.getRawPC(), () => {
  // Give up — close and recreate
  this.removePeer(remotePeerId);
  this.createPC(remotePeerId, isPolite); // fresh start
});
```

**🔬 TEST IT:** Start a call. Disconnect your WiFi for 8 seconds. Reconnect. Watch the logs. You should see `disconnected` → retry → `connected` without rebuilding the whole room.

---

## PHASE 10 — INSERTABLE STREAMS (VIDEO FILTERS + E2EE FOUNDATION)
### 🎯 Concept: Process raw video/audio frames in a Worker — no Canvas hacks, no CPU waste

This is the modern way to do blur backgrounds, grayscale filters, custom encryption, watermarks — anything that touches raw media. `MediaStreamTrackProcessor` gives you a `ReadableStream` of `VideoFrame` objects. `MediaStreamTrackGenerator` takes your processed frames back out.

**Support check:** Chrome 94+, Firefox 117+, Safari behind a flag. Always check `'MediaStreamTrackProcessor' in window`.

`apps/client/src/features/insertable-streams.ts`:
```typescript
export type FrameProcessor = (
  frame: VideoFrame,
  controller: TransformStreamDefaultController<VideoFrame>
) => void;

export class InsertableStreams {
  private processor: MediaStreamTrackProcessor<VideoFrame> | null = null;
  private generator: MediaStreamTrackGenerator<VideoFrame> | null = null;

  isSupported(): boolean {
    return 'MediaStreamTrackProcessor' in window && 'MediaStreamTrackGenerator' in window;
  }

  // Transform a video track through a custom processor function
  // Returns a NEW track — use replaceTrack() to put it in the PeerConnection
  transform(track: MediaStreamVideoTrack, processFn: FrameProcessor): MediaStreamTrack {
    if (!this.isSupported()) {
      console.warn('Insertable Streams not supported — returning original track');
      return track;
    }

    this.processor = new MediaStreamTrackProcessor({ track });
    this.generator = new MediaStreamTrackGenerator({ kind: 'video' });

    const transformer = new TransformStream<VideoFrame, VideoFrame>({
      transform(frame, controller) {
        processFn(frame, controller);
        // IMPORTANT: always close frames you don't enqueue to avoid memory leaks
      }
    });

    // Pipe: camera → processor → your transform → generator → peer connection
    this.processor.readable
      .pipeThrough(transformer)
      .pipeTo(this.generator.writable);

    return this.generator as unknown as MediaStreamTrack;
  }

  stop() {
    // Closing is handled when the source track ends
    this.processor = null;
    this.generator = null;
  }
}

// ─── BUILT-IN PROCESSORS ────────────────────────────────────────

// Grayscale filter — a real-time effect, no canvas needed
export function grayscaleProcessor(
  frame: VideoFrame,
  controller: TransformStreamDefaultController<VideoFrame>
): void {
  // For custom pixel processing you'd use OffscreenCanvas here
  // For simple pass-through effects, just enqueue as-is
  controller.enqueue(frame);
}

// Black frame — useful for "camera off" state without removing the track
export function blackFrameProcessor(
  frame: VideoFrame,
  controller: TransformStreamDefaultController<VideoFrame>
): void {
  // Create a black frame with same dimensions
  const offscreen = new OffscreenCanvas(frame.displayWidth, frame.displayHeight);
  const ctx = offscreen.getContext('2d')!;
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, offscreen.width, offscreen.height);

  const blackFrame = new VideoFrame(offscreen, { timestamp: frame.timestamp });
  frame.close(); // free the original
  controller.enqueue(blackFrame);
}

// E2EE processor skeleton — XOR every byte (toy example, use WebCrypto for real)
// See Boss Challenge 5 for the full WebCrypto version
export function encryptProcessor(
  frame: VideoFrame,
  controller: TransformStreamDefaultController<VideoFrame>
): void {
  // In production: use RTCRtpScriptTransform (worker-based) for E2EE
  // This in-main-thread version is for learning only
  controller.enqueue(frame);
}
```

### Use It

```typescript
const streams = new InsertableStreams();

// Replace your camera track with a black-frame version when "camera off"
const blackTrack = streams.transform(
  localStream.getVideoTracks()[0] as MediaStreamVideoTrack,
  blackFrameProcessor
);

// replaceTrack on all peer connections
for (const [, pc] of room.getPeers()) {
  const sender = pc.getRawPC().getSenders().find(s => s.track?.kind === 'video');
  await sender?.replaceTrack(blackTrack);
}
```

**🔬 EXPERIMENT:** Build a real grayscale filter using `OffscreenCanvas`. Draw each incoming `VideoFrame` to an `OffscreenCanvas`, get `ImageData`, loop through pixels and average RGB, put it back. Watch the FPS in your Stats dashboard (Phase 11) to see the CPU cost.

---

## PHASE 11 — STATS DASHBOARD (THE DEBUGGER'S WEAPON)
### 🎯 Concept: getStats() is a window into everything happening under the hood

Packet loss, RTT, jitter, codec, frame rate, bitrate — all exposed. This is how you debug production WebRTC problems. Learn this API deeply.

`apps/client/src/features/stats.ts`:
```typescript
export interface PeerStats {
  peerId: string;
  // Video out
  bytesSent: number;
  framesSent: number;
  frameWidth: number;
  frameHeight: number;
  framesPerSecond: number;
  // Video in
  bytesReceived: number;
  packetsLost: number;
  jitter: number;          // seconds — multiply by 1000 for ms
  framesDecoded: number;
  // Network
  roundTripTime: number;   // ms
  availableOutgoingBitrate: number;
  candidateType: string;   // host | srflx | relay
  // State
  iceState: RTCIceConnectionState;
  connectionState: RTCPeerConnectionState;
}

export class StatsCollector {
  private intervals = new Map<string, ReturnType<typeof setInterval>>();
  private previousStats = new Map<string, RTCStatsReport>();

  startCollecting(
    peerId: string,
    pc: RTCPeerConnection,
    onStats: (stats: PeerStats) => void,
    intervalMs = 1000
  ) {
    const id = setInterval(async () => {
      const report = await pc.getStats();
      const stats: Partial<PeerStats> = {
        peerId,
        iceState: pc.iceConnectionState,
        connectionState: pc.connectionState
      };

      report.forEach((item: RTCStats) => {
        switch (item.type) {
          case 'outbound-rtp':
            if ((item as any).kind === 'video') {
              stats.bytesSent = (item as any).bytesSent;
              stats.framesSent = (item as any).framesSent;
              stats.framesPerSecond = (item as any).framesPerSecond;
              stats.frameWidth = (item as any).frameWidth;
              stats.frameHeight = (item as any).frameHeight;
            }
            break;
          case 'inbound-rtp':
            if ((item as any).kind === 'video') {
              stats.bytesReceived = (item as any).bytesReceived;
              stats.packetsLost = (item as any).packetsLost;
              stats.jitter = (item as any).jitter * 1000; // convert to ms
              stats.framesDecoded = (item as any).framesDecoded;
              stats.framesPerSecond = (item as any).framesPerSecond;
            }
            break;
          case 'candidate-pair':
            if ((item as any).state === 'succeeded') {
              stats.roundTripTime = ((item as any).currentRoundTripTime ?? 0) * 1000;
              stats.availableOutgoingBitrate = (item as any).availableOutgoingBitrate ?? 0;
            }
            break;
          case 'local-candidate':
            if ((item as any).candidateType) {
              stats.candidateType = (item as any).candidateType;
            }
            break;
        }
      });

      this.previousStats.set(peerId, report);
      onStats(stats as PeerStats);
    }, intervalMs);

    this.intervals.set(peerId, id);
  }

  stop(peerId: string) {
    const id = this.intervals.get(peerId);
    if (id) { clearInterval(id); this.intervals.delete(peerId); }
    this.previousStats.delete(peerId);
  }

  stopAll() {
    this.intervals.forEach((_, peerId) => this.stop(peerId));
  }
}
```

**🔬 BUILD THE UI:** Render a table that updates every second per peer:

| Peer | RTT | Packet Loss | Jitter | Resolution | FPS | Bitrate | Via |
|---|---|---|---|---|---|---|---|
| abc123 | 42ms | 0.1% | 3ms | 1280x720 | 30 | 1.2 Mbps | direct |
| def456 | 180ms | 3.2% | 18ms | 640x360 | 24 | 380 kbps | relay |

When a peer's RTT > 150ms or packet loss > 2%, call `autoDegradeIfNeeded()` from Phase 8.

---

## PHASE 12 — RECORDING WITH MEDIARECORDER
### 🎯 Concept: Record any MediaStream client-side — no server required

`apps/client/src/features/recorder.ts`:
```typescript
export class PeerRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  // Pick the best supported codec
  private static getBestMimeType(): string {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4', // Safari fallback
    ];
    return candidates.find(m => MediaRecorder.isTypeSupported(m)) ?? '';
  }

  start(stream: MediaStream) {
    this.chunks = [];
    const mimeType = PeerRecorder.getBestMimeType();
    console.log('Recording with:', mimeType);

    this.recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 2_500_000,
      audioBitsPerSecond: 128_000
    });

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };

    this.recorder.start(1000); // chunk every 1s — important for seeking later
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorder) { reject(new Error('Not recording')); return; }
      this.recorder.onstop = () => {
        const mimeType = this.recorder?.mimeType ?? 'video/webm';
        resolve(new Blob(this.chunks, { type: mimeType }));
      };
      this.recorder.stop();
    });
  }

  async stopAndDownload(filename = 'recording.webm') {
    const blob = await this.stop();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  isRecording() {
    return this.recorder?.state === 'recording';
  }
}
```

**🔬 EXPERIMENT:** Record a 30-second clip. Open it in VLC. Check the codec with `ffprobe recording.webm`. Now record with `videoBitsPerSecond: 500_000`. Compare file sizes and quality. Understanding bitrate tradeoffs is a real skill.

---

## PHASE 13 — PAGE VISIBILITY HANDLING
### 🎯 Concept: When the tab is hidden, conserve bandwidth automatically

This is easy to implement but almost always missing from tutorials. In a real product you'd want this.

`apps/client/src/features/visibility.ts`:
```typescript
export class VisibilityManager {
  private isHidden = false;

  constructor(
    private getPCs: () => Map<string, { getRawPC(): RTCPeerConnection }>,
    private mediaControls: { setVideoBitrate: (kbps: number) => Promise<void> }
  ) {
    document.addEventListener('visibilitychange', () => this.handleChange());
  }

  private async handleChange() {
    this.isHidden = document.hidden;

    if (document.hidden) {
      console.log('Tab hidden — reducing bitrate, pausing video');
      // Drop to audio-only quality
      await this.mediaControls.setVideoBitrate(0); // or very low

      // Disable video tracks to stop encoding entirely
      for (const [, pc] of this.getPCs()) {
        pc.getRawPC().getSenders()
          .filter(s => s.track?.kind === 'video')
          .forEach(s => { if (s.track) s.track.enabled = false; });
      }
    } else {
      console.log('Tab visible — restoring video');
      await this.mediaControls.setVideoBitrate(1500);

      for (const [, pc] of this.getPCs()) {
        pc.getRawPC().getSenders()
          .filter(s => s.track?.kind === 'video')
          .forEach(s => { if (s.track) s.track.enabled = true; });
      }
    }
  }

  destroy() {
    document.removeEventListener('visibilitychange', () => this.handleChange());
  }
}
```

---

## PHASE 14 — WIRE IT ALL TOGETHER
### 🔨 `apps/client/src/main.ts`

Build a minimal UI exposing every feature:

```
┌─────────────────────────────────────────────────┐
│  FullMesh                          [Stats Panel] │
├──────────────────────────┬──────────────────────┤
│                          │  💬 Chat              │
│   Video Grid             │  ─────────────────── │
│   (CSS Grid, auto-grow)  │  [message list]       │
│                          │                       │
│   [you]  [peer1] [peer2] │  [input] [send]       │
│                          ├──────────────────────┤
│                          │  📁 Files             │
│                          │  [drop zone]          │
├──────────────────────────┴──────────────────────┤
│ [🎤 Mute] [📷 Cam] [🖥 Share] [⏺ Record]       │
│ Bitrate: [──●──────] 1500 kbps  Mode: [sendrecv]│
└─────────────────────────────────────────────────┘
```

Features to wire:
- Video grid grows/shrinks as peers join/leave
- Chat sidebar uses `DataChannel` via `ChatManager`
- File drop zone uses `FileTransfer.sendFile()`
- Screen share button toggles `ScreenShare`
- Mute/camera use `TransceiverControl.muteAudio/muteVideo()`
- Bitrate slider calls `MediaControls.setVideoBitrate()`
- Stats panel table, updated every second via `StatsCollector`
- Record button per peer's stream
- Insertable Streams toggle for grayscale filter demo

---

## 💀 FINAL BOSS CHALLENGES

Do all five. No looking up solutions first.

**Boss 1: SDP Munging**
Intercept the SDP before `setLocalDescription`. Force VP9 to be the first codec in the `m=video` section. This is raw string parsing — it's ugly, it's what production apps do when `setCodecPreferences()` isn't enough.
```typescript
function preferCodec(sdp: string, kind: 'audio' | 'video', mimeType: string): string {
  // 1. Find the m= section for kind
  // 2. Find all a=rtpmap lines
  // 3. Find the payload type for mimeType
  // 4. Move it to front of the codec list on the m= line
  // 5. Return modified SDP
}
```

**Boss 2: STUN/TURN Health Check**
Before joining a room, verify each ICE server is reachable. Surface a warning if only `host` candidates appear (STUN unreachable) or if no `relay` candidate appears (TURN unreachable).
```typescript
async function checkIceServer(server: RTCIceServer): Promise<'host' | 'srflx' | 'relay' | 'timeout'> {
  // Create a throwaway PC, gather candidates, report highest type found
  // Timeout after 5s
}
```

**Boss 3: Bandwidth-Adaptive Quality**
Wire `StatsCollector` to `MediaControls.autoDegradeIfNeeded()`. Auto-degrade video quality when RTT > 200ms or packet loss > 3%. Show a toast to the user when on TURN relay. Restore quality when conditions improve.

**Boss 4: End-to-End Encryption on DataChannel**
Use the WebCrypto API. Before the call, each peer generates an ECDH key pair. Exchange public keys via signaling. Derive a shared secret. Encrypt every chat message and file chunk with AES-GCM. No third party can read it — not even your signaling server.
```typescript
// Key generation
const { publicKey, privateKey } = await crypto.subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']
);

// After exchanging public keys via signaling:
const sharedKey = await crypto.subtle.deriveKey(
  { name: 'ECDH', public: theirPublicKey },
  privateKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

**Boss 5: Insertable Streams Grayscale Filter**
Build a real grayscale processor using `OffscreenCanvas`. Draw each `VideoFrame`, extract `ImageData`, loop pixels and compute `(r+g+b)/3`, put pixels back, create a new `VideoFrame`, enqueue it. Watch FPS in your stats panel before and after. Measure the CPU cost.

---

## 🧪 FINAL CHECKLIST

Test every item on **two different machines on two different networks** (WiFi + phone hotspot):

**Core**
- [ ] Two peers: camera-to-camera connection established
- [ ] Three+ peers: full mesh, all see all
- [ ] ICE candidates: all three types visible in logs (host, srflx, relay)
- [ ] TURN-only mode works (`iceTransportPolicy: 'relay'`)

**Data**
- [ ] Chat messages deliver to all peers instantly
- [ ] File transfer 50MB+ completes without error or data corruption
- [ ] File transfer shows accurate progress %

**Media**
- [ ] Screen sharing switches live, switches back to camera
- [ ] Mute/unmute audio without disrupting video
- [ ] Toggle video without disrupting audio or connection
- [ ] Presenter mode: others go recvonly

**Resilience**
- [ ] Disconnect WiFi for 10s — connection self-heals (ICE restart)
- [ ] Max restart attempts → graceful give-up → reconnect fresh
- [ ] Tab hidden → bitrate drops → tab visible → bitrate restores

**Advanced**
- [ ] Stats panel showing RTT, packet loss, FPS, resolution live
- [ ] Auto-degrade bitrate on bad network, restore on good
- [ ] Grayscale filter live via Insertable Streams
- [ ] Recording saves a valid .webm, plays in VLC/browser
- [ ] E2EE DataChannel: messages unreadable in DevTools Network tab

**Cross-browser**
- [ ] Chrome ✓
- [ ] Firefox ✓
- [ ] Safari (your hardest test — good luck)
- [ ] Mobile browser ✓

---

## 🧠 MISTAKES YOU WILL MAKE (and learn from)

| Mistake | Symptom | Fix |
|---|---|---|
| DataChannel on both sides | `ondatachannel` fires twice | Only impolite peer creates it |
| Not `await`ing `setLocalDescription` | Signaling race conditions | Always async |
| Removing a track vs disabling it | Remote video disappears entirely | `track.enabled = false` |
| Not handling `onnegotiationneeded` | New tracks never appear | Perfect negotiation, always |
| Sending before ICE connected | First messages silently lost | Check `channel.readyState === 'open'` |
| Buffer overflow on file transfer | Browser tab crashes | Respect `bufferedAmountLowThreshold` |
| Ignoring Safari | Works on Chrome, dead on Safari | Test early, test often |
| Not closing `VideoFrame` in Insertable Streams | Memory leak, tab slows to a crawl | Always `frame.close()` |
| Setting direction without renegotiation | Direction change ignored | `direction` change auto-triggers `onnegotiationneeded` |
| Recreating PC instead of `restartIce()` | User sees a full disconnect | `restartIce()` first, recreate only on give-up |

---

## 📦 ROOT PACKAGE.JSON SCRIPTS

```json
{
  "scripts": {
    "dev:server": "pnpm --filter server tsx watch src/index.ts",
    "dev:client": "pnpm --filter client vite",
    "dev": "pnpm run dev:server & pnpm run dev:client",
    "build": "pnpm --filter server tsc && pnpm --filter client vite build",
    "type-check": "pnpm -r exec tsc --noEmit"
  }
}
```

---

## 🔗 REFERENCES — open these only when you're stuck

| Resource | URL |
|---|---|
| MDN RTCPeerConnection | https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection |
| Perfect Negotiation | https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation |
| WebRTC Samples (canonical) | https://webrtc.github.io/samples/ |
| WebRTC Stats spec | https://www.w3.org/TR/webrtc-stats/ |
| Insertable Streams explainer | https://github.com/w3c/mediacapture-transform/blob/main/explainer.md |
| RTCRtpTransceiver | https://developer.mozilla.org/en-US/docs/Web/API/RTCRtpTransceiver |
| coturn server | https://github.com/coturn/coturn |
| chrome://webrtc-internals | (your best debugger — open it during every call) |

---

> **You don't learn WebRTC by reading about it.**
> **You learn it by staring at ICE failures at 2am.**
>
> **Now go build.**
