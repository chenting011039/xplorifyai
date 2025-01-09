document.addEventListener('DOMContentLoaded', function() {
    let programsData = [];
    let selectedCategories = new Set();
    let selectedDifficulties = new Set();

    // Fetch programs data
    fetch('programs.json')
        .then(response => response.json())
        .then(data => {
            programsData = data;
            displayPrograms(programsData);
            setupFilters();
        })
        .catch(error => console.error('Error loading programs:', error));

    function setupFilters() {
        // Category filter setup
        document.querySelectorAll('.category-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateFilters);
        });

        // Difficulty filter setup
        document.querySelectorAll('.difficulty-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateFilters);
        });

        // Select all categories
        document.getElementById('select-all-categories').addEventListener('change', function(e) {
            document.querySelectorAll('.category-checkbox').forEach(cb => {
                cb.checked = e.target.checked;
            });
            updateFilters();
        });

        // Select all difficulties
        document.getElementById('select-all-difficulties').addEventListener('change', function(e) {
            document.querySelectorAll('.difficulty-checkbox').forEach(cb => {
                cb.checked = e.target.checked;
            });
            updateFilters();
        });

        // Clear filters button
        document.getElementById('clear-filters').addEventListener('click', clearFilters);

        // Setup hover behavior for both dropdowns
        const dropdownFilters = document.querySelectorAll('.dropdown-filter');
        
        dropdownFilters.forEach(filter => {
            const dropdownOptions = filter.querySelector('.dropdown-options');
            
            // Show on hover
            filter.addEventListener('mouseenter', function() {
                // Close all other dropdowns first
                document.querySelectorAll('.dropdown-options').forEach(dropdown => {
                    dropdown.style.display = 'none';
                });
                // Show current dropdown
                dropdownOptions.style.display = 'block';
            });

            // Hide on mouse leave
            filter.addEventListener('mouseleave', function() {
                dropdownOptions.style.display = 'none';
            });
        });
    }

    function updateFilters() {
        selectedCategories.clear();
        selectedDifficulties.clear();

        document.querySelectorAll('.category-checkbox:checked').forEach(cb => {
            selectedCategories.add(cb.value);
        });

        document.querySelectorAll('.difficulty-checkbox:checked').forEach(cb => {
            selectedDifficulties.add(cb.value);
        });

        filterAndDisplayPrograms();
    }

    function clearFilters() {
        document.querySelectorAll('.category-checkbox, .difficulty-checkbox, .select-all').forEach(cb => {
            cb.checked = false;
        });
        selectedCategories.clear();
        selectedDifficulties.clear();
        displayPrograms(programsData);
    }

    function filterAndDisplayPrograms() {
        let filteredPrograms = {};
        
        Object.entries(programsData).forEach(([category, programs]) => {
            if (selectedCategories.size === 0 || selectedCategories.has(category)) {
                filteredPrograms[category] = programs.filter(program => 
                    selectedDifficulties.size === 0 || selectedDifficulties.has(program.difficulty)
                );
            }
        });

        displayPrograms(filteredPrograms);
    }

    function displayPrograms(data) {
        const tableBody = document.getElementById('programs-table-body');
        tableBody.innerHTML = '';

        Object.entries(data).forEach(([category, programs]) => {
            programs.forEach(program => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${program.name}</td>
                    <td>${program.direction}</td>
                    <td>${program.difficulty}</td>
                    <td>${program.suitable_students}</td>
                    <td>${program.highlights}</td>
                    <td>
                        <a href="${program.application_link}" target="_blank" class="btn btn-primary btn-sm">
                            Apply
                        </a>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        });
    }
}); 