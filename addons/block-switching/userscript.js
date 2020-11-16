const blockToDom = (block) => {
  var Blockly2 = {Xml:{}};
  var goog = {dom: {}, string: {}, object: {}, array: {}};

  goog.dom.createDom = function(tagName, opt_attributes, var_args) {
    'use strict';
    return goog.dom.createDom_(document, arguments);
  };

  goog.isArrayLike = function(val) {
    var type = goog.typeOf(val);
    return type == 'array' || type == 'object' && typeof val.length == 'number';
  };

  goog.typeOf = function(value) {
    var s = typeof value;
    if (s == 'object') {
      if (value) {
        // We cannot use constructor == Array or instanceof Array because
        // different frames have different Array objects. In IE6, if the iframe
        // where the array was created is destroyed, the array loses its
        // prototype. Then dereferencing val.splice here throws an exception, so
        // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
        // so that will work. In this case, this function will return false and
        // most array functions will still work because the array is still
        // array-like (supports length and []) even though it has lost its
        // prototype.
        // Mark Miller noticed that Object.prototype.toString
        // allows access to the unforgeable [[Class]] property.
        //  15.2.4.2 Object.prototype.toString ( )
        //  When the toString method is called, the following steps are taken:
        //      1. Get the [[Class]] property of this object.
        //      2. Compute a string value by concatenating the three strings
        //         "[object ", Result(1), and "]".
        //      3. Return Result(2).
        // and this behavior survives the destruction of the execution context.
        if (value instanceof Array ||  // Works quickly in same execution context.
            // If value is from a different execution context then
            // !(value instanceof Object), which lets us early out in the common
            // case when value is from the same context but not an array.
            // The {if (value)} check above means we don't have to worry about
            // undefined behavior of Object.prototype.toString on null/undefined.
            //
            // HACK: In order to use an Object prototype method on the arbitrary
            //   value, the compiler requires the value be cast to type Object,
            //   even though the ECMA spec explicitly allows it.
            (!(value instanceof Object) &&
            (Object.prototype.toString.call(
                /** @type {Object} */ (value)) == '[object Array]') ||

            // In IE all non value types are wrapped as objects across window
            // boundaries (not iframe though) so we have to do object detection
            // for this edge case
            typeof value.length == 'number' &&
            typeof value.splice != 'undefined' &&
            typeof value.propertyIsEnumerable != 'undefined' &&
            !value.propertyIsEnumerable('splice')

            )) {
          return 'array';
        }
        // HACK: There is still an array case that fails.
        //     function ArrayImpostor() {}
        //     ArrayImpostor.prototype = [];
        //     var impostor = new ArrayImpostor;
        // this can be fixed by getting rid of the fast path
        // (value instanceof Array) and solely relying on
        // (value && Object.prototype.toString.vall(value) === '[object Array]')
        // but that would require many more function calls and is not warranted
        // unless closure code is receiving objects from untrusted sources.

        // IE in cross-window calls does not correctly marshal the function type
        // (it appears just as an object) so we cannot use just typeof val ==
        // 'function'. However, if the object has a call property, it is a
        // function.
        if (!(value instanceof Object) &&
            (Object.prototype.toString.call(
                /** @type {Object} */ (value)) == '[object Function]' ||
            typeof value.call != 'undefined' &&
            typeof value.propertyIsEnumerable != 'undefined' &&
            !value.propertyIsEnumerable('call'))) {
          return 'function';
        }


      } else {
        return 'null';
      }

    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    } else if (s == 'function' && typeof value.call == 'undefined') {
      return 'object';
    }
    return s;
  };

  goog.dom.createDom_ = function(doc, args) {
    var tagName = String(args[0]);
    var attributes = args[1];

    var element = document.createElement(tagName);

    if (attributes) {
      if (typeof attributes === 'string') {
        element.className = attributes;
      } else if (Array.isArray(attributes)) {
        element.className = attributes.join(' ');
      } else {
        goog.dom.setProperties(element, attributes);
      }
    }

    if (args.length > 2) {
      goog.dom.append_(doc, element, args, 2);
    }

    return element;
  };

  goog.dom.append_ = function(doc, parent, args, startIndex) {
    'use strict';
    function childHandler(child) {
      // TODO(user): More coercion, ala MochiKit?
      if (child) {
        parent.appendChild(
            typeof child === 'string' ? doc.createTextNode(child) : child);
      }
    }

    for (var i = startIndex; i < args.length; i++) {
      var arg = args[i];
      // TODO(attila): Fix isArrayLike to return false for a text node.
      if (goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
        // If the argument is a node list, not a real array, use a clone,
        // because forEach can't be used to mutate a NodeList.
        goog.array.forEach(
            goog.dom.isNodeList(arg) ? goog.array.toArray(arg) : arg,
            childHandler);
      } else {
        childHandler(arg);
      }
    }
  };

  goog.array.forEach = Array.prototype.forEach;

  goog.array.toArray = function toArray(object) {
    var length = object.length;

    // If length is not a number the following is false. This case is kept for
    // backwards compatibility since there are callers that pass objects that are
    // not array like.
    if (length > 0) {
      var rv = new Array(length);
      for (var i = 0; i < length; i++) {
        rv[i] = object[i];
      }
      return rv;
    }
    return [];
  };


  goog.dom.setProperties = function(element, properties) {
    'use strict';
    goog.object.forEach(properties, function(val, key) {
      'use strict';
      if (val && typeof val == 'object' && val.implementsGoogStringTypedString) {
        val = val.getTypedStringValue();
      }
      if (key == 'style') {
        element.style.cssText = val;
      } else if (key == 'class') {
        element.className = val;
      } else if (key == 'for') {
        element.htmlFor = val;
      } else if (goog.dom.DIRECT_ATTRIBUTE_MAP_.hasOwnProperty(key)) {
        element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val);
      } else if (
          goog.string.startsWith(key, 'aria-') ||
          goog.string.startsWith(key, 'data-')) {
        element.setAttribute(key, val);
      } else {
        element[key] = val;
      }
    });
  };

  goog.object.forEach = function(obj, f, opt_obj) {
    'use strict';
    for (const key in obj) {
      f.call(/** @type {?} */ (opt_obj), obj[key], key, obj);
    }
  };

  goog.dom.createElement_ = function(doc, name) {
    'use strict';
    name = String(name);
    if (doc.contentType === 'application/xhtml+xml') name = name.toLowerCase();
    return doc.createElement(name);
  };

  Blockly2.Xml.blockToDom = (block, opt_noId) => {
    var element = goog.dom.createDom(block.isShadow() ? 'shadow' : 'block');
    element.setAttribute('type', block.type);
    if (!opt_noId) {
      element.setAttribute('id', block.id);
    }
    if (block.mutationToDom) {
      // Custom data for an advanced block.
      var mutation = block.mutationToDom();
      if (mutation && (mutation.hasChildNodes() || mutation.hasAttributes())) {
        element.appendChild(mutation);
      }
    }

    Blockly2.Xml.allFieldsToDom_(block, element);

    Blockly2.Xml.scratchCommentToDom_(block, element);

    if (block.data) {
      var dataElement = goog.dom.createDom('data', null, block.data);
      element.appendChild(dataElement);
    }

    for (var i = 0, input; input = block.inputList[i]; i++) {
      var container;
      var empty = true;
      if (input.type == 5) {
        continue;
      } else {
        var childBlock = input.connection.targetBlock();
        if (input.type == 1) {
          container = goog.dom.createDom('value');
        } else if (input.type == 3) {
          container = goog.dom.createDom('statement');
        }
        var shadow = input.connection.getShadowDom();
        if (shadow && (!childBlock || !childBlock.isShadow())) {
          var shadowClone = Blockly2.Xml.cloneShadow_(shadow);
          // Remove the ID from the shadow dom clone if opt_noId
          // is specified to true.
          if (opt_noId && shadowClone.getAttribute('id')) {
            shadowClone.removeAttribute('id');
          }
          container.appendChild(shadowClone);
        }
        if (childBlock) {
          container.appendChild(Blockly2.Xml.blockToDom(childBlock, opt_noId));
          empty = false;
        }
      }
      container.setAttribute('name', input.name);
      if (!empty) {
        element.appendChild(container);
      }
    }
    if (block.inputsInlineDefault != block.inputsInline) {
      element.setAttribute('inline', block.inputsInline);
    }
    if (block.isCollapsed()) {
      element.setAttribute('collapsed', true);
    }
    if (block.disabled) {
      element.setAttribute('disabled', true);
    }
    if (!block.isDeletable() && !block.isShadow()) {
      element.setAttribute('deletable', false);
    }
    if (!block.isMovable() && !block.isShadow()) {
      element.setAttribute('movable', false);
    }
    if (!block.isEditable()) {
      element.setAttribute('editable', false);
    }

    var nextBlock = block.getNextBlock();
    if (nextBlock) {
      var container = goog.dom.createDom('next', null,
          Blockly2.Xml.blockToDom(nextBlock, opt_noId));
      element.appendChild(container);
    }
    var shadow = block.nextConnection && block.nextConnection.getShadowDom();
    if (shadow && (!nextBlock || !nextBlock.isShadow())) {
      container.appendChild(Blockly2.Xml.cloneShadow_(shadow));
    }

    return element;
  };

  Blockly2.Xml.allFieldsToDom_ = function(block, element) {
    for (var i = 0, input; input = block.inputList[i]; i++) {
      for (var j = 0, field; field = input.fieldRow[j]; j++) {
        var fieldDom = Blockly2.Xml.fieldToDom_(field);
        if (fieldDom) {
          element.appendChild(fieldDom);
        }
      }
    }
  };

  Blockly2.Xml.fieldToDom_ = function(field) {
    if (field.name && field.SERIALIZABLE) {
      if (field.referencesVariables()) {
        return Blockly2.Xml.fieldToDomVariable_(field);
      } else {
        var container = goog.dom.createDom('field', null, field.getValue());
        container.setAttribute('name', field.name);
        return container;
      }
    }
    return null;
  };

  Blockly2.Xml.fieldToDomVariable_ = function(field) {
    var id = field.getValue();
    // The field had not been initialized fully before being serialized.
    // This can happen if a block is created directly through a call to
    // workspace.newBlock instead of from XML.
    // The new block will be serialized for the first time when firing a block
    // creation event.
    if (id == null) {
      field.initModel();
      id = field.getValue();
    }
    // Get the variable directly from the field, instead of doing a lookup.  This
    // will work even if the variable has already been deleted.  This can happen
    // because the flyout defers deleting blocks until the next time the flyout is
    // opened.
    var variable = field.getVariable();

    if (!variable) {
      throw Error('Tried to serialize a variable field with no variable.');
    }
    var container = goog.dom.createDom('field', null, variable.name);
    container.setAttribute('name', field.name);
    container.setAttribute('id', variable.getId());
    container.setAttribute('variabletype', variable.type);
    return container;
  };

  Blockly2.Xml.scratchCommentToDom_ = function(block, element) {
    var commentText = block.getCommentText();
    if (commentText) {
      var commentElement = goog.dom.createDom('comment', null, commentText);
      if (typeof block.comment == 'object') {
        commentElement.setAttribute('id', block.comment.id);
        commentElement.setAttribute('pinned', block.comment.isVisible());
        var hw;
        if (block.comment instanceof Blockly.ScratchBlockComment) {
          hw = block.comment.getHeightWidth();
        } else {
          hw = block.comment.getBubbleSize();
        }
        commentElement.setAttribute('h', hw.height);
        commentElement.setAttribute('w', hw.width);
        var xy = block.comment.getXY();
        commentElement.setAttribute('x',
            Math.round(block.workspace.RTL ? block.workspace.getWidth() - xy.x - hw.width :
            xy.x));
        commentElement.setAttribute('y', xy.y);
        commentElement.setAttribute('minimized', block.comment.isMinimized());

      }
      element.appendChild(commentElement);
    }
  };

  Blockly2.Xml.cloneShadow_ = function(shadow) {
    shadow = shadow.cloneNode(true);
    // Walk the tree looking for whitespace.  Don't prune whitespace in a tag.
    var node = shadow;
    var textNode;
    while (node) {
      if (node.firstChild) {
        node = node.firstChild;
      } else {
        while (node && !node.nextSibling) {
          textNode = node;
          node = node.parentNode;
          if (textNode.nodeType == 3 && textNode.data.trim() == '' &&
              node.firstChild != textNode) {
            // Prune whitespace after a tag.
            goog.dom.removeNode(textNode);
          }
        }
        if (node) {
          textNode = node;
          node = node.nextSibling;
          if (textNode.nodeType == 3 && textNode.data.trim() == '') {
            // Prune whitespace before a tag.
            goog.dom.removeNode(textNode);
          }
        }
      }
    }
    return shadow;
  };

  return Blockly2.Xml.blockToDom(block, false);
};

