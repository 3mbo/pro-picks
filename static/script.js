document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded");
        function inspectDataStorage() {
        // Get the data-storage-section element
        const dataStorageSection = document.getElementById('data-storage-section');

        // Check if the element exists
        if (!dataStorageSection) {
            console.log('Data storage section not found.');
            return;
        }

        // Get all the child elements with class 'champion-data'
        const championDataElements = dataStorageSection.getElementsByClassName('champion-data');

        // Iterate through each champion data element
        for (let i = 0; i < championDataElements.length; i++) {
            const element = championDataElements[i];

            // Log the data attributes of the element
            console.log('Champion ID:', element.dataset.id);
            console.log('Champion Name:', element.dataset.name);
            console.log('Blue Picks:', element.dataset.bluePicks);
            console.log('Blue Bans:', element.dataset.blueBans);
            console.log('Red Picks:', element.dataset.redPicks);
            console.log('Red Bans:', element.dataset.redBans);
            console.log('Image URL:', element.dataset.imageUrl);
            console.log('---');
        }
    }

    // Call the function to inspect the data storage
    inspectDataStorage();
    // Select champions list, slots, and data storage section
    const championsList = document.getElementById('champions-list');
    const slots = document.querySelectorAll('.slot');
    let lastFullSlot = null;
    const dataViewToggle = document.getElementById('data-view-toggle');
    const state = {
        dataView: 'blue', // Initialize dataView state to 'blue' by default
    };

    // Attach an event listener to the checkbox toggle switch
    if (dataViewToggle) {
        dataViewToggle.addEventListener('change', toggleDataView);
    } else {
        console.error("Data view toggle switch not found.");
    }

    // Attach event listeners to champions and slots
    if (championsList) {
        const champions = championsList.querySelectorAll('.champion');
        champions.forEach(champion => {
            champion.addEventListener('click', handleChampionClick);
        });
    } else {
        console.error("Champions list element not found.");
    }

    function getDataView() {
        return state.dataView;
    }

    function setDataView(newDataView) {
        state.dataView = newDataView;
        // Trigger any necessary updates when the state changes
        handleDataViewChange(newDataView);
    }

    function handleDataViewChange(newDataView) {
        // Call functions that need to react to the state change
        displayRelevantData(newDataView);
        highlightRelevantSlots();
    }
    function toggleDataView() {
        const currentDataView = getDataView();
        const newDataView = currentDataView === 'blue' ? 'red' : 'blue';
        setDataView(newDataView);
    }


    function handleChampionClick(event) {
        event.preventDefault();

        const champion = event.currentTarget;
        const championId = champion.dataset.id;
        console.log("Champion clicked with ID:", championId);

        // Check if the champion is currently in a slot
        const slot = champion.closest('.slot');
        const isInSlot = slot !== null;

        if (isInSlot) {
            // Check if the slot is the last full slot
            if (slot !== lastFullSlot) {
                console.warn("Cannot remove champion from this slot. You can only remove the champion from the most recently added slot.");
                return;
            }

            // Move the champion back to the champions list
            championsList.appendChild(champion);
            console.log(`Champion ID ${championId} moved back to champions list.`);

            // Update the most recent filled slot
            lastFullSlot = findFullSlot();
        } else {
            // Find the first empty slot
            const emptySlot = findEmptySlot();
            if (emptySlot) {
                // Move the champion to the empty slot
                emptySlot.appendChild(champion);
                console.log(`Champion ID ${championId} moved to slot ${emptySlot.id}.`);

                // Update the most recent filled slot
                lastFullSlot = emptySlot;
            } else {
                console.warn("No empty slot available.");
            }
        }
        displayRelevantData(getDataView());
        highlightRelevantSlots();
    }

    function findEmptySlot() {
        for (const slot of slots) {
            if (slot.childElementCount === 0) {
                return slot;
            }
        }
        return null;
    }

    function findFullSlot() {
        // Iterate through the slots in reverse order
        for (let i = slots.length - 1; i >= 0; i--) {
            const slot = slots[i];
            if (slot.childElementCount > 0) {
                return slot;
            }
        }
        return null;
    }

    function retrieveChampionData() {
        const dataStorageSection = document.getElementById('data-storage-section');
        const championElements = dataStorageSection.querySelectorAll('.champion-data');
        const championsData = [];

        // Iterate through each champion element in data storage section
        championElements.forEach((element, index) => {
            try {
                // Parse blue and red data from the element's data attributes
                const bluePicks = JSON.parse(element.dataset.bluePicks);
                const blueBans = JSON.parse(element.dataset.blueBans);
                const redPicks = JSON.parse(element.dataset.redPicks);
                const redBans = JSON.parse(element.dataset.redBans);

                // Construct data object for the champion
                const data = {
                    id: element.dataset.id,
                    name: element.dataset.name,
                    imageUrl: element.dataset.imageUrl,
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
                championsData.push(data);
            } catch (error) {
                console.error(`Error parsing data for champion at index ${index}:`, error);
            }
        });

    // Log the retrieved data for debugging purposes
    console.log('Retrieved champions data:', championsData);

    // Return the array of parsed champion data
    return championsData;
}

    function displayRelevantData(dataView) {
        const dataElementsSection = document.getElementById('data-elements-section');
        dataElementsSection.innerHTML = '';

        const relevantSlots = getRelevantSlots(dataView);
        console.log('Relevant slots:', relevantSlots);

        const championData = retrieveChampionData();
        console.log('Champions data:', championData);

        // Determine the constant for the slot indexing based on the first relevant slot and dataView
        let slotIndexConstant;
        const firstRelevantSlot = relevantSlots[0];
        if (relevantSlots.length === 0) {
            // If there are no relevant slots, return early and do not display any data
            console.log(`No open slots available for ${dataView} view.`);
            return;
        }

        console.log('First relevant slot:', firstRelevantSlot);

        if (dataView === 'blue') {
            // For 'blue' dataView, handle special case when the first slot is 'slot_4'
            if (firstRelevantSlot.id === 'slot_4') {
                slotIndexConstant = parseInt(firstRelevantSlot.id.replace('slot_', '')) - 2; // Adjust for 'blue' view
            } else {
                slotIndexConstant = parseInt(firstRelevantSlot.id.replace('slot_', '')) - 1; // Normal case
            }
        } else if (dataView === 'red') {
            // For 'red' dataView, handle special case when the first slot is not 'slot_1'
            if (firstRelevantSlot.id !== 'slot_1') {
                slotIndexConstant = parseInt(firstRelevantSlot.id.replace('slot_', '')) - 2; // Adjust for 'red' view
            } else {
                slotIndexConstant = parseInt(firstRelevantSlot.id.replace('slot_', '')) - 1; // Normal case
            }
        }

        console.log('Slot index constant:', slotIndexConstant);

        // Create a list to store relevant champions' data
        const relevantChampionsData = [];

        // Iterate through champions data
        championData.forEach(champion => {
            // Determine the element to show based on the slotIndexConstant
            const elementToShow = champion[dataView].picks[slotIndexConstant];

            // console.log(`Champion: ${champion.name}, Element to show:`, elementToShow);

            // If the element is greater than 0, add the champion data to the list
            if (elementToShow > 0) {
                relevantChampionsData.push({
                    name: champion.name,
                    element: elementToShow,
                    imageUrl: champion.imageUrl,
                });
            }
        });

        // Sort the relevant champions' data based on the integer element in descending order
        relevantChampionsData.sort((a, b) => b.element - a.element);
        console.log('Sorted relevant champions data:', relevantChampionsData);

        // Iterate through the sorted data and display the champion images and their corresponding data
        relevantChampionsData.forEach(championData => {
            // Create a div element to display the relevant data
            const div = document.createElement('div');
            div.classList.add('champion-elements');

            // Create an image element to display the champion image
            const img = document.createElement('img');
            img.src = championData.imageUrl;
            img.alt = `${championData.name} image`;
            img.className = 'champion-image';
            img.style.width = '50px';
            img.style.height = '50px';
            div.appendChild(img);

            // Create a paragraph element to display the integer element
            const p = document.createElement('p');
            p.textContent = championData.element;
            div.appendChild(p);

            // Add the div to the data elements section
            dataElementsSection.appendChild(div);

            // Log the display
            console.log(`Displaying ${dataView} data for champions with slotIndexConstant ${slotIndexConstant}.`);
        });
    }

    function getRelevantSlots(dataView) {
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
    function highlightRelevantSlots() {
        // Get the data view state
        const dataView = getDataView();

        // Use the getRelevantSlots function to obtain the relevant slots
        const relevantSlots = getRelevantSlots(dataView);

        // Remove existing highlights from all slots
        slots.forEach(slot => {
            slot.classList.remove('highlighted-slot');
        });

        // Add the highlight class to the determined slots
        relevantSlots.forEach(slot => {
            slot.classList.add('highlighted-slot');
        });
    }
    // Initial data display
    const initialDataView = 'blue';
    setDataView(initialDataView);
    dataViewToggle.checked = false;

    // Call the display and highlight functions for initial data view
    displayRelevantData(initialDataView);
    highlightRelevantSlots();
});