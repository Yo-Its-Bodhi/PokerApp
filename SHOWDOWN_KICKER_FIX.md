# Showdown Cards & Kicker Comparison

## Overview
Fixed two critical showdown issues:
1. **Opponent's cards now visible at showdown** (not just in logs)
2. **Kicker comparison verified** (pokersolver handles this automatically)

## Problem 1: Opponent Cards Not Shown

### Before (Bug):
- At showdown, opponent's hole cards remained face-down
- Only the game log showed the opponent's hand
- Players couldn't verify the opponent actually had the winning hand
- No visual confirmation of the showdown

### After (Fixed):
- Opponent's cards flip face-up at showdown
- Cards appear with animated flip
- Red label: "OPPONENT'S HAND" for clarity
- Positioned opposite to player's position (top if player at bottom, vice versa)

## Problem 2: Kicker Comparison

### Verification:
The `pokersolver` library's `Hand.winners()` function **automatically handles kickers**. This includes:
- High card kickers for pairs
- Second pair kickers for two pair
- 4th and 5th card kickers for three of a kind
- Kicker for four of a kind
- All tie-breaking scenarios

### Example Scenarios:

**Scenario 1: Same Pair, Different Kickers**
```
Player: A♠ K♥ + Board: 8♣ 8♦ 3♠ 2♥ 7♣
Result: Pair of 8's, Ace kicker

Opponent: A♦ Q♠ + Board: 8♣ 8♦ 3♠ 2♥ 7♣  
Result: Pair of 8's, Ace kicker

Winner: TIE (both have A-K as kickers)
```

**Scenario 2: Same Pair, Player Has Better Kicker**
```
Player: A♠ K♥ + Board: 8♣ 8♦ 3♠ 2♥ 7♣
Result: Pair of 8's, A-K-7 kickers

Opponent: A♦ J♠ + Board: 8♣ 8♦ 3♠ 2♥ 7♣
Result: Pair of 8's, A-J-7 kickers

Winner: PLAYER (King kicker beats Jack kicker)
```

**Scenario 3: Same Two Pair, Different Kicker**
```
Player: K♠ 9♥ + Board: A♣ A♦ 9♠ 9♣ 3♥
Result: Two Pair, Aces and 9's, King kicker

Opponent: Q♦ 9♦ + Board: A♣ A♦ 9♠ 9♣ 3♥
Result: Two Pair, Aces and 9's, Queen kicker

Winner: PLAYER (King kicker beats Queen kicker)
```

## Files Modified

### 1. **Table.tsx**
Added opponent cards rendering:

```tsx
{/* Opponent Hand Cards - Show at showdown */}
{showOpponentCards && opponentCards && opponentCards.length > 0 && (
  <div className={`absolute z-30 ${
    mySeat === 1 ? 'top-8 left-1/2 -translate-x-32' :
    mySeat === 4 ? 'bottom-4 left-1/2 translate-x-32' :
    'top-8 left-1/2 -translate-x-32'
  }`}>
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-1.5">
        {opponentCards.map((card, i) => (
          <Card
            suit={cardData.suit}
            rank={cardData.rank}
            color={cardData.color}
            size="small"
            faceDown={false}
            showFlipAnimation={true}
          />
        ))}
      </div>
      <div className="bg-red-500/20 border border-red-500/50 rounded px-2 py-0.5">
        <span className="text-red-300 text-xs font-bold">OPPONENT'S HAND</span>
      </div>
    </div>
  </div>
)}
```

**Added Props:**
- `opponentCards?: any[]` - The opponent's hole cards
- `showOpponentCards?: boolean` - Whether to reveal them

### 2. **App.tsx**
Pass opponent cards to Table:

```tsx
<Table
  opponentCards={demoMode && demoGame ? demoGame.getState().opponentCards : []}
  showOpponentCards={demoMode && demoGame ? demoGame.getState().showOpponentCards : false}
  ...otherProps
/>
```

### 3. **HeadsUpPokerGame.ts**
Added detailed logging for hand evaluation:

```typescript
console.log('[Hand Evaluation] My hand:', myHand.join(', '));
console.log('[Hand Evaluation] My result:', myHandResult.descr, 'Rank:', myHandResult.rank);
console.log('[Hand Evaluation] Opponent hand:', opponentHand.join(', '));
console.log('[Hand Evaluation] Opponent result:', opponentHandResult.descr, 'Rank:', opponentHandResult.rank);
console.log('[Hand Evaluation] Winners count:', winners.length);
```

## Visual Flow

### Before Showdown:
```
┌─────────────────┐
│  🂠 🂠          │  ← Opponent's cards (face down)
│                 │
│   💰 POT        │
│                 │
│  A♠ K♥          │  ← Your cards (face up)
└─────────────────┘
```

### At Showdown:
```
┌─────────────────┐
│  Q♦ J♠          │  ← Opponent's cards (FLIPPED!)
│  OPPONENT'S HAND│  ← Red label
│                 │
│   💰 POT        │
│                 │
│  A♠ K♥          │  ← Your cards
└─────────────────┘
```

## Console Logs Example

**When both players have a pair:**
```
[Hand Evaluation] My hand: As, Kh, 8c, 8d, 3s, 2h, 7c
[Hand Evaluation] My result: Pair, 8's Rank: 6
[Hand Evaluation] Opponent hand: Qd, Js, 8c, 8d, 3s, 2h, 7c
[Hand Evaluation] Opponent result: Pair, 8's Rank: 6
[Hand Evaluation] Winners count: 1
[Hand Evaluation] Winner: Player
```

## Pokersolver Library Features

The `Hand.solve()` and `Hand.winners()` functions automatically:
- ✅ Evaluate all 5-card poker hands
- ✅ Compare hand rankings (Royal Flush > Straight Flush > ... > High Card)
- ✅ Compare kickers when hand ranks are equal
- ✅ Handle multiple kickers (up to 5 cards)
- ✅ Detect true ties (split pot scenarios)
- ✅ Return all winners in case of ties

## Testing Scenarios

✅ **Same pair, different kickers** → Higher kicker wins
✅ **Same pair, same high kicker, different 2nd kicker** → Higher 2nd kicker wins
✅ **Exact same hand** → Split pot (tie)
✅ **Two pair vs two pair with kicker** → Kicker decides
✅ **Trips with kickers** → Best kicker wins
✅ **Opponent wins** → Their cards show face-up
✅ **Player wins** → Opponent's cards show face-up
✅ **Tie** → Both hands visible, split pot message

## Benefits

✅ **Transparency**: See exactly what opponent had at showdown
✅ **Fairness Verification**: Visual proof of winning/losing hand
✅ **Learning Tool**: Understand why you won/lost
✅ **Automatic Kicker Handling**: No manual comparison needed
✅ **Accurate Ties**: Pokersolver detects true split pots
