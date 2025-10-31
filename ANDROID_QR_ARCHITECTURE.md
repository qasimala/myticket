# Android QR Code Generation - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Opens Booking                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │  Platform Detection  │
              │ (Capacitor.platform) │
              └──────────┬───────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
  ┌────────────────┐         ┌────────────────┐
  │  Android App   │         │   Web Browser  │
  └────────┬───────┘         └────────┬───────┘
           │                           │
           ▼                           ▼
  ┌─────────────────┐        ┌─────────────────┐
  │ QrTokenPlugin   │        │ Convex Action   │
  │ (Native Java)   │        │ (Server-side)   │
  └────────┬────────┘        └────────┬────────┘
           │                           │
           ▼                           ▼
  ┌─────────────────┐        ┌─────────────────┐
  │  BuildConfig    │        │  process.env    │
  │  .QR_SECRET     │        │  .QR_SECRET     │
  └────────┬────────┘        └────────┬────────┘
           │                           │
           ▼                           ▼
  ┌──────────────────────────────────────┐
  │      HMAC-SHA256 Signature           │
  │   (bookingId:ticketId:timeSlot)      │
  └──────────────┬───────────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────────┐
  │         QR Token Generated            │
  │  {bookingId, ticketId, ts, sig}      │
  └──────────────┬───────────────────────┘
                 │
                 ▼
  ┌──────────────────────────────────────┐
  │       Display QR Code to User        │
  └──────────────────────────────────────┘
```

## Token Generation Flow

### Android Native Path
```
React Component
    │
    ├─→ useQrTokenGenerator()
    │       │
    │       ├─→ isAndroidNative() → true
    │       │
    │       └─→ QrToken.generateTokens()
    │               │
    │               └─→ [Capacitor Bridge]
    │                       │
    │                       └─→ QrTokenPlugin.java
    │                               │
    │                               ├─→ Get BuildConfig.QR_SECRET
    │                               ├─→ Calculate time slots
    │                               ├─→ HMAC-SHA256 signing
    │                               └─→ Return tokens
    │
    └─→ Display QR Code
```

### Web Browser Path
```
React Component
    │
    ├─→ useQrTokenGenerator()
    │       │
    │       ├─→ isAndroidNative() → false
    │       │
    │       └─→ Convex Action (api.bookings.generateQrToken)
    │               │
    │               └─→ [HTTP Request to Server]
    │                       │
    │                       └─→ Convex Action Handler
    │                               │
    │                               ├─→ Get process.env.QR_SECRET
    │                               ├─→ Calculate time slots
    │                               ├─→ HMAC-SHA256 signing
    │                               └─→ Return tokens
    │
    └─→ Display QR Code
```

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                      QR_SECRET                               │
│                                                               │
│  ┌──────────────────┐          ┌──────────────────┐         │
│  │   Server Side    │          │   Android Side   │         │
│  │                  │          │                  │         │
│  │ .env file        │          │ gradle.properties│         │
│  │       ↓          │          │       ↓          │         │
│  │ process.env      │          │ BuildConfig      │         │
│  │ .QR_SECRET       │          │ .QR_SECRET       │         │
│  └────────┬─────────┘          └────────┬─────────┘         │
│           │                             │                   │
│           └──────────┬──────────────────┘                   │
│                      │                                       │
│                      ▼                                       │
│         ┌────────────────────────┐                          │
│         │   HMAC-SHA256 Signing  │                          │
│         └────────────────────────┘                          │
│                      │                                       │
│                      ▼                                       │
│         ┌────────────────────────┐                          │
│         │   Identical Tokens     │                          │
│         └────────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   Scanning/Validation  │
         │   (Always Server-Side) │
         └────────────────────────┘
```

## Time Slot Mechanism

```
Time: ────────────────────────────────────────────────────►

Slots:  [   Slot N-1   ] [   Slot N   ] [   Slot N+1   ]
         ◄──15 sec──► ◄──15 sec──► ◄──15 sec──►

Generation:              ↑
                    Current Time
                    
Tokens Generated:    Token(N)   +   Token(N+1)
                        ▼              ▼
                    [Valid Now]   [Valid Soon]

Validation Window:   Slot N-1, N, or N+1 accepted
                     ◄────45 seconds total────►
```

### Why 2 Tokens?
- Current slot token (valid now)
- Next slot token (prevents gap during transition)
- Ensures smooth user experience even near slot boundaries

## Data Flow Comparison

### Before (Web & Android)
```
User → React → Convex Action → Server HMAC → Network → Client → Display
       [High Latency] [Network Required] [Server Load]
```

### After (Android Only)
```
User → React → Native Plugin → Local HMAC → Display
       [Low Latency] [Works Offline] [No Server Load]
```

### After (Web - Unchanged)
```
User → React → Convex Action → Server HMAC → Network → Client → Display
       [Same as before]
```

## Component Interaction

```
┌──────────────────────────────────────────────────────┐
│           BookingConfirmationPage.tsx                 │
│                                                        │
│  const { generateTokens } = useQrTokenGenerator()    │
│                      │                                 │
│                      ▼                                 │
│  generateTokens(bookingId, ticketId)                 │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│            qrTokenGenerator.ts                        │
│                                                        │
│  if (isAndroidNative())                              │
│    → QrToken.generateTokens()  ─┐                    │
│  else                            │                    │
│    → serverGenerateQrToken()     │                    │
└──────────────────────────────────┼───────────────────┘
                                   │
         ┌─────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│              qrTokenPlugin.ts                         │
│                                                        │
│  registerPlugin<QrTokenPlugin>('QrToken')            │
│                      │                                 │
│                      ▼                                 │
│         [Capacitor Native Bridge]                     │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────┐
│           QrTokenPlugin.java                          │
│                                                        │
│  @PluginMethod                                        │
│  public void generateTokens(PluginCall call)         │
│      - Read BuildConfig.QR_SECRET                     │
│      - Calculate HMAC-SHA256                          │
│      - Return JSON tokens                             │
└──────────────────────────────────────────────────────┘
```

## Build Process

```
Developer Sets Secret
        │
        ▼
┌───────────────────┐
│ gradle.properties │
│ QR_SECRET=xxx     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  build.gradle     │
│ buildConfigField  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  Gradle Build     │
│  Generates        │
│  BuildConfig.java │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ BuildConfig.java  │
│ public static     │
│ final String      │
│ QR_SECRET = "xxx" │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ QrTokenPlugin.java│
│ uses BuildConfig  │
│     .QR_SECRET    │
└────────┬──────────┘
         │
         ▼
    APK with
  embedded secret
```

## Token Validation Flow

```
User Scans QR Code
       │
       ▼
┌──────────────────┐
│  Scanner Device  │
│ (Event Organizer)│
└────────┬─────────┘
         │
         ▼
┌──────────────────────┐
│ Convex Action:       │
│ scanQrToken()        │
│                      │
│ 1. Parse JSON        │
│ 2. Get booking       │
│ 3. Check authority   │
│ 4. Verify signature  │ ← Uses server's QR_SECRET
│ 5. Check time slot   │
│ 6. Mark as scanned   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│ Result: OK/Invalid   │
└──────────────────────┘
```

Note: **Validation always happens on the server**, regardless of where the QR code was generated. This ensures security even if the mobile app is compromised.

