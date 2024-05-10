import {
    findEmptySlot,
    findFullSlot,
    getChampionHtmlData,
    getDataView,
    getSearchBar,
    clearSelectedRoles,
    setDataView,
    setLitSlotRoleSelector,
    getLitSlotRoleSelector
} from './state.js';

import {
    displayRelevantData,
    filterChampionsBySelectedRoles,
    highlightRelevantSlots,
    loadMoreCard
} from './displayUpdate.js';

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

        const clonedChampion = champion.cloneNode(true);

        champion.style.opacity = '0.5';
        champion.style.pointerEvents = 'none';

        clonedChampion.style.display = 'none';
        const img = clonedChampion.querySelector('img');
        img.dataset.id = championId
        firstOpenSlot.appendChild(img);
        img.style.cursor = 'pointer';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.addEventListener('mouseover', handleChampionMouseEnter);
        firstOpenSlot.appendChild(img);

        const slotContainer = firstOpenSlot.parentElement;

        const slotRoleSelectorContainer = slotContainer.querySelector('.slot-role-selector-container');
        slotRoleSelectorContainer.style.display = '';

        const hoverTab = slotContainer.querySelector('.hover-tab');
        hoverTab.style.display = 'flex';

        console.log(`Champion ID ${championId} added to slot ${firstOpenSlot.id}.`);

        img.addEventListener('click', handleChampionClick);

    }
    displayRelevantData(getDataView());
    highlightRelevantSlots();
}

// Function to handle champion click in a slot
export function handleSlotChampionClick(champion) {
    const championId = champion.dataset.id;
    const slot = champion.closest('.slot');
    const slotContainer = slot.parentElement
    const slotRoleSelectorContainer = slotContainer.querySelector('.slot-role-selector-container');
    const lastSlot = findFullSlot();
    const hoverTab = slotContainer.querySelector('.hover-tab')

    // Only remove if last
    if (slot !== lastSlot) {
        console.warn('You may only remove champions from the last slot');
    } else {
        // Remove the champion from the slot
        slot.removeChild(champion)
        console.log(`Champion ID ${championId} removed from slot ${slot.id}.`);

        const litSlotRoleSelector = slotRoleSelectorContainer.querySelector('.selected')
        if (litSlotRoleSelector) {
            selectDeselectRole(litSlotRoleSelector)
        }
        slotRoleSelectorContainer.style.display = 'none';
        hoverTab.style.display = 'none';

        // Find the matching champion in the list
        const matchingChampion = document.querySelector(`.stats-card-wrapper [data-id="${championId}"]`);
        if (matchingChampion) {
            // Revert the champion's transparency and clickability
            matchingChampion.style.opacity = '1';
            matchingChampion.style.pointerEvents = 'auto';
            console.log(`Champion ID ${championId} restored in the list.`);
        }
        displayRelevantData(getDataView(), false);
        highlightRelevantSlots();
    }
}

let hoverTimeout; // Variable to store the timeout for the hover delay
const loaded = new Set([])
let currentDisplayedCardId = null; // Variable to track the ID of the currently displayed card

// Keyboard event listeners for flipping pages
document.addEventListener('keydown', event => {
    if (currentDisplayedCardId) {
        const moreCard = document.querySelector(`#more-cards-section .more-card[data-id="${currentDisplayedCardId}"]`);
        const moreCardBackground = document.querySelector(`#more-cards-section .more-card-background[data-id="${currentDisplayedCardId}"]`);

        if (event.key === 'q' || event.key === 'Q') {
            // Display only the more card background (left page)
            if (moreCardBackground) moreCardBackground.style.display = 'flex';
            if (moreCard) moreCard.style.display = 'none';
        } else if (event.key === 'e' || event.key === 'E') {
            // Display both the more card and its background (right page)
            if (moreCardBackground) moreCardBackground.style.display = 'flex';
            if (moreCard) moreCard.style.display = '';
        }
    }
});

// Handle mouse enter event
export function handleChampionMouseEnter(event) {
    const champion = event.currentTarget;
    if (event.relatedTarget && champion.contains(event.relatedTarget)) {
        return;
    }

    const championId = champion.dataset.id;
    clearTimeout(hoverTimeout);

    hoverTimeout = setTimeout(() => {
        if (currentDisplayedCardId && currentDisplayedCardId !== championId) {
            hideCurrentDisplayedCard(); // Hide previously displayed cards
        }

        displayMoreCard(championId); // Display the new card
        console.log('Mouse enter:', championId);
    }, 300);
}

// Handle mouse leave event
export function handleChampionMouseLeave(event) {
    const champion = event.currentTarget;
    if (event.relatedTarget && champion.contains(event.relatedTarget)) {
        return;
    }
    console.log('Mouse leave:', champion.dataset.id);
    clearTimeout(hoverTimeout);
}

