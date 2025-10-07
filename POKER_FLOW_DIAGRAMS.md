# 🎰 POKER ENGINE - VISUAL FLOW DIAGRAMS

## 🎯 State Machine Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    POKER HAND LIFECYCLE                      │
└─────────────────────────────────────────────────────────────┘

    ┌──────────┐
    │ SEATING  │  ← Waiting for players (< 2 players)
    └────┬─────┘
         │
         │ (2+ players available)
         │
    ┌────▼─────┐
    │   PREP   │  ← Move button, post blinds, shuffle deck
    └────┬─────┘
         │
         │ Deal 2 hole cards to each player
         │
    ┌────▼─────┐
    │ PREFLOP  │  ← First betting round (no community cards)
    └────┬─────┘
         │
         │ Betting complete
         │
    ┌────▼─────┐
    │   FLOP   │  ← Burn 1, deal 3 community cards
    └────┬─────┘     Betting round
         │
         │ Betting complete
         │
    ┌────▼─────┐
    │   TURN   │  ← Burn 1, deal 1 community card
    └────┬─────┘     Betting round
         │
         │ Betting complete
         │
    ┌────▼─────┐
    │  RIVER   │  ← Burn 1, deal 1 community card
    └────┬─────┘     Final betting round
         │
         │ Betting complete or only 1 player left
         │
    ┌────▼─────┐
    │ SHOWDOWN │  ← Evaluate hands, award pots
    └────┬─────┘
         │
         │ Distribute winnings
         │
    ┌────▼─────┐
    │ CLEANUP  │  ← Archive hand, reset for next
    └────┬─────┘
         │
         └──────► Loop back to PREP for next hand
```

---

## 🔄 Action Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│           PROCESSING A PLAYER ACTION                         │
└─────────────────────────────────────────────────────────────┘

Player wants to act (e.g., "RAISE 500")
         │
         ▼
┌─────────────────────┐
│  Is it their turn?  │──NO──► Reject: "Not your turn"
└──────────┬──────────┘
           │ YES
           ▼
┌─────────────────────────┐
│ getValidActions(seat)   │
│  - canCheck?            │
│  - canCall? callAmount? │
│  - canRaise? minRaise?  │
│  - maxBet?              │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Is action legal?        │──NO──► Reject: "Cannot raise"
│ (e.g., raise ≥ minRaise)│       or "Min raise is X"
└──────────┬──────────────┘
           │ YES
           ▼
┌─────────────────────────┐
│ Execute Action:         │
│  - Update player stack  │
│  - Add to pot(s)        │
│  - Set currentBet       │
│  - Mark actedThisStreet │
│  - Log action           │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Is betting round done?  │
│  - All acted?           │
│  - All matched bet?     │
│  - Only 1 player left?  │
└──────────┬──────────────┘
           │
      ┌────┴────┐
      │         │
     YES       NO
      │         │
      ▼         ▼
┌──────────┐  ┌──────────────┐
│ Advance  │  │ Move cursor  │
│ Street   │  │ to next seat │
└──────────┘  └──────────────┘
      │
      ▼
┌──────────────┐
│ Create Side  │
│ Pots (if     │
│ all-ins)     │
└──────────────┘
```

---

## 💰 Side Pot Creation Algorithm

```
┌─────────────────────────────────────────────────────────────┐
│              SIDE POT CREATION EXAMPLE                       │
└─────────────────────────────────────────────────────────────┘

SCENARIO:
  Alice:   500 chips (all-in)
  Bob:   2,000 chips (raises to 2000)
  Charlie: 2,000 chips (calls 2000)

STEP 1: Identify all-in players sorted by contribution
  Alice: 500 (all-in) ← Lowest

STEP 2: Create main pot up to Alice's cap (500)
  ┌─────────────────────────────────────┐
  │         MAIN POT: 1,500             │
  │  (500 from Alice, Bob, Charlie)     │
  │  Eligible: Alice, Bob, Charlie      │
  └─────────────────────────────────────┘

STEP 3: Create side pot for remaining chips
  Bob's remaining: 2000 - 500 = 1500
  Charlie's remaining: 2000 - 500 = 1500
  
  ┌─────────────────────────────────────┐
  │        SIDE POT: 3,000              │
  │   (1500 from Bob + 1500 Charlie)    │
  │   Eligible: Bob, Charlie ONLY       │
  └─────────────────────────────────────┘

SHOWDOWN SCENARIOS:

Scenario A: Alice has best hand (Royal Flush)
  ✅ Alice wins Main Pot: 1,500
  ✅ Bob/Charlie compete for Side Pot: 3,000
     (best of Bob/Charlie wins 3,000)
  
  Result: Alice gets 1,500 (can't win more than she put in)

Scenario B: Bob has best hand (Straight Flush)
  ✅ Bob wins Main Pot: 1,500
  ✅ Bob wins Side Pot: 3,000
  
  Result: Bob wins 4,500 (all pots he's eligible for)

Scenario C: Charlie has best hand
  ✅ Charlie wins Main Pot: 1,500
  ✅ Charlie wins Side Pot: 3,000
  
  Result: Charlie wins 4,500
```

