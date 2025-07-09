export class ScratchAddonsProcedureBlocks {
  constructor(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Vm.Runtime}
     */
    this.runtime = runtime;
  }

  static polluteStackFrame(StackFrame) {
    if (StackFrame._sa_polluted) {
      return;
    }
    console.log("StackFrame not yet polluted, polluting now");
    StackFrame._sa_polluted = true;

    const oldReset = StackFrame.reset;
    StackFrame.reset = function () {
      oldReset.call(this);
      this._sa_proper_call = false;
      this._sa_inputs_inspected = false;
    };
  }

  static polluteThread(Thread) {
    if (Thread._sa_polluted) {
      return;
    }
    console.log("thread not yet polluted, polluting now");
    Thread._sa_polluted = true;

    Thread.stopThisScript = function () {
      let blockID = this.peekStack();
      while (blockID !== null) {
        const block = this.target.blocks.getBlock(blockID);
        if (
          typeof block !== "undefined" &&
          (block.opcode === "procedures_call" ||
            block.opcode === "procedures_call_reporter" ||
            block.opcode === "procedures_call_boolean")
        ) {
          break;
        }
        this.popStack();
        blockID = this.peekStack();
      }

      if (this.stack.length === 0) {
        // Clean up!
        this.requestScriptGlowInFrame = false;
        this.status = Thread.STATUS_DONE;
      }
    };

    Thread.pushProcReporterCalls = function (outerBlock) {
      for (const { block } of Object.values(this.target.blocks.getInputs(outerBlock) ?? {})) {
        const inputBlock = this.target.blocks.getBlock(block);
        console.log("input opcode: %s", inputBlock.opcode)
        if (inputBlock.opcode === "procedures_call_reporter" || inputBlock.opcode === "procedures_call_boolean") {
          this.pushStack(block);
          let stackFrame = this.stackFrames.at(-1);
          stackFrame._sa_proper_call = true;
          console.log('pushed custom reporter call')
          continue;
        }
        this.pushProcReporterCalls(block);
      }
    };

    // Thread.goToNextBlock = function () {
    //   const nextBlockId = this.target.blocks.getNextBlock(this.peekStack());
    //   this.reuseStackForNextBlock(nextBlockId);
    //   ScratchAddonsProcedureBlocks.polluteStackFrame(this.stackFrames.at(-1).constructor.prototype);
    //   let nextBlock = this.target.blocks.getBlock(nextBlockId);
    //   this.pushProcReporterCalls(nextBlock);
    // };
    Thread.peekStack = function () {
      const peeked = this.stack.length > 0 ? this.stack.at(-1) : null;
      if (peeked === null) {
        return null;
      }
      const stackFrame = this.peekStackFrame();
      ScratchAddonsProcedureBlocks.polluteStackFrame(stackFrame.constructor.prototype);
      if (stackFrame._sa_inputs_inspected) {
        return peeked;
      }
      let block = this.target.blocks.getBlock(peeked);
      if (block?.opcode) {
        console.log(block.opcode)
      }
      this.pushProcReporterCalls(block);
      stackFrame._sa_inputs_inspected = true;
      return this.stack.at(-1);
    }
  }

  /**
   * Retrieve the block primitives implemented by this package.
   * @return {object.<string, Function>} Mapping of opcode to Function.
   */
  getPrimitives() {
    return {
      procedures_definition_reporter: this.definition,
      procedures_defitinition_boolean: this.definition,
      procedures_call_reporter: this.call,
      prcoedures_call_boolean: this.call,
      procedures_return_reporter: this.return,
      procedures_return_boolean: this.return,
    };
  }

  definition() {
    // No-op: execute the blocks.
  }

  call(args, util) {
    if (util.thread.peekStackFrame()._sa_proper_call) {
      console.log('got proper call')
      if (!util.stackFrame.executed) {
        const procedureCode = args.mutation.proccode;
        const paramNamesIdsAndDefaults = util.getProcedureParamNamesIdsAndDefaults(procedureCode);

        // If null, procedure could not be found, which can happen if custom
        // block is dragged between sprites without the definition.
        // Match Scratch 2.0 behavior and noop.
        if (paramNamesIdsAndDefaults === null) {
          return;
        }

        const [paramNames, paramIds, paramDefaults] = paramNamesIdsAndDefaults;

        // Initialize params for the current stackFrame to {}, even if the procedure does
        // not take any arguments. This is so that `getParam` down the line does not look
        // at earlier stack frames for the values of a given parameter (#1729)
        util.initParams();
        for (let i = 0; i < paramIds.length; i++) {
          if (Object.prototype.hasOwnProperty.call(args, paramIds[i])) {
            util.pushParam(paramNames[i], args[paramIds[i]]);
          } else {
            util.pushParam(paramNames[i], paramDefaults[i]);
          }
        }
        util.stackFrame.executed = true;
        util.startProcedure(procedureCode);
      }
    } else {
      console.log('got non-proper call')
      const target = util.target;
      const proccode = args.mutation.proccode;
      const variableInfo = target.getReturnVar(proccode);
      const variable = target.lookupOrCreateVariable(variableInfo.id, variableInfo.value);
      return variable.value;
    }
  }

  return(args, util) {
    console.log("returned!");
    const thisId = util.thread.peekStack();
    const target = util.target;
    const blocks = target.blocks._blocks;
    const proccode =
      blocks[blocks[target.blocks.getTopLevelScript(thisId)].inputs.custom_block.block].mutation.proccode;
    const variableInfo = target.getReturnVar(proccode);
    const variable = util.target.lookupOrCreateVariable(variableInfo.id, variableInfo.value);
    variable.value = args.return_value;
    util.stopThisScript();
  }
}
