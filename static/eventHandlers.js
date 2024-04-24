import {
    findEmptySlot,
    findFullSlot,
    getChampionElements,
    getDataView,
    getSearchBar,
    clearSelectedRoles,
    setDataView,
    setLitRoleBox
} from './state.js';

import {displayRelevantData, filterChampionsBasedOnRoleBoxes, highlightRelevantSlots,} from './displayUpdate.js';

// Event handler for the champion click
export function handleChampionClick(event) {
    event.preventDefault();

    const champion = event.currentTarget;
    const slot = champion.closest('.slot');
    const isInSlot = slot !== null;

    if (isInSlot) {
        // Champion clicked in a slot
        handleSlotChampionClick(champion);
    } else {
        // Champion clicked in the list
        handleListChampionClick(champion);
    }
}

// Function to handle champion click in the list
export function handleListChampionClick(champion) {
    // Find the first open slot
    const firstOpenSlot = findEmptySlot();
    if (firstOpenSlot) {
        const championId = champion.dataset.id;

        // Clone champion
        const clonedChampion = champion.cloneNode(true);

        // Make the champion 20% transparent and disable clicks
        champion.style.opacity = '0.2';
        champion.style.pointerEvents = 'none';
        firstOpenSlot.appendChild(clonedChampion);

        createRoleBoxContainer(clonedChampion, firstOpenSlot);
        console.log(`Champion ID ${championId} added to slot ${firstOpenSlot.id}.`);

        // Add click event listener to the cloned champion
        clonedChampion.addEventListener('click', handleChampionClick);
    }
    displayRelevantData(getDataView());
    highlightRelevantSlots();
}

// Function to handle champion click in a slot
export function handleSlotChampionClick(champion) {
    const championId = champion.dataset.id;
    const slot = champion.closest('.slot');
    const roleBoxContainer = slot.querySelector('.role-boxes-container')
    const lastSlot = findFullSlot();

    // Only remove if last
    if (slot !== lastSlot) {
        console.warn('You may only remove champions from the last slot');
    } else {
        // Remove the champion from the slot
        slot.removeChild(champion)
        console.log(`Champion ID ${championId} removed from slot ${slot.id}.`);
        roleBoxContainer.remove();
        // Find the matching champion in the list
        const matchingChampion = document.querySelector(`[data-id="${championId}"]`);
        if (matchingChampion) {
            // Revert the champion's transparency and clickability
            matchingChampion.style.opacity = '1';
            matchingChampion.style.pointerEvents = 'auto';
            console.log(`Champion ID ${championId} restored in the list.`);
        }
        displayRelevantData(getDataView());
        highlightRelevantSlots();
    }
}

export function handleSearchInput() {
    // Retrieve the input value and convert it to lowercase
    const championSearchBar = getSearchBar()
    const searchTerm = championSearchBar.value.toLowerCase();

    // Retrieve the list of data from the data storage section
    const championDataElements = getChampionElements();

    // Loop through each data element
    championDataElements.forEach(dataElement => {
        // Retrieve the champion name from the data attribute
        const championName = dataElement.dataset.name.toLowerCase();
        const championId = dataElement.dataset.id;

        // Find the corresponding champion in the champions list using the champion ID
        const championElement = document.querySelector(`#champions-list img[data-id="${championId}"]`);

        // Check if the champion name starts with the search term
        if (championName.startsWith(searchTerm)) {
            // If it matches, show the corresponding champion
            championElement.style.display = '';
        } else {
            // If it doesn't match, hide the corresponding champion
            championElement.style.display = 'none';
        }
    });
}

// Add an event listener for the 'focus' event (when the input field is focused)
export function handleSearchFocus() {
    const championSearchBar = getSearchBar()
    // Change the search bar's background color to yellow when focused
    championSearchBar.style.backgroundColor = '#433a85';
    // Remove the placeholder text when the search bar is focused
    championSearchBar.placeholder = '';
}

// Add an event listener for the 'blur' event (when the input field loses focus)
export function handleSearchBlur() {
    const championSearchBar = getSearchBar()
    // Change the search bar's background color back to its default color when it loses focus
    championSearchBar.style.backgroundColor = ''; // Reset to default background color
    // Set the placeholder text back to "Search champions..." when the search bar loses focus
    championSearchBar.placeholder = 'Search champions...';
}


export function handleToggleClick() {
    const currentDataView = getDataView();
    const newDataView = currentDataView === 'blue' ? 'red' : 'blue';
    setDataView(newDataView);
    displayRelevantData(newDataView);
    highlightRelevantSlots();
}



export function handleRoleBoxClick(event) {
    clearSelectedRoles()
    const clickedRoleBox = event.currentTarget;
    const roleBoxContainer = clickedRoleBox.closest('.role-boxes-container');
    const slot = roleBoxContainer.closest('.slot');
    const slotId = slot.id;

    // Deselect all role boxes in the container
    roleBoxContainer.querySelectorAll('.role-box').forEach(roleBox => {
        roleBox.style.opacity = '0.5';
    });

    // Select the clicked role box
    clickedRoleBox.style.opacity = '1';

    // Get the selected role from the clicked role box
    const selectedRole = clickedRoleBox.textContent;
    console.log(selectedRole)
    // Set the lit role box state for the slot
    setLitRoleBox(slotId, selectedRole);

    // Filter champions based on the lit role box
    filterChampionsBasedOnRoleBoxes();
}

export function createRoleBoxContainer(champion, slot) {
    // Create the role box container
    const roleBoxContainer = document.createElement('div');
    roleBoxContainer.classList.add('role-boxes-container');

    // Add role boxes inside the container
    const roles = ['T', 'J', 'M', 'B', 'S'];
    let roleIndex = 0
    for (const role of roles) {
        const roleBox = document.createElement('div');
        roleBox.classList.add('role-box')
        roleBox.style.opacity = '0.5'; // Set initial opacity to 50%
        roleBox.textContent = role;

        // Add an event listener for clicks
        roleBox.addEventListener('click', handleRoleBoxClick);

        // Append role box to the container
        roleBoxContainer.appendChild(roleBox);
        roleIndex += 1
    }

    // Append the role box container to the slot
    slot.insertBefore(roleBoxContainer, champion);
}

