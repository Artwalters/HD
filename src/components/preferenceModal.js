// ==============================
// PREFERENCE MODAL COMPONENT
// ==============================

class PreferenceModal {
    constructor(filterManager) {
        this.filterManager = filterManager;
        this.modal = null;
        this.selectedCategories = [];
        this.currentStepIndex = 0;
        this.currentCategory = null;
        this.userPreferences = {};
        this.isOpen = false;
    }

    /**
     * Toont de preference modal voor geselecteerde categorieën
     */
    show(selectedCategories) {
        console.log('🎭 PreferenceModal.show called with:', selectedCategories);
        
        this.selectedCategories = selectedCategories;
        this.currentStepIndex = 0;
        this.userPreferences = {};
        this.isOpen = true;

        // Reset to first category/step
        this.resetToFirstStep();
        
        console.log('🎭 Creating modal...');
        this.createModal();
        this.showCurrentStep();
        
        // Add to body
        document.body.appendChild(this.modal);
        console.log('🎭 Modal added to body');
        
        // Trigger animation
        requestAnimationFrame(() => {
            this.modal.classList.add('visible');
            console.log('🎭 Modal made visible');
        });
    }

    /**
     * Reset naar eerste stap van eerste categorie
     */
    resetToFirstStep() {
        this.currentCategory = this.selectedCategories[0];
        this.currentStepIndex = 0;
    }

    /**
     * Creëert de modal HTML structuur
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'preference-modal';
        this.modal.innerHTML = `
            <div class="preference-backdrop"></div>
            <div class="preference-container">
                <div class="preference-header">
                    <button class="preference-close" aria-label="Sluiten">&times;</button>
                    <div class="preference-progress">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                        <span class="progress-text">Stap 1 van ${this.getTotalSteps()}</span>
                    </div>
                </div>
                
                <div class="preference-content">
                    <!-- Content wordt dynamisch geladen -->
                </div>
                
                <div class="preference-footer">
                    <button class="btn-secondary preference-skip">Overslaan</button>
                    <div class="preference-navigation">
                        <button class="btn-secondary preference-back" style="display: none;">Vorige</button>
                        <button class="btn-primary preference-next">Volgende</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    /**
     * Berekent totaal aantal stappen
     */
    getTotalSteps() {
        let total = 0;
        this.selectedCategories.forEach(category => {
            const definition = window.SubcategoryDefinitions[category];
            if (definition) {
                total += definition.steps.length;
            }
        });
        return total;
    }

    /**
     * Berekent huidige absolute stap nummer
     */
    getCurrentAbsoluteStep() {
        let step = 0;
        
        // Tel alle stappen van vorige categorieën
        const currentCategoryIndex = this.selectedCategories.indexOf(this.currentCategory);
        for (let i = 0; i < currentCategoryIndex; i++) {
            const definition = window.SubcategoryDefinitions[this.selectedCategories[i]];
            if (definition) {
                step += definition.steps.length;
            }
        }
        
        // Tel huidige stap
        step += this.currentStepIndex + 1;
        
        return step;
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        this.modal.querySelector('.preference-close').addEventListener('click', () => {
            this.close();
        });

        // Backdrop click
        this.modal.querySelector('.preference-backdrop').addEventListener('click', () => {
            this.close();
        });

        // Navigation buttons
        this.modal.querySelector('.preference-skip').addEventListener('click', () => {
            this.handleSkip();
        });

        this.modal.querySelector('.preference-back').addEventListener('click', () => {
            this.handleBack();
        });

        this.modal.querySelector('.preference-next').addEventListener('click', () => {
            this.handleNext();
        });

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }

    /**
     * Toont de huidige stap
     */
    showCurrentStep() {
        const definition = window.SubcategoryDefinitions[this.currentCategory];
        if (!definition || !definition.steps[this.currentStepIndex]) {
            this.handleComplete();
            return;
        }

        const step = definition.steps[this.currentStepIndex];
        const content = this.modal.querySelector('.preference-content');
        
        content.innerHTML = `
            <div class="step-container" data-step="${step.id}">
                <div class="step-header">
                    <div class="step-icon">${step.icon}</div>
                    <h2 class="step-title">${step.title}</h2>
                    <p class="step-category">in ${this.currentCategory}</p>
                </div>
                
                <div class="step-options">
                    ${step.options.map(option => `
                        <button class="preference-option" data-option="${option.id}">
                            <span class="option-icon">${option.icon}</span>
                            <span class="option-label">${option.label}</span>
                        </button>
                    `).join('')}
                </div>
                
                ${!step.required ? `
                    <div class="step-hint">
                        <p>💡 Je kunt meerdere opties selecteren of overslaan</p>
                    </div>
                ` : ''}
            </div>
        `;

        // Setup option clicks
        this.setupOptionListeners();
        
        // Update progress
        this.updateProgress();
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Restore previous selections
        this.restoreSelections(step.id);
    }

    /**
     * Setup option button listeners
     */
    setupOptionListeners() {
        const options = this.modal.querySelectorAll('.preference-option');
        options.forEach(option => {
            option.addEventListener('click', () => {
                option.classList.toggle('selected');
                this.saveCurrentSelections();
            });
        });
    }

    /**
     * Herstel vorige selecties voor deze stap
     */
    restoreSelections(stepId) {
        if (!this.userPreferences[this.currentCategory] || 
            !this.userPreferences[this.currentCategory][stepId]) {
            return;
        }

        const selections = this.userPreferences[this.currentCategory][stepId];
        selections.forEach(selectionId => {
            const option = this.modal.querySelector(`[data-option="${selectionId}"]`);
            if (option) {
                option.classList.add('selected');
            }
        });
    }

