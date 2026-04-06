/**
 * Fishing Chains - Core Game Logic (Finite Deck + 5-of-9 Poker Hands + Shop)
 */

// =====================
// DATA MODEL — 52-card deck definition
// =====================

// 13 fish species, one per rank
const DECK_FISH = [
    { rank: 1,  name: "Trout",     rarity: "common",    baseWeight: 3   },
    { rank: 2,  name: "Bass",      rarity: "common",    baseWeight: 5   },
    { rank: 3,  name: "Catfish",   rarity: "common",    baseWeight: 7   },
    { rank: 4,  name: "Pike",      rarity: "common",    baseWeight: 9   },
    { rank: 5,  name: "Snapper",   rarity: "common",    baseWeight: 12  },
    { rank: 6,  name: "Grouper",   rarity: "common",    baseWeight: 16  },
    { rank: 7,  name: "Mahi",      rarity: "common",    baseWeight: 20  },
    { rank: 8,  name: "Salmon",    rarity: "rare",      baseWeight: 28  },
    { rank: 9,  name: "Tarpon",    rarity: "rare",      baseWeight: 38  },
    { rank: 10, name: "Tuna",      rarity: "rare",      baseWeight: 55  },
    { rank: 11, name: "Barracuda", rarity: "rare",      baseWeight: 80  },
    { rank: 12, name: "Swordfish", rarity: "legendary", baseWeight: 150 },
    { rank: 13, name: "Marlin",    rarity: "legendary", baseWeight: 300 },
];

const DECK_COLORS = ["blue", "red", "green", "gold"];

const SUIT_COLORS = {
    blue:  "#58a6ff",
    red:   "#f85149",
    green: "#3fb950",
    gold:  "#ffd33d"
};

const SIZES = ["small", "medium", "large"];

// =====================
// PACK DEFINITIONS
// =====================

const PACK_TYPES = {
    shark: {
        name: "Shark Pack",
        icon: "🦈",
        description: "Aggressive high-rank fish. Spike scoring.",
        themeColor: "#e63946",
        // Favors high-rank fish
        fishPool: [
            { rank: 7,  name: "Mahi",      rarity: "common",    baseWeight: 20  },
            { rank: 8,  name: "Salmon",    rarity: "rare",      baseWeight: 28  },
            { rank: 9,  name: "Tarpon",    rarity: "rare",      baseWeight: 38  },
            { rank: 10, name: "Tuna",      rarity: "rare",      baseWeight: 55  },
            { rank: 11, name: "Barracuda", rarity: "rare",      baseWeight: 80  },
            { rank: 12, name: "Swordfish", rarity: "legendary", baseWeight: 150 },
            { rank: 13, name: "Marlin",    rarity: "legendary", baseWeight: 300 },
        ],
        weightMult: 1.15
    },
    whale: {
        name: "Whale Pack",
        icon: "🐋",
        description: "Massive weight. Slow but powerful.",
        themeColor: "#457b9d",
        fishPool: [
            { rank: 5,  name: "Snapper",   rarity: "common",    baseWeight: 12  },
            { rank: 6,  name: "Grouper",   rarity: "common",    baseWeight: 16  },
            { rank: 7,  name: "Mahi",      rarity: "common",    baseWeight: 20  },
            { rank: 8,  name: "Salmon",    rarity: "rare",      baseWeight: 28  },
            { rank: 9,  name: "Tarpon",    rarity: "rare",      baseWeight: 38  },
            { rank: 10, name: "Tuna",      rarity: "rare",      baseWeight: 55  },
            { rank: 11, name: "Barracuda", rarity: "rare",      baseWeight: 80  },
        ],
        weightMult: 1.6
    },
    crustacean: {
        name: "Crustacean Pack",
        icon: "🦀",
        description: "Low weight, but built-in multiplier bonuses.",
        themeColor: "#e9c46a",
        fishPool: [
            { rank: 1,  name: "Trout",     rarity: "common",    baseWeight: 3   },
            { rank: 2,  name: "Bass",      rarity: "common",    baseWeight: 5   },
            { rank: 3,  name: "Catfish",   rarity: "common",    baseWeight: 7   },
            { rank: 4,  name: "Pike",      rarity: "common",    baseWeight: 9   },
            { rank: 5,  name: "Snapper",   rarity: "common",    baseWeight: 12  },
            { rank: 6,  name: "Grouper",   rarity: "common",    baseWeight: 16  },
        ],
        weightMult: 0.7,
        bonusMult: 0.5  // each crustacean card gives +0.5 multiplier when scored
    }
};

const HOLO_CHANCE = 0.10;
const HOLO_MULT_BONUS = 1; // +1 multiplier when a holo card is in the scored hand

const ROUND_TARGETS = [100, 250, 500, 850, 1300, 1900, 2700, 3800, 5200, 7000];

const BASE_DRAW_COUNT = 9;
const BASE_SELECT_COUNT = 5;

const MODIFIER_POOL = [
    // --- Original ---
    {
        id: "lucky_lure",
        name: "Lucky Lure",
        description: "Rare/Legendary fish in deck get +30% weight",
        shopCost: 120
    },
    {
        id: "heavy_line",
        name: "Heavy Line",
        description: "Double selected fish weight contribution",
        shopCost: 160
    },
    {
        id: "trophy_hunter",
        name: "Trophy Hunter",
        description: "Selected highest-weight fish scores x4, ignores other selected fish weight",
        shopCost: 220
    },
    // --- Draw Modifiers ---
    {
        id: "deep_sea_luck",
        name: "Deep Sea Luck",
        description: "Draw from top and bottom of deck, pick the best cards",
        shopCost: 180
    },
    {
        id: "double_catch",
        name: "Double Catch",
        description: "20% chance to draw 10 fish instead of 9",
        shopCost: 140
    },
    {
        id: "selective_net",
        name: "Selective Net",
        description: "Lowest weight fish in hand is replaced from deck",
        shopCost: 130
    },
    // --- Combo Modifiers ---
    {
        id: "combo_booster",
        name: "Combo Booster",
        description: "+1 to all combo multipliers",
        shopCost: 200
    },
    {
        id: "pair_specialist",
        name: "Pair Specialist",
        description: "Pairs are x4 instead of x2",
        shopCost: 170
    },
    {
        id: "all_different_master",
        name: "All Different Master",
        description: "Flush bonus +2 multiplier",
        shopCost: 160
    },
    // --- Weight Modifiers ---
    {
        id: "big_game_hunter",
        name: "Big Game Hunter",
        description: "Large fish weight +50%",
        shopCost: 150
    },
    {
        id: "heavy_waters",
        name: "Heavy Waters",
        description: "Fish gain +5% weight each round",
        shopCost: 190
    },
    // --- Risk Modifiers ---
    {
        id: "risky_hook",
        name: "Risky Hook",
        description: "x2 score but 20% chance to score 0",
        shopCost: 160
    },
    {
        id: "last_cast",
        name: "Last Cast",
        description: "Final hand of round gets x3",
        shopCost: 200
    },
    // --- Utility Modifiers ---
    {
        id: "extra_slot",
        name: "Extra Slot",
        description: "Select 6 fish instead of 5",
        shopCost: 250
    },
    {
        id: "second_chance",
        name: "Second Chance",
        description: "Bad hands (< 50% target) refund a reroll",
        shopCost: 140
    }
];

