/**
 * Template Loader Utility
 * Laadt en cached HTML templates voor betere scheiding van concerns
 */
class TemplateLoader {
    constructor() {
        this.cache = new Map();
        this.baseUrl = window.location.origin + window.location.pathname.replace(/[^\/]*$/, '');
    }

    /**
     * Laadt een template van een URL
     * @param {string} templatePath - Pad naar het template bestand
     * @returns {Promise<string>} Template HTML
     */
    async loadTemplate(templatePath) {
        // Check cache eerst
        if (this.cache.has(templatePath)) {
            return this.cache.get(templatePath);
        }

        try {
            const response = await fetch(`${this.baseUrl}templates/${templatePath}`);
            if (!response.ok) {
                throw new Error(`Failed to load template: ${templatePath}`);
            }
            
            const template = await response.text();
            this.cache.set(templatePath, template);
            return template;
        } catch (error) {
            console.error('Template loading error:', error);
            throw error;
        }
    }

    /**
     * Rendert een template met data
     * @param {string} template - Template HTML met placeholders
     * @param {Object} data - Data om in te vullen
     * @returns {string} Gerenderde HTML
     */
    render(template, data = {}) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data.hasOwnProperty(key) ? this.escapeHtml(String(data[key])) : match;
        });
    }

    /**
     * Rendert een template met complexe data (ondersteunt nested properties)
     * @param {string} template - Template HTML
     * @param {Object} data - Data object
     * @returns {string} Gerenderde HTML
     */
    renderAdvanced(template, data = {}) {
        // Eerst conditionele blokken verwerken
        template = this.processConditionals(template, data);
        
        // Dan normale placeholders vervangen
        return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
            const trimmed = expression.trim();
            
            // Normale property lookup
            const value = this.getNestedProperty(data, trimmed);
            return value !== undefined ? this.escapeHtml(String(value)) : '';
        });
    }

    /**
     * Verwerkt conditionele blokken in template
     * @param {string} template - Template HTML
     * @param {Object} data - Data object
     * @returns {string} Template met verwerkte conditionals
     */
    processConditionals(template, data) {
        // Vervang conditionele blokken
        return template.replace(/\{\{if\s+([^}]+)\}\}(.*?)\{\{endif\}\}/gs, (match, condition, content) => {
            const shouldShow = this.evaluateCondition(condition.trim(), data);
            return shouldShow ? content : '';
        });
    }

    /**
     * Haalt nested property op uit object
     * @param {Object} obj - Data object
     * @param {string} path - Property pad (bijv. "user.name")
     * @returns {*} Property waarde
     */
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, prop) => 
            current && current[prop] !== undefined ? current[prop] : undefined, obj);
    }

    /**
     * Evalueert een simpele conditie
     * @param {string} condition - Conditie string
     * @param {Object} data - Data context
     * @returns {boolean} Conditie resultaat
     */
    evaluateCondition(condition, data) {
        try {
            // Simpele property check
            const value = this.getNestedProperty(data, condition);
            return !!value;
        } catch (error) {
            console.error('Condition evaluation error:', error);
            return false;
        }
    }

    /**
     * Escape HTML voor veiligheid
     * @param {string} text - Te escapen text
     * @returns {string} Geescapete text
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Creëert een DOM element van HTML string
     * @param {string} html - HTML string
     * @returns {Element} DOM element
     */
    createElementFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstElementChild;
    }

    /**
     * Rendert een template direct naar een DOM element
     * @param {string} templatePath - Template pad
     * @param {Object} data - Template data
     * @param {Element} container - Container element
     */
    async renderToElement(templatePath, data, container) {
        try {
            const template = await this.loadTemplate(templatePath);
            const rendered = this.renderAdvanced(template, data);
            const element = this.createElementFromHTML(rendered);
            
            if (container) {
                container.innerHTML = '';
                container.appendChild(element);
            }
            
            return element;
        } catch (error) {
            console.error('Render to element error:', error);
            throw error;
        }
    }

    /**
     * Laadt en compileert alle templates in een directory
     * @param {Array<string>} templatePaths - Array van template paden
     */
    async preloadTemplates(templatePaths) {
        const promises = templatePaths.map(path => this.loadTemplate(path));
        await Promise.all(promises);
    }

    /**
     * Clear de template cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Singleton instance
const templateLoader = new TemplateLoader();