---

## 🎲 Hand Evaluation Flow

```
┌─────────────────────────────────────────────────────────────┐
│         7-CARD TO BEST 5-CARD EVALUATION                     │
└─────────────────────────────────────────────────────────────┘

INPUT: 7 cards (2 hole + 5 board)
         │
         ▼
┌─────────────────────────────────────┐
│ Generate all 21 possible 5-card    │
│ combinations (choose 5 from 7)     │
└──────────────┬──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ For each combination │
    └──────────┬───────────┘
               │
               ▼
    ┌─────────────────────────┐
    │ Check for patterns:     │
    │  - Flush? (5 same suit) │
    │  - Straight? (sequence) │
    │  - N of a kind?         │
    └──────────┬──────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Assign rank 0-9:         │
    │  9 = Royal Flush         │
    │  8 = Straight Flush      │
    │  7 = Four of a Kind      │
    │  6 = Full House          │
    │  5 = Flush               │
    │  4 = Straight            │
    │  3 = Three of a Kind     │
    │  2 = Two Pair            │
    │  1 = One Pair            │
    │  0 = High Card           │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Extract values for ties: │
    │  - Pair rank             │
    │  - Kickers (high→low)    │
    └──────────┬───────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Compare all 21 combinations         │
│ Keep the BEST hand                  │
└──────────────┬───────────────────────┘
               │
               ▼
OUTPUT: Best 5-card hand with rank + values

EXAMPLE:
  Hole: A♠ K♠
  Board: Q♠ J♠ 10♠ 9♥ 2♦
  
  Best hand: A♠ K♠ Q♠ J♠ 10♠
  Rank: 9 (Royal Flush)
  Values: [12] (Ace-high)
```

---

## 🃏 Action Validation Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│           CAN PLAYER CHECK AFTER A RAISE?                    │
└─────────────────────────────────────────────────────────────┘

Player wants to CHECK
         │
         ▼
┌────────────────────────┐
│ toCall = currentBet -  │
│   player.committed     │
└──────────┬─────────────┘
           │
           ▼
    ┌──────────────┐
    │ toCall = 0?  │
    └───┬──────────┘
        │
    ┌───┴───┐
    │       │
   YES      NO
    │       │
    │       └──► ❌ REJECT: "Cannot check - must call or raise"
    │
    └──► ✅ ALLOW: Player may check


┌─────────────────────────────────────────────────────────────┐
│              CAN PLAYER RAISE TO X?                          │
└─────────────────────────────────────────────────────────────┘

Player wants to RAISE to X
         │
         ▼
┌────────────────────────────┐
│ raiseAmount = X -          │
│   currentBet               │
└──────────┬─────────────────┘
           │
           ▼
┌────────────────────────────────┐
│ raiseAmount ≥ lastRaiseSize?  │
└────────┬───────────────────────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    │    ┌────▼─────────────────────────┐
    │    │ Is all-in (X = full stack)? │
    │    └────┬─────────────────────────┘
    │         │
    │    ┌────┴────┐
    │    │         │
    │   YES       NO
    │    │         │
    │    │         └──► ❌ REJECT: "Min raise is Y"
    │    │
    │    └──► ✅ ALLOW: All-in (may not reopen action)
    │
    └──► ✅ ALLOW: Valid raise (reopens action)


EXAMPLE:
  Blinds: 50/100
  Alice bets 600
  
  currentBet = 600
  lastRaiseSize = 600 (from 0 to 600)
  
  Bob wants to raise to 800:
    raiseAmount = 800 - 600 = 200
    200 ≥ 600? NO
    Is all-in? NO
    ❌ REJECT: "Min raise is 1200"
  
  Bob wants to raise to 1200:
    raiseAmount = 1200 - 600 = 600
    600 ≥ 600? YES
    ✅ ALLOW: Valid raise
    
    Update: currentBet = 1200, lastRaiseSize = 600