const UTILITY_ITEMS = [
    {
        id: "extra_reroll",
        name: "Extra Reroll",
        description: "+1 reroll each round",
        shopCost: 150,
        type: "utility"
    },
    {
        id: "extra_hand",
        name: "Extra Hand",
        description: "+1 hand submission each round",
        shopCost: 250,
        type: "utility"
    }
];

// =====================
// GAME STATE
// =====================

let currentHand = [];
let selectedFishIndexes = [];
let currentSort = 'default'; // 'default' | 'color' | 'fish' | 'rank'
let drawOrder = []; // original indices for 'default' sort
let rerollsRemaining = 2;
let handsRemaining = 2;
let hasScored = false;
let runOver = false;
let currentEncounter = 1;
let inEndlessMode = false;
let targetScore = ROUND_TARGETS[0];
let currentScore = 0;
let roundScoreTotal = 0;
let modifiers = [];

// Redraw / Discard Logic
let discardsRemaining = 3;
let drawsRemaining = 3;
let baseDiscardsPerRound = 3;
let baseDrawsPerRound = 3;

// DECK STATE
let drawPile = [];
let discardPile = [];

// SHOP STATE
let gold = 0;
let baseRerollsPerRound = 2;
let baseHandsPerRound = 2;
let shopOffers = [];
let shopPurchasedThisVisit = false;

// REWARD STATE
let rewardStep = 'pack'; // 'pack' | 'trim' | 'done'
let packOptions = [];
let justAddedCardId = null;

// DEBUFF SYSTEM
const DEBUFF_POOL = [
    { id: "low_tide", name: "Low Tide", description: "Draw -1 fish per hand" },
    { id: "choppy_waters", name: "Choppy Waters", description: "1 fewer hand submission per round" },
    { id: "heavy_fog", name: "Heavy Fog", description: "All rerolls disabled" }
];
let currentDebuff = null;

// =====================
// DOM ELEMENTS
// =====================

const handDisplay = document.getElementById('hand-display');
const drawBtn = document.getElementById('draw-btn');
const drawCountEl = document.getElementById('draw-count-label');
const rerollBtn = document.getElementById('reroll-btn');
const rerollCountEl = document.getElementById('reroll-count-label');
const submitBtn = document.getElementById('submit-btn');
const baseScoreEl = document.getElementById('base-score');
const multiplierEl = document.getElementById('multiplier');
const scoreTextEl = document.getElementById('score');
const roundScoreTotalValEl = document.getElementById('round-score-total');
const handsRemainingValEl = document.getElementById('hands-remaining-val');
const targetValEl = document.getElementById('target-val');
const comboTextEl = document.getElementById('combo-text');
const selectionCountEl = document.getElementById('selection-count');
const activeModifiersEl = document.getElementById('active-modifiers');
const roundInfoEl = document.getElementById('round-info');
const targetInfoEl = document.getElementById('target-info');
const resultTextEl = document.getElementById('result-text');
const goldValEl = document.getElementById('gold-val');
const debuffIndicatorEl = document.getElementById('debuff-indicator');

// Deck info DOM
const deckCountEl = document.getElementById('deck-count');
const discardCountEl = document.getElementById('discard-count');
const deckBlueEl = document.getElementById('deck-blue');
const deckRedEl = document.getElementById('deck-red');
const deckGreenEl = document.getElementById('deck-green');
const deckGoldEl = document.getElementById('deck-gold');

// Shop DOM
const shopPanel = document.getElementById('shop-panel');
const shopGoldValEl = document.getElementById('shop-gold-val');
const shopOffersEl = document.getElementById('shop-offers');
const shopRerollBtn = document.getElementById('shop-reroll-btn');
const shopNextRoundBtn = document.getElementById('shop-next-round-btn');

// Reward DOM
const rewardPanel = document.getElementById('reward-panel');
const rewardTitleEl = document.getElementById('reward-title');
const rewardSubtitleEl = document.getElementById('reward-subtitle');
const rewardCardsEl = document.getElementById('reward-cards');
const rewardSkipBtn = document.getElementById('reward-skip-btn');
const rewardProceedBtn = document.getElementById('reward-proceed-btn');

// Game board sections to hide during shop/reward
const gameBoard = document.getElementById('game-board');
const modifiersArea = document.getElementById('modifiers-area');
const controlsFooter = document.getElementById('controls');
const deckInfoArea = document.getElementById('deck-info');

// =====================
// DECK SYSTEM
// =====================

function createCard(fishData, color, opts) {
    opts = opts || {};
    const weightMult = opts.weightMult || 1;
    const variance = 0.8 + Math.random() * 0.4;
    const weight = Math.max(1, Math.floor(fishData.baseWeight * variance * weightMult));
    const size = SIZES[Math.floor(Math.random() * SIZES.length)];
    const isHolo = opts.forceHolo || (opts.canBeHolo && Math.random() < HOLO_CHANCE);

    const card = {
        id: Math.random().toString(36).substr(2, 9),
        name: fishData.name,
        rank: fishData.rank,
        rarity: fishData.rarity,
        color: color,
        baseWeight: fishData.baseWeight,
        weight: weight,
        size: size,
        holo: isHolo,
        bonusMult: opts.bonusMult || 0,
        packType: opts.packType || null
    };
    return card;
}

