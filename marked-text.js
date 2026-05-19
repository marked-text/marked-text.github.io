!(( // IIFE so code can be copied anywhere without worrying about dependencies or globals
/*

██╗    ██╗ ██████╗ ██████╗ 
██║    ██║██╔════╝██╔═══██╗
██║ █╗ ██║██║     ██║   ██║
██║███╗██║██║     ██║▄▄ ██║
╚███╔███╔╝╚██████╗╚██████╔╝
 ╚══╝╚══╝  ╚═════╝ ╚══▀▀═╝

A Web Components Course

*/

// https://marked-text.github.io

// <marked-text> renders authored prose inside shadow DOM and paints a hand-drawn SVG highlight layer behind nested `mark-text` and `[marktext]` targets.

SETTINGS = ["color", "frequency", "scale", "seed"],
    DEFAULTS = {
        color: "rebeccapurple",
        frequency: "0.015",
        scale: "13",
        seed: "0",
    },
    // CSS custom properties that can be used as host-level fallbacks for settings
    CSS_VARIABLES = {
        color: "--marked-text-color",
        frequency: "--marked-text-frequency",
        scale: "--marked-text-scale",
        seed: "--marked-text-seed",
    },
    /**
     * Creates a DOM element, assigns properties, and appends child nodes.
     * @param {string} tag The tag name to create.
     * @param {object} [props={}] Properties, attributes, styles, classes, and children.
     * @returns {HTMLElement} The configured element.
     */
    createElement = (tag, props = {}) => {
        const element = document.createElement(tag);
        const { append = [], attrs = {}, styles = {}, classes = [], ...rest } = props;
        Object.assign(element, rest);
        Object.entries(attrs).forEach(([name, value]) => {
            if (value !== undefined && value !== null) element.setAttribute(name, value);
        });
        // Object.assign(element.style, styles);
        // element.classList.add(...[classes].flat().filter(Boolean));
        element.append(...[append].flat(9));
        return element;
    },
    /**
     * Rounds layout values to 2 decimals to keep SVG payloads stable.
     * @param {number} value The numeric value to round.
     * @returns {number} The rounded value.
     */
    round = (value) => Math.round(value * 100) / 100,
    /**
     * Escapes attribute values used inside inline SVG markup.
     * @param {string|number} value The raw attribute value.
     * @returns {string} The escaped attribute-safe string.
     */
    escapeAttribute = (value) => String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll('#', "&#35;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;"),
    /**
     * Reads a host-level setting from an attribute, CSS custom property, or fallback default.
     * @param {HTMLElement} host The marked-text host.
     * @param {"color"|"frequency"|"scale"|"seed"} name The setting name.
     * @returns {string} The resolved host setting.
     */
    resolveHostSetting = (host, name) => host.getAttribute(name)
        || getComputedStyle(host).getPropertyValue(CSS_VARIABLES[name]).trim()
        || DEFAULTS[name],
    /**
     * Reads an attribute override from a marked target, with support for prefixed aliases.
     * @param {Element} target The marked element.
     * @param {string} name The base attribute name.
     * @param {string} fallback The inherited fallback value.
     * @returns {string} The resolved attribute value.
     */
    resolveMarkedSetting = (target, name, fallback) => target.getAttribute(name) || target.getAttribute(`marktext${name}`) || fallback,
    /**
     * Builds the inline SVG data URL used as the highlight background image.
     * @param {object} [options={}] Highlight image options.
     * @param {number} options.width The content width in CSS pixels.
     * @param {number} options.height The content height in CSS pixels.
     * @param {Array<{x:number,y:number,width:number,height:number,rx:number,color:string,frequency:string,scale:string,seed:string}>} options.rects The rectangles to draw.
     * @returns {string} A CSS background-image value.
     */
    createHighlightImage = ({ width, height, rects } = {}) => {
        if (!width || !height || !rects?.length) return "none";
        const filters = rects.map(({ frequency, scale, seed }, index) => {
            const filterId = `filter-${index}`;
            return {
                id: filterId,
                markup: `<filter id="${filterId}">`
                    + `<feTurbulence baseFrequency="${escapeAttribute(frequency)}" numOctaves="5" seed="${escapeAttribute(seed)}" result="noise"></feTurbulence>`
                    + `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${escapeAttribute(scale)}" xChannelSelector="R" yChannelSelector="G">`
                    + `</feDisplacementMap></filter>`,
            };
        });
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(width)} ${round(height)}" preserveAspectRatio="none">`
            + `<defs>`
            + filters.map(({ markup }) => markup).join("")
            + `</defs>`
            + rects.map(({ x, y, width: rectWidth, height: rectHeight, rx, color }, index) =>
                `<rect x="${round(x)}" y="${round(y)}"`
                + ` width="${round(rectWidth)}" height="${round(rectHeight)}"`
                + ` rx="${round(rx)}" fill="${escapeAttribute(color)}"`
                + ` filter="url(#${filters[index].id})">`
                + `</rect>`).join("")
            + `</svg>`;
        const encoded = encodeURIComponent(svg); // just to be sure
        const sanitizedForUser = encoded
            .replaceAll("%2F", "/")
            .replaceAll("%3D", "=")
            .replaceAll("%22", "'")
            .replaceAll("%20", " ")
            // .replaceAll("%23", "#")
            .replaceAll("%3E", ">")
            .replaceAll("%3C", "<")
            .replaceAll("%3A", ":");
        console.log("%c Chrome handles this SVG just fine as background-image.Not sure if all browsers handle this SVG correctly:\n", "background:orange; color:black;font-weight:bold;", sanitizedForUser);
        return `url("data:image/svg+xml,${encoded}")`;
    },
    /**
     * Collects the rectangles that should receive the filtered marker background.
     * @param {object} options Rectangle collection options.
     * @param {HTMLElement} options.container The rendered content container.
     * @param {string} options.color The fallback highlight color.
     * @param {string} options.frequency The fallback turbulence frequency.
     * @param {string} options.scale The fallback displacement scale.
     * @param {string} options.seed The fallback turbulence seed.
     * @returns {Array<{x:number,y:number,width:number,height:number,rx:number,color:string,frequency:string,scale:string,seed:string}>} The marker rectangles.
     */
    collectMarkedRects = ({ container, color, frequency, scale, seed }) => {
        const containerRect = container.getBoundingClientRect();
        const targets = [...container.querySelectorAll("mark-text,[marktext]")];
        return targets.flatMap((target) => {
            const targetSettings = {
                color: resolveMarkedSetting(target, "color", color),
                frequency: resolveMarkedSetting(target, "frequency", frequency),
                scale: resolveMarkedSetting(target, "scale", scale),
                seed: resolveMarkedSetting(target, "seed", seed),
            };
            if (target.hasAttribute("marktext")) { // mark HTML elements don't support multiple client rects, so we use the bounding rect instead
                const rect = target.getBoundingClientRect();
                if (!rect.width || !rect.height) return [];
                return [{
                    x: rect.left - containerRect.left - 3,
                    y: rect.top - containerRect.top - 2,
                    width: rect.width + 6,
                    height: rect.height + 4,
                    rx: Math.max(8, rect.height * 0.18),
                    ...targetSettings,
                }];
            }

            const BAND_HEIGHT_MIN = 8; // ensures small text gets enough highlight to look good
            const BAND_HEIGHT_RATIO = 0.68; // fills gaps between lines while keeping single-line highlights tight
            const BAND_RX_RATIO = 0.32; // keeps corner curves proportional to band height
            const BAND_Y_FACTOR = 0.16; // moves highlight down to better align with text descenders
            const BAND_X_OFFSET = 2; // expands highlight equally on both sides to better cover anti-aliasing and small fonts
            const BAND_WIDTH_EXPAND = 4; // expands highlight beyond text edges to better cover anti-aliasing and small fonts

            return [...target.getClientRects()]
                .filter((rect) => rect.width > 0 && rect.height > 0)
                .map((rect) => {
                    const bandHeight = Math.max(BAND_HEIGHT_MIN, rect.height * BAND_HEIGHT_RATIO);
                    const bandY = rect.top - containerRect.top + rect.height * BAND_Y_FACTOR;
                    return {
                        x: rect.left - containerRect.left - BAND_X_OFFSET,
                        y: bandY,
                        width: rect.width + BAND_WIDTH_EXPAND,
                        height: bandHeight,
                        rx: bandHeight * BAND_RX_RATIO,
                        ...targetSettings,
                    };
                });
        });
    }
) => {
    // **************************************************************************** <marked-text>
    if (!customElements.get("marked-text")) {
        /**
         * <marked-text> renders authored prose inside shadow DOM and paints a hand-drawn
         * SVG highlight layer behind nested `mark-text` and `[marktext]` targets.
         *
         * Attributes:
         * - color: default fill color for all generated highlight rectangles.
         * - frequency: default SVG turbulence baseFrequency value.
         * - scale: default SVG displacement scale.
         * - seed: default SVG turbulence seed.
         * - CSS custom properties `--marked-text-color`, `--marked-text-frequency`,
         *   `--marked-text-scale`, and `--marked-text-seed` provide optional host-level fallbacks.
         *
         * Per-mark overrides:
         * - `mark-text` and `[marktext]` targets can override `color`, `frequency`,
         *   `scale`, and `seed` on a single highlighted fragment.
         * - `[marktext]` targets also accept `marktextcolor`, `marktextfrequency`,
         *   `marktextscale`, and `marktextseed` aliases.
         *
         * Methods:
         * - scheduleRender(): queues one redraw on the next animation frame.
         * - render(): measures marked fragments and rebuilds the SVG background image.
         */
        customElements.define("marked-text", class extends HTMLElement {
            static observedAttributes = ["color", "scale", "seed"];
            static BASE_CONTENT_BACKGROUND = "background-repeat:no-repeat;background-position:0 0;background-size:100% 100%";
            /**
             * Creates the shadow DOM shell and the observers used to keep markers aligned.
             */
            constructor() {
                super();
                this.__renderQueued = false;
                this.__movedLightDom = false;
                this.__resizeObserver = new ResizeObserver(() => this.scheduleRender());
                this.__mutationObserver = new MutationObserver(() => {
                    this.__observeLayout();
                    this.scheduleRender();
                });
                this
                    .attachShadow({ mode: "open" })
                    .append(
                        createElement("style", {
                            id: "ComponentStyles", // Simpler than constructed stylesheets
                            textContent:
                                    /*css*/`:host{display:block;position:relative}\n` +
                                    /*css*/`:host([hidden]){display:none}\n` +
                                    /*css*/`marked-text-content{display:block;position:relative}\n` +
                                    /*css*/`marked-text-content mark-text,marked-text-content [marktext]{position:relative}\n`,
                        }),
                        this.svgbackground = createElement("style", {
                            id: "SVG-backgroundImage"
                        }),
                        this.__content = createElement("marked-text-content", {
                            attrs: { part: "content highlight" },
                        }),
                    );
            }
            // ======================================================================== connectedCallback
            /**
             * Starts one-time initialization after the element is connected.
             * @returns {void}
             */
            connectedCallback() {
                this.__initialize();
            } // connectedCallback
            // ======================================================================== disconnectedCallback
            /**
             * Stops active observers when the element leaves the document.
             * @returns {void}
             */
            disconnectedCallback() {
                this.__resizeObserver.disconnect();
                this.__mutationObserver.disconnect();
            } // disconnectedCallback
            // ======================================================================== attributeChangedCallback
            /**
             * Queues a redraw when highlight-related attributes change.
             * @returns {void}
             */
            attributeChangedCallback() {
                this.scheduleRender();
            } // attributeChangedCallback
            get color() {
                return resolveHostSetting(this, "color");
            }
            get frequency() {
                return resolveHostSetting(this, "frequency");
            }
            get scale() {
                return resolveHostSetting(this, "scale");
            }
            get seed() {
                return resolveHostSetting(this, "seed");
            }
            // ======================================================================== __initialize
            /**
             * Defers light DOM capture until authored children are available.
             * @returns {void}
             */
            __initialize() {
                if (this.__initialized) return;
                this.__initialized = true;
                requestAnimationFrame(() => {
                    this.__moveLightDomToShadow();
                    this.__observeLayout();
                    this.scheduleRender();
                });
            } // __initialize
            // ======================================================================== scheduleRender
            /**
             * Queues one render per animation frame.
             * @returns {void}
             */
            scheduleRender() {
                if (this.__renderQueued) return;
                this.__renderQueued = true;
                requestAnimationFrame(() => {
                    this.__renderQueued = false;
                    this.render();
                });
            } // scheduleRender
            // ======================================================================== render
            /**
             * Measures all marked fragments and rebuilds the SVG background image.
             * @returns {void}
             */
            render() {
                const contentRect = this.__content.getBoundingClientRect();
                if (!contentRect.width || !contentRect.height) {
                    this.svgbackground.textContent = `marked-text-content{${this.constructor.BASE_CONTENT_BACKGROUND};background-image:none}`;
                    return;
                }
                const settings = Object.fromEntries(SETTINGS.map((name) => [name, this[name]]));
                const rects = collectMarkedRects({ container: this.__content, ...settings });
                const backgroundImage = createHighlightImage({ width: contentRect.width, height: contentRect.height, rects });
                this.svgbackground.textContent = `marked-text-content{${this.constructor.BASE_CONTENT_BACKGROUND};background-image:${backgroundImage}}`;
            } // render
            // ======================================================================== __moveLightDomToShadow
            /**
             * Moves authored child nodes into the shadow content container once.
             * @returns {void}
             */
            __moveLightDomToShadow() {
                if (this.__movedLightDom) return;
                while (this.firstChild) this.__content.append(this.firstChild);
                this.__movedLightDom = true;
            } // __moveLightDomToShadow
            // ======================================================================== __observeLayout
            /**
             * Watches the host, rendered content, and marked descendants for geometry changes.
             * @returns {void}
             */
            __observeLayout() {
                this.__resizeObserver.disconnect();
                this.__resizeObserver.observe(this);
                this.__resizeObserver.observe(this.__content);
                [...this.__content.querySelectorAll("mark-text,[marktext]")].forEach((target) => {
                    this.__resizeObserver.observe(target);
                });
                this.__mutationObserver.disconnect();
                this.__mutationObserver.observe(this.__content, {
                    subtree: true,
                    childList: true,
                    characterData: true,
                    attributes: true,
                    attributeFilter: ["marktext", ...SETTINGS.flatMap((name) => [name, `marktext${name}`]), "style", "class"],
                });
            } // __observeLayout
        }); // customElements.define
    } // if custom element not defined
}) ();