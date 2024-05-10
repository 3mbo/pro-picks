import {
    handleToggleClick,
    handleSearchInput,
    handleChampionClick,
    handleSearchFocus,
    handleSearchBlur,
    handleChampionMouseEnter,
    handleChampionMouseLeave,
    handleSlotRoleSelectorClick,
    updateContainerPosition
} from './eventHandlers.js';

import {
    displayRelevantData,
    highlightRelevantSlots
} from './displayUpdate.js';

import {
    setDataView,
    loadChampionData,
    loadTransactionData
} from './state.js';

export default function initialize() {
    // Load the DOM elements
    // Initialize the application state
    setDataView('blue');
    loadChampionData()
    loadTransactionData()
    displayRelevantData('blue', true); // Display data based on default state
    highlightRelevantSlots(); // Highlight relevant slots in the UI

    const dataViewToggle = document.getElementById('data-view-toggle');
    const championSearchBar = document.getElementById('champion-search-bar');
    const statsCards = document.querySelectorAll('.stats-card');
    const slotRoleSelectors = document.querySelectorAll('.slot-role-selector');

    // Register event listeners
    slotRoleSelectors.forEach(slotRoleSelector => {
        slotRoleSelector.addEventListener('click', handleSlotRoleSelectorClick);
    })
    dataViewToggle.addEventListener('click', handleToggleClick);
    championSearchBar.addEventListener('input', handleSearchInput);
    championSearchBar.addEventListener('focus', handleSearchFocus);
    championSearchBar.addEventListener('blur', handleSearchBlur);
    statsCards.forEach(statsCard => {
        statsCard.addEventListener('click', handleChampionClick);
        statsCard.addEventListener('mouseover', handleChampionMouseEnter);
        statsCard.addEventListener('mouseout', handleChampionMouseLeave);
    });
}

// Listen for DOMContentLoaded event to start the initialization
document.addEventListener('DOMContentLoaded', function() {
    initialize(); // Call the initialize function when the DOM is fully loaded
});