function buildStarterDeck() {
    const deck = [];
    // 4 colors × 13 ranks = 52 cards
    DECK_COLORS.forEach(color => {
        DECK_FISH.forEach(fish => {
            deck.push(createCard(fish, color));
        });
    });
    return deck;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function initDeck() {
    const fullDeck = buildStarterDeck();
    drawPile = shuffleArray(fullDeck);
    discardPile = [];
    updateDeckUI();
}

// Add cards to the deck (for future shop packs)
function addCardsToDeck(cards) {
    cards.forEach(c => drawPile.push(c));
    shuffleArray(drawPile);
    updateDeckUI();
}

// Remove cards from the deck by predicate (for future shop)
function removeCardsFromDeck(predicate, count) {
    let removed = 0;
    drawPile = drawPile.filter(card => {
        if (removed < count && predicate(card)) {
            removed++;
            return false;
        }
        return true;
    });
    updateDeckUI();
    return removed;
}

function reshuffleDiscard() {
    drawPile = drawPile.concat(discardPile);
    discardPile = [];
    shuffleArray(drawPile);
}

function drawCardsFromDeck(count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
        if (drawPile.length === 0) {
            if (discardPile.length === 0) break; // truly out of cards
            reshuffleDiscard();
        }
        if (drawPile.length > 0) {
            drawn.push(drawPile.pop());
        }
    }
    return drawn;
}

function discardCards(cards) {
    cards.forEach(c => discardPile.push(c));
}

function updateDeckUI() {
    if (deckCountEl) deckCountEl.textContent = drawPile.length;
    if (discardCountEl) discardCountEl.textContent = discardPile.length;

    // Color counts in draw pile
    const colorCounts = { blue: 0, red: 0, green: 0, gold: 0 };
    drawPile.forEach(c => { colorCounts[c.color] = (colorCounts[c.color] || 0) + 1; });
    if (deckBlueEl) deckBlueEl.textContent = colorCounts.blue;
    if (deckRedEl) deckRedEl.textContent = colorCounts.red;
    if (deckGreenEl) deckGreenEl.textContent = colorCounts.green;
    if (deckGoldEl) deckGoldEl.textContent = colorCounts.gold;
}

// =====================
// HAND EVALUATION — Poker-style combos
// =====================

function getMaxSelectionSize() {
    return modifiers.some(m => m.id === 'extra_slot') ? (BASE_SELECT_COUNT + 1) : BASE_SELECT_COUNT;
}

function checkFlush(hand) {
    if (hand.length < 2) return false;
    return hand.every(f => f.color === hand[0].color);
}

function checkStraight(hand) {
    if (hand.length < 3) return false;
    const ranks = hand.map(f => f.rank).sort((a, b) => a - b);
    for (let i = 1; i < ranks.length; i++) {
        if (ranks[i] !== ranks[i - 1] + 1) return false;
    }
    return true;
}

function evaluateHand(hand) {
    const counts = {};
    hand.forEach(fish => {
        counts[fish.name] = (counts[fish.name] || 0) + 1;
    });

    const values = Object.values(counts).sort((a, b) => b - a);
    const isFlush = checkFlush(hand);
    const isStraight = checkStraight(hand);

    let hasComboBooster = modifiers.some(m => m.id === 'combo_booster');
    let hasPairSpecialist = modifiers.some(m => m.id === 'pair_specialist');
    let hasFlushBooster = modifiers.some(m => m.id === 'all_different_master');
    let comboBonus = hasComboBooster ? 1 : 0;

    let multiplier = 1;
    let flatBonus = 0;
    let label = "High Fish";

    if (values[0] === 5) {
        multiplier = 10 + comboBonus;
        label = "Five of a Kind";
    } else if (isStraight && isFlush) {
        multiplier = 8 + comboBonus;
        label = "Straight Flush";
    } else if (values[0] === 4) {
        multiplier = 6 + comboBonus;
        label = "Four of a Kind";
    } else if (values[0] === 3 && values[1] === 2) {
        multiplier = 5 + comboBonus;
        label = "Full House";
    } else if (isFlush) {
        let flushMult = 4;
        if (hasFlushBooster) flushMult += 2;
        multiplier = flushMult + comboBonus;
        label = "Flush";
    } else if (isStraight) {
        multiplier = 4 + comboBonus;
        label = "Straight";
    } else if (values[0] === 3) {
        multiplier = 3 + comboBonus;
        label = "Three of a Kind";
    } else if (values[0] === 2 && values[1] === 2) {
        multiplier = 2.5 + comboBonus;
        label = "Two Pair";
    } else if (values[0] === 2) {
        let pairMult = hasPairSpecialist ? 4 : 2;
        multiplier = pairMult + comboBonus;
        label = "Pair";
    }

    return { multiplier, flatBonus, label };
}

function calculateScore(hand) {
    let hasHeavyLine = modifiers.some(m => m.id === 'heavy_line');
    let hasTrophyHunter = modifiers.some(m => m.id === 'trophy_hunter');
    let hasBigGameHunter = modifiers.some(m => m.id === 'big_game_hunter');
    let hasHeavyWaters = modifiers.some(m => m.id === 'heavy_waters');
    let hasRiskyHook = modifiers.some(m => m.id === 'risky_hook');
    let hasLastCast = modifiers.some(m => m.id === 'last_cast');
    let hasLuckyLure = modifiers.some(m => m.id === 'lucky_lure');

    let adjustedHand = hand.map(fish => {
        let w = fish.weight;
        // Lucky Lure: rare/legendary get +30% weight
        if (hasLuckyLure && (fish.rarity === 'rare' || fish.rarity === 'legendary')) {
            w = Math.floor(w * 1.3);
        }
        if (hasBigGameHunter && fish.size === 'large') {
            w = Math.floor(w * 1.5);
        }
        if (hasHeavyWaters) {
            w = Math.floor(w * (1 + 0.05 * currentEncounter));
        }
        return { ...fish, weight: w };
    });

    let weightContribution = 0;

    if (hasTrophyHunter) {
        weightContribution = Math.max(...adjustedHand.map(f => f.weight));
        if (hasHeavyLine) {
            weightContribution *= 2;
        }
    } else {
        weightContribution = adjustedHand.reduce((sum, fish) => sum + fish.weight, 0);
        if (hasHeavyLine) {
            weightContribution *= 2;
        }
    }

    let rarityBonus = 0;
    adjustedHand.forEach(fish => {
        if (fish.rarity === 'rare') rarityBonus += 20;
        if (fish.rarity === 'legendary') rarityBonus += 100;
    });

    const combo = evaluateHand(adjustedHand);

    // Crustacean bonus: each card with bonusMult adds to multiplier
    let crustMult = 0;
    adjustedHand.forEach(f => { if (f.bonusMult) crustMult += f.bonusMult; });

    // Holo bonus: each holo card adds +1 multiplier
    let holoMult = 0;
    adjustedHand.forEach(f => { if (f.holo) holoMult += HOLO_MULT_BONUS; });
    
    let totalMultiplier = combo.multiplier + crustMult + holoMult;
    let baseScore = weightContribution + rarityBonus + combo.flatBonus;
    let finalScore = baseScore * totalMultiplier;

    if (hasTrophyHunter) {
        finalScore *= 4;
    }

    if (hasLastCast && handsRemaining === 1) {
        finalScore *= 3;
    }

    if (hasRiskyHook) {
        if (Math.random() < 0.2) {
            finalScore = 0;
        } else {
            finalScore *= 2;
        }
    }

    finalScore = Math.floor(finalScore);

    let multiplierLabel = totalMultiplier;
    let suffixes = [];
    if (hasTrophyHunter) suffixes.push('x4 Trophy');
    if (hasLastCast && handsRemaining === 1) suffixes.push('x3 Last Cast');
    if (hasRiskyHook) suffixes.push('Risky');
    if (suffixes.length > 0) {
        multiplierLabel = `${combo.multiplier} (${suffixes.join(', ')})`;
    }

    return {
        base: baseScore,
        multiplier: multiplierLabel,
        label: combo.label,
        total: finalScore
    };
}

