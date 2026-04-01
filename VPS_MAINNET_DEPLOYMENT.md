# VPS Mainnet Deployment (Single Domain)

This guide deploys:
- frontend (Vite static build) via nginx
- backend (Socket.IO server) via PM2 on a free internal port
- single domain routing on `poker.bodhix.io`

## 1) Preconditions

- Ubuntu VPS with:
  - Node.js 18+
  - npm
  - nginx
  - pm2 (`npm i -g pm2`)
  - certbot (`sudo apt-get install certbot python3-certbot-nginx`)
- DNS A record for `poker.bodhix.io` pointing to the VPS
- repo cloned on the VPS

## 1.1) One-Command GitHub Deploy (Recommended)

Use this when the repo on GitHub is your source of truth. It prevents local file drift on the VPS:

```bash
cd /root/poker-live
chmod +x scripts/vps/deploy-from-github.sh scripts/vps/deploy-frontend-static.sh scripts/vps/smoke-check.sh
./scripts/vps/deploy-from-github.sh --branch main --domain poker.bodhix.io
```

Optional full stack deploy (frontend + backend restart):

```bash
./scripts/vps/deploy-from-github.sh --branch main --domain poker.bodhix.io --deploy-server
```

Deploy metadata is written to:

- `/var/www/poker/web/dist/build-info.json`

You can verify what is live with:

```bash
curl -ks https://poker.bodhix.io/build-info.json
```

## 2) Configure Mainnet Frontend Env

Update `web/.env.production` with real contract addresses before building:

- `VITE_TABLE_FACTORY_ADDRESS`
- `VITE_TABLE_ESCROW_ADDRESS`
- `VITE_RAKE_VAULT_ADDRESS`

Keep these flags for launch mode:

- `VITE_NETWORK=mainnet`
- `VITE_CHAIN_ID=9008`
- `VITE_DEMO_MODE=false`
- `VITE_MULTIPLAYER_ENABLED=true`
- `VITE_SERVER_URL=https://poker.bodhix.io`

## 2.1) Deploy Mainnet Contracts (Chain 9008)

Run from repo root on a secured operator machine (not on the public VPS):

```bash
export DEPLOYER_PRIVATE_KEY=<your_deployer_private_key>
export SHIDO_RPC_URL=https://rpc-nodes.shidoscan.com
export WSHIDO_TOKEN_ADDRESS=<mainnet_wshido_token_address>
export TREASURY_ADDRESS=0x1D7688b3f2e1314841825efF39503f525f181FB9
export POKER_ADMIN_ADDRESS=0x39f070F6560FcF91f868313899F429bDCc530652
# Optional override. If omitted, deployment script defaults SERVER_SIGNER_ADDRESS to POKER_ADMIN_ADDRESS.
export SERVER_SIGNER_ADDRESS=0x39f070F6560FcF91f868313899F429bDCc530652

# Optional table params (defaults shown)
export TABLE_MIN_BUY_IN=50
export TABLE_MAX_BUY_IN=500
export TABLE_RAKE_BPS=250
export TABLE_RAKE_CAP=10

npm run deploy:shido:mainnet
```

If `DEPLOYER_PRIVATE_KEY` is not the same wallet as `POKER_ADMIN_ADDRESS`, the script will print a warning. Current contracts still keep `TableFactory` ownership on deployer.

The script writes a deployment artifact under `deployments/` and prints:

- `VITE_RAKE_VAULT_ADDRESS`
- `VITE_TABLE_FACTORY_ADDRESS`
- `VITE_TABLE_ESCROW_ADDRESS`

Use those values in `web/.env.production` before frontend build/publish.

## 3) Build + Publish Frontend Static Files

```bash
chmod +x scripts/vps/deploy-frontend-static.sh
sudo ./scripts/vps/deploy-frontend-static.sh --target-dir /var/www/poker/web/dist
```

## 4) Build + Start Backend on a Free Port

```bash
chmod +x scripts/find-free-port.sh scripts/vps/deploy-server.sh
./scripts/vps/deploy-server.sh --domain poker.bodhix.io
```

Notes:
- The script auto-selects a free port in `3100-3999` unless you pass `--port`.
- It writes `server/.env.production` and starts/restarts PM2 process `poker-server`.
- Backend is bound to localhost (`HOST=127.0.0.1`) and exposed externally only via nginx.
- Reconnect grace is enabled by default (`DISCONNECT_GRACE_MS=30000`).
- It runs a local health check on `http://127.0.0.1:<PORT>/health`.

## 5) Install nginx Site Config (HTTP Bootstrap)

Render config with the backend port printed by deploy script:

```bash
chmod +x scripts/vps/render-nginx-config.sh
./scripts/vps/render-nginx-config.sh --domain poker.bodhix.io --backend-port <PORT> --ssl-enabled false | sudo tee /etc/nginx/sites-available/poker.bodhix.io >/dev/null
```

Enable and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/poker.bodhix.io /etc/nginx/sites-enabled/poker.bodhix.io
sudo nginx -t
sudo systemctl reload nginx
```

## 6) Issue/Refresh SSL

```bash
sudo certbot --nginx -d poker.bodhix.io
```

## 7) Switch nginx Config to HTTPS Mode

```bash
./scripts/vps/render-nginx-config.sh --domain poker.bodhix.io --backend-port <PORT> --ssl-enabled true | sudo tee /etc/nginx/sites-available/poker.bodhix.io >/dev/null
sudo nginx -t
sudo systemctl reload nginx
```

## 8) Smoke Test

```bash
chmod +x scripts/vps/smoke-check.sh
./scripts/vps/smoke-check.sh --domain poker.bodhix.io --scheme https
```

This checks:
- frontend URL is reachable
- backend health endpoint via domain
- Socket.IO polling handshake via domain

## 9) PM2 Operations

```bash
pm2 status
pm2 logs poker-server --lines 200
pm2 restart poker-server --update-env
pm2 save
```

## 10) Launch Acceptance Checklist

- Two wallets can join and play at the same table
- Chat works in both directions
- Deposit (top-up) confirms on-chain
- Claim (`standUp`) returns funds to wallet
- `/health` shows `status: ok`
- `socket.io` handshake works through nginx
