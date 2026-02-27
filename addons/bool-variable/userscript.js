export default async function ({ addon }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  if (!ScratchBlocks) return;

  const ConnectionProto = ScratchBlocks.Connection.prototype;

  // 判定是否為變數類積木
  const isVarBlock = (conn) => {
    const block = conn.getSourceBlock();
    if (!block) return false;
    return block.type === 'data_variable' || block.type === 'data_listcontents';
  };

  // 1. 允許連接：僅限「變數積木」吸入「布林槽」
  const originalCanConnect = ConnectionProto.canConnectWithReason_;
  ConnectionProto.canConnectWithReason_ = function (targetConnection, opt_commonParent) {
    const reason = originalCanConnect.call(this, targetConnection, opt_commonParent);
    if (reason !== 0) {
      const isSourceVar = isVarBlock(this);
      const isTargetBool = targetConnection.check_ && targetConnection.check_.includes('Boolean');

      // 只有當來源是變數積木，且目標是布林槽時，強制放行
      if (isSourceVar && isTargetBool) return 0;
    }
    return reason;
  };

  // 2. 欺騙渲染器：僅針對變數與布林的組合進行偽裝
  const originalCheckType = ConnectionProto.checkType_;
  ConnectionProto.checkType_ = function (otherConnection) {
    const sourceVar = isVarBlock(this);
    const targetBool = otherConnection.check_ && otherConnection.check_.includes('Boolean');
    
    const targetVar = isVarBlock(otherConnection);
    const sourceBool = this.check_ && this.check_.includes('Boolean');

    if ((sourceVar && targetBool) || (targetVar && sourceBool)) {
      return true;
    }

    return originalCheckType.call(this, otherConnection);
  };
}