// =====================
// SELECTION & PREVIEW
// =====================

function toggleFishSelection(index) {
    if (hasScored || runOver) return;

    const maxSelect = getMaxSelectionSize();
    const selectedPos = selectedFishIndexes.indexOf(index);
    if (selectedPos === -1) {
        if (selectedFishIndexes.length < maxSelect) {
            selectedFishIndexes.push(index);
        }
    } else {
        selectedFishIndexes.splice(selectedPos, 1);
    }

    updateScorePreview();
    renderHand();
}

function updateScorePreview() {
    const maxSelect = getMaxSelectionSize();
    const selectedFish = currentHand.filter((_, i) => selectedFishIndexes.includes(i));
    selectionCountEl.textContent = `Selected: ${selectedFishIndexes.length} / ${maxSelect}`;

    if (selectedFish.length === 0) {
        baseScoreEl.textContent = '0';
        multiplierEl.textContent = '1';
        scoreTextEl.textContent = 'Hand Selection Preview: 0';
        comboTextEl.textContent = 'WAITING...';
        submitBtn.disabled = true;
        return;
    }

    const result = calculateScore(selectedFish);
    baseScoreEl.textContent = result.base;
    multiplierEl.textContent = result.multiplier;
    scoreTextEl.textContent = `Hand Selection Preview: ${result.total}`;
    comboTextEl.textContent = result.label;
    submitBtn.disabled = false;
}

function updateGoldUI() {
    goldValEl.textContent = gold;
    if (shopGoldValEl) shopGoldValEl.textContent = gold;
}

// =====================
// SUBMIT & ROUND FLOW
// =====================

function processSubmit() {
    if (selectedFishIndexes.length === 0 || hasScored || runOver) return;

    const selectedFish = currentHand.filter((_, i) => selectedFishIndexes.includes(i));
    const result = calculateScore(selectedFish);
    
    roundScoreTotal += result.total;
    handsRemaining--;

    // Discard the entire current hand to the discard pile
    discardCards(currentHand);
    currentHand = [];
    updateDeckUI();

    roundScoreTotalValEl.textContent = roundScoreTotal;
    handsRemainingValEl.textContent = handsRemaining;
    scoreTextEl.textContent = `Hand Score: ${result.total}`;

    // Second Chance: if score < 50% of target, refund a reroll
    let hasSecondChance = modifiers.some(m => m.id === 'second_chance');
    if (hasSecondChance && result.total < targetScore * 0.5) {
        rerollsRemaining++;
        rerollCountEl.textContent = `Rerolls: ${rerollsRemaining}/${baseRerollsPerRound}`;
    }
    
    if (roundScoreTotal >= targetScore) {
        gold += Math.floor(roundScoreTotal / 10);
        updateGoldUI();

        resultTextEl.textContent = "SUCCESS! YOU BEAT THE TARGET.";
        resultTextEl.className = "win";
        hasScored = true;

        submitBtn.disabled = true;
        drawBtn.disabled = true;
        rerollBtn.disabled = true;

        setTimeout(() => {
            openReward();
        }, 1500);

    } else if (handsRemaining <= 0) {
        resultTextEl.textContent = "RUN FAILED.";
        resultTextEl.className = "lose";
        runOver = true;
        hasScored = true;

        submitBtn.disabled = true;
        drawBtn.disabled = true;
        rerollBtn.disabled = true;
    } else {
        resultTextEl.textContent = "Score Saved. Play again!";
        resultTextEl.className = "";
        
        setTimeout(() => {
            drawHand();
            submitBtn.disabled = true;
            drawBtn.disabled = false;
            if (rerollsRemaining > 0) rerollBtn.disabled = false;
        }, 1000);
    }

    renderHand();
}

function processReroll() {
    // Treat reroll button as "Discard Selected"
    if (discardsRemaining <= 0 || hasScored || runOver) return;
    if (selectedFishIndexes.length === 0) return;
    if (selectedFishIndexes.length > 5) return;

    discardsRemaining--;
    rerollCountEl.textContent = `Discards: ${discardsRemaining}/${baseDiscardsPerRound}`;
    
    if (discardsRemaining <= 0) {
        rerollBtn.disabled = true;
    }

    // Identify selected cards
    const cardsToDiscard = [];
    // Sort indices descending to avoid splice shifting issues
    const sortedIdx = [...selectedFishIndexes].sort((a,b) => b - a);
    
    sortedIdx.forEach(idx => {
        cardsToDiscard.push(currentHand[idx]);
        currentHand.splice(idx, 1);
    });

    // Discard them
    discardCards(cardsToDiscard);
    selectedFishIndexes = [];

    // Draw replacements
    const replacementCount = cardsToDiscard.length;
    const newCards = drawCardsFromDeck(replacementCount);
    currentHand.push(...newCards);
    
    updateDeckUI();
    updateScorePreview();
    renderHand();
}

/**
 * Handle DRAW FISH button click (Full hand redraw)
 */
function processDrawRequest() {
    if (drawsRemaining <= 0 || hasScored || runOver) return;

    drawsRemaining--;
    if (drawCountEl) drawCountEl.textContent = `Draws: ${drawsRemaining}/${baseDrawsPerRound}`;
    
    if (drawsRemaining <= 0) {
        drawBtn.disabled = true;
    }

    drawHand();
}

function renderModifiers() {
    if (!activeModifiersEl) return;
    
    if (modifiers.length === 0) {
        activeModifiersEl.innerHTML = '<div class="empty-msg">No active gear...</div>';
        return;
    }

    activeModifiersEl.innerHTML = '';
    modifiers.forEach(mod => {
        const pill = document.createElement('div');
        pill.className = 'modifier-pill';
        pill.innerHTML = `
            <div class="mod-name">${mod.name}</div>
            <div class="mod-desc">${mod.description}</div>
        `;
        activeModifiersEl.appendChild(pill);
    });
}