export default async function ({ addon, global, console }) {
  const blockSwitches = {
    motion_turnright: ['motion_turnleft'],
    motion_turnleft: ['motion_turnright'],
    operator_equals: ['operator_gt', 'operator_lt'],
    operator_gt: ['operator_equals', 'operator_lt'],
    operator_lt: ['operator_equals', 'operator_gt'],
    operator_add: ['operator_subtract', 'operator_multiply', 'operator_divide', 'operator_mod'],
    operator_subtract: ['operator_add', 'operator_multiply', 'operator_divide', 'operator_mod'],
    operator_multiply: ['operator_add', 'operator_subtract', 'operator_divide', 'operator_mod'],
    operator_divide: ['operator_add', 'operator_subtract', 'operator_multiply', 'operator_mod'],
    operator_mod: ['operator_add', 'operator_subtract', 'operator_multiply', 'operator_divide'],
    motion_setx: ['motion_changexby', 'motion_sety', 'motion_changeyby'],
    motion_changexby: ['motion_setx', 'motion_sety', 'motion_changeyby'],
    motion_sety: ['motion_setx', 'motion_changexby', 'motion_changeyby'],
    motion_changeyby: ['motion_setx', 'motion_changexby', 'motion_sety'],
    data_setvariableto: ['data_changevariableby'],
    data_changevariableby: ['data_setvariableto'],
    motion_xposition: ['motion_yposition'],
    motion_yposition: ['motion_xposition'],
    looks_show: ['looks_hide'],
    looks_hide: ['looks_show'],
    control_if: ['control_if_else'],
    control_if_else: ['control_if'], // TODO: what to do with blocks in the else branch?
    sensing_mousex: ['sensing_mousey'],
    sensing_mousey: ['sensing_mousex'],
  };

  const genuid = () => {
    // https://github.com/LLK/scratch-blocks/blob/691111ee526f297735d43dff610b39dd4ab2ea70/core/utils.js#L610-L633
    const soup = '!#$%()*+,-./:;=?@[]^_`{|}~ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const length = 20;
    const soupLength = soup.length;
    const id = [];
    for (let i = 0; i < length; i++) {
      id[i] = soup.charAt(Math.random() * soupLength);
    }
    return id.join('');
  };

  const switchBlockCallback = (block, newOpcode) => () => {
    const xml = blockToDom(block);
    xml.setAttribute('type', newOpcode);

    // We need to find the actual Block object once it's pasted.
    // To do that, we'll generate a random ID ahead of time instead of letting Scratch makes it own.
    const randomId = genuid();
    xml.setAttribute('id', randomId);

    Blockly.getMainWorkspace().paste(xml);
    const newBlock = Blockly.getMainWorkspace().getBlockById(randomId);

    const parent = block.getParent();
    if (parent) {
      // We have to setup some connections.
      const blockConnections = block.getConnections_();
      const parentConnections = parent.getConnections_();
      const newConnections = newBlock.getConnections_();

      // TODO: clean this up; figure out if determining typ eof blockToParentConnection is even necessary
      const blockToParentConnection = blockConnections.find((connection) => connection.targetConnection && connection.targetConnection.sourceBlock_ === parent);
      const parentToBlockConnection = parentConnections.find((connection) => connection.targetConnection && connection.targetConnection.sourceBlock_ === block);
      const newConnection = newConnections.find((connection) => connection.type === blockToParentConnection.type);


      newConnection.connect(parentToBlockConnection);
    } else {
      // TODO: Move the block to the proper spot.
      // block.dispose();
    }

    block.dispose();
  };

  const customContextMenuHandler = function (options) {
    if (this._blockswitchingNativeContextMenu) {
      this._blockswitchingNativeContextMenu(options);
    }

    const switches = blockSwitches[this.type];
    for (const opcode of switches) {
      options.push({
        enabled: true,
        text: opcode, // TODO: display human readable name; translate
        callback: switchBlockCallback(this, opcode)
      });
    }
  };

  const injectCustomContextMenu = (block) => {
    const type = block.type;
    if (!blockSwitches.hasOwnProperty(type)) {
      return;
    }

    block._blockswitchingNativeContextMenu = block.customContextMenu;
    block.customContextMenu = customContextMenuHandler;
  }

  const changeListener = (change) => {
    if (change.type !== 'create') {
      return;
    }

    for (const id of change.ids) {
      const block = Blockly.getMainWorkspace().getBlockById(id);
      if (!block) continue;
      injectCustomContextMenu(block);
    }
  };

  const inject = (workspace) => {
    workspace.getAllBlocks().forEach(injectCustomContextMenu);
    workspace.addChangeListener(changeListener);
  };

  if (addon.tab.editorMode === "editor") {
    const interval = setInterval(() => {
      if (Blockly.getMainWorkspace()) {
        inject(Blockly.getMainWorkspace());
        clearInterval(interval);
      }
    }, 100);
  }
  addon.tab.addEventListener(
    "urlChange",
    () => addon.tab.editorMode === "editor" && inject(Blockly.getMainWorkspace())
  );
}
