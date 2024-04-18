document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded");

    const champions = document.querySelectorAll('.champion');
    const slots = document.querySelectorAll('.slot');

    champions.forEach(champion => {
        champion.addEventListener('click', handleChampionClick);
    });

    slots.forEach(slot => {
        slot.addEventListener('click', handleSlotClick);
    });

    // Handle champion click events
    function handleChampionClick(event) {
        event.preventDefault();
        console.log("Champion clicked event handled");

        const champion = event.currentTarget.closest('.champion');
        if (!champion) {
            console.error("No .champion element found in event target");
            return;
        }

        const championId = champion.dataset.id;
        console.log("Champion clicked with ID:", championId);

        const slot = champion.closest('.slot');
        if (slot) {
            // If the champion is in a slot
            handleSlotClick(event);
        } else {
            fetch(`/select/${championId}`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    console.log("Response from server:", data);

                    if (data.status === 'added') {
                        console.log("Champion added to a slot.");

                        // Iterate through slots and find the first empty one
                        const slots = document.querySelectorAll('.slot');
                        let emptySlotFound = false;
                        for (const slot of slots) {
                            if (slot.childElementCount === 0) {
                                console.log("Moving champion to empty slot:", slot);
                                slot.appendChild(champion);
                                emptySlotFound = true;
                                break;
                            }
                        }

                        if (!emptySlotFound) {
                            console.warn("No empty slots available to move the champion to");
                        }
                    } else if (data.status === 'removed') {
                        console.log("Champion removed from a slot.");
                        // Handle the case where a champion is removed
                    }
                })
                .catch(error => {
                    console.error("Error during fetch:", error);
                });
        }
    }

    // Handle slot click events
    function handleSlotClick(event) {
        event.preventDefault();
        console.log("Slot clicked event handled");

        const slot = event.currentTarget;
        // Check if the slot contains a child element
        if (slot.childElementCount > 0) {
            const champion = slot.firstChild;
            const championsList = document.querySelector('#champions');
            if (championsList) {
                console.log("Moving champion back to champions list:", champion);
                championsList.appendChild(champion);

                // Send a request to remove the champion from the slot
                fetch(`/deselect/${champion.dataset.id}`, { method: 'POST' })
                    .then(response => {
                        if (response.ok) {
                            console.log('Champion removed from slot successfully');
                        } else {
                            console.error('Failed to remove champion from slot');
                        }
                    })
                    .catch(error => {
                        console.error("Error during fetch:", error);
                    });
            } else {
                console.error("Unable to find champions list element");
            }
        } else {
            console.warn("No child element in slot to remove");
        }
    }
});