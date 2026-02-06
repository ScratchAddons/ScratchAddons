export default async function ({ addon }) {
  const addonname = "editor-input-shadow";

  const ScratchBlocks = await addon.tab.traps.getBlockly();
  const workspace = await addon.tab.traps.getWorkspace();

  if (!ScratchBlocks || !workspace) {
    console.error(`[${addonname}] ScratchBlocks 未載入`);
    return;
  }

  // --- 優化工具：徹底清除 XML 副本中的 ID ---
  const cleanXml = (node) => {
    if (node.nodeType !== 1) return;
    node.removeAttribute('id');
    node.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  };

  // --- 優化工具：執行精準彈出 ---
  const spawnAt = (xml, targetPos) => {
    const b = ScratchBlocks.Xml.domToBlock(xml, workspace);
    const myC = b.outputConnection || b.previousConnection;
    if (myC && targetPos !== undefined) {
      const cfg = {
        rangeX: addon.settings.get('spawn_range_x'),
        rangeY: addon.settings.get('spawn_range_y'),
        get offX() { return -(this.rangeX / 2); },
        get offY() { return -(this.rangeY / 2); }
      };
      const currentXY = b.getRelativeToSurfaceXY();
      const connOffset = { x: myC.x_ - currentXY.x, y: myC.y_ - currentXY.y };
      const rx = cfg.rangeX > 0 ? Math.floor(Math.random() * (cfg.rangeX + 1)) + cfg.offX : 0;
      const ry = cfg.rangeY > 0 ? Math.floor(Math.random() * (cfg.rangeY + 1)) + cfg.offY : 0;
      b.moveBy(targetPos.x - connOffset.x - currentXY.x + rx, targetPos.y - connOffset.y - currentXY.y + ry);
    }
  };

  const input_lock = (block, opcodeData) => {
    if (opcodeData.isNoop) return;
    try {
      ScratchBlocks.Events.setGroup(true);
      const mainPos = block.getRelativeToSurfaceXY();
      const xml = ScratchBlocks.Xml.blockToDom(block);
      const spawnList = [];
      const connPosMap = new Map();

      // --- 1. 紀錄所有連線點的絕對座標 (不抓左上角) ---
      const record = (b) => {
        if (!b) return;
        b.inputList.forEach(input => {
          const conn = input.connection;
          if (conn) connPosMap.set(input.name + b.id, { x: conn.x_, y: conn.y_ });
          if (conn && conn.targetBlock()) record(conn.targetBlock());
        });
        if (b.getNextBlock()) record(b.getNextBlock());
      };
      record(block);

      const process = (vNode, isFirst, parentId) => {
        const sChild = vNode.querySelector(':scope > shadow');
        const bChild = vNode.querySelector(':scope > block');
        const name = vNode.getAttribute('name');

        if (bChild) {
          const bId = bChild.getAttribute('id');
          const targetConnPos = connPosMap.get(name + parentId);
          if (sChild && targetConnPos) {
            const sToB = xml.ownerDocument.createElement('block');
            for (let a of sChild.attributes) sToB.setAttribute(a.name, a.value);
            while (sChild.firstChild) sToB.appendChild(sChild.firstChild);
            spawnList.push({ xml: sToB, pos: targetConnPos });
          }
          const nS = xml.ownerDocument.createElement('shadow');
          for (let a of bChild.attributes) nS.setAttribute(a.name, a.value);
          while (bChild.firstChild) nS.appendChild(bChild.firstChild);
          Array.from(nS.querySelectorAll('value')).forEach(v => process(v, false, bId));
          vNode.innerHTML = ''; vNode.appendChild(nS);
        } else if (sChild && isFirst) {
          const nB = xml.ownerDocument.createElement('block');
          for (let a of sChild.attributes) nB.setAttribute(a.name, a.value);
          while (sChild.firstChild) nB.appendChild(sChild.firstChild);
          Array.from(nB.querySelectorAll('value')).forEach(v => process(v, false, sChild.getAttribute('id') || ''));
          vNode.replaceChild(nB, sChild);
        }
      };

      Array.from(xml.childNodes).filter(n => n.tagName && n.tagName.toLowerCase() === 'value').forEach(v => process(v, true, block.id));
      block.dispose();
      ScratchBlocks.Xml.domToBlock(xml, workspace).moveBy(mainPos.x, mainPos.y);
      spawnList.forEach(item => spawnAt(item.xml, item.pos));
    } catch (e) { console.error(`[${addonname}]` + e); } finally { ScratchBlocks.Events.setGroup(false); }
  };

  const process_all = (block, mode) => {
    try {
      ScratchBlocks.Events.setGroup(true);
      const mainPos = block.getRelativeToSurfaceXY();
      const xml = ScratchBlocks.Xml.blockToDom(block);
      const spawnList = [];
      const connPosMap = new Map();

      // 1. 深度紀錄連線點位置
      const record = (b) => {
        if (!b) return;
        b.inputList.forEach(input => {
          if (input.connection) connPosMap.set(input.name + b.id, { x: input.connection.x_, y: input.connection.y_ });
          if (input.connection && input.connection.targetBlock()) record(input.connection.targetBlock());
        });
        if (b.nextConnection) {
          connPosMap.set('NEXT' + b.id, { x: b.nextConnection.x_, y: b.nextConnection.y_ });
          if (b.getNextBlock()) record(b.getNextBlock());
        }
      };
      record(block);

      // 2. 遞迴 XML 轉換 (處理 value, statement, next)
      const transform = (element, parentId) => {
        Array.from(element.querySelectorAll(':scope > value, :scope > statement, :scope > next')).forEach(container => {
          const tagName = container.tagName.toLowerCase();
          const sChild = container.querySelector(':scope > shadow');
          const bChild = container.querySelector(':scope > block');
          const name = container.getAttribute('name') || (tagName === 'next' ? 'NEXT' : '');
          const targetPos = connPosMap.get(name + parentId);

          if (mode === 'LOCK' && bChild) {
            if (sChild && targetPos) {
              const sToB = xml.ownerDocument.createElement('block');
              for (let a of sChild.attributes) sToB.setAttribute(a.name, a.value);
              while (sChild.firstChild) sToB.appendChild(sChild.firstChild);
              spawnList.push({ xml: sToB, pos: targetPos });
            }
            const nS = xml.ownerDocument.createElement('shadow');
            for (let a of bChild.attributes) nS.setAttribute(a.name, a.value);
            while (bChild.firstChild) nS.appendChild(bChild.firstChild);
            transform(nS, bChild.getAttribute('id'));
            container.innerHTML = ''; container.appendChild(nS);
          } else if (mode === 'UNLOCK' && (bChild || sChild)) {
            if (bChild && sChild && targetPos) {
              const sToB = xml.ownerDocument.createElement('block');
              for (let a of sChild.attributes) if (a.name.toLowerCase() !== 'id') sToB.setAttribute(a.name, a.value);
              Array.from(sChild.childNodes).forEach(node => sToB.appendChild(node.cloneNode(true)));
              cleanXml(sToB);
              transform(sToB, sChild.getAttribute('id'));
              spawnList.push({ xml: sToB, pos: targetPos });
            }
            const target = bChild || sChild;
            const nB = xml.ownerDocument.createElement('block');
            for (let a of target.attributes) nB.setAttribute(a.name, a.value);
            while (target.firstChild) nB.appendChild(target.firstChild);
            const nextId = target.getAttribute('id');
            container.innerHTML = ''; container.appendChild(nB);
            transform(nB, nextId);
          }
        });
      };
      transform(xml, block.id);

      block.dispose();
      ScratchBlocks.Xml.domToBlock(xml, workspace).moveBy(mainPos.x, mainPos.y);
      spawnList.forEach(item => spawnAt(item.xml, item.pos));
    } catch (e) { console.error(`[${addonname}]` + e); } finally { ScratchBlocks.Events.setGroup(false); }
  };

  // --- 右鍵選單掛載 ---
  addon.tab.createBlockContextMenu((items, block) => {
    if (addon.self.disabled) return items;
    items.push({
      enabled: true, text: "切換輸入格鎖定",
      callback: () => input_lock(block, { opcode: block.type, shadow: block.isShadow(), isNoop: false }),
      separator: true,
    });
    if (addon.settings.get('full_shadow_lock')) {
      items.push({ enabled: true, text: "將連接的所有積木影化", callback: () => process_all(block, 'LOCK') });
      items.push({ enabled: true, text: "將連接的所有積木實化", callback: () => process_all(block, 'UNLOCK') });
    }
    return items;
  }, { blocks: true });
}