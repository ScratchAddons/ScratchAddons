export default async function ({ addon, console }) {
    await addon.tab.waitForElement("svg.blocklySvg>g.blocklyWorkspace"); //Wait for the workspace to be ready.

    const Blockly = window.Blockly; //Blockly is usually exposed by default.
    if (!Blockly) {
        Blockly = await addon.tab.traps.getBlockly();
    }

    if (!Blockly) { //If the Blockly global is not exposed, the script cannot do anything useful.
        return "Failed to find Blockly instance!";
    }

    var workspace = Blockly.getMainWorkspace();

    var dom = Blockly.Xml.workspaceToDom(workspace); //Export the workspace to a DOM representing the save XML.
    workspace.addChangeListener(() => { //Every time the workspace changes, update the dom variable.
        dom = Blockly.Xml.workspaceToDom(workspace);
    });
    var TabManager = { //Hacky fix to get the tab key working in the XML editor.
        enableTab: function (keyEvent, tabChar) { //Call with the key event and a string to insert at the text caret's position
            if (keyEvent.keyCode === 9) {
                // Insert tabChar at cursor position
                this.insertTab(tabChar);

                // Prevent switching focus to next element
                this.blockKeyEvent(keyEvent);
            }
        },
        insertTab: function (tab) { //Function to insert the tab char
            if (window.getSelection) {
                var sel = window.getSelection();

                sel.modify("extend", "backward", "paragraphboundary"); //Alter bounds of selection

                var pos = sel.anchorOffset; //Offset of caret in anchorNode (in the editor's case, this is the current Text node)

                if (sel.anchorNode) {
                    sel.collapseToEnd();

                    var node = sel.anchorNode;

                    //Get text before and after caret
                    var preText = node.nodeValue.substring(0, pos);
                    var postText = node.nodeValue.substring(pos, node.nodeValue.length);

                    node.nodeValue = preText + tab + postText; //Insert tab character
                    sel.setPosition(node, pos + 1); //Move text caret forward
                }
            }
        },
        blockKeyEvent: function (keyEvent) {
            if (keyEvent.preventDefault) {
                keyEvent.preventDefault();
            } else {
                keyEvent.returnValue = false;
            }
        }
    };
    if (!document.querySelector("style[data-blocklydevtools-style]")) { //If the css has not yet been injected, inject it.
        var style = document.createElement("style");
        style.innerHTML = `
        /* Hide the ✏️ button on blocks that aren't top level */
        g.blocklyDraggable[data-id]:not(.blocklyInsertionMarker):not(g.blocklyBlockCanvas>g.blocklyDraggable[data-id]:not(.blocklyInsertionMarker)) [data-is-blocklydev-btn] {
            display: none !important;
        }

        /* Hide editor buttons on blocks that aren't top level */
        g.blocklyDraggable[data-id]:not(.blocklyInsertionMarker):not(g.blocklyBlockCanvas>g.blocklyDraggable[data-id]:not(.blocklyInsertionMarker)) [data-is-blocklydev-editor-btn] {
            display: none !important;
        }

        /* Hide the XML editor on blocks that aren't top level */
        g.blocklyDraggable[data-id]:not(.blocklyInsertionMarker):not(g.blocklyBlockCanvas>g.blocklyDraggable[data-id]:not(.blocklyInsertionMarker)) [data-isblocklydeveditor] {
            display: none !important;
        }

        /* Hide scrollbars on the XML editor */
        div[data-isblocklydeveditor]::-webkit-scrollbar {
            display: none;
        }
        div[data-isblocklydeveditor] {
            scrollbar-width: none;
        }
        `;
        style.setAttribute("data-blocklydevtools-style", "true"); //Mark it, so we can know if it has already been injected.
        document.head.appendChild(style);
    }

    if (!getBlocklyWorkspace()) {
        return "Failed to find Blockly SvgWorkspace!";
    }

    function formatXml(xml, innerHTMLMode = false) { //Utility function to format XML, optionally outputting valid HTML
        var formatted = '', indent = '';
        var tab = '\t';
        xml.split(/>\s*</).forEach(function (node) {
            if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
            formatted += indent + '<' + node + '>\r\n';
            if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab;
        });
        if (!innerHTMLMode) {
            return formatted.substring(1, formatted.length - 3);
        } else {
            return formatted.substring(1, formatted.length - 3)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\t/g, "&emsp;")
                .replace(/\n/g, "<br>")
                .replace(/ /g, "&nbsp;");
        }
    }
    function getBlocklyWorkspace() { //Get the svg workspace
        return document.querySelector("svg.blocklySvg>g.blocklyWorkspace");
    }
    function getBlocklyBlockCanvas() { //get the block canvas from the workspace
        return getBlocklyWorkspace().querySelector("g.blocklyBlockCanvas");
    }
    function getSvgPathFromBlock(blockElem) { //Get the svg path from an svg block
        if (isNewBlocklyBlock(blockElem)) {
            return blockElem.querySelector("g.blocklyDraggable[data-id]:not(.blocklyInsertionMarker)>path.blocklyPath[d]");
        }
    }
    function isNewBlocklyBlock(node) { //Is node a block svg that has not yet been hooked.
        return node && node instanceof Element && node.tagName === "g" && node.classList.contains("blocklyDraggable") && !node.classList.contains("blocklyInsertionMarker") && node.hasAttribute("data-id") && !node.hasAttribute("data-blocklydev-hooked");
    }
    function makeBlockEditor(blockId) { //Make the XML editor for a blockId
        function getXmlFromBlockId(id, dom) { //Utility function to get the block's XML string from a Blockly serialised DOM.
            for (let i = 0; i < dom.children.length; i++) {
                const element = dom.children[i];
                if (element.tagName.toLowerCase() === "block" && element.getAttribute("id") === id) {
                    return element.outerHTML;
                }
            }
        }

        var originalXml = getXmlFromBlockId(blockId, dom); //Store the block's original, un-edited XML.

        var container = document.createElement("div"); //Create the editor

        container.setAttribute("data-isblocklydeveditor", "true"); //Give it an identifying attribute
        container.contentEditable = true; //Allow it's contents to be edited

        //Styling
        container.style.padding = "10px";
        container.style.userSelect = "text";
        container.style.cursor = "auto";
        container.style.font = "12pt monospace";
        container.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.5)";
        container.style.color = "yellowgreen";
        container.style.border = "2px solid white";
        container.style.zIndex = "998";
        container.style.borderRadius = "0.8rem";
        container.style.width = "max-content";
        container.style.backgroundColor = "rgb(0,0,30)";
        container.style.overflowX = "hidden";
        container.style.maxHeight = "100vh";
        container.style.overflowY = "scroll";
        container.style.caretColor = "white";

        //Disable spellcheck and autocomplete.
        container.setAttribute("autocomplete", "false");
        container.setAttribute("spellcheck", "false");

        //Set the editor's contents to the formatted original XML.
        container.innerHTML = formatXml(originalXml, true);

        function update() { //Function called when the workspace updates
            originalXml = getXmlFromBlockId(blockId, dom); //Update original XML
            if (!originalXml) { //If it is now undefined, the block has been deleted or no longer exists, so remove listeners and exit.
                workspace.removeChangeListener(update);
                return;
            }
            container.innerHTML = formatXml(originalXml, true); //Update contents
        }

        workspace.addChangeListener(update); //Register change listener

        container.save = function () { //Function to save
            var xmlStr = (Blockly.Xml.domToText || Blockly.utils.xml.domToText)(dom); //Convert the dom to string
            if (!xmlStr.includes(originalXml)) { //If the domn does not contain the original block XML, it is impossible to save changes.
                throw new Error("Workspace XML does not contain block!");
            }
            xmlStr = xmlStr.replace(originalXml, container.textContent); //Replace original XML with modified XML.
            //xmlStr = xmlStr.replace(/\u2003/g, "").replace(/\n/g, "");
            xmlStr = xmlStr.replace(/\u00A0/g, "\u0020"); //Replace any non-breaking spaces with normal ones.
            dom = (Blockly.Xml.textToDom || Blockly.utils.xml.textToDom)(xmlStr); //Update the DOM variable.
            workspace.clear(); //Clear the workspace
            Blockly.Xml.domToWorkspace(dom, workspace); //Load the DOM
            if (Blockly.getMainWorkspace().getToolbox() //If the blockly instance has a toolbox, it needs to be refreshed,
            ) {
                Blockly.getMainWorkspace().getToolbox().refreshSelection();
            }
        }

        //Prevent events from propagating to Blockly
        container.addEventListener("pointerdown", (event) => {
            event.stopPropagation();
        }, {
            capture: true
        });
        container.addEventListener("wheel", (event) => {
            event.stopPropagation();
        }, {
            capture: true
        });
        container.addEventListener("scroll", (event) => {
            event.stopPropagation();
        }, {
            capture: true
        });
        container.addEventListener("contextmenu", (event) => {
            event.stopPropagation();
        }, {
            capture: true
        });
        container.addEventListener("keydown", (event) => {
            TabManager.enableTab(event, "\u2003"); //Fix for tab key
        }, {
            capture: true
        });

        return container;
    }
    function processBlock(element) { //Function to hook block svg element
        if (isNewBlocklyBlock(element)) { //Check if we have not already hooked it
            var blockId = element.getAttribute("data-id"); //Get the id
            var internalBlock = workspace.getBlockById(blockId); //Get the internal block object
            internalBlock.tooltip ||= internalBlock.type || "unknown"; //If the block does not have a tooltip, set it to it's opcode.
            var devWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'); //Create a foreignObject element to allow HTML inside of SVG.
            var btnWrapper = document.createElement("div"); //Wrapper for buttons to keep them on the same row

            btnWrapper.style.cursor = "auto"; //Fix for cursor being the grab hand
            btnWrapper.style.width = "max-content";

            var btn = document.createElement("span"); //Create the edit button
            btn.style.cursor = "pointer";
            btn.style.zIndex = "999";
            btn.style.lineHeight = "1rem";
            btn.setAttribute("data-is-blocklydev-btn", "true");
            btn.innerHTML = "✏️"; //📝✏️

            var save = document.createElement("span"); //Create the save button
            save.style.cursor = "pointer";
            save.style.zIndex = "999";
            save.setAttribute("data-is-blocklydev-editor-btn", "true");
            save.style.display = "none";
            save.innerHTML = "💾";
            save.style.lineHeight = "1rem";

            var collapse = document.createElement("span"); //Create the collapse/uncollapse button
            collapse.style.cursor = "pointer";
            collapse.style.zIndex = "999";
            collapse.setAttribute("data-is-blocklydev-editor-btn", "true");
            collapse.style.display = "none";
            collapse.innerHTML = "⬆️";
            collapse.style.lineHeight = "1rem";

            var bin = document.createElement("span"); //Create the force delete button
            bin.style.cursor = "pointer";
            bin.style.zIndex = "999";
            bin.setAttribute("data-is-blocklydev-btn", "true");
            bin.innerHTML = "🗑️";
            bin.style.lineHeight = "1rem";

            //Get the block's hull and calculate bounding box. Used to calculate where to position elements.
            var path = getSvgPathFromBlock(element);
            var bbox = path.getBBox();

            //Attributes and styles for the foreignObject
            //Width and height are 1 instead of 0 because firefox is won't render the element if it doesn't have a positive size.
            devWrapper.setAttributeNS(null, "width", 1);
            devWrapper.setAttributeNS(null, "height", 1);

            devWrapper.style.overflow = "visible";
            devWrapper.style.userSelect = "none";

            devWrapper.setAttributeNS(null, "class", "blocklyText");
            devWrapper.setAttributeNS(null, "y", "0");
            devWrapper.setAttributeNS(null, "text-anchor", "middle");
            devWrapper.setAttributeNS(null, "dominant-baseline", "middle");
            devWrapper.setAttributeNS(null, "dy", "0");
            devWrapper.setAttributeNS(null, "x", bbox.width);
            devWrapper.setAttributeNS(null, "transform", `translate(0, 0) `);

            //Add buttons to button wrapper
            btnWrapper.appendChild(btn);
            btnWrapper.appendChild(save);
            btnWrapper.appendChild(collapse);
            btnWrapper.appendChild(bin);

            //Add button wrapper to foreignObject
            devWrapper.appendChild(btnWrapper);

            //Add foreignObject to block SVG
            element.appendChild(devWrapper);

            //The block has been hooked
            element.setAttribute("data-blocklydev-hooked", "true");

            //Stop events reaching Blockly
            btnWrapper.addEventListener("pointerdown", (event) => {
                event.stopPropagation();
            });

            //Edit button handler.
            btn.addEventListener("pointerdown", (event) => {
                event.stopPropagation();
                event.preventDefault();
                if (element.hasAttribute("data-id")) {
                    blockId = element.getAttribute("data-id");
                    if (devWrapper.querySelector("div[data-isblocklydeveditor]")) { //If the editor exists, remove it.
                        devWrapper.querySelector("div[data-isblocklydeveditor]").remove();
                        save.style.display = "none";
                        collapse.style.display = "none";
                    } else {
                        devWrapper.appendChild(makeBlockEditor(blockId)); //Add editor if it does not exist.
                        save.style.display = "initial";
                        collapse.style.display = "initial";
                    }
                }
            }, {
                capture: true
            });

            collapse.addEventListener("pointerdown", (event) => { //Handler for collapse button
                event.stopPropagation();
                event.preventDefault();
                if (element.hasAttribute("data-id")) {
                    blockId = element.getAttribute("data-id");
                    var internalBlock = workspace.getBlockById(blockId);

                    internalBlock.setCollapsed(!internalBlock.isCollapsed()); //Toggle collapsed for the current block

                    var collapsed = internalBlock.isCollapsed(); //Store collapsed as variable for efficiency

                    //Loop through all sub-blocks and set collapsed to match.
                    var blocks = element.querySelectorAll("g.blocklyDraggable[data-id]:not(.blocklyInsertionMarker)");
                    for (let i = 0; i < blocks.length; i++) {
                        const b = blocks[i];
                        var bId = b.getAttribute("data-id");
                        workspace.getBlockById(bId).setCollapsed(collapsed);
                    }
                    if (collapsed) { //Change button
                        collapse.innerHTML = "⬇️";
                    } else {
                        collapse.innerHTML = "⬆️";
                    }
                }
            }, {
                capture: true
            });

            save.addEventListener("pointerdown", (event) => { //Save button handler
                event.stopPropagation();
                event.preventDefault();
                if (element.hasAttribute("data-id") && devWrapper.querySelector("div[data-isblocklydeveditor]")) {
                    devWrapper.querySelector("div[data-isblocklydeveditor]").save(); //Delegate saving to the editor
                }
            }, {
                capture: true
            });

            bin.addEventListener("pointerdown", (event) => { //Force delete handler
                event.stopPropagation();
                event.preventDefault();
                if (element.hasAttribute("data-id")) {
                    blockId = element.getAttribute("data-id");
                    workspace.getBlockById(blockId).dispose(false); //dispose(false) means "do not heal stack"
                }
            }, {
                capture: true
            });

            var updateObserver = new MutationObserver(function () { //When this block updates
                blockId = element.getAttribute("data-id");
                bbox = path.getBBox();

                devWrapper.setAttributeNS(null, "class", "blocklyText");
                devWrapper.setAttributeNS(null, "y", "0");
                devWrapper.setAttributeNS(null, "text-anchor", "middle");
                devWrapper.setAttributeNS(null, "dominant-baseline", "middle");
                devWrapper.setAttributeNS(null, "dy", "0");
                devWrapper.setAttributeNS(null, "x", bbox.width);
                devWrapper.setAttributeNS(null, "transform", `translate(0, 0) `);

                updateObserver.disconnect();
                element.appendChild(devWrapper); //Move element to be last, to allow displaying on top of other blocks connected underneath. (When an element is already appended, appendChild() moves rather than appends)
                updateObserver.observe(element, observerConfig);
            });
            updateObserver.observe(element, observerConfig); //Initialise observer
        }
    }
    var observer = new MutationObserver(mutationHandler);

    var observerConfig = { childList: true, characterData: false, attributes: false, subtree: true };

    function mutationHandler(mutationRecords) { //Handler that tries to process all blocks every time the block canvas changes.
        mutationRecords.forEach(function (mutation) {
            mutation.addedNodes.forEach(function (node) {
                processBlock(node);
            });
        });
    }

    //Initial block processing (script runs too early in this case)
    var blocks = getBlocklyBlockCanvas().children;
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        processBlock(block);
    }

    //Observe canvas
    observer.observe(getBlocklyBlockCanvas(), observerConfig);
    return "Blockly dev tools ran successfully.";
}