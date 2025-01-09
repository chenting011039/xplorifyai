let translations = null;
let currentLanguage = 'en';

// Load translations
fetch('translations.json')
    .then(response => response.json())
    .then(data => {
        translations = data;
        // Set initial language
        changeLanguage(currentLanguage);
    })
    .catch(error => console.error('Error loading translations:', error));

// Function to change language
function changeLanguage(lang) {
    if (!translations || !translations[lang]) return;
    
    currentLanguage = lang;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const keys = element.getAttribute('data-i18n').split('.');
        let value = translations[lang];
        keys.forEach(key => {
            value = value[key];
        });
        
        if (value) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = value;
            } else if (element.tagName === 'OPTION') {
                element.text = value;
            } else {
                element.textContent = value;
            }
        }
    });

    // Update activity recommendations if they're displayed
    if (activitiesData) {
        const recommendationsOutput = document.getElementById('recommendations-output');
        const currentRecommendations = recommendationsOutput.querySelector('.recommendations-list');
        if (currentRecommendations) {
            displayRecommendations(activitiesData.activityList);
        }
    }

    // Store language preference
    localStorage.setItem('preferredLanguage', lang);

    updateDifficultyLabels();
}

document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const hobbySelect = document.getElementById('hobby-select');
    const majorSelect = document.getElementById('major-select');
    const recommendationsOutput = document.getElementById('recommendations-output');
    const contactForm = document.getElementById('contact-form');

    // Store activities data
    let activitiesData = null;

    // Fetch activities data
    fetch('activity.json')
        .then(response => response.json())
        .then(data => {
            activitiesData = data;
            console.log('Activities data loaded successfully');
        })
        .catch(error => {
            console.error('Error loading activities:', error);
            recommendationsOutput.innerHTML = '<p class="text-danger">Error loading recommendations. Please try again later.</p>';
        });

    // Function to update recommendations
    function updateRecommendations() {
        const hobby = hobbySelect.value;
        const major = majorSelect.value;

        if (!hobby || !major) {
            recommendationsOutput.innerHTML = '<p class="text-muted">Please select both your hobby and intended major...</p>';
            return;
        }

        if (!activitiesData) {
            recommendationsOutput.innerHTML = '<p class="text-danger">Loading activities data...</p>';
            return;
        }

        // Check if selected combination matches the JSON data
        if (hobby === activitiesData.hobby && major === activitiesData.major) {
            displayRecommendations(activitiesData.activityList);
        } else {
            recommendationsOutput.innerHTML = `
                <div class="alert alert-info">
                    No specific recommendations available for this combination yet. 
                    Try selecting Writing as hobby and Pre-Med as major for a demo.
                </div>
            `;
        }
    }

    // Function to display recommendations
    function displayRecommendations(activities) {
        let html = '<div class="recommendations-list">';
        activities.forEach((activity, index) => {
            const activityName = currentLanguage === 'zh' ? activity.nameZh || activity.name : activity.name;
            const whatItIs = currentLanguage === 'zh' ? activity.whatItIsZh || activity.whatItIs : activity.whatItIs;
            const whyItHelps = currentLanguage === 'zh' ? activity.whyItHelpsZh || activity.whyItHelps : activity.whyItHelps;

            html += `
                <div class="card mb-4">
                    <div class="card-body">
                        <h5 class="card-title">${activityName}</h5>
                        <div class="card-text mb-3">
                            <h6 class="text-primary">${translations[currentLanguage].activities.whatItIs || 'What it is'}</h6>
                            <p>${whatItIs}</p>
                        </div>
                        <div class="card-text mb-3">
                            <h6 class="text-primary">${translations[currentLanguage].activities.whyItHelps || 'Why it helps'}</h6>
                            <p>${whyItHelps}</p>
                        </div>
                        <div class="card-text">
                            <h6 class="text-primary">${translations[currentLanguage].activities.resources || 'Resources'}</h6>
                            <div class="d-flex gap-2 flex-wrap">
                                ${activity.resources.map(resource => `
                                    <a href="${resource.link}" 
                                       target="_blank" 
                                       class="btn btn-outline-primary btn-sm">
                                        <i class="bi bi-link-45deg"></i> 
                                        ${currentLanguage === 'zh' ? resource.nameZh || resource.name : resource.name}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        recommendationsOutput.innerHTML = html;
    }

    // Event listeners
    hobbySelect.addEventListener('change', updateRecommendations);
    majorSelect.addEventListener('change', updateRecommendations);

    // Handle contact form submission
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                body: JSON.stringify(Object.fromEntries(formData))
            });
            if (response.ok) {
                alert('Thank you for your message! We will get back to you soon.');
                contactForm.reset();
            }
        } catch (error) {
            console.error('Error submitting form:', error);
        }
    });

    // Get the button
    const returnToTopBtn = document.getElementById('return-to-top');

    // Show button when user scrolls down 300px
    window.onscroll = function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            returnToTopBtn.classList.add('show');
        } else {
            returnToTopBtn.classList.remove('show');
        }
    };

    // Scroll to top when button is clicked
    returnToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Check for stored language preference
    const storedLang = localStorage.getItem('preferredLanguage');
    if (storedLang) {
        changeLanguage(storedLang);
    }

    let programsData = null;
    const programsTableBody = document.getElementById('programs-table-body');
    const categoryCheckboxes = document.querySelectorAll('.category-checkbox');
    const difficultyCheckboxes = document.querySelectorAll('.difficulty-checkbox');
    const selectAllCategories = document.getElementById('select-all-categories');
    const selectAllDifficulties = document.getElementById('select-all-difficulties');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const categoryButton = document.querySelector('.dropdown-filter button');
    const difficultyButton = document.querySelectorAll('.dropdown-filter button')[1];

    // Fetch programs data
    fetch('./programs.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            programsData = data;
            displayPrograms();
        })
        .catch(error => {
            console.error('Error loading programs:', error);
            programsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-danger">
                        Error loading programs: ${error.message}
                    </td>
                </tr>
            `;
        });

    // Function to handle Select All for a group of checkboxes
    function handleSelectAll(selectAllCheckbox, checkboxes) {
        selectAllCheckbox.addEventListener('change', function() {
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
            displayPrograms();
        });

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                selectAllCheckbox.checked = allChecked;
                displayPrograms();
            });
        });
    }

    // Set up Select All functionality
    handleSelectAll(selectAllCategories, categoryCheckboxes);
    handleSelectAll(selectAllDifficulties, difficultyCheckboxes);

    // Clear filters button
    clearFiltersBtn.addEventListener('click', () => {
        categoryCheckboxes.forEach(cb => cb.checked = false);
        difficultyCheckboxes.forEach(cb => cb.checked = false);
        selectAllCategories.checked = false;
        selectAllDifficulties.checked = false;
        displayPrograms();
    });

    // Function to update filter button text
    function updateFilterButtonText(type, count) {
        const button = type === 'category' ? categoryButton : difficultyButton;
        const text = type === 'category' ? 'Categories' : 'Difficulty';
        
        button.innerHTML = `
            Select ${text}
            ${count > 0 ? `<span class="selected-count">${count}</span>` : ''}
            <i class="bi bi-chevron-down float-end"></i>
        `;
    }

    // Main display function
    function displayPrograms() {
        if (!programsData) return;

        const selectedCategories = Array.from(categoryCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const selectedDifficulties = Array.from(difficultyCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        // Update filter button text
        updateFilterButtonText('category', selectedCategories.length);
        updateFilterButtonText('difficulty', selectedDifficulties.length);

        let programsToShow = [];

        // Get programs based on selected categories
        if (selectedCategories.length === 0) {
            // If no categories selected, show all programs
            Object.entries(programsData).forEach(([category, programs]) => {
                programsToShow = programsToShow.concat(programs);
            });
        } else {
            // Show only selected categories
            selectedCategories.forEach(category => {
                if (programsData[category]) {
                    programsToShow = programsToShow.concat(programsData[category]);
                }
            });
        }

        // Apply difficulty filter
        if (selectedDifficulties.length > 0) {
            programsToShow = programsToShow.filter(program => 
                selectedDifficulties.includes(program.difficulty)
            );
        }

        // Generate HTML
        let html = '';
        if (programsToShow.length === 0) {
            html = `
                <tr>
                    <td colspan="6" class="text-center text-muted">
                        ${translations[currentLanguage].programs.noPrograms}
                    </td>
                </tr>
            `;
        } else {
            programsToShow.forEach(program => {
                const name = currentLanguage === 'zh' ? program.nameZh || program.name : program.name;
                const direction = currentLanguage === 'zh' ? program.directionZh || program.direction : program.direction;
                const suitable_students = currentLanguage === 'zh' ? program.suitable_students_zh || program.suitable_students : program.suitable_students;
                const highlights = currentLanguage === 'zh' ? program.highlights_zh || program.highlights : program.highlights;

                html += `
                    <tr>
                        <td>${name}</td>
                        <td>${direction}</td>
                        <td>${program.difficulty}</td>
                        <td>
                            <div class="text-wrap" style="max-width: 200px;">
                                ${suitable_students}
                            </div>
                        </td>
                        <td>
                            <div class="text-wrap" style="max-width: 300px;">
                                ${highlights}
                            </div>
                        </td>
                        <td>
                            <a href="${program.application_link}" 
                               target="_blank" 
                               class="btn btn-sm btn-outline-primary">
                                <i class="bi bi-link-45deg"></i>
                                ${translations[currentLanguage].programs.apply}
                            </a>
                        </td>
                    </tr>
                `;
            });
        }

        programsTableBody.innerHTML = html;
    }

    // Initialize display
    displayPrograms();
});

// Update the fetch calls to use API Gateway URL
const API_URL = 'https://your-api-gateway-url.execute-api.region.amazonaws.com/prod';

async function getRecommendations(hobby, major) {
    try {
        const response = await fetch(`${API_URL}/api/activities?hobby=${hobby}&major=${major}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return null;
    }
}