// =====================
// SHOP SYSTEM
// =====================

function generateShopOffers() {
    const pool = [];

    MODIFIER_POOL.forEach(mod => {
        if (!modifiers.some(m => m.id === mod.id)) {
            pool.push({
                id: mod.id,
                name: mod.name,
                description: mod.description,
                cost: mod.shopCost,
                type: "modifier"
            });
        }
    });

    UTILITY_ITEMS.forEach(util => {
        pool.push({
            id: util.id,
            name: util.name,
            description: util.description,
            cost: util.shopCost,
            type: "utility"
        });
    });

    const shuffled = pool.sort(() => Math.random() - 0.5);
    shopOffers = shuffled.slice(0, 3);
}

function proceedFromShop() {
    shopPanel.style.display = 'none';
    currentEncounter++;
    if (currentEncounter > 30) {
        inEndlessMode = true;
    }
    startNextRound();
}

function getNodeInfo(encounterNum) {
    if (encounterNum > 30) {
        return { label: `ENDLESS SPOT ${encounterNum}`, type: 'normal' };
    }
    if (encounterNum === 30) {
        return { label: "FINAL CHAMPIONSHIP", type: 'final' };
    }
    if (encounterNum % 10 === 0) {
        const regionalNum = encounterNum / 10;
        return { label: `REGIONAL CHAMPIONSHIP ${regionalNum}`, type: 'regional' };
    }
    return { label: `FISHING SPOT ${encounterNum}`, type: 'normal' };
}
// =====================
// REWARD SYSTEM (Pack + Trim)
// =====================

let selectedPackType = null;

function generatePackCards(packTypeId) {
    const pack = PACK_TYPES[packTypeId];
    const options = [];
    for (let i = 0; i < 3; i++) {
        const fish = pack.fishPool[Math.floor(Math.random() * pack.fishPool.length)];
        const color = DECK_COLORS[Math.floor(Math.random() * DECK_COLORS.length)];
        options.push(createCard(fish, color, {
            weightMult: pack.weightMult || 1,
            bonusMult: pack.bonusMult || 0,
            packType: packTypeId,
            canBeHolo: true
        }));
    }
    return options;
}

function openReward() {
    rewardStep = 'choose_pack';
    justAddedCardId = null;
    selectedPackType = null;
    packOptions = [];

    gameBoard.style.display = 'none';
    modifiersArea.style.display = 'none';
    controlsFooter.style.display = 'none';
    if (deckInfoArea) deckInfoArea.style.display = 'none';
    shopPanel.style.display = 'none';

    rewardPanel.style.display = 'flex';
    renderPackChoice();
}

function closeReward() {
    rewardPanel.style.display = 'none';
}

function renderPackChoice() {
    rewardTitleEl.textContent = 'CHOOSE A PACK';
    rewardSubtitleEl.textContent = 'Each pack has a unique theme and card pool';
    rewardCardsEl.innerHTML = '';
    rewardSkipBtn.style.display = 'none';
    rewardProceedBtn.style.display = 'none';

    Object.entries(PACK_TYPES).forEach(([id, pack]) => {
        const el = document.createElement('div');
        el.className = `pack-choice pack-${id}`;
        el.innerHTML = `
            <div class="pack-icon">${pack.icon}</div>
            <div class="pack-name">${pack.name}</div>
            <div class="pack-desc">${pack.description}</div>
        `;
        el.addEventListener('click', () => selectPack(id));
        rewardCardsEl.appendChild(el);
    });
}

function selectPack(packTypeId) {
    selectedPackType = packTypeId;
    packOptions = generatePackCards(packTypeId);

    // Animate out unselected packs
    const packs = rewardCardsEl.querySelectorAll('.pack-choice');
    packs.forEach(el => {
        if (!el.classList.contains(`pack-${packTypeId}`)) {
            el.style.opacity = '0.2';
            el.style.pointerEvents = 'none';
            el.style.transform = 'scale(0.9)';
        } else {
            el.classList.add('pack-selected');
        }
    });

    setTimeout(() => {
        rewardStep = 'pack';
        renderPackStep();
    }, 700);
}

function renderCardMini(card, onClick, isDisabled) {
    const el = document.createElement('div');
    const rarityClass = card.rarity === 'legendary' ? 'rarity-legendary' : (card.rarity === 'rare' ? 'rarity-rare' : '');
    const holoClass = card.holo ? 'card-holo' : '';
    el.className = `fish-card suit-${card.color} ${holoClass} ${isDisabled ? 'card-disabled' : ''}`;
    el.style.animationDelay = '0s';
    el.style.opacity = '1';
    el.style.transform = 'none';

    const fishSvg = FISH_ART[card.name] || FISH_ART['Trout'];
    const bonusTag = card.bonusMult ? `<div class="card-bonus">+${card.bonusMult} mult</div>` : '';
    const holoTag = card.holo ? '<div class="card-holo-tag">✦ HOLO</div>' : '';

    el.innerHTML = `
        <div class="card-rank">${card.rank}</div>
        ${holoTag}
        <div class="card-art">${fishSvg}</div>
        <div class="card-bottom">
            <div class="card-fish-name ${rarityClass}">${card.name}</div>
            ${bonusTag}
            <div class="card-weight">${card.weight} lbs</div>
        </div>
    `;

    if (!isDisabled && onClick) {
        el.addEventListener('click', onClick);
        el.style.cursor = 'pointer';
    } else if (isDisabled) {
        el.style.cursor = 'not-allowed';
    }

    return el;
}

function renderPackStep() {
    const pack = PACK_TYPES[selectedPackType];
    rewardTitleEl.textContent = `${pack.icon} ${pack.name.toUpperCase()}`;
    rewardSubtitleEl.textContent = 'Choose 1 card to add to your deck';
    rewardCardsEl.innerHTML = '';
    rewardSkipBtn.style.display = 'inline-block';
    rewardProceedBtn.style.display = 'none';

    packOptions.forEach((card, i) => {
        const el = renderCardMini(card, () => {
            selectPackCard(i);
        }, false);
        el.classList.add('reward-option');
        rewardCardsEl.appendChild(el);
    });
}

function selectPackCard(index) {
    const chosenCard = packOptions[index];
    // Add to draw pile
    drawPile.push(chosenCard);
    shuffleArray(drawPile);
    justAddedCardId = chosenCard.id;
    updateDeckUI();

    // Highlight picked card
    const cards = rewardCardsEl.querySelectorAll('.reward-option');
    cards.forEach((el, i) => {
        if (i === index) {
            el.classList.add('selected');
        } else {
            el.classList.add('card-disabled');
            el.style.opacity = '0.3';
            el.style.pointerEvents = 'none';
        }
    });

    rewardSkipBtn.style.display = 'none';

    // Move to trim step after brief delay
    setTimeout(() => {
        rewardStep = 'trim';
        renderTrimStep();
    }, 800);
}

