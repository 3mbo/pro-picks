import {
    handleToggleClick,
    handleSearchInput,
    handleChampionClick,
    handleSearchFocus,
    handleSearchBlur,
} from './eventHandlers.js';

import {
    displayRelevantData,
    highlightRelevantSlots
} from './displayUpdate.js';

import {
    setDataView,
    loadChampionData,
} from './state.js';

// Initialization function
export default function initialize() {
    // Initial setup
    // Load the DOM elements
    const dataViewToggle = document.getElementById('data-view-toggle');
    const championSearchBar = document.getElementById('champion-search-bar');
    const champions = document.querySelectorAll('.champion');

    // Register event listeners
    dataViewToggle.addEventListener('click', handleToggleClick);
    championSearchBar.addEventListener('input', handleSearchInput);
    championSearchBar.addEventListener('focus', handleSearchFocus);
    championSearchBar.addEventListener('blur', handleSearchBlur);
    champions.forEach(champion => {
        champion.addEventListener('click', handleChampionClick);
    });

    // Initialize the application state
    setDataView('blue');
    loadChampionData()

    displayRelevantData('blue'); // Display data based on default state
    highlightRelevantSlots(); // Highlight relevant slots in the UI
}

// Listen for DOMContentLoaded event to start the initialization
document.addEventListener('DOMContentLoaded', function() {
    initialize(); // Call the initialize function when the DOM is fully loaded
});

