document.addEventListener('DOMContentLoaded', () => {
    const blacklistElement = document.getElementById('blacklist');

    chrome.storage.sync.get('blacklist', (data) => {
        const blacklist = data.blacklist || [];

        if (blacklist.length === 0) {
            blacklistElement.innerHTML = "<li>No pages in blacklists</li>";
            return;
        }

        blacklist.forEach(site => {
            const li = document.createElement('li');
            li.textContent = site;

            const removeButton = document.createElement('button');
            removeButton.textContent = "Delete";
            removeButton.addEventListener('click', () => {
                const newBlacklist = blacklist.filter(item => item !== site);
                chrome.storage.sync.set({ blacklist: newBlacklist }, () => {
                    li.remove();
                });
            });

            li.appendChild(removeButton);
            blacklistElement.appendChild(li);
        });
    });
});