    /**
     * Sla huidige selecties op
     */
    saveCurrentSelections() {
        const definition = window.SubcategoryDefinitions[this.currentCategory];
        const step = definition.steps[this.currentStepIndex];
        
        const selectedOptions = Array.from(
            this.modal.querySelectorAll('.preference-option.selected')
        ).map(option => option.dataset.option);

        // Initialize nested object if needed
        if (!this.userPreferences[this.currentCategory]) {
            this.userPreferences[this.currentCategory] = {};
        }

        this.userPreferences[this.currentCategory][step.id] = selectedOptions;
    }

    /**
     * Update progress bar en tekst
     */
    updateProgress() {
        const currentStep = this.getCurrentAbsoluteStep();
        const totalSteps = this.getTotalSteps();
        const percentage = (currentStep / totalSteps) * 100;

        const progressFill = this.modal.querySelector('.progress-fill');
        const progressText = this.modal.querySelector('.progress-text');

        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `Stap ${currentStep} van ${totalSteps}`;
    }

    /**
     * Update navigation buttons
     */
    updateNavigationButtons() {
        const backBtn = this.modal.querySelector('.preference-back');
        const nextBtn = this.modal.querySelector('.preference-next');
        
        // Show/hide back button
        const isFirstStep = this.currentStepIndex === 0 && 
                           this.selectedCategories.indexOf(this.currentCategory) === 0;
        backBtn.style.display = isFirstStep ? 'none' : 'block';
        
        // Update next button text
        const isLastStep = this.isLastStep();
        nextBtn.textContent = isLastStep ? 'Voltooien' : 'Volgende';
    }

    /**
     * Controleert of dit de laatste stap is
     */
    isLastStep() {
        const categoryIndex = this.selectedCategories.indexOf(this.currentCategory);
        const definition = window.SubcategoryDefinitions[this.currentCategory];
        
        return categoryIndex === this.selectedCategories.length - 1 && 
               this.currentStepIndex === definition.steps.length - 1;
    }

    /**
     * Behandelt skip actie
     */
    handleSkip() {
        // Clear current selections
        const definition = window.SubcategoryDefinitions[this.currentCategory];
        const step = definition.steps[this.currentStepIndex];
        
        if (this.userPreferences[this.currentCategory]) {
            delete this.userPreferences[this.currentCategory][step.id];
        }
        
        this.handleNext();
    }

    /**
     * Behandelt back actie
     */
    handleBack() {
        if (this.currentStepIndex > 0) {
            this.currentStepIndex--;
        } else {
            // Ga naar vorige categorie
            const categoryIndex = this.selectedCategories.indexOf(this.currentCategory);
            if (categoryIndex > 0) {
                this.currentCategory = this.selectedCategories[categoryIndex - 1];
                const definition = window.SubcategoryDefinitions[this.currentCategory];
                this.currentStepIndex = definition.steps.length - 1;
            }
        }
        
        this.showCurrentStep();
    }

    /**
     * Behandelt next actie
     */
    handleNext() {
        // Save current selections
        this.saveCurrentSelections();
        
        const definition = window.SubcategoryDefinitions[this.currentCategory];
        
        if (this.currentStepIndex < definition.steps.length - 1) {
            // Volgende stap in dezelfde categorie
            this.currentStepIndex++;
            this.showCurrentStep();
        } else {
            // Volgende categorie
            const categoryIndex = this.selectedCategories.indexOf(this.currentCategory);
            if (categoryIndex < this.selectedCategories.length - 1) {
                this.currentCategory = this.selectedCategories[categoryIndex + 1];
                this.currentStepIndex = 0;
                this.showCurrentStep();
            } else {
                // Alle stappen voltooid
                this.handleComplete();
            }
        }
    }

    /**
     * Behandelt voltooiing van alle stappen
     */
    handleComplete() {
        // Toon samenvatting of pas direct toe
        this.applyPreferences();
    }

    /**
     * Past de voorkeuren toe en sluit modal
     */
    applyPreferences() {
        // Sla voorkeuren op in localStorage
        localStorage.setItem('userSubcategoryPreferences', JSON.stringify(this.userPreferences));
        
        // Geef voorkeuren door aan filter manager
        this.filterManager.applySubcategoryFilters(this.userPreferences);
        
        console.log('🎯 Voorkeuren toegepast:', this.userPreferences);
        
        this.close();
    }

    /**
     * Behandelt keyboard input
     */
    handleKeyPress(e) {
        if (!this.isOpen) return;
        
        switch(e.key) {
            case 'Escape':
                this.close();
                break;
            case 'ArrowLeft':
                if (e.target.closest('.preference-modal')) {
                    this.handleBack();
                }
                break;
            case 'ArrowRight':
            case 'Enter':
                if (e.target.closest('.preference-modal')) {
                    this.handleNext();
                }
                break;
        }
    }

    /**
     * Sluit de modal
     */
    close() {
        if (!this.modal) return;
        
        this.modal.classList.remove('visible');
        
        setTimeout(() => {
            if (this.modal && this.modal.parentNode) {
                this.modal.parentNode.removeChild(this.modal);
            }
            this.modal = null;
            this.isOpen = false;
        }, 300);
        
        // Remove keyboard listener
        document.removeEventListener('keydown', this.handleKeyPress);
    }

    /**
     * Vernietigt de modal en cleanup
     */
    destroy() {
        this.close();
        this.filterManager = null;
        this.selectedCategories = [];
        this.userPreferences = {};
    }
}

// Maak beschikbaar voor andere modules
window.PreferenceModal = PreferenceModal;