function renderTrimStep() {
    rewardTitleEl.textContent = 'REMOVE 1 CARD FROM YOUR DECK';
    rewardSubtitleEl.textContent = `Deck size: ${drawPile.length + discardPile.length} cards — select a card to remove`;
    rewardCardsEl.innerHTML = '';
    rewardSkipBtn.style.display = 'none';
    rewardProceedBtn.style.display = 'none';

    // Collect all cards in the run (draw + discard)
    const allCards = [...drawPile, ...discardPile];
    // Sort by color then rank for readability
    allCards.sort((a, b) => {
        const colorOrder = { blue: 0, red: 1, green: 2, gold: 3 };
        if (colorOrder[a.color] !== colorOrder[b.color]) return colorOrder[a.color] - colorOrder[b.color];
        return a.rank - b.rank;
    });

    allCards.forEach(card => {
        const isProtected = card.id === justAddedCardId;
        const el = renderCardMini(card, isProtected ? null : () => {
            selectTrimCard(card.id);
        }, isProtected);
        el.classList.add('trim-option');
        if (isProtected) {
            el.classList.add('card-protected');
            el.title = 'Just added — cannot remove';
        }
        el.dataset.cardId = card.id;
        rewardCardsEl.appendChild(el);
    });
}

function selectTrimCard(cardId) {
    // Remove from draw pile or discard pile
    let removed = false;
    const drawIdx = drawPile.findIndex(c => c.id === cardId);
    if (drawIdx !== -1) {
        drawPile.splice(drawIdx, 1);
        removed = true;
    }
    if (!removed) {
        const discIdx = discardPile.findIndex(c => c.id === cardId);
        if (discIdx !== -1) {
            discardPile.splice(discIdx, 1);
        }
    }
    updateDeckUI();

    // Highlight removed card
    const allTrimCards = rewardCardsEl.querySelectorAll('.trim-option');
    allTrimCards.forEach(el => {
        if (el.dataset.cardId === cardId) {
            el.classList.add('card-removed');
        } else {
            el.style.pointerEvents = 'none';
        }
    });

    rewardStep = 'done';
    rewardTitleEl.textContent = 'DECK UPDATED';
    rewardSubtitleEl.textContent = `Deck size: ${drawPile.length + discardPile.length} cards`;
    rewardSkipBtn.style.display = 'none';
    rewardProceedBtn.style.display = '';
    rewardProceedBtn.disabled = false;
}

function skipReward() {
    rewardSkipBtn.style.display = 'none';
    const cards = rewardCardsEl.querySelectorAll('.reward-option');
    cards.forEach(el => {
        el.classList.add('card-disabled');
        el.style.opacity = '0.2';
        el.style.transform = 'scale(0.9)';
        el.style.pointerEvents = 'none';
    });
    
    // Give a small pause to see the cards fade out
    setTimeout(() => {
        proceedFromReward();
    }, 600);
}

function proceedFromReward() {
    closeReward();
    openShop();
}

function openShop() {
    shopPurchasedThisVisit = false;
    generateShopOffers();

    gameBoard.style.display = 'none';
    modifiersArea.style.display = 'none';
    controlsFooter.style.display = 'none';
    if (deckInfoArea) deckInfoArea.style.display = 'none';

    shopPanel.style.display = 'flex';
    updateGoldUI();
    renderShopOffers();
    updateShopRerollBtn();
}

function closeShop() {
    shopPanel.style.display = 'none';
    gameBoard.style.display = '';
    modifiersArea.style.display = '';
    controlsFooter.style.display = '';
    if (deckInfoArea) deckInfoArea.style.display = '';
}

function renderShopOffers() {
    shopOffersEl.innerHTML = '';

    shopOffers.forEach((offer, index) => {
        const card = document.createElement('div');
        card.className = 'shop-offer-card';

        const canAfford = gold >= offer.cost;
        const btnDisabled = !canAfford || shopPurchasedThisVisit;

        card.innerHTML = `
            <span class="offer-type-tag ${offer.type}">${offer.type}</span>
            <div class="offer-name">${offer.name}</div>
            <div class="offer-desc">${offer.description}</div>
            <div class="offer-cost">${offer.cost}g</div>
            <button class="offer-buy-btn" data-index="${index}" ${btnDisabled ? 'disabled' : ''}>BUY</button>
        `;

        const buyBtn = card.querySelector('.offer-buy-btn');
        buyBtn.addEventListener('click', () => {
            buyShopItem(index);
        });

        shopOffersEl.appendChild(card);
    });
}

function buyShopItem(index) {
    if (shopPurchasedThisVisit) return;
    const offer = shopOffers[index];
    if (!offer || gold < offer.cost) return;

    gold -= offer.cost;
    shopPurchasedThisVisit = true;

    if (offer.type === "modifier") {
        const modData = MODIFIER_POOL.find(m => m.id === offer.id);
        if (modData && !modifiers.some(m => m.id === modData.id)) {
            modifiers.push(modData);
            renderModifiers();
        }
    } else if (offer.type === "utility") {
        if (offer.id === "extra_reroll") {
            baseRerollsPerRound += 1;
        } else if (offer.id === "extra_hand") {
            baseHandsPerRound += 1;
        }
    }

    updateGoldUI();

    const allBuyBtns = shopOffersEl.querySelectorAll('.offer-buy-btn');
    allBuyBtns.forEach((btn, i) => {
        if (i === index) {
            btn.textContent = 'PURCHASED';
            btn.classList.add('purchased');
            btn.disabled = true;
        } else {
            btn.disabled = true;
        }
    });

    updateShopRerollBtn();
}

function rerollShop() {
    if (gold < 50) return;
    gold -= 50;
    updateGoldUI();

    generateShopOffers();
    renderShopOffers();
    updateShopRerollBtn();
}

function updateShopRerollBtn() {
    shopRerollBtn.disabled = gold < 50;
}

// =====================
// ROUND MANAGEMENT
// =====================

