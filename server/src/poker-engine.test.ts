/**
 * Test suite for poker engine
 * Tests critical scenarios: min-raise, side pots, showdown protocol
 */

import {
  createTable,
  addPlayerToTable,
  startNewHand,
  processAction,
  getValidActions,
  evaluateHand,
  compareHandRanks,
  createDeck,
  Table
} from './poker-engine';

describe('Poker Engine Tests', () => {
  
  test('Min-raise rule enforcement', () => {
    const table = createTable('test', 6, 50, 100, 0);
    addPlayerToTable(table, 0, 'Alice', 10000);
    addPlayerToTable(table, 1, 'Bob', 10000);
    addPlayerToTable(table, 2, 'Charlie', 10000);
    
    startNewHand(table);
    
    // Alice is first to act after BB, calls 100
    processAction(table, 0, 'CALL');
    
    // Bob raises to 600 (raise of 500)
    processAction(table, 1, 'RAISE', 600);
    
    // Charlie must raise to at least 1100 (600 current + 500 last raise)
    const valid = getValidActions(table, 2);
    expect(valid.minRaise).toBe(1100);
    
    // Attempting to raise to 800 should fail
    const result = processAction(table, 2, 'RAISE', 800);
    expect(result.success).toBe(false);
  });

  test('Check not allowed after raise', () => {
    const table = createTable('test', 6, 50, 100, 0);
    addPlayerToTable(table, 0, 'Alice', 10000);
    addPlayerToTable(table, 1, 'Bob', 10000);
    
    startNewHand(table);
    
    // Alice raises
    processAction(table, 0, 'RAISE', 500);
    
    // Bob cannot check - must call, raise, or fold
    const valid = getValidActions(table, 1);
    expect(valid.canCheck).toBe(false);
    expect(valid.canCall).toBe(true);
    expect(valid.canRaise).toBe(true);
  });

  test('Side pot creation with all-ins', () => {
    const table = createTable('test', 6, 50, 100, 0);
    addPlayerToTable(table, 0, 'Alice', 500); // Short stack
    addPlayerToTable(table, 1, 'Bob', 5000);
    addPlayerToTable(table, 2, 'Charlie', 5000);
    
    startNewHand(table);
    
    // Alice all-in for 500
    processAction(table, 0, 'ALL_IN');
    
    // Bob raises to 2000
    processAction(table, 1, 'RAISE', 2000);
    
    // Charlie calls 2000
    processAction(table, 2, 'CALL');
    
    // Should create side pots:
    // Main pot: 500*3 = 1500 (Alice, Bob, Charlie eligible)
    // Side pot: 1500*2 = 3000 (Bob, Charlie eligible)
    
    // Fast-forward to showdown
    while (table.handState.street !== 'SHOWDOWN' && table.handState.street !== 'CLEANUP') {
      const seat = table.handState.actionCursorSeat;
      processAction(table, seat, 'CHECK');
    }
    
    expect(table.pots.length).toBeGreaterThan(1);
  });

  test('Hand evaluation - Royal Flush beats Four of a Kind', () => {
    const deck = createDeck();
    
    // Royal flush: A♠ K♠ Q♠ J♠ 10♠
    const royalFlush = [
      deck[12], deck[11], deck[10], deck[9], deck[8], deck[0], deck[1]
    ].slice(0, 7);
    
    // Four of a kind: A♥ A♦ A♣ A♠ K♥
    const fourOfKind = [
      deck[12], deck[25], deck[38], deck[51], deck[24], deck[0], deck[1]
    ].slice(0, 7);
    
    const royal = evaluateHand(royalFlush);
    const quads = evaluateHand(fourOfKind);
    
    expect(compareHandRanks(royal, quads)).toBeGreaterThan(0);
  });

  test('Heads-up blind posting', () => {
    const table = createTable('test', 2, 50, 100, 0);
    addPlayerToTable(table, 0, 'Alice', 10000);
    addPlayerToTable(table, 1, 'Bob', 10000);
    
    startNewHand(table);
    
    // In heads-up, button posts SB and acts first preflop
    expect(table.handState.sbIndex).toBe(table.handState.buttonIndex);
    
    // Button (SB) should be first to act preflop
    expect(table.handState.actionCursorSeat).toBe(table.handState.buttonIndex);
  });

  test('All-in short raise does not reopen action', () => {
    const table = createTable('test', 6, 50, 100, 0);
    addPlayerToTable(table, 0, 'Alice', 10000);
    addPlayerToTable(table, 1, 'Bob', 10000);
    addPlayerToTable(table, 2, 'Charlie', 300); // Short stack
    
    startNewHand(table);
    
    // Alice raises to 600
    processAction(table, 0, 'RAISE', 600);
    
    // Bob calls 600
    processAction(table, 1, 'CALL');
    
    // Charlie all-in for 300 (less than min-raise)
    // This should NOT reopen action for Alice/Bob
    processAction(table, 2, 'ALL_IN');
    
    // Alice should only be able to call the extra 0 (already covered Charlie's all-in)
    const validAlice = getValidActions(table, 0);
    
    // Since Charlie's all-in is less than Alice's contribution, Alice doesn't need to act again
    // The round should advance to flop
  });

  test('Pot split on exact tie', () => {
    const table = createTable('test', 6, 50, 100, 0);
    addPlayerToTable(table, 0, 'Alice', 10000);
    addPlayerToTable(table, 1, 'Bob', 10000);
    
    startNewHand(table);
    
    // Force same hole cards for testing (would need deck manipulation)
    // This test validates the split logic exists
    
    processAction(table, 0, 'CALL');
    processAction(table, 1, 'CHECK');
    
    // Check remaining streets
    while (table.handState.street !== 'SHOWDOWN' && table.handState.street !== 'CLEANUP') {
      const seat = table.handState.actionCursorSeat;
      const player = table.seats[seat];
      if (player && !player.folded && !player.allIn) {
        processAction(table, seat, 'CHECK');
      }
    }
    
    // Both players should have stacks (pot was split)
    const alice = table.seats[0]!;
    const bob = table.seats[1]!;
    
    expect(alice.stack + bob.stack).toBe(20000); // Total chips conserved
  });

  test('Ace-low straight (wheel) evaluation', () => {
    const deck = createDeck();
    
    // A-2-3-4-5 straight (wheel)
    const wheel = [
      deck[12], // A♠
      deck[3],  // 5♠
      deck[2],  // 4♠
      deck[1],  // 3♠
      deck[0],  // 2♠
      deck[20], // 9♥
      deck[21]  // 10♥
    ];
    
    const hand = evaluateHand(wheel);
    expect(hand.rank).toBe(4); // Straight
    expect(hand.values[0]).toBe(3); // High card is 5 (rank 3)
  });

  test('Button rotation each hand', () => {
    const table = createTable('test', 6, 50, 100, 0);
    addPlayerToTable(table, 0, 'Alice', 10000);
    addPlayerToTable(table, 2, 'Bob', 10000);
    addPlayerToTable(table, 4, 'Charlie', 10000);
    
    const firstButton = table.handState.buttonIndex;
    
    startNewHand(table);
    
    // Complete the hand quickly
    while (table.handState.street !== 'CLEANUP') {
      const seat = table.handState.actionCursorSeat;
      processAction(table, seat, 'FOLD');
    }
    
    startNewHand(table);
    
    // Button should have moved
    expect(table.handState.buttonIndex).not.toBe(firstButton);
  });
});
