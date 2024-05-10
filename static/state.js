
let state = {
    dataView: 'blue', // Initialize dataView state to blue by default
};

const dataStorageSection = document.getElementById('data-storage-section');
const htmlChampionData = dataStorageSection.querySelectorAll('.champion-data');
const htmlCachedTransactions = dataStorageSection.querySelectorAll('.cached-transaction-data');
const slots = document.querySelectorAll('.slot');
let slotRoleSelectorState = {}; // Object to track lit role selector state for each slot
const selectedRoles = new Set([])
let championData = {}
let allChampionData = []
let transactionData = {}

export function loadTransactionData() {
    // Iterate through each transactions in data storage section
    htmlCachedTransactions.forEach((cachedTransaction, index) => {
        try {
            const transactions = JSON.parse(cachedTransaction.dataset.transactions);

            // Construct data object for the transactions
            transactionData[cachedTransaction.dataset.id] = {
                id: cachedTransaction.dataset.id,
                transactions: transactions,
            }
        } catch (error) {
            console.error(`Error parsing data for transactions at index ${index}:`, error);
        }
    });
}

export function getTransactionData() {
    return transactionData;
}

export function loadChampionData() {
    // Iterate through each champion element in data storage section
    htmlChampionData.forEach((champion, index) => {
        try {
            // Parse blue and red data from the champion's data attributes
            const bluePicks = JSON.parse(champion.dataset.bluePicks);
            const blueBans = JSON.parse(champion.dataset.blueBans);
            const redPicks = JSON.parse(champion.dataset.redPicks);
            const redBans = JSON.parse(champion.dataset.redBans);
            const roles = JSON.parse(champion.dataset.roles);
            const pick_total = parseInt(champion.dataset.pick_total, 10);
            const relevance = parseInt(champion.dataset.relevance, 10);

            // Construct data object for the champion
            const data = {
                id: champion.dataset.id,
                name: champion.dataset.name,
                imageUrl: champion.dataset.imageUrl,
                roles: roles,
                relevance: relevance,
                pick_total: pick_total,
                // Store parsed blue and red picks and bans in the data object
                blue: {
                    picks: bluePicks,
                    bans: blueBans
                },
                red: {
                    picks: redPicks,
                    bans: redBans
                }
            };
            allChampionData.push(data)
            championData[champion.dataset.id] = data
        } catch (error) {
            console.error(`Error parsing data for champion at index ${index}:`, error);
        }
    });
}

export function getChampionHtmlData() {
    return htmlChampionData
}

export function getAllChampionData() {
    return allChampionData
}

export function getChampionData(championId) {
    return championData[championId];
}

export function getChampionDataByName(championName) {
    // Iterate through each champion data in allChampionData
    for (let i = 0; i < allChampionData.length; i++) {
        // Get the current champion data
        const champion = allChampionData[i];

        // Check if the name of the current champion data matches the provided name
        if (champion.name === championName) {
            // Return the champion data if there is a match
            return champion;
        }
    }

    // Return null or undefined if no matching champion name is found
    return null;
}


export function getDataView() {
    return state.dataView;
}

export function setDataView(newDataView) {
    state.dataView = newDataView;
}

export function getSearchBar() {
    return document.getElementById('champion-search-bar')
}

export function findEmptySlot() {
    for (const slot of slots) {
        if (slot.childElementCount === 0) {
            return slot;
        }
    }
    return null;
}

export function findFullSlot() {
    // Iterate through the slots in reverse order
    for (let i = slots.length - 1; i >= 0; i--) {
        const slot = slots[i];
        if (slot.childElementCount > 0) {
            return slot;
        }
    }
    return null;
}

export function getRelevantSlots(dataView) {
    // Create an array to hold the relevant slots
    const relevantSlots = [];
    // Get the first empty slot
    const firstOpenSlot = findEmptySlot();

    // Check the value of dataView
    if (dataView === 'blue') {
        // Conditions for 'blue' dataView (similar to highlightRelevantSlots)
        if (firstOpenSlot) {
            if (firstOpenSlot.id === 'slot_1') {
                relevantSlots.push(firstOpenSlot);
            } else if (firstOpenSlot.id === 'slot_2' || firstOpenSlot.id === 'slot_3') {
                const slot2 = document.getElementById('slot_2');
                const slot3 = document.getElementById('slot_3');
                if (slot2) relevantSlots.push(slot2);
                if (slot3) relevantSlots.push(slot3);
            } else if (firstOpenSlot.id === 'slot_4' || firstOpenSlot.id === 'slot_5') {
                const slot4 = document.getElementById('slot_4');
                const slot5 = document.getElementById('slot_5');
                if (slot4) relevantSlots.push(slot4);
                if (slot5) relevantSlots.push(slot5);
            }
        }
    } else if (dataView === 'red') {
        // Conditions for 'red' dataView
        if (firstOpenSlot) {
            if (firstOpenSlot.id === 'slot_1' || firstOpenSlot.id === 'slot_2') {
                const slot1 = document.getElementById('slot_1');
                const slot2 = document.getElementById('slot_2');
                if (slot1) relevantSlots.push(slot1);
                if (slot2) relevantSlots.push(slot2);
            } else if (firstOpenSlot.id === 'slot_3') {
                const slot3 = document.getElementById('slot_3');
                if (slot3) relevantSlots.push(slot3);
            } else if (firstOpenSlot.id === 'slot_4') {
                const slot4 = document.getElementById('slot_4');
                if (slot4) relevantSlots.push(slot4);
            } else if (firstOpenSlot.id === 'slot_5') {
                const slot5 = document.getElementById('slot_5');
                if (slot5) relevantSlots.push(slot5);
            }
        }
    }

    // Return the array of relevant slots
    return relevantSlots;
}

// Function to set the state of a lit role selector for a given slot
export function setLitSlotRoleSelector(slotId, role) {
    slotRoleSelectorState[slotId] = role;
}

// Function to get the state of a lit role selector for a given slot
export function getLitSlotRoleSelector(slotId) {
    return slotRoleSelectorState[slotId];
}

export function getSelectedRoles() {
    return selectedRoles;
}

export function addSelectedRole(role) {
    selectedRoles.add(role)
}

export function clearSelectedRoles() {
    selectedRoles.clear()
}