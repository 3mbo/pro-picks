import {
    addSelectedRole,
    getChampionData,
    getDataView,
    getRelevantSlots,
    getSelectedRoles
} from './state.js';


export function displayRelevantData(dataView) {
    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = '';

    const relevantSlots = getRelevantSlots(dataView);
    console.log('Relevant slots:', relevantSlots);

    const championData = getChampionData();

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

    let relevantTotal = 0;
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
                roles: champion.roles,
            });
            // Calculate total for a percentage later.
            relevantTotal = Math.max(relevantTotal, elementToShow);
        }
    });

    // Sort the relevant champions' data based on the integer element in descending order
    relevantChampionsData.sort((a, b) => b.element - a.element);
    console.log('Sorted relevant champions data:', relevantChampionsData);


    // Iterate through the sorted data and display the champion images and their corresponding data
    relevantChampionsData.forEach(championData => {
        // Create a statsCard div to hold the roleBoxesContainer and the imageContainer
        const statsCardWrapper = document.createElement('div');
        statsCardWrapper.classList.add('stats-card-wrapper');

        const statsCard = document.createElement('div');
        statsCard.classList.add('stats-card');

        // Create a imageContainer div element to hold the champion image
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('image-container');

        const roleBoxesContainer = document.createElement('div');
        roleBoxesContainer.classList.add('role-boxes-container');

        let gradientColors = [];
        const roleColors = ['rgba(232,58,58,0.8)', 'rgba(67,240,67,0.8)', 'rgba(32,125,212,0.8)', 'rgba(214,181,15,0.8)', 'rgba(189,67,217,0.8)'];
        const roleBGColors = ['rgba(180,55,55,0.8)', 'rgba(47,133,13,0.8)', 'rgba(0,91,182,0.8)',
                                            'rgba(175,147,5,0.8)', 'rgba(159,44,157,0.8)'];
        const gradientIntervals = ['15% 15%', '30% 30%', '50% 50%', '70% 70%', '85% 85%'];
        const nearTransparent = 'rgba(50,50,100,0.1)'

        // Create and add five empty boxes (div elements) to the boxes container
        for (let i = 0; i < 5; i++) {
            if (championData.roles[i] > 0) {
                const roleBox = document.createElement('div');
                roleBox.classList.add('role-box');

                const roleLetters = ['t', 'j', 'm', 'b', 's'];
                const letter = roleLetters[i];

                roleBox.style.backgroundColor = roleColors[i];
                roleBox.setAttribute('data-letter', letter);

                // Create an <svg> element containing a <use> element that references the desired symbol
                const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                const useElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#role-${roleLetters[i]}`);
                svgElement.appendChild(useElement);

                roleBox.appendChild(svgElement);
                roleBoxesContainer.appendChild(roleBox);
                // Set includeTop and includeBot based on the loop index
                if (i === 0) {
                   gradientColors.push(`${roleBGColors[i]} ${gradientIntervals[i]}`);
                } else if (i === 1) {
                    gradientColors.push(`${roleBGColors[i]} ${gradientIntervals[i]}`);
                } else if (i === 2) {
                    gradientColors.push(`${roleBGColors[i]} ${gradientIntervals[i]}`);
                } else if (i === 3) {
                    gradientColors.push(`${roleBGColors[i]} ${gradientIntervals[i]}`);
                } else if (i === 4) {
                    gradientColors.push(`${roleBGColors[i]} ${gradientIntervals[i]}`);
                }
            } else {
                if (i === 0) {
                    gradientColors.push(`${nearTransparent} 10% 10%`);

                }else if (i===4) {
                    gradientColors.push(`${nearTransparent} 90% 90%`);

                }else {
                    gradientColors.push(`${nearTransparent} ${gradientIntervals[i]}`);
                }
            }
        }
        // Add the boxes container to the outer div
        const gradientString = `${gradientColors.join(', ')}`;
        statsCard.style.borderImageSource = `linear-gradient(to bottom right, ${nearTransparent} -30% -30%, ${gradientString}, ${nearTransparent} 120% 120%)`;
        statsCard.style.backgroundImage = `radial-gradient(ellipse 150% 100% at center, transparent, #030E1C, transparent),
        linear-gradient(to bottom right, ${nearTransparent} -30% -30%, ${gradientString}, ${nearTransparent} 120% 120%)`;
        statsCard.style.borderWidth = '2px';
        statsCard.style.borderStyle = 'solid';
        statsCard.style.borderImageSlice = '1';
        statsCard.appendChild(roleBoxesContainer);



        // Create an image element to display the champion image
        const img = document.createElement('img');
        img.src = championData.imageUrl;
        img.alt = `${championData.name} image`;
        img.className = 'champion-image';
        imageContainer.appendChild(img);

        // Create a div element to represent the bar
        const bar = document.createElement('div');
        const barContainer = document.createElement('div');
        barContainer.classList.add('bar-container');
        bar.classList.add('bar');

        // Calculate the percentage of the total
        const elementValue = Number(championData.element);
        const percentage = (elementValue / relevantTotal) * 100;

        // Add a buffer for low percentages
        const percentageWithBuffer = ((10 + percentage) / 110) * 100
        // Set the width of the bar based on the calculated percentage
        bar.style.width = `${percentageWithBuffer}%`;

        // Create a number-display element to display the numerical value inside the bar
        const numberDisplay = document.createElement('div');
        numberDisplay.classList.add('number-display');
        numberDisplay.textContent = elementValue.toString();

        bar.appendChild(numberDisplay);
        barContainer.appendChild(bar);
        statsCard.appendChild(imageContainer);
        statsCard.appendChild(barContainer);

        statsCardWrapper.appendChild(statsCard)
        statsGrid.appendChild(statsCardWrapper);

        // Log the display
        console.log(`Displaying ${dataView} data for champions with slotIndexConstant ${slotIndexConstant}.`);
    });
}

