
let state = {
    dataView: 'blue', // Initialize dataView state to 'blue' by default
};

const dataStorageSection = document.getElementById('data-storage-section');
let championElements = dataStorageSection.querySelectorAll('.champion-data');
let championData = [];
const slots = document.querySelectorAll('.slot');
let slotRoleBoxState = {}; // Object to track lit role box state for each slot
const selectedRoles = new Set([])



export function loadChampionData() {
    // Iterate through each champion element in data storage section
    championElements.forEach((element, index) => {
        try {
            // Parse blue and red data from the element's data attributes
            const bluePicks = JSON.parse(element.dataset.bluePicks);
            const blueBans = JSON.parse(element.dataset.blueBans);
            const redPicks = JSON.parse(element.dataset.redPicks);
            const redBans = JSON.parse(element.dataset.redBans);
            const roles = JSON.parse(element.dataset.roles);

            // Construct data object for the champion
            const data = {
                id: element.dataset.id,
                name: element.dataset.name,
                imageUrl: element.dataset.imageUrl,
                roles: roles,
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
            championData.push(data);
        } catch (error) {
            console.error(`Error parsing data for champion at index ${index}:`, error);
        }
    });

// Log the retrieved data for debugging purposes
console.log('Retrieved champions data:', championData);
setChampionData(championData)
setChampionElements(championElements)
}
export function setChampionData(newData) {
    championData = newData;
}
export function getChampionElements() {
    return championElements
}

export function getChampionData() {
    return championData
}

export function setChampionElements(newData) {
    championElements = newData;
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

// Function to set the state of a lit role box for a given slot
export function setLitRoleBox(slotId, role) {
    slotRoleBoxState[slotId] = role;
}

// Function to get the state of a lit role box for a given slot
export function getLitRoleBox(slotId) {
    return slotRoleBoxState[slotId];
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