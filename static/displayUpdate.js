import {
    addSelectedRole,
    getAllChampionData,
    getChampionData,
    getChampionDataByName,
    getDataView,
    getRelevantSlots,
    getSelectedRoles,
    getTransactionData
} from './state.js';

export function displayRelevantData(dataView, initial) {
    const statsGrid = document.getElementById('stats-grid');
    const sideboard = document.getElementById('sideboard');
    const commons = document.getElementById('commons');


    const relevantSlots = getRelevantSlots(dataView);
    console.log('Relevant slots:', relevantSlots);

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

    const championData = getAllChampionData();

    // Sort by pick rate for current relevant slots
    championData.sort((a, b) => b[dataView].picks[slotIndexConstant] - a[dataView].picks[slotIndexConstant]);

    let relevantTotal = 0;
    // Iterate through
    championData.forEach(champion => {

        // Determine the champion to show based on the slotIndexConstant
        const relevantFrequency = champion[dataView].picks[slotIndexConstant];

        let relevance = champion.relevance
        // If the relevant frequency is greater than 0, add the champion data to the list
        if (relevantFrequency > 0) {
            relevance += 1
            // Calculate total for a percentage later.
            relevantTotal = Math.max(relevantTotal, relevantFrequency);
        }
        // Create a statsCard div to hold the roleBoxesContainer and the imageContainer
        const statsCardWrapper = document.querySelector(`#stats-section [data-id="${champion.id}"]`);
        const statsCard = document.querySelector(`.stats-card-wrapper [data-id="${champion.id}"]`);

        if (initial) {
            const roleBoxesContainer = statsCardWrapper.querySelector('.role-boxes-container');
            const roleBoxes = roleBoxesContainer.querySelectorAll('.role-box');

            let gradientColors = [];
            const roleColors = ['rgba(232,58,58,0.8)', 'rgba(60,138,60,0.8)', 'rgba(32,125,212,0.8)', 'rgba(214,181,15,0.8)', 'rgba(221,65,210,0.8)'];
            const roleBGColors = ['rgba(180,55,55,0.8)', 'rgba(47,133,13,0.8)', 'rgba(0,91,182,0.8)',
                'rgba(175,147,5,0.8)', 'rgba(159,44,157,0.8)'];
            const gradientIntervals = ['15% 15%', '30% 30%', '50% 50%', '70% 70%', '85% 85%'];
            const nearTransparent = 'rgba(50,50,100,0.1)'
            const noRoleColor = 'rgba(60,60,60,0.8)'

            if (champion.pick_total > 0) {
                // Create a Set to collect data-letter-roles
                const dataLetterRoles = new Set();
                const roleLetters = ['t', 'j', 'm', 'b', 's'];
                roleBoxes.forEach((roleBox, index) => {
                    if (champion.roles[index] > 0) {
                        const letter = roleLetters[index];

                        roleBox.style.backgroundColor = roleColors[index];
                        roleBox.setAttribute('data-letter-role', letter);
                        dataLetterRoles.add(letter);

                        // Create an <svg> element containing a <use> element that references the desired symbol
                        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        const useElement = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                        useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#role-${roleLetters[index]}`);
                        svgElement.appendChild(useElement);

                        roleBox.appendChild(svgElement);
                        roleBox.style.display = 'flex';
                        gradientColors.push(`${roleBGColors[index]} ${gradientIntervals[index]}`);

                    } else {
                        roleBox.style.display = 'none';
                        if (index === 0) {
                            gradientColors.push(`${nearTransparent} 10% 10%`);

                        } else if (index === 4) {
                            gradientColors.push(`${nearTransparent} 90% 90%`);

                        } else {
                            gradientColors.push(`${nearTransparent} ${gradientIntervals[index]}`);
                        }
                    }
                })
                const dataLetterRolesString = Array.from(dataLetterRoles).join(',');
                roleBoxesContainer.setAttribute('data-letter-roles', dataLetterRolesString);
            } else {
                gradientColors.push(`${noRoleColor} 10% 10%`);
            }

            // Add the boxes container to the outer div
            const gradientString = `${gradientColors.join(', ')}`;
            statsCard.style.borderImageSource = `linear-gradient(to bottom right, ${nearTransparent} -30% -30%, ${gradientString}, ${nearTransparent} 120% 120%)`;
            statsCard.style.backgroundImage = `radial-gradient(ellipse 150% 100% at center, transparent, #030E1C, transparent),
                linear-gradient(to bottom right, ${nearTransparent} -30% -30%, ${gradientString}, ${nearTransparent} 120% 120%)`;
            statsCard.style.borderWidth = '2px';
            statsCard.style.borderStyle = 'solid';
            statsCard.style.borderImageSlice = '1';
        }
        const barContainer = document.querySelector(`.stats-card-wrapper[data-id="${champion.id}"] .stats-card[data-id="${champion.id}"] .bar-container`);
        const bar = barContainer.querySelector('.bar')
        bar.style.display = 'none';

        const numberDisplay = barContainer.nextElementSibling;
        numberDisplay.textContent = relevantFrequency.toString();
        numberDisplay.style.display = 'none';
        if (relevantFrequency > 0) {
            // Create a div element to represent the bar
            const percentage = (relevantFrequency / relevantTotal) * 100;

            // Add a buffer for low percentages
            const percentageWithBuffer = ((6 + percentage) / 106) * 100
            // Set the width of the bar based on the calculated percentage
            bar.style.width = `${percentageWithBuffer}%`;
            bar.style.display = '';
            numberDisplay.style.display = '';
        }

        if (relevance===2) {
            statsGrid.appendChild(statsCardWrapper)
        } else if (relevance===1){
            sideboard.appendChild(statsCardWrapper);
        } else if (relevance===0) {
            statsCard.style.borderRadius = '5px';
            commons.appendChild(statsCardWrapper);
        }
    });
    if (initial) {
        const invisible_filler0 = document.createElement('div')
        invisible_filler0.style.flex = "10";

        const invisible_filler1 = invisible_filler0.cloneNode(true)
        const invisible_filler2 = invisible_filler0.cloneNode(true)

        invisible_filler0.setAttribute("class", "invisible-filler-0")
        invisible_filler1.setAttribute("class", "invisible-filler-1")
        invisible_filler2.setAttribute("class", "invisible-filler-2")

        statsGrid.appendChild(invisible_filler0)
        sideboard.appendChild(invisible_filler1)
        commons.appendChild(invisible_filler2)
    }
    else {
        const invisible_filler0 = statsGrid.querySelector('.invisible-filler-0');
        const invisible_filler1 = sideboard.querySelector('.invisible-filler-1');
        const invisible_filler2 = commons.querySelector('.invisible-filler-2');

        statsGrid.removeChild(invisible_filler0)
        sideboard.removeChild(invisible_filler1)
        commons.removeChild(invisible_filler2)
            
        statsGrid.appendChild(invisible_filler0)
        sideboard.appendChild(invisible_filler1)
        commons.appendChild(invisible_filler2)


    }

    console.log(`Displaying ${dataView} data for champions with slotIndexConstant ${slotIndexConstant}.`);
    initial = true;
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

export function filterChampionsBySelectedRoles() {
    const selectedRoles = getSelectedRoles()
    const statsCardWrappers = document.querySelectorAll('.stats-card-wrapper');
    const slotsSection = document.getElementById('slots-section');
    const slots = slotsSection.querySelectorAll('.slot');

    slots.forEach(slot => {
        // Check if slot exists and has children
        if (slot && slot.childElementCount > 0) {
            // Find the role selector container for the slot
            const slotRoleSelectorContainer = slot.previousElementSibling;

            // Check if the role selector container exists
            if (slotRoleSelectorContainer) {
                // Iterate over each role selectors inside the container
                slotRoleSelectorContainer.querySelectorAll('.slot-role-selector').forEach(roleBox => {
                    // Check if the role selector is fully opaque (selected)
                    if (roleBox.style.opacity === '1') {
                        // Retrieve the role from the role selector
                        const role = roleBox.getAttribute('data-letter-role');

                        // Add the selected role using your custom function
                        addSelectedRole(role);
                    }
                });
            }
        }
    });
    statsCardWrappers.forEach(statsCardWrapper => {
        // Filter stats outers based on the selected role
        let show = true;

        // Iterate over the role boxes in the stats outer
        const roleBoxesContainer = statsCardWrapper.querySelector('.role-boxes-container')
        if (selectedRoles.has(roleBoxesContainer.getAttribute('data-letter-roles'))) {
            show = false;
        }

        // Display or hide the stats outer based on the filter result
        statsCardWrapper.style.display = show ? '' : 'none';
        const statsCard = statsCardWrapper.querySelector('.stats-card');
        statsCard.style.display = show ? '' : 'none';
    });
}

export function loadMoreCard(championId){
    const moreCard = document.querySelector(`#more-cards-section .more-card[data-id="${championId}"]`);
    const champion = getChampionData(championId);
    const goLeft = moreCard.querySelector('.go-left');
    const goRight = moreCard.querySelector('.go-right');
    const roleFrequencyContainer = moreCard.querySelector('.role-frequency-container')

    const computedStyle = window.getComputedStyle(roleFrequencyContainer);
    const containerWidth = parseFloat(computedStyle.width);
    const containerHeight = parseFloat(computedStyle.height);

    const pickTotal = champion.pick_total;

    // Data preparation for the packed bubble chart
    const data = champion.roles.map((frequency, index) => {
        // Calculate size factor
        const sizeFactor = frequency / pickTotal;

        // Calculate size for each bubble
        const size = (sizeFactor * containerHeight * 0.8) + 1; // Adjust to fill the container height

        // Return an object with the size and index
        return { value: size, index: index };
    });

    function createBubbleChart(roleFrequencyContainer, championData) {
        // Get the container dimensions
        const computedStyle = window.getComputedStyle(roleFrequencyContainer);
        const containerWidth = parseFloat(computedStyle.width);
        const containerHeight = parseFloat(computedStyle.height);

        // Define colors
        const colors = [
            'rgba(232,58,58, 1)',
            'rgba(60,138,60,1)',
            'rgba(32,125,212, 1)',
            'rgba(214,181,15, 1)',
            'rgba(221,65,210,1)'
        ];

        // Prepare the size data and map original indices to colors
        const data = championData.roles.map((frequency, index) => {
            return {
                frequency, // Keep the original pick_total
                index, // Original index
                color: colors[index] // Map original index to color
            };
        });

        // Use a square root scale to control the size of the circles
        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.frequency)]) // Range of frequencies
            .range([containerHeight / 50, containerHeight / 3]); // Desired range of radii

        // Convert the data into nodes format for the force layout
        const nodes = data.map(d => ({
            index: d.index,
            radius: radiusScale(d.frequency), // Apply square root scaling to the radius
            color: d.color, // Keep the color mapping
            x: Math.random() * containerWidth,
            y: Math.random() * containerHeight,
        }))

        // Sort nodes by radius
        nodes.sort((a, b) => b.radius - a.radius);

        // Create the SVG element
        const svg = d3.select(roleFrequencyContainer)
            .append("svg")
            // Set viewBox to match the container size
            .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
            // Use relative dimensions for width and height
            .attr("width", '100%')
            .attr("height", '100%')

        // Create circles and bind data
        const circles = svg.selectAll("circle")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("r", d => d.radius)
            .style("fill", d => d.color) // Use the color from the data to maintain role order
            .style("stroke", "rgb(0,0,0)")
            .attr("shape-rendering", "geometricPrecision")
            .style("stroke-width", containerWidth/150)

        // Create the force simulation
        const simulation = d3.forceSimulation(nodes)
            .force("center", d3.forceCenter(containerWidth / 2, containerHeight / 2))
            .force("collision", d3.forceCollide().radius(d => d.radius).strength(0.9)) // High collision strength
            .force("x", d3.forceX(containerWidth / 2).strength(0.01))
            .force("y", d3.forceY(containerHeight / 2).strength(0.01))
            .velocityDecay(0.9)
            .alphaDecay(0.001)
            .on("tick", ticked);

        function ticked() {
            circles
                .attr("cx", d => Math.max(d.radius + containerWidth/100, Math.min(containerWidth - d.radius - containerWidth/100, d.x)))
                .attr("cy", d => Math.max(d.radius + containerWidth/100, Math.min(containerHeight - d.radius - containerWidth/100, d.y)));
        }

        // Set a timeout to stop the simulation after 30 seconds
        setTimeout(() => {
            simulation.stop();
        }, 30000);

        // Initialize the simulation
        simulation.restart();
    }
    createBubbleChart(roleFrequencyContainer, champion);


    const transactionData = getTransactionData()
    const transactionsByRole = transactionData[1].transactions
    const championName = champion.name;

    // Function to find the most recent game with the specified championName
    function findRecentGame(transactions, championName) {
        for (let i = 0; i < transactions.length; i++) {
            const gameData = transactions[i];
            if (gameData.includes(championName)) {
                // Return the first 10 strings in the gameData list
                return gameData.slice(0, 10);
            }
        }
        // If no game is found with the championName, return an empty list
        return [];
    }

    const leftGameContainer = moreCard.querySelector('.left-game-container');
    const rightGameContainer = moreCard.querySelector('.right-game-container');

    // Find the most recent game involving the specified championName
    const recentGame = findRecentGame(transactionsByRole, championName);
    const smallImageContainers = moreCard.querySelectorAll('.small-image-container');

    // Ensure we have enough image containers for each champion (or adjust this logic as necessary)
    if (smallImageContainers.length < recentGame.length) {
        console.error('Not enough image containers for the number of champions in recent games.');
        return; // Exit if not enough containers
    }

    recentGame.forEach((championName, index) => {
        const recentChampion = getChampionDataByName(championName);
        const smallImageUrl = recentChampion.imageUrl;

        const smallImage = document.createElement('img');
        smallImage.src = smallImageUrl;
        smallImage.alt = `${championName} image`;
        smallImage.style.width = "4vh";
        smallImage.style.height = "4vh";

        // Append the image to the corresponding container by index
        if (smallImageContainers[index]) {
            smallImageContainers[index].appendChild(smallImage);
        }

        if (index > 4){
            leftGameContainer.appendChild(smallImageContainers[index]);
        } else {
            rightGameContainer.appendChild(smallImageContainers[index]);
        }
    });
    const svgElement4 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const useElement4 = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    useElement4.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#arrow-left`);
    svgElement4.appendChild(useElement4);

    goLeft.appendChild(svgElement4);

    const svgElement5 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const useElement5 = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    useElement5.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#arrow-right`);
    svgElement5.appendChild(useElement5);

    goRight.appendChild(svgElement5);

    const splashArt = moreCard.querySelector('.splash-art');
    splashArt.setAttribute('src', `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${championId}/${championId}000.jpg`);

    const moreCardBackground = document.querySelector(`#more-cards-section .more-card-background[data-id="${championId}"]`);

    // Set the background image from local static files
    const encodedChampionName = encodeURIComponent(championName).replace(/'/g, "%27");
    moreCardBackground.style.backgroundImage = `url('${window.location.origin}/static/images/${encodedChampionName}.webp')`;
    moreCardBackground.style.backgroundSize = 'cover';
    moreCardBackground.style.backgroundPosition = 'center';

    const blueShapes = moreCard.querySelectorAll('.blue-rectangle, .blue-square');
    const redShapes = moreCard.querySelectorAll('.red-rectangle, .red-square');
    const bluePicks = champion.blue.picks;
    const redPicks = champion.red.picks;

    blueShapes.forEach((shape, index) => {
        shape.textContent = bluePicks[index];
    })
    redShapes.forEach((shape, index) => {
        shape.textContent = redPicks[index];
    })
}