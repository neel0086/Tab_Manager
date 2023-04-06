var activeTimers = []
var tabCreation = {}

chrome.storage.local.set({
        "activeTimers": activeTimers
}, () => { });

chrome.runtime.onMessage.addListener(
        function msgHandler(msg) {
                let timeout = setTimeout(() => {

                        chrome.tabs.remove(msg.tabid, () => { });

                        activeTimers = activeTimers.filter((obj) => {
                                obj.timeoutid != timeout
                        });
                        chrome.storage.local.set({
                                "activeTimers": activeTimers
                        }, () => { });

                }, msg.time);

                let d = new Date();
                let timerobj = {
                        tabid: msg.tabid,
                        timeoutid: timeout,
                        timestr: (new Date(d.getTime() + msg.time)).toString()
                }
                activeTimers.push(timerobj);
                chrome.storage.local.set({
                        "activeTimers": activeTimers
                }, () => { });
                return true;
        });

chrome.tabs.onCreated.addListener(function (tab) {
        // Get the current date/time and store it in storage
        var dateObj = new Date();
        var options = { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric' };
        var newdate = dateObj.toLocaleString('en-US', options);

        tabCreation[tab.id] = newdate

        chrome.storage.local.set({ "tabCreation": tabCreation });
});

// searchWikipedia = function (word) {
//         var query = word.selectionText;
//         chrome.tabs.create({ url: "https://en.wikipedia.org/w/index.php?search=" + query + "&title=Special%3ASearch&go=Go" });
// };

// chrome.contextMenus.create({
//         title: "Search in Wikipedia",
//         contexts: ['all'],
//         onclick: searchWikipedia
// });