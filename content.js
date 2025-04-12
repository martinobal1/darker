const currentHostname = window.location.hostname;

chrome.storage.sync.get(["darkMode", "sepiaValue", "blacklist"], (data) => {
    const isDarkMode = data.darkMode || false;
    const sepiaValue = data.sepiaValue || 0;
    const blacklist = data.blacklist || [];

    const isBlacklisted = blacklist.some(entry => currentHostname.includes(entry));

    if (isBlacklisted) {
        console.log(`Stránka ${currentHostname} je na blacklist-e. Dark mode sa neaplikuje.`);
        return;
    }

    document.documentElement.style.setProperty('filter', `sepia(${sepiaValue / 100})`, 'important');

    if (isDarkMode) {
        applyDarkMode();
    } else {
        restoreOriginalColors();
    }
});

function applyDarkMode() {
    const elements = document.querySelectorAll("*");
    elements.forEach(el => {
        if (!el.dataset.originalBackground) {
            el.dataset.originalBackground = el.style.backgroundColor || window.getComputedStyle(el).backgroundColor || "";
        }
        if (!el.dataset.originalColor) {
            el.dataset.originalColor = el.style.color || window.getComputedStyle(el).color || "";
        }
        el.style.setProperty('background-color', '#000', 'important');
        el.style.setProperty('color', '#FFF', 'important');
    });
}

function restoreOriginalColors() {
    const elements = document.querySelectorAll("*");
    elements.forEach(el => {
        if (el.dataset.originalBackground !== undefined) {
            el.style.setProperty('background-color', el.dataset.originalBackground, 'important');
            delete el.dataset.originalBackground;
        } else {
            el.style.removeProperty('background-color');
        }

        if (el.dataset.originalColor !== undefined) {
            el.style.setProperty('color', el.dataset.originalColor, 'important');
            delete el.dataset.originalColor;
        } else {
            el.style.removeProperty('color');
        }
    });
}

function startObserver() {
    if (!document.body) {
        setTimeout(startObserver, 100);
        return;
    }

    const observer = new MutationObserver(() => {
        if (!window || !chrome || !chrome.storage) return;

        try {
            chrome.storage.sync.get(["darkMode", "blacklist"], (data) => {
                const isDarkMode = data.darkMode || false;
                const blacklist = data.blacklist || [];

                const isBlacklisted = blacklist.some((entry) => {
                    try {
                        return window.location.hostname.includes(entry);
                    } catch {
                        return false;
                    }
                });

                if (isDarkMode && !isBlacklisted) {
                    applyDarkMode();
                }
            });
        } catch (e) {
            console.warn("Context invalidated, skipping observer update.");
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

startObserver();

document.addEventListener("DOMContentLoaded", () => {
    function fixGoogleMapsDarkMode() {
        document.querySelectorAll("iframe, [class*='map'], [class*='nwn5d']").forEach(el => {
            el.style.filter = "none";
            el.style.backgroundColor = "transparent";
            el.style.setProperty("mix-blend-mode", "normal", "important");
        });

        document.querySelectorAll("div").forEach(el => {
            if (el.innerHTML.includes("Hodnotenia") || el.innerHTML.includes("Recenzie") || el.innerHTML.includes("Otváracie hodiny")) {
                el.style.backgroundColor = "#222";
                el.style.color = "#fff";
                el.style.filter = "none";
            }
        });

        // Najdôležitejšia časť – upravíme **priamo inline štýly na všetkých divoch s mapami**
        document.querySelectorAll("div:has(iframe), div:has([class*='map'])").forEach(el => {
            el.style.setProperty("background-color", "transparent", "important");
        });
    }

    // Aplikuj fix okamžite
    fixGoogleMapsDarkMode();

    // Opakujeme každých 500ms, aby Google neprepísal štýly
    setInterval(fixGoogleMapsDarkMode, 500);

    // Sledujeme DOM a aplikujeme fix pri zmene obsahu
    const observer = new MutationObserver(fixGoogleMapsDarkMode);
    observer.observe(document.body, { childList: true, subtree: true });
});