```

---

## 🏆 Showdown Order

```
┌─────────────────────────────────────────────────────────────┐
│              SHOWDOWN PROTOCOL                               │
└─────────────────────────────────────────────────────────────┘

                  ┌─────────────────┐
                  │   River ends    │
                  └────────┬────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
      ┌───────▼────────┐        ┌──────▼──────┐
      │ Was there a    │        │ Everyone    │
      │ bet on river?  │        │ checked?    │
      └───────┬────────┘        └──────┬──────┘
              │ YES                    │ YES
              │                        │
    ┌─────────▼─────────┐     ┌────────▼────────┐
    │ Last aggressor    │     │ First player    │
    │ shows FIRST       │     │ left of button  │
    │                   │     │ shows FIRST     │
    │ Others can:       │     │                 │
    │  - Show (claim)   │     │ Proceed         │
    │  - Muck (concede) │     │ clockwise       │
    └───────────────────┘     └─────────────────┘


EXAMPLE 1: Bet on river
  ┌─────────────────────────────────────┐
  │ Seat 2 (BTN): Check                 │
  │ Seat 4: Bet 1000                    │ ← Last aggressor
  │ Seat 2: Call                        │
  └─────────────────────────────────────┘
  
  Showdown order:
    1. Seat 4 shows first (last aggressor)
    2. Seat 2 can show or muck
       - Show if better hand
       - Muck if worse hand

EXAMPLE 2: Everyone checks river
  ┌─────────────────────────────────────┐
  │ BTN at Seat 3                       │
  │ Seat 4: Check                       │ ← Left of button
  │ Seat 0: Check                       │
  │ Seat 3 (BTN): Check                 │
  └─────────────────────────────────────┘
  
  Showdown order:
    1. Seat 4 shows first (left of BTN)
    2. Seat 0 shows next (clockwise)
    3. Seat 3 shows last (BTN)
```

---

## 🎯 Your Bug Fix Visualization

```
┌─────────────────────────────────────────────────────────────┐
│        THE BUG: AI Checks After Your Raise                   │
└─────────────────────────────────────────────────────────────┘

❌ OLD CODE FLOW:
  You: RAISE 250,000
       │
       ▼
  ┌─────────────────────────┐
  │ simulateAIAction()      │
  │  - Pick random action   │
  │  - No validation!       │
  └───────────┬─────────────┘
              │
              ▼
        ┌──────────┐
        │ "check"  │ ← ❌ BUG! This is illegal!
        └────┬─────┘
             │
             ▼
    [AI illegally checks]


✅ NEW CODE FLOW:
  You: RAISE 250,000
       │
       │ (sets currentBet = 250000)
       ▼
  ┌────────────────────────────┐
  │ getValidActions(AI_seat)   │
  │   - currentBet = 250000    │
  │   - AI.committed = 0       │
  │   - toCall = 250000        │
  └───────────┬────────────────┘
              │
              ▼
  ┌────────────────────────────┐
  │ Returns:                   │
  │   canCheck: FALSE ❌       │
  │   canCall: TRUE ✅         │
  │   callAmount: 250000       │
  │   canRaise: TRUE ✅        │
  │   minRaise: 500000         │
  │   canFold: TRUE ✅         │
  └───────────┬────────────────┘
              │
              ▼
  ┌────────────────────────────┐
  │ AI MUST choose:            │
  │  - CALL 250,000            │
  │  - RAISE to 500,000+       │
  │  - FOLD                    │
  │                            │
  │ ❌ CHECK is IMPOSSIBLE!    │
  └────────────────────────────┘

Result: Bug is FIXED! 🎉
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         COMPLETE SYSTEM ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────┘

CLIENT (React/TypeScript)
  │
  │ User clicks "RAISE 250,000"
  │
  ▼
┌─────────────────────────────┐
│ App.tsx                     │
│  - Emit 'player-action'     │
│    { tableId, seatId,       │
│      action: 'RAISE',       │
│      amount: 250000 }       │
└──────────────┬──────────────┘
               │
               │ Socket.IO
               │
               ▼
SERVER (Node.js/Socket.IO)
┌─────────────────────────────┐
│ server.ts                   │
│  - Receive action event     │
│  - Get table from Map       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ poker-engine.ts             │
│  processAction()            │
│    ├─ getValidActions()    │
│    ├─ Validate move        │
│    ├─ Update player stack  │
│    ├─ Update pot(s)        │
│    ├─ Check round complete │
│    └─ advanceStreet()      │
└──────────────┬──────────────┘
               │
               │ Returns { success, message }
               │
               ▼