export function highlightRelevantSlots() {
    // Get the data view state
    const dataView = getDataView();
    const slots = document.querySelectorAll('.slot');
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

export function filterChampionsBasedOnRoleBoxes() {
    // Get all the stats outers in the stats section
    const selectedRoles = getSelectedRoles()
    const statsGrid = document.querySelectorAll('.stats-card-wrapper');
    const slotsSection = document.getElementById('slots-section');
    const slots = slotsSection.querySelectorAll('.slot');

    slots.forEach(slot => {
        // Check if slot exists and has children
        if (slot && slot.childElementCount > 0) {
            // Find the role boxes container inside the slot
            const roleBoxesContainer = slot.querySelector('.role-boxes-container');

            // Check if the role boxes container exists
            if (roleBoxesContainer) {
                // Iterate over each role box inside the container
                roleBoxesContainer.querySelectorAll('.role-box').forEach(roleBox => {
                    // Check if the role box is fully opaque (selected)
                    if (roleBox.style.opacity === '1') {
                        // Retrieve the role from the role box
                        // Assuming role information is stored in a `data-role` attribute
                        const role = roleBox.getAttribute('data-letter');

                        // Add the selected role using your custom function
                        addSelectedRole(role);
                    }
                });
            }
        }
    });

    if (statsGrid) {
        statsGrid.forEach(statsCardWrapper => {
            // Filter stats outers based on the selected role
            let showChampion = false;

            // Iterate over the role boxes in the stats outer
            statsCardWrapper.querySelectorAll('.stats-card .role-boxes-container .role-box').forEach(roleBox => {
                // Check if any role doesn't match the selected roles
                if (!selectedRoles.has(roleBox.getAttribute('data-letter'))) {
                    showChampion = true;
                }
            });

            // Display or hide the stats outer based on the filter result
            statsCardWrapper.style.display = showChampion ? 'flex' : 'none';
        });
    }

}