function updateFilterButtonText(selectElement, buttonElement) {
    const selectedOptions = Array.from(selectElement.selectedOptions);
    const defaultText = selectElement.id === 'category-select' ? 'Select Categories' : 'Select Difficulty';
    
    if (selectedOptions.length === 0) {
        buttonElement.innerHTML = `${defaultText} <i class="bi bi-chevron-down float-end"></i>`;
    } else {
        buttonElement.innerHTML = `
            ${defaultText} 
            <span class="selected-count">${selectedOptions.length}</span>
            <i class="bi bi-chevron-down float-end"></i>
        `;
    }
}

// Update the difficulty labels based on language
function updateDifficultyLabels() {
    const difficultyLabels = {
        "⭐": translations[currentLanguage].programs.difficulty.level1,
        "⭐⭐": translations[currentLanguage].programs.difficulty.level2,
        "⭐⭐⭐": translations[currentLanguage].programs.difficulty.level3,
        "⭐⭐⭐⭐": translations[currentLanguage].programs.difficulty.level4,
        "⭐⭐⭐⭐⭐": translations[currentLanguage].programs.difficulty.level5
    };

    document.querySelectorAll('.checkbox-list input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.value.includes('⭐')) {
            const label = checkbox.nextElementSibling;
            label.textContent = `${checkbox.value} ${difficultyLabels[checkbox.value]}`;
        }
    });
} 