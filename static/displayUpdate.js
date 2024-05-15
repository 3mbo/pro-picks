import {
    addSelectedRole,
    getAllChampionData,
    getChampionData,
    getChampionDataByName,
    getCurrentDisplayedCardId,
    getDataView,
    getRelevantPhase,
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
    const statsCardWrappers = document.querySelectorAll('.stats-card-wrapper');
    const slotsSection = document.getElementById('slots-section');
    const slots = slotsSection.querySelectorAll('.slot');

    slots.forEach(slot => {
        // Check if slot exists and has children
        if (slot && slot.childElementCount > 0) {
            // Find the role selector container for the slot
            const slotRoleSelectorContainer = slot.previousElementSibling;

            // Iterate over each role selectors inside the container
            slotRoleSelectorContainer.querySelectorAll('.slot-role-selector').forEach(roleSelector => {
                // Check if the role selector is fully opaque (selected)
                if (roleSelector.style.opacity === '1') {
                    // Retrieve the role from the role selector
                    const role = roleSelector.getAttribute('data-letter-role');

                    // Add the selected role using your custom function
                    addSelectedRole(role);
                }
            });
        }
    });

    const selectedRoles = getSelectedRoles()

statsCardWrappers.forEach(statsCardWrapper => {
        // Find the role boxes container and attempt to retrieve its data-letter-roles attribute
        const roleBoxesContainer = statsCardWrapper.querySelector('.role-boxes-container');
        const dataLetterRoles = roleBoxesContainer ? roleBoxesContainer.getAttribute('data-letter-roles') : '';

        // Proceed only if dataLetterRoles is not null or empty
        if (dataLetterRoles) {
            // Parse the roles from data-letter-roles
            const roles = new Set(dataLetterRoles.split(',').map(role => role.trim()));

            // Check if all roles from data-letter-roles are in the selected roles
            let allRolesMatch = roles.size > 0; // Assume all roles match only if there are any roles
            roles.forEach(role => {
                if (!selectedRoles.has(role)) {
                    allRolesMatch = false;
                }
            });

            // Display or hide the stats card wrapper based on whether all roles match
            const show = !allRolesMatch; // If not all roles match, we show the card
            statsCardWrapper.style.display = show ? '' : 'none';
            const statsCard = statsCardWrapper.querySelector('.stats-card');
            statsCard.style.display = show ? '' : 'none';
        } else {
            // If no data-letter-roles attribute is found, default to showing the card
            statsCardWrapper.style.display = '';
            const statsCard = statsCardWrapper.querySelector('.stats-card');
            statsCard.style.display = '';
        }
    });
}

// Helper function to load champions page
function loadChampionsPage(moreCard, champion) {
    const AEGridAllies = moreCard.querySelector('.rules-allies-container .ae-grid');
    const allyStats = champion.allies;
    const AEGridEnemies = moreCard.querySelector('.rules-enemies-container .ae-grid');
    const enemyStats = champion.enemies;

    loadAlliesEnemies(AEGridAllies, allyStats);
    loadAlliesEnemies(AEGridEnemies, enemyStats);

}

// Helper function for the champions page
function loadAlliesEnemies(container, AEStats) {

    // Sort the stats by frequency in descending order
    AEStats.sort((a, b) => b[1] - a[1]);
    const AEWrappers = container.querySelectorAll('.ae-wrapper')

    AEWrappers.forEach((AEWrapper, index) => {
        if (!AEStats[index]) {
            return;
        }
        const championName = AEStats[index][0];
        const frequency = AEStats[index][1];
        const delta = AEStats[index][2]
        const championData = getChampionDataByName(championName);

        const smallImageContainer = AEWrapper.querySelector('.small-image-container')

        const smallImage = document.createElement('img');
        smallImage.src = championData.imageUrl;
        smallImage.alt = `${championName} image`;

        const frequencySpan = AEWrapper.querySelector('.info .frequency')
        const deltaSpan = AEWrapper.querySelector('.info .delta')
        let deltaText = delta >= 0 ? `+${delta}` : `${delta}`;
        let deltaColor = delta >= 0 ? 'rgb(106,236,106)' : 'rgb(255,84,84)';

        deltaSpan.innerHTML = `<span style="color:${deltaColor};">${deltaText}</span>`;
        frequencySpan.textContent = frequency

        smallImageContainer.appendChild(smallImage);

    });
}


