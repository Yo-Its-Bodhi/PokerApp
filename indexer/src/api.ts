// indexer/src/api.ts

import express from 'express';

const app = express();
const port = 3001;

// GET /lobby
app.get('/lobby', (req, res) => {
    // Return list of tables, seats, blinds
    res.json({
        /* mock data */
    });
});

// GET /table/:id
app.get('/table/:id', (req, res) => {
    // Return players, stacks, pot, last N hands
    res.json({
        /* mock data */
    });
});

// GET /user/:wallet/history
app.get('/user/:wallet/history', (req, res) => {
    // Return user's hand history
    res.json({
        /* mock data */
    });
});

// WebSocket endpoint for live updates
// ...

app.listen(port, () => {
    console.log(`Indexer API listening at http://localhost:${port}`);
});
