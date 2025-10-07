# IP-Based Wallet Restriction System

## Overview
This feature prevents multiple wallets from being used from the same IP address, helping to prevent multi-accounting abuse and collusion in poker games.

## How It Works

### Server-Side Implementation
- **IP Tracking**: When a player connects, the server extracts their IP address from the socket handshake
- **Wallet Registration**: Each IP address is mapped to a set of wallet addresses that have connected from it
- **Validation**: When a new connection attempt is made, the server checks if:
  - This IP has any wallets registered
  - The connecting wallet is different from the registered wallet(s)
  - If so, the connection is rejected with an error message

### Data Structures
```typescript
// Maps IP address -> Set of wallet addresses
const ipToWallets = new Map<string, Set<string>>();

// Maps wallet address -> IP address  
const walletToIp = new Map<string, string>();
```

### Configuration
In `server/src/server.ts`:
```typescript
// Set to true to enforce one wallet per IP
const ENFORCE_ONE_WALLET_PER_IP = true;
```

## IP Detection
The server checks multiple sources to get the client's IP:
1. `x-forwarded-for` header (for proxies/load balancers)
2. `socket.handshake.address`
3. `socket.conn.remoteAddress`

If behind a proxy, the first IP in the `x-forwarded-for` chain is used.

## Error Handling

### Server Response
When a second wallet attempts to connect from the same IP:
```json
{
  "message": "Only one wallet per IP address is allowed. Please use your previously registered wallet.",
  "code": "WALLET_IP_LIMIT"
}
```

### Client Handling
The client displays the error message and disconnects the socket to prevent further attempts.

## Important Considerations

### 1. Persistence
- **Current Behavior**: IP-wallet mappings persist until server restart
- **Reasoning**: Prevents players from quickly reconnecting with different wallets
- **Trade-off**: Legitimate users behind shared IPs (e.g., family members) cannot play simultaneously

### 2. Shared IPs
Common scenarios where legitimate users share an IP:
- **Family/Household**: Multiple people in same home
- **University/Office**: Network-wide shared IP
- **VPN Services**: Many users on same exit node
- **Mobile Carriers**: Some carriers use CGNAT (shared IPs)

### 3. Dynamic IPs
- Home ISPs often assign dynamic IPs that change periodically
- A user's IP may change between sessions
- The system allows the same wallet to reconnect with a new IP

## Recommendations

### For Production
Consider these enhancements:

#### 1. Time-Based Expiry
```typescript
// Add timestamp to wallet registrations
const ipToWallets = new Map<string, Map<string, number>>(); // wallet -> timestamp

// Clean up old entries (e.g., after 24 hours)
function cleanupOldMappings(maxAgeMs: number = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  for (const [ip, wallets] of ipToWallets.entries()) {
    for (const [wallet, timestamp] of wallets.entries()) {
      if (now - timestamp > maxAgeMs) {
        wallets.delete(wallet);
      }
    }
    if (wallets.size === 0) {
      ipToWallets.delete(ip);
    }
  }
}
```

#### 2. Database Persistence
Store IP-wallet mappings in a database for:
- Persistence across server restarts
- Better auditing and analytics
- Ability to review and manage restrictions

#### 3. Whitelist/Exemptions
Allow certain IPs to bypass restrictions:
```typescript
const WHITELISTED_IPS = new Set([
  '192.168.1.100', // Local testing
  '10.0.0.0/8',    // Private networks
]);
```

#### 4. Grace Period
Allow users to switch wallets once per time period:
```typescript
const WALLET_CHANGE_GRACE_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days
```

#### 5. Admin Override
Implement admin commands to:
- Clear IP restrictions for specific addresses
- View all IP-wallet mappings
- Manually whitelist IPs

### Alternative Approaches

#### Device Fingerprinting
- Use browser fingerprinting in addition to IP
- More resistant to VPN/proxy evasion
- Libraries: FingerprintJS, ClientJS

#### Behavioral Analysis
- Track playing patterns and statistics
- Flag suspicious behavior (always folding to same player, chip transfers)
- Machine learning models for collusion detection

#### KYC (Know Your Customer)
- Require identity verification
- Most effective but reduces user privacy
- May require regulatory compliance

## Testing

### Test Scenarios

1. **Same Wallet, Same IP**: ✅ Should allow
2. **Same Wallet, Different IP**: ✅ Should allow (user moved/changed network)
3. **Different Wallet, Same IP**: ❌ Should block
4. **Different Wallet, Different IP**: ✅ Should allow

### Manual Testing
```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Test with first wallet
# Connect to http://localhost:5173
# Connect wallet 0x1111...

# Terminal 3: Same browser, clear cookies, or use incognito
# Connect to http://localhost:5173
# Try to connect wallet 0x2222...
# Should see error message
```

## Logging
The server logs:
- IP address for each connection
- Wallet address being used
- Rejection events with details

Example logs:
```
📍 Player IP: 192.168.1.100 Wallet: 0x1234...
✅ Wallet registered for IP

📍 Player IP: 192.168.1.100 Wallet: 0x5678...
❌ IP already has a wallet registered: ['0x1234...']
```

## Configuration Options

### Disable Feature
To turn off IP restrictions:
```typescript
const ENFORCE_ONE_WALLET_PER_IP = false;
```

### Clear Mappings on Disconnect
To allow re-registration after disconnect, uncomment the cleanup code in the disconnect handler.

## Security Notes

⚠️ **This is not foolproof**:
- Users can use VPNs to get different IPs
- Tor/proxy services provide easy IP rotation
- Should be combined with other anti-abuse measures

✅ **What it prevents**:
- Casual multi-accounting
- Reduces accidental multi-wallet usage
- Creates friction for abuse
- Provides audit trail

## Future Enhancements

1. **Redis Integration**: Store mappings in Redis for clustering support
2. **Rate Limiting**: Limit connection attempts per IP
3. **Geolocation**: Flag connections from unusual locations
4. **Session Tracking**: Track session duration and activity
5. **Reputation System**: Build trust scores for wallets over time

---

**Last Updated**: October 6, 2025  
**Version**: 1.0.0