function startNextRound() {
    gameBoard.style.display = '';
    modifiersArea.style.display = '';
    controlsFooter.style.display = '';
    if (deckInfoArea) deckInfoArea.style.display = '';

    if (currentEncounter <= ROUND_TARGETS.length) {
        targetScore = ROUND_TARGETS[currentEncounter - 1];
    } else {
        targetScore = Math.floor(targetScore * 1.6);
    }

    // Reshuffle all cards back into draw pile for the new round
    reshuffleDiscard();
    updateDeckUI();

    roundScoreTotal = 0;
    handsRemaining = baseHandsPerRound;
    discardsRemaining = baseDiscardsPerRound;
    drawsRemaining = baseDrawsPerRound;

    // Apply Debuffs for Championships
    const nodeInfo = getNodeInfo(currentEncounter);
    currentDebuff = null;
    if (nodeInfo.type === 'regional' || nodeInfo.type === 'final') {
        // Unique per regional: index based on encounter
        const debuffIdx = (Math.floor(currentEncounter / 3) - 1) % DEBUFF_POOL.length;
        currentDebuff = DEBUFF_POOL[debuffIdx] || DEBUFF_POOL[0];
    }

    if (currentDebuff && currentDebuff.id === 'choppy_waters') {
        handsRemaining = Math.max(1, handsRemaining - 1);
    }
    if (currentDebuff && currentDebuff.id === 'heavy_fog') {
        discardsRemaining = 0;
    }

    updateDebuffUI();

    hasScored = false;
    runOver = false;
    selectedFishIndexes = [];

    roundInfoEl.textContent = nodeInfo.label;
    targetInfoEl.textContent = `Target: ${targetScore}`;
    targetValEl.textContent = targetScore;
    roundScoreTotalValEl.textContent = "0";
    handsRemainingValEl.textContent = handsRemaining;
    baseScoreEl.textContent = "0";
    multiplierEl.textContent = "1";
    scoreTextEl.textContent = "Hand Selection Preview: 0";
    selectionCountEl.textContent = `Selected: 0 / ${getMaxSelectionSize()}`;
    rerollCountEl.textContent = `Discards: ${discardsRemaining}/${baseDiscardsPerRound}`;
    if (drawCountEl) drawCountEl.textContent = `Draws: ${drawsRemaining}/${baseDrawsPerRound}`;
    comboTextEl.textContent = "WAITING...";
    resultTextEl.textContent = "";
    resultTextEl.className = "";
    drawBtn.disabled = false;

    drawHand();
}

// =====================
// DRAW FROM DECK
// =====================

function drawHand() {
    // Discard any leftover hand (shouldn't happen normally but be safe)
    if (currentHand.length > 0) {
        discardCards(currentHand);
    }

    currentHand = [];
    selectedFishIndexes = [];

    // Double Catch: 20% chance to draw +1
    let hasDoubleCatch = modifiers.some(m => m.id === 'double_catch');
    let drawCount = BASE_DRAW_COUNT;
    
    // DEBUFF: Low Tide
    if (currentDebuff && currentDebuff.id === 'low_tide') {
        drawCount--;
    }

    if (hasDoubleCatch && Math.random() < 0.2) {
        drawCount += 1;
    }

    currentHand = drawCardsFromDeck(drawCount);
    drawOrder = currentHand.map((_, i) => i);

    // Selective Net: replace lowest weight fish with next from deck
    let hasSelectiveNet = modifiers.some(m => m.id === 'selective_net');
    if (hasSelectiveNet && currentHand.length > 1) {
        let minIdx = 0;
        for (let i = 1; i < currentHand.length; i++) {
            if (currentHand[i].weight < currentHand[minIdx].weight) {
                minIdx = i;
            }
        }
        // Discard the lowest, draw a replacement
        discardPile.push(currentHand[minIdx]);
        const replacement = drawCardsFromDeck(1);
        if (replacement.length > 0) {
            currentHand[minIdx] = replacement[0];
        }
    }

    updateDeckUI();
    updateScorePreview();
    renderHand();
    submitBtn.disabled = true;
    if (rerollsRemaining > 0 && !hasScored && !runOver) {
        rerollBtn.disabled = false;
    } else {
        rerollBtn.disabled = true;
    }
}

// =====================
// FISH ART — Hand-drawn SVG silhouettes
// =====================

const FISH_ART = {
    "Trout": `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12,28 Q18,16 32,18 Q42,14 52,18 L62,22 Q68,25 65,28 L62,30 Q68,28 74,20 M62,30 Q68,32 74,38 M62,30 Q52,34 42,35 Q32,36 22,34 Q14,32 12,28 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="56" cy="24" r="2" fill="rgba(0,0,0,0.5)"/>
    </svg>`,
    "Bass": `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,26 Q16,12 30,14 Q38,10 48,14 Q56,12 60,16 L66,22 Q70,26 66,30 L60,34 Q56,38 48,36 Q38,40 30,38 Q16,40 10,30 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M66,22 L74,16 M66,30 L74,36" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="58" cy="24" r="2.2" fill="rgba(0,0,0,0.5)"/>
    </svg>`,
    "Catfish": `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12,26 Q18,16 34,18 Q46,16 56,20 L64,24 Q68,26 64,30 L56,34 Q46,38 34,36 Q18,38 12,30 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M64,24 L74,18 M64,30 L74,36" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M60,22 Q68,18 76,16 M60,21 Q66,20 72,22 M60,32 Q66,34 72,36" stroke="rgba(255,255,255,0.6)" stroke-width="1" stroke-linecap="round"/>
        <circle cx="56" cy="24" r="2" fill="rgba(0,0,0,0.5)"/>
    </svg>`,
    "Pike": `<img src="assets/pike.jpg" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: screen; border-radius: 4px; pointer-events: none;" />`,
    "Snapper": `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14,26 Q20,12 36,16 Q46,10 54,16 L62,22 Q66,26 62,30 L54,36 Q46,40 36,36 Q20,40 14,30 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M62,22 L72,16 M62,30 L72,38" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M36,16 L38,8 M40,14 L44,6" stroke="rgba(255,255,255,0.5)" stroke-width="1" stroke-linecap="round"/>
        <circle cx="54" cy="24" r="2" fill="rgba(0,0,0,0.5)"/>
    </svg>`,
    "Grouper": `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12,28 Q16,10 32,14 Q44,8 54,14 L62,20 Q68,26 62,32 L54,38 Q44,44 32,40 Q16,44 12,32 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M62,20 L72,14 M62,32 L72,38" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="52" cy="22" r="2.5" fill="rgba(0,0,0,0.5)"/>
    </svg>`,
    "Mahi": `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14,30 Q18,22 30,22 Q40,20 50,22 L60,26 Q64,28 60,32 L50,34 Q40,36 30,34 Q18,36 14,32 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M30,22 Q32,10 38,6 Q44,10 50,22" fill="rgba(255,255,255,0.5)" stroke="rgba(255,255,255,0.8)" stroke-width="1" stroke-linecap="round"/>
        <path d="M60,26 L70,20 M60,32 L70,38" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="54" cy="27" r="2" fill="rgba(0,0,0,0.5)"/>
    </svg>`,
    "Salmon": `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,28 Q16,16 32,18 Q44,14 54,18 L64,24 Q68,26 64,30 L54,34 Q44,38 32,36 Q16,38 10,30 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M64,24 L74,18 M64,30 L74,36" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="20" cy="26" r="1" fill="rgba(255,255,255,0.4)"/>
        <circle cx="26" cy="24" r="1" fill="rgba(255,255,255,0.4)"/>
        <circle cx="24" cy="30" r="1" fill="rgba(255,255,255,0.4)"/>
        <circle cx="32" cy="28" r="1" fill="rgba(255,255,255,0.4)"/>
        <circle cx="58" cy="24" r="2" fill="rgba(0,0,0,0.5)"/>
    </svg>`,
    "Tarpon": `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,26 Q16,12 34,16 Q48,10 58,16 L66,22 Q72,26 66,30 L58,36 Q48,42 34,38 Q16,42 10,32 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M66,22 L76,16 M66,30 L76,38" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M30,18 L30,36 M38,16 L38,38 M46,16 L46,38 M54,18 L54,34" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>
        <circle cx="60" cy="24" r="2.2" fill="rgba(0,0,0,0.5)"/>
    </svg>`,
    "Tuna": `<img src="assets/tuna.jpg" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: screen; border-radius: 4px; pointer-events: none;" />`,
    "Barracuda": `<svg viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4,26 Q10,20 22,22 Q34,20 46,22 Q54,20 62,22 Q68,22 72,24 L76,25 Q78,26 76,27 L72,28 Q68,30 62,30 Q54,32 46,30 Q34,32 22,30 Q10,32 4,28 Z" fill="rgba(255,255,255,0.85)" stroke="rgba(255,255,255,0.95)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M76,25 L80,22 M76,27 L80,30" stroke="rgba(255,255,255,0.7)" stroke-width="1.2" stroke-linecap="round"/>
        <path d="M72,24 L74,26 L72,28" stroke="rgba(255,255,255,0.6)" stroke-width="0.8" fill="none"/>
        <circle cx="70" cy="25" r="1.5" fill="rgba(0,0,0,0.5)"/>
    </svg>`,
    "Swordfish": `<img src="assets/swordfish.jpg" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: screen; border-radius: 4px; pointer-events: none;" />`,
    "Marlin": `<img src="assets/marlin.jpg" style="width: 100%; height: 100%; object-fit: contain; mix-blend-mode: screen; border-radius: 4px; pointer-events: none;" />`
};

