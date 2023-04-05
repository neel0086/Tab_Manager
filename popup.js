var selectedrow;
var prevrow;
function getMemory(callback) {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
                const httpTabs = tabs.filter((tab) => /^http/.test(tab.url));
                const results = {};
                let waiting = httpTabs.length;

                httpTabs.forEach((tab) => {
                        chrome.tabs.highlight({ 'tabs': tab.id }, function () { });
                        chrome.tabs.executeScript(tab.id, { code: 'window.performance.memory.usedJSHeapSize' }, (memory) => {
                                results[tab.id] = { id: tab.id, memory: memory[0], title: tab.title };
                                waiting--;
                                if (waiting === 0) {
                                        callback(results);
                                }
                        });
                });
        });
}



function rearrange(res) {
        var sortable = [];
        for (var tabid in res) {
                sortable.push([tabid, res[tabid].memory]);
        }

        sortable.sort(function (a, b) {
                return b[1] - a[1];
        });

        for (let i = 0; i < sortable.length; i++) {
                chrome.tabs.move(parseInt(sortable[i][0], 10), {
                        'index': i
                });
        }
}

function sortTab() {
        getMemory((res) => rearrange(res));
}

async function sortTabTime() {
        await chrome.storage.local.get(["tabCreation"], async (result) => {
                let res = result["tabCreation"]
                var sortable = [];
                for (var tabid in res) {
                        sortable.push([tabid, res[tabid]]);
                }

                sortable.sort(function (a, b) {
                        return a[1] - b[1];
                });

                for (let i = 0; i < sortable.length; i++) {
                        chrome.tabs.move(parseInt(sortable[i][0], 10), {
                                'index': i
                        });
                }
        })
}

function selectRow() {
        selectedrow = this;
        this.style.backgroundColor = "#435560";
        if (prevrow)
                prevrow.style.backgroundColor = "";
        prevrow = this;

        if (!this.getElementsByTagName("img")[0].classList.contains("hide")) {
                chrome.storage.local.get(['activeTimers'], (activeTimersres) => {
                        let activeTimers = activeTimersres["activeTimers"];
                        for (timer of activeTimers) {
                                if (timer.tabid == selectedrow.id) {
                                        document.getElementById("warningplaceholder").textContent =
                                                "This tab is scheduled to close at " + timer.timestr;
                                }
                        }
                });
        } else
                document.getElementById("warningplaceholder").textContent = "";
}

function scheduleCloseAt() {

        let timein = document.getElementById("timeform").value;
        // hh:mm close exactly at hh:mm

        let curr = new Date();
        let curhours = curr.getHours();
        let curmin = curr.getMinutes();
        let hours = parseInt(timein.slice(0, 2), 10);
        let min = parseInt(timein.slice(3, 5), 10);

        if (hours * 60 + min < curhours * 60 + curmin)
                hours += 24;

        if (min < curmin) {
                min += 60;
                hours -= 1;
        }

        chrome.runtime.sendMessage({
                tabid: parseInt(selectedrow.id, 10),
                time: ((hours - curhours) * 60 * 60 + (min - curmin) * 60) * 1000
        }, () => {
                return true;
        });
}


function scheduleClose() {
        if (!selectedrow) {
                {
                        document.getElementById("warningplaceholder").textContent =
                                "Select a tab first, by clicking on it in the table above";
                        return;
                }
        } else
                document.getElementById("warningplaceholder").textContent = "";
        scheduleCloseAt();

        selectedrow.getElementsByTagName("img")[0].classList.remove("hide");

        setTimeout(() => {
                document.getElementById("warningplaceholder").textContent = "Scheduled to be closed";
        }, 100);

        setTimeout(() => {
                document.getElementById("warningplaceholder").textContent = "";
        }, 5000);
}

getMemory((res) => {

        chrome.storage.local.get(['activeTimers'], async (activeTimersres) => {
                let activeTimers = activeTimersres["activeTimers"];
                await chrome.storage.local.get(["tabCreation"], async (result) => {

                        let creationTime = result["tabCreation"];
                        console.log(creationTime)
                        for (tabid in res) {
                                let clockimg = document.createElement("img");
                                clockimg.src = "clock.png";
                                let row = document.createElement("tr");
                                let clock = document.createElement("td");
                                let name = document.createElement("td");
                                let time = document.createElement("td");
                                let mem = document.createElement("td");

                                row.id = tabid;
                                row.draggable = true
                                clock.classList.add("clock");
                                name.classList.add("tabname");
                                time.classList.add("tabtime")
                                mem.classList.add("tabmem");

                                if (!activeTimers.some((obj) => obj.tabid == tabid)) {
                                        clockimg.classList.add("hide");
                                }
                                clockimg.classList.add("clockimg");
                                clock.append(clockimg);
                                name.textContent = res[tabid].title;
                                time.textContent = creationTime[tabid]
                                mem.textContent = (res[tabid].memory / 1000000).toFixed(2);
                                row.append(clock);
                                row.append(name);
                                row.append(time)
                                row.append(mem);
                                row.addEventListener("click", selectRow);
                                document.getElementById("tablist").getElementsByTagName("tbody")[0].append(row);
                        }
                });

        });
});

let key = document.querySelectorAll('.tablist tr');
let draggedRow = null;

key.forEach((table, index) => {
        table.addEventListener('dragstart', function (event) {
                if (event.target.tagName === 'TD') {
                        draggedRow = event.target.parentNode;
                }
        });

        table.addEventListener('dragover', function (event) {
                event.preventDefault();

                if (event.target.tagName === 'TD') {
                        let targetRow = event.target.parentNode;
                        let targetIndex = Array.from(targetRow.parentNode.children).indexOf(targetRow);
                        let draggedIndex = Array.from(draggedRow.parentNode.children).indexOf(draggedRow);

                        if (targetIndex > draggedIndex) {
                                targetRow.after(draggedRow);
                        } else if (targetIndex < draggedIndex) {
                                targetRow.before(draggedRow);
                        }
                }
        });

        table.addEventListener('dragend', function (event) {
                draggedRow = null;
        });

})



document.getElementById("sortbt").addEventListener("click", sortTab);
document.getElementById("sortByTime").addEventListener("click", sortTabTime);
document.getElementById("scheduleclose").addEventListener("click", scheduleClose);