┌─────────────────────────────┐
│ server.ts                   │
│  - If success:              │
│    getTableState()          │
│    emit 'game-state' to all │
└──────────────┬──────────────┘
               │
               │ Socket.IO
               │
               ▼
CLIENT (React/TypeScript)
┌─────────────────────────────┐
│ App.tsx                     │
│  - Receive 'game-state'     │
│  - Update UI:               │
│    - board cards            │
│    - pot amount             │
│    - player stacks          │
│    - whose turn             │
│    - available actions      │
└─────────────────────────────┘
```

---

## 🎓 Complete Rule Reference

```
┌─────────────────────────────────────────────────────────────┐
│           POKER RULES QUICK REFERENCE                        │
└─────────────────────────────────────────────────────────────┘

ACTIONS:
  ✅ FOLD    - Give up hand, lose all contributed chips
  ✅ CHECK   - Pass action (ONLY if no bet to match)
  ✅ CALL    - Match current bet
  ✅ BET     - First bet on a street (min = table.minBet)
  ✅ RAISE   - Increase bet (min = currentBet + lastRaiseSize)
  ✅ ALL-IN  - Bet all remaining chips

POSITIONS:
  Button (BTN) ──► Small Blind (SB) ──► Big Blind (BB)
  
  Preflop:  First to act = left of BB
  Postflop: First to act = left of BTN (SB if still in)
  
  Heads-up: BTN posts SB, acts first preflop, last postflop

BETTING ROUNDS:
  1. PREFLOP - After hole cards dealt
  2. FLOP    - After 3 community cards
  3. TURN    - After 4th community card
  4. RIVER   - After 5th community card
  
  Round ends when:
    - All folded except one (immediate winner)
    - All matched current bet and acted

HAND RANKINGS (best → worst):
  9. Royal Flush      A♠ K♠ Q♠ J♠ 10♠
  8. Straight Flush   9♥ 8♥ 7♥ 6♥ 5♥
  7. Four of a Kind   K♠ K♥ K♦ K♣ A♠
  6. Full House       J♠ J♥ J♦ 7♠ 7♥
  5. Flush            A♠ 9♠ 7♠ 5♠ 2♠
  4. Straight         10♥ 9♠ 8♦ 7♣ 6♥
  3. Three of a Kind  Q♠ Q♥ Q♦ A♠ K♠
  2. Two Pair         A♠ A♥ 9♦ 9♣ K♠
  1. One Pair         K♠ K♥ A♠ Q♦ J♣
  0. High Card        A♠ K♥ Q♦ 9♣ 7♠

SIDE POTS:
  - Created when player(s) go all-in
  - Each pot has a "cap" (max per-player contribution)
  - Players only eligible for pots they contributed to
  - Showdown resolves main pot first, then side pots
```

---

## 🚀 Quick Start Guide

```
┌─────────────────────────────────────────────────────────────┐
│           HOW TO USE THE NEW ENGINE                          │
└─────────────────────────────────────────────────────────────┘

STEP 1: Create a table
  const table = createTable('table-1', 6, 50, 100);

STEP 2: Add players
  addPlayerToTable(table, 0, 'Alice', 10000);
  addPlayerToTable(table, 1, 'Bob', 10000);

STEP 3: Start hand
  startNewHand(table);
  // ✅ Button moved
  // ✅ Blinds posted
  // ✅ Cards dealt
  // ✅ State = PREFLOP

STEP 4: Players act
  const valid = getValidActions(table, 0);
  // Check what Alice can do
  
  if (valid.canRaise) {
    processAction(table, 0, 'RAISE', 500);
  }

STEP 5: Automatic progression
  // Engine handles:
  // ✅ Moving to next player
  // ✅ Advancing streets (FLOP/TURN/RIVER)
  // ✅ Creating side pots
  // ✅ Showdown and winners

STEP 6: Get state for UI
  const state = getTableState(table);
  // Send to all clients via Socket.IO
```

---

**🎉 You now have a visual understanding of the entire poker engine!**

**📁 Files:** All diagrams in `POKER_FLOW_DIAGRAMS.md`  
**🎯 Status:** Professional-grade, tournament-ready poker engine  
**✅ Bug Fixed:** No more illegal checks after raises!

🎰 **Enjoy your perfect poker game!** 🔥