function updateDebuffUI() {
    if (!debuffIndicatorEl) return;
    if (currentDebuff) {
        debuffIndicatorEl.textContent = `⚠ TOURNAMENT PRESSURE: ${currentDebuff.name} - ${currentDebuff.description}`;
        debuffIndicatorEl.classList.add('active');
    } else {
        debuffIndicatorEl.textContent = '';
        debuffIndicatorEl.classList.remove('active');
    }
}

function getSortedHandIndices() {
    const indices = currentHand.map((_, i) => i);
    const colorOrder = { blue: 0, red: 1, green: 2, gold: 3 };

    switch (currentSort) {
        case 'color':
            indices.sort((a, b) => {
                const ca = colorOrder[currentHand[a].color] ?? 9;
                const cb = colorOrder[currentHand[b].color] ?? 9;
                if (ca !== cb) return ca - cb;
                return currentHand[a].rank - currentHand[b].rank;
            });
            break;
        case 'fish':
            indices.sort((a, b) => {
                const na = currentHand[a].name;
                const nb = currentHand[b].name;
                if (na !== nb) return na.localeCompare(nb);
                return (colorOrder[currentHand[a].color] ?? 9) - (colorOrder[currentHand[b].color] ?? 9);
            });
            break;
        case 'rank':
            indices.sort((a, b) => currentHand[a].rank - currentHand[b].rank);
            break;
        default:
            break; // keep original draw order
    }
    return indices;
}

function setSort(sortType) {
    currentSort = sortType;
    // Update active button
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sort === sortType);
    });
    renderHand();
}

function renderHand() {
    handDisplay.innerHTML = '';
    const sortedIndices = getSortedHandIndices();
    
    sortedIndices.forEach((index, displayPos) => {
        const fish = currentHand[index];
        const isSelected = selectedFishIndexes.includes(index);
        const card = document.createElement('div');
        card.className = `fish-card suit-${fish.color} ${isSelected ? 'selected' : ''}`;
        card.style.animationDelay = `${displayPos * 0.06}s`;
        
        const fishSvg = FISH_ART[fish.name] || FISH_ART["Trout"];
        const rarityClass = fish.rarity === 'legendary' ? 'rarity-legendary' : (fish.rarity === 'rare' ? 'rarity-rare' : '');
        const holoClass = fish.holo ? 'card-holo' : '';
        if (fish.holo) card.classList.add('card-holo');
        const bonusTag = fish.bonusMult ? `<div class="card-bonus">+${fish.bonusMult} mult</div>` : '';
        const holoTag = fish.holo ? '<div class="card-holo-tag">✦ HOLO</div>' : '';
        
        card.innerHTML = `
            <div class="card-rank">${fish.rank}</div>
            ${holoTag}
            <div class="card-art">${fishSvg}</div>
            <div class="card-bottom">
                <div class="card-fish-name ${rarityClass}">${fish.name}</div>
                ${bonusTag}
                <div class="card-weight">${fish.weight} lbs</div>
            </div>
        `;
        
        card.addEventListener('click', () => toggleFishSelection(index));
        handDisplay.appendChild(card);
    });
}

function init() {
    // Build and shuffle the starter deck
    initDeck();

    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => setSort(btn.dataset.sort));
    });

    drawBtn.addEventListener('click', () => {
        if (hasScored || runOver) return;
        processDrawRequest();
    });

    rerollBtn.addEventListener('click', () => {
        processReroll();
    });

    submitBtn.addEventListener('click', () => {
        processSubmit();
    });

    shopRerollBtn.addEventListener('click', () => {
        rerollShop();
    });

    shopNextRoundBtn.addEventListener('click', () => {
        proceedFromShop();
    });

    rewardProceedBtn.addEventListener('click', () => {
        proceedFromReward();
    });

    rewardSkipBtn.addEventListener('click', () => {
        skipReward();
    });

    // Start Game Directly
    startNextRound();

    updateGoldUI();
    updateDeckUI();
    renderModifiers();
    console.log("Fishing Chains - Streamlined Loop Initialized");
}

window.addEventListener('DOMContentLoaded', init);