function hideCurrentDisplayedCard() {
    if (currentDisplayedCardId) {
        const moreCard = document.querySelector(`#more-cards-section .more-card[data-id="${currentDisplayedCardId}"]`);
        const moreCardBackground = document.querySelector(`#more-cards-section .more-card-background[data-id="${currentDisplayedCardId}"]`);
        if (moreCard) moreCard.style.display = 'none';
        if (moreCardBackground) moreCardBackground.style.display = 'none';
    }
}

function displayMoreCard(championId) {
    const moreCard = document.querySelector(`#more-cards-section .more-card[data-id="${championId}"]`);
    const moreCardBackground = document.querySelector(`#more-cards-section .more-card-background[data-id="${championId}"]`);
    if (!loaded.has(championId)) {
        loadMoreCard(championId);
        loaded.add(championId);
    }
    moreCardBackground.style.display = 'flex';
    moreCard.style.display = '';
    currentDisplayedCardId = championId; // Update currently displayed card ID
}

export function handleSearchInput() {
    // Retrieve the input value and convert it to lowercase
    const championSearchBar = getSearchBar()
    const searchTerm = championSearchBar.value.toLowerCase();

    // Retrieve the list of data from the data storage section
    const championData = getChampionHtmlData();

    // Loop through each data element
    championData.forEach(champion => {
        // Retrieve the champion name from the data attribute
        const championName = champion.dataset.name.toLowerCase();
        const championId = champion.dataset.id;

        // Find the corresponding champion in the champions list using the champion ID
        const statsCardWrapper = document.querySelector(`.stats-card-wrapper[data-id="${championId}"]`);
        const statsCard = statsCardWrapper.querySelector(`.stats-card`);

        // Check if the champion name starts with the search term
        if (championName.startsWith(searchTerm)) {
            // If it matches, show the corresponding champion
            statsCard.style.display = '';
            statsCardWrapper.style.display = '';
        } else {
            // If it doesn't match, hide the corresponding champion
            statsCard.style.display = 'none';
            statsCardWrapper.style.display = 'none';
        }
    });
}

// Add an event listener for the search bar focus
export function handleSearchFocus() {
    const championSearchBar = getSearchBar()
    // Change the search bar's background color to yellow when focused
    championSearchBar.style.backgroundColor = '#433a85';
    // Remove the placeholder text when the search bar is focused
    championSearchBar.placeholder = '';
}

// Add an event listener for the search bar blur
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
    displayRelevantData(newDataView, false);
    highlightRelevantSlots();
}



export function handleSlotRoleSelectorClick(event) {
    const clickedSlotRoleSelector = event.currentTarget;
    selectDeselectRole(clickedSlotRoleSelector)
}

export function selectDeselectRole(selectedSelector) {
    clearSelectedRoles()
    const slotRoleSelectorContainer = selectedSelector.closest('.slot-role-selector-container');
    const slotContainer = slotRoleSelectorContainer.parentElement;

    const selectedRole = selectedSelector.dataset.letterRole;
    const slot = slotContainer.querySelector('.slot')
    const slotId = slot.id;

    if (getLitSlotRoleSelector(slotId) === selectedRole) {
        selectedSelector.style.opacity = 0.6;
        setLitSlotRoleSelector(slotId, null)
    }

    else {
        // Deselect all role selectors in the container
        slotRoleSelectorContainer.querySelectorAll('.slot-role-selector').forEach(roleSelector => {
            roleSelector.style.opacity = '0.6';
        });

        // Light up the clicked role selector
        selectedSelector.style.opacity = '1';

        // Set the lit role selector state for the slot
        setLitSlotRoleSelector(slotId, selectedRole);
    }

    // Filter champions based on the lit role selector
    filterChampionsBySelectedRoles();
    // Check if any selector is lit
    updateContainerPosition(slotContainer);
}

export function updateContainerPosition(slotContainer) {
    const slotRoleSelectorContainer = slotContainer.querySelector('.slot-role-selector-container')
    const slot = slotContainer.querySelector('.slot')
    const slotId = slot.id
    const hoverTab = slotContainer.querySelector('.hover-tab');

    // Remove selected class if a role selector is currently selected
    const selectedRoleSelector = slotRoleSelectorContainer.querySelector('.selected')
    if (selectedRoleSelector) {
        selectedRoleSelector.classList.remove('selected')
    }

    const isSelected = getLitSlotRoleSelector(slotId) !== null;
    // Apply the partially-hidden and selected classes if any selector is lit
    if (isSelected) {
        const selectedRole = getLitSlotRoleSelector(slotId)
        const litSelector = slotRoleSelectorContainer.querySelector(`[data-letter-role="${selectedRole}"]`)
        slotRoleSelectorContainer.classList.add('partially-hidden');
        hoverTab.classList.add('partially-hidden');
        litSelector.classList.add('selected')

    } else {
        slotRoleSelectorContainer.classList.remove('partially-hidden');
        hoverTab.classList.remove('partially-hidden');
    }
}