export function loadMoreCard(championId){
    const moreCard = document.querySelector(`#more-cards-section .more-card[data-id="${championId}"]`);
    const champion = getChampionData(championId);
    const goLeft = moreCard.querySelector('.go-left');
    const goRight = moreCard.querySelector('.go-right');
    const roleFrequencyContainer = moreCard.querySelector('.role-frequency-container')

    // Call function to create bar chart
    createBarChart(roleFrequencyContainer, champion);

    const transactionData = getTransactionData()
    const transactionsByRole = transactionData[1].transactions
    const championName = champion.name;

    const leftGameContainer = moreCard.querySelector('.left-game-container');
    const rightGameContainer = moreCard.querySelector('.right-game-container');

    // Find the most recent game involving the specified championName
    const recentGame = findRecentGame(transactionsByRole, championName);
    const smallImageContainers = moreCard.querySelectorAll('.small-image-container');

    // Ensure we have enough image containers for each champion (
    if (smallImageContainers.length < recentGame.length) {
        console.error('Not enough image containers for the number of champions in recent games.');
        return; // Exit if not enough containers
    }

    recentGame.forEach((recentChampionName, index) => {
        const recentChampion = getChampionDataByName(recentChampionName);
        const smallImageUrl = recentChampion.imageUrl;

        const smallImage = document.createElement('img');
        smallImage.src = smallImageUrl;
        smallImage.alt = `${recentChampionName} image`;
        smallImage.style.width = "4vh";
        smallImage.style.height = "4vh";

        if (recentChampionName === championName) {
            smallImage.style.border = "solid white 0.1vh"
            smallImage.style.borderRadius = "0.3vh"
        }

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
    splashArt.setAttribute('src', `/static/images/splashArt/${championId}.webp`);

    const moreCardBackground = document.querySelector(`#more-cards-section .more-card-background[data-id="${championId}"]`);

    // Set the background image from local asset files
    const encodedChampionName = encodeURIComponent(championName).replace(/'/g, "%27");
    moreCardBackground.style.backgroundImage = `url('${window.location.origin}/static/images/cardBGs/${encodedChampionName}.webp')`;
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

    loadChampionsPage(moreCard, champion)
}

// Helper function to create bar chart
function createBarChart(roleFrequencyContainer, championData) {
    // Define margins
    const computedStyle = window.getComputedStyle(roleFrequencyContainer);
    const fullWidth = parseFloat(computedStyle.width);
    const fullHeight = parseFloat(computedStyle.height);
    const margin = { top: fullHeight*0.1, right: fullHeight*0.1, bottom: fullHeight*0.15, left: fullHeight*0.15 };
    const width = fullWidth - margin.left - margin.right;
    const height = fullHeight - margin.top - margin.bottom;

    // Define colors
    const colors = [
        'rgba(232,58,58, 1)', // top
        'rgba(60,138,60, 1)', // jungle
        'rgba(32,125,212, 1)', // mid
        'rgba(214,181,15, 1)', // bot
        'rgba(221,65,210, 1)'  // support
    ];

    // Role names
    const roleNames = ["Top", "Jung", "Mid", "Bot", "Supp"];

    // Prepare and sort the data
    let data = championData.roles.map((frequency, index) => ({
        frequency,
        index,
        role: roleNames[index],
        color: colors[index]
    }));

    // Sort data by frequency in descending order
    data.sort((a, b) => b.frequency - a.frequency);

    // Create the SVG element
    const svg = d3.select(roleFrequencyContainer)
        .append("svg")
        .attr("viewBox", `0 0 ${fullWidth} ${fullHeight}`)
        .attr("width", '100%')
        .attr("height", '100%')
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const maxFrequency = d3.max(data, d => d.frequency + 1);
    let tickStep = Math.ceil(maxFrequency / 5);
    tickStep = tickStep < 1 ? 1 : tickStep; // Ensure at least one step
    const highestTick = Math.ceil(maxFrequency / tickStep) * tickStep; // Ensure final tick is shown

    // Create scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.role))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, highestTick])
        .range([height, 0]);

    const minBarHeight = fullWidth/50; // pixels

    const bars = svg.selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("d", d => {
            const x = xScale(d.role);
            const y = d.frequency === 0 ? height : Math.min(yScale(d.frequency), height - minBarHeight);
            const width = xScale.bandwidth();
            const heightBar = d.frequency === 0 ? 0 : Math.max(minBarHeight, height - yScale(d.frequency));
            const radius = fullWidth/70;

            // Create a path with rounded top and flat bottom
            return `M${x},${y + radius} 
                    a${radius},${radius} 0 0 1 ${radius},-${radius} 
                    h${width - 2 * radius} 
                    a${radius},${radius} 0 0 1 ${radius},${radius} 
                    v${heightBar - radius} 
                    h${-width} 
                    Z`;
        })
        .style("fill", d => d.color);

    // Transparent overlays for generous hover area
    svg.selectAll(".hover-overlay")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "hover-overlay")
        .attr("x", d => xScale(d.role))
        .attr("y", d => yScale(d.frequency + 1) - 20) // Starts 20px above the bar
        .attr("width", xScale.bandwidth())
        .attr("height", d => (height - yScale(d.frequency + 1)) + 20) // Extends 20px above
        .style("fill", "none") // Make overlay invisible
        .style("pointer-events", "all") // Ensures overlay can receive pointer events
        .on("mouseover", function(event, d) {
            const x = xScale(d.role) + xScale.bandwidth() / 2;
            const y = yScale(d.frequency + 1) - 10; // Position tooltip above the bar

            // Brighten the color of the corresponding bar
            svg.selectAll("path")
                .filter((p) => p === d)
                .style("fill", d3.color(d.color).brighter(0.5));

            svg.append("text")
                .attr("class", "tooltip")
                .attr("x", x)
                .attr("y", y)
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .style("pointer-events", "none") // Ignore pointer events
                .text(d.frequency);
        })
        .on("mouseout", function(event, d) {
            svg.selectAll("path")
                .filter((p) => p === d)
                .style("fill", d.color);

            svg.select(".tooltip").remove(); // Remove tooltip on mouse out
        });


    // Add Axes
    const xAxis = d3.axisBottom(xScale);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("text")   // Select all text elements for the x-axis
        .style("font-size", `${fullWidth*0.05}`);

    const yAxis = d3.axisLeft(yScale)
        .tickValues(d3.range(0, highestTick + 1, tickStep))
        .tickFormat(d3.format("d")); // Ensure integer format

    svg.append("g")
        .call(yAxis)
        .selectAll("text")   // Select all text elements for the y-axis
        .style("font-size", `${fullWidth*0.05}`);
}

// Helper function to find the most recent game with the specified championName
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

export function updateMoreCardPickPhase(moreCard) {
    const blueShapes = moreCard.querySelectorAll('.blue-rectangle, .blue-square');
    const redShapes = moreCard.querySelectorAll('.red-rectangle, .red-square');
    const relevantPhase = getRelevantPhase()

    blueShapes.forEach((shape, index) => {
        shape.style.border = 'solid transparent 0.2vh;'
        if (index === relevantPhase) {
            shape.style.border = 'solid #b4a8ff 0.1vh'
        }
    })
    redShapes.forEach((shape, index) => {
        shape.style.border = 'solid transparent 0.2vh;'
        if (index === relevantPhase - 3 && getDataView() === 'red') {
            shape.style.border = 'solid #b4a8ff 0.1vh'
        }
    })

}

export function updateNavigator(navigator, newPageNumber) {
    const pages = navigator.querySelectorAll('.page')
    const totalPages = pages.length;
    const nextLeft = (newPageNumber - 1 + totalPages) % totalPages;
    const nextRight = (newPageNumber + 1) % totalPages;

    // Update classes for CSS styling
    pages.forEach((page, index) => {
        if (index === newPageNumber) {
            page.className = 'page current';
        } else if (index === nextLeft) {
            page.className = 'page left';
        } else if (index === nextRight) {
            page.className = 'page right';
        } else {
            page.className = 'page';
        }
    });
}

export function updatePage(pageNumber) {
    const currentDisplayedCardId = getCurrentDisplayedCardId();
    const moreCard = document.querySelector(`#more-cards-section .more-card[data-id="${currentDisplayedCardId}"]`);
    const pbSection = moreCard.querySelector('.pb-section')
    const footer = moreCard.querySelector('.footer')
    const frequencySection = moreCard.querySelector('.frequency-section')
    const splashArtContainer = moreCard.querySelector('.splash-art-container')
    const rulesSection = moreCard.querySelector('.rules-section')
    const navigator = moreCard.querySelector('.navigator');

    updateNavigator(navigator, pageNumber); // Update navigator appearance based on new page number

    if (pageNumber === 0) {
        // Art page
        frequencySection.style.display = 'none';
        splashArtContainer.style.display = 'none';
        rulesSection.style.display = 'none';
        moreCard.style.backgroundColor = 'transparent';
        pbSection.style.display = 'none'
        footer.style.display = 'none'

        navigator.style.display = 'flex';
    }
    if (pageNumber === 1) {
        // Overview page
        rulesSection.style.display = 'none';

        footer.style.display = 'flex'
        pbSection.style.display = 'flex'
        moreCard.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        frequencySection.style.display = 'flex';
        splashArtContainer.style.display = 'flex';
    }
    if (pageNumber === 2) {
        // Rules page
        frequencySection.style.display = 'none';
        splashArtContainer.style.display = 'none';

        footer.style.display = 'flex'
        pbSection.style.display = 'flex'
        moreCard.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
        rulesSection.style.display = 'flex';
        navigator.style.display= 'flex';
    }
}

