// ==UserScript==
// @name         WeebGakuin+
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Add Download and Stream columns to weebgakuin.org!
// @author       grant_user
// @match        https://weebgakuin.org/*
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// ==/UserScript==

// @twitter      grant_user
// @github       grantUser


(function() {
    'use strict';

    function createButton(className, iconClass, text, clickHandler) {
        const button = document.createElement('button');
        button.className = className;
        button.innerHTML = `<i class="${iconClass}"></i> ${text}`;
        button.addEventListener('click', clickHandler);
        return button;
    }

    function addColumn(table, columnName, iconClass, clickHandler) {
        const headerRow = table.querySelector('thead tr');
        const newHeaderCell = document.createElement('th');
        newHeaderCell.textContent = columnName;
        newHeaderCell.classList.add('center-align');
        headerRow.appendChild(newHeaderCell);

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const fileIcon = row.querySelector('.fa-file.fa-lg');
            const newCell = row.insertCell();
            newCell.classList.add('center-align');

            if (fileIcon) {
                newCell.appendChild(createButton('btn-' + columnName.toLowerCase(), iconClass, columnName, clickHandler(row)));
            } else {
                newCell.textContent = '-';
            }
        });
    }

    function createVideoModal(videoLink) {
        const modalContainer = document.createElement('div');
        modalContainer.className = 'modal-container';

        const plyrVideo = document.createElement('video');
        plyrVideo.className = 'plyr';
        plyrVideo.controls = true;

        const source = document.createElement('source');
        source.setAttribute('src', videoLink);
        plyrVideo.appendChild(source);

        const closeButton = createButton('btn-close', 'fas fa-times', '', function() {
            modalContainer.remove();
        });
        closeButton.style.textIndent = '-999px';

        const closeButtonContainer = document.createElement('div');
        closeButtonContainer.className = 'close-button-container';
        closeButtonContainer.appendChild(closeButton);

        modalContainer.appendChild(closeButtonContainer);
        modalContainer.appendChild(plyrVideo);
        document.body.appendChild(modalContainer);

        const plyrStylesheet = document.createElement('link');
        plyrStylesheet.rel = 'stylesheet';
        plyrStylesheet.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
        document.head.appendChild(plyrStylesheet);

        const plyrScript = document.createElement('script');
        plyrScript.src = 'https://cdn.plyr.io/3.7.8/plyr.js';
        document.head.appendChild(plyrScript);

        plyrScript.onload = function() {
            new Plyr(plyrVideo);
        };
    }

    GM_addStyle(`
        /* Add styles for buttons, center alignment, and disabled button */
        .btn-download,
        .btn-stream,
        .btn-close {
            border-radius: 4px;
            background-color: #292c35;
            color: #ffffff;
            border: 1px solid #3d404a;
            padding: 6px 12px;
            margin-right: 5px;
            cursor: pointer;
        }
        .btn-download:hover,
        .btn-stream:hover,
        .btn-close:hover {
            background-color: #3d404a;
        }
        .center-align {
            text-align: center;
        }
        .btn-stream[disabled] {
            cursor: not-allowed;
        }
        .modal-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }
        .close-button-container {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 1;
        }
        .plyr {
            width: 50%;
            height: 45%;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
    `);

    const targetTable = document.querySelector('table');
    if (targetTable) {
        const downloadIconClass = 'fas fa-download';
        const playIconClass = 'fas fa-play';

        addColumn(targetTable, 'Download', downloadIconClass, function(row) {
            return function() {
                const downloadLink = row.querySelector('a[href^="/download/"]');
                if (downloadLink) {
                    const link = downloadLink.getAttribute('href');
                    const domain = window.location.hostname;
                    const fullLink = 'https://' + domain + link;

                    GM_xmlhttpRequest({
                        method: "HEAD",
                        url: fullLink,
                        onreadystatechange: function(response) {
                            if (response.readyState === 2) {
                                const redirectedLink = response.finalUrl + '?action=download';
                                window.open(redirectedLink, '_blank');
                            }
                        }
                    });
                }
            };
        });

        addColumn(targetTable, 'Stream', playIconClass, function(row) {
            return function() {
                const streamLink = row.querySelector('a[href^="/download/"]');
                const fileName = streamLink.textContent;
                const streamButton = this;

                if (streamLink && !fileName.includes('HEVC')) {
                    const link = streamLink.getAttribute('href');
                    const domain = window.location.hostname;
                    const fullLink = 'https://' + domain + link;

                    GM_xmlhttpRequest({
                        method: "HEAD",
                        url: fullLink,
                        onreadystatechange: function(response) {
                            if (response.readyState === 2) {
                                const redirectedLink = response.finalUrl + '?action=stream';
                                createVideoModal(redirectedLink);
                            }
                        }
                    });
                }
            };
        });


        const allRows = targetTable.querySelectorAll('tbody tr');
        allRows.forEach(row => {
            const streamButton = row.querySelector('.btn-stream');
            const fileName = row.textContent;

            if (streamButton && fileName.includes('HEVC')) {
                streamButton.disabled = true;
            }
        });
    }
})();
