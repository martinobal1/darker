document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggleSwitch');
    const sepiaSlider = document.getElementById('sepiaSlider');
    const addCurrentPageBtn = document.getElementById('addCurrentPageToBlacklist');
    const blacklistElement = document.getElementById('blacklist');
    const openBlacklistPage = document.getElementById('openBlacklistPage');

    // Načítanie darkMode stavu
    chrome.storage.sync.get("darkMode", (data) => {
        toggleSwitch.checked = data.darkMode;
    });

    // Načítanie sepia hodnoty
    chrome.storage.sync.get("sepiaValue", (data) => {
        if (data.sepiaValue !== undefined) {
            sepiaSlider.value = data.sepiaValue;
            document.body.style.filter = `sepia(${data.sepiaValue / 100})`;
        }
    });

    loadBlacklist();

    toggleSwitch.addEventListener('change', (event) => {
        const isOn = event.target.checked;

        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const url = new URL(tabs[0].url);
            chrome.storage.sync.get('blacklist', (data) => {
                const blacklist = data.blacklist || [];

                if (blacklist.some(blockedUrl => url.hostname.includes(blockedUrl))) {
                    console.log(`Dark mode nebude zapnutý na stránke: ${url.hostname}`);
                    return;
                }

                chrome.storage.sync.set({ darkMode: isOn }, () => {
                    chrome.tabs.reload(tabs[0].id);
                });
            });
        });

        const slider = document.querySelector('.slider');
        slider.style.backgroundColor = isOn ? '#bfbfbf' : '#1c1c1c';
    });

    sepiaSlider.addEventListener('input', (event) => {
        const sepiaValue = event.target.value;
        chrome.storage.sync.set({ sepiaValue }, () => {
            document.body.style.filter = `sepia(${sepiaValue / 100})`;
        });
    });

    sepiaSlider.addEventListener('change', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.reload(tabs[0].id);
        });
    });

    // Pridanie aktuálnej stránky do blacklistu + refresh
    addCurrentPageBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0] || !tabs[0].url) return;

            try {
                const url = new URL(tabs[0].url);
                const hostname = url.hostname;

                chrome.storage.sync.get('blacklist', (data) => {
                    const blacklist = data.blacklist || [];

                    if (!blacklist.includes(hostname)) {
                        blacklist.push(hostname);
                        chrome.storage.sync.set({ blacklist }, () => {
                            loadBlacklist();
                            console.log(`Stránka ${hostname} bola pridaná do blacklistu.`);

                            // Refresh aktuálnej stránky
                            chrome.tabs.reload(tabs[0].id);
                        });
                    } else {
                        console.log(`Stránka ${hostname} je už v blacklist-e.`);
                    }
                });
            } catch (e) {
                console.error("Nepodarilo sa spracovať URL aktuálnej stránky");
            }
        });
    });

    openBlacklistPage.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("blacklist.html") });
    });

    function loadBlacklist() {
        chrome.storage.sync.get('blacklist', (data) => {
            const blacklist = data.blacklist || [];
            /*if (blacklistElement) {
                //blacklistElement.innerHTML = '';
            }*/
            

            blacklist.forEach(url => {
                const li = document.createElement('li');
                li.textContent = url;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'Odstrániť';
                removeBtn.onclick = () => removeFromBlacklist(url);
                li.appendChild(removeBtn);
                blacklistElement.appendChild(li);
            });
        });
    }

    function removeFromBlacklist(url) {
        chrome.storage.sync.get('blacklist', (data) => {
            const blacklist = data.blacklist || [];
            const updatedBlacklist = blacklist.filter(item => item !== url);
            chrome.storage.sync.set({ blacklist: updatedBlacklist }, () => {
                loadBlacklist();
            });
        });
    }
});
