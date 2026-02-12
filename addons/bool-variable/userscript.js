export default async function ({ addon }) {
  const ScratchBlocks = await addon.tab.traps.getBlockly();
  
  if (!ScratchBlocks) return;

  const originalCanConnect = ScratchBlocks.Connection.prototype.canConnectWithReason_;

  ScratchBlocks.Connection.prototype.canConnectWithReason_ = function (targetConnection, opt_commonParent) {
    const reason = originalCanConnect.call(this, targetConnection, opt_commonParent);

    if (reason !== 0) {
      const sourceCheck = this.check_;
      const targetCheck = targetConnection.check_; 

      const isVariable = sourceCheck && (sourceCheck.includes('String') || sourceCheck.includes('Number'));
      const isBooleanInput = targetCheck && targetCheck.includes('Boolean');

      if (isVariable && isBooleanInput) {
        return 0;
      }
    }

    return reason;
  };
}