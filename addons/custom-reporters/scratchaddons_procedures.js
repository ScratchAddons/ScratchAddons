let blockUtility;
const BlocksExecuteCache = {};
let Thread;
/**
 * A private method shared with execute to build an object containing the block
 * information execute needs and that is reset when other cached Blocks info is
 * reset.
 * @param {Blocks} blocks Blocks containing the expected blockId
 * @param {string} blockId blockId for the desired execute cache
 * @param {function} CacheType constructor for cached block information
 * @return {object} execute cache object
 */
BlocksExecuteCache.getCached = function (blocks, blockId, CacheType) {
  let cached = blocks._cache._executeCached[blockId];
  if (typeof cached !== "undefined") {
    return cached;
  }

  const block = blocks.getBlock(blockId);
  if (typeof block === "undefined") return null;

  if (typeof CacheType === "undefined") {
    cached = {
      id: blockId,
      opcode: blocks.getOpcode(block),
      fields: blocks.getFields(block),
      inputs: blocks.getInputs(block),
      mutation: blocks.getMutation(block),
    };
  } else {
    cached = new CacheType(blocks, {
      id: blockId,
      opcode: blocks.getOpcode(block),
      fields: blocks.getFields(block),
      inputs: blocks.getInputs(block),
      mutation: blocks.getMutation(block),
    });
  }

  blocks._cache._executeCached[blockId] = cached;
  return cached;
};

/**
 * A execute.js internal representation of a block to reduce the time spent in
 * execute as the same blocks are called the most.
 *
 * With the help of the Blocks class create a mutable copy of block
 * information. The members of BlockCached derived values of block information
 * that does not need to be reevaluated until a change in Blocks. Since Blocks
 * handles where the cache instance is stored, it drops all cache versions of a
 * block when any change happens to it. This way we can quickly execute blocks
 * and keep perform the right action according to the current block information
 * in the editor.
 *
 * @param {Blocks} blockContainer the related Blocks instance
 * @param {object} cached default set of cached values
 */
class BlockCached {
  constructor(blockContainer, cached) {
    /**
     * Block id in its parent set of blocks.
     * @type {string}
     */
    this.id = cached.id;

    /**
     * Block operation code for this block.
     * @type {string}
     */
    this.opcode = cached.opcode;

    /**
     * Original block object containing argument values for static fields.
     * @type {object}
     */
    this.fields = cached.fields;

    /**
     * Original block object containing argument values for executable inputs.
     * @type {object}
     */
    this.inputs = cached.inputs;

    /**
     * Procedure mutation.
     * @type {?object}
     */
    this.mutation = cached.mutation;

    /**
     * The profiler the block is configured with.
     * @type {?Profiler}
     */
    this._profiler = null;

    /**
     * Profiler information frame.
     * @type {?ProfilerFrame}
     */
    this._profilerFrame = null;

    /**
     * Is the opcode a hat (event responder) block.
     * @type {boolean}
     */
    this._isHat = false;

    /**
     * The block opcode's implementation function.
     * @type {?function}
     */
    this._blockFunction = null;

    /**
     * Is the block function defined for this opcode?
     * @type {boolean}
     */
    this._definedBlockFunction = false;

    /**
     * Is this block a block with no function but a static value to return.
     * @type {boolean}
     */
    this._isShadowBlock = false;

    /**
     * The static value of this block if it is a shadow block.
     * @type {?any}
     */
    this._shadowValue = null;

    /**
     * A copy of the block's fields that may be modified.
     * @type {object}
     */
    this._fields = Object.assign({}, this.fields);

    /**
     * A copy of the block's inputs that may be modified.
     * @type {object}
     */
    this._inputs = Object.assign({}, this.inputs);

    /**
     * An arguments object for block implementations. All executions of this
     * specific block will use this objecct.
     * @type {object}
     */
    this._argValues = {
      mutation: this.mutation,
    };

    /**
     * The inputs key the parent refers to this BlockCached by.
     * @type {string}
     */
    this._parentKey = null;

    /**
     * The target object where the parent wants the resulting value stored
     * with _parentKey as the key.
     * @type {object}
     */
    this._parentValues = null;

    /**
     * A sequence of non-shadow operations that can must be performed. This
     * list recreates the order this block and its children are executed.
     * Since the order is always the same we can safely store that order
     * and iterate over the operations instead of dynamically walking the
     * tree every time.
     * @type {Array<BlockCached>}
     */
    this._ops = [];

    const { runtime } = blockUtility.sequencer;

    const { opcode, fields, inputs } = this;

    // Assign opcode isHat and blockFunction data to avoid dynamic lookups.
    this._isHat = runtime.getIsHat(opcode);
    this._blockFunction = runtime.getOpcodeFunction(opcode);
    this._definedBlockFunction = typeof this._blockFunction !== "undefined";

    // Store the current shadow value if there is a shadow value.
    const fieldKeys = Object.keys(fields);
    this._isShadowBlock = !this._definedBlockFunction && fieldKeys.length === 1 && Object.keys(inputs).length === 0;
    this._shadowValue = this._isShadowBlock && fields[fieldKeys[0]].value;

    // Store the static fields onto _argValues.
    for (const fieldName in fields) {
      if (fieldName === "VARIABLE" || fieldName === "LIST" || fieldName === "BROADCAST_OPTION") {
        this._argValues[fieldName] = {
          id: fields[fieldName].id,
          name: fields[fieldName].value,
        };
      } else {
        this._argValues[fieldName] = fields[fieldName].value;
      }
    }

    // Remove custom_block. It is not part of block execution.
    delete this._inputs.custom_block;

    if ("BROADCAST_INPUT" in this._inputs) {
      // BROADCAST_INPUT is called BROADCAST_OPTION in the args and is an
      // object with an unchanging shape.
      this._argValues.BROADCAST_OPTION = {
        id: null,
        name: null,
      };

      // We can go ahead and compute BROADCAST_INPUT if it is a shadow
      // value.
      const broadcastInput = this._inputs.BROADCAST_INPUT;
      if (broadcastInput.block === broadcastInput.shadow) {
        // Shadow dropdown menu is being used.
        // Get the appropriate information out of it.
        const shadow = blockContainer.getBlock(broadcastInput.shadow);
        const broadcastField = shadow.fields.BROADCAST_OPTION;
        this._argValues.BROADCAST_OPTION.id = broadcastField.id;
        this._argValues.BROADCAST_OPTION.name = broadcastField.value;

        // Evaluating BROADCAST_INPUT here we do not need to do so
        // later.
        delete this._inputs.BROADCAST_INPUT;
      }
    }

    // Cache all input children blocks in the operation lists. The
    // operations can later be run in the order they appear in correctly
    // executing the operations quickly in a flat loop instead of needing to
    // recursivly iterate them.
    for (const inputName in this._inputs) {
      const input = this._inputs[inputName];
      if (input.block) {
        const inputCached = BlocksExecuteCache.getCached(blockContainer, input.block, BlockCached);

        if (inputCached._isHat) {
          continue;
        }

        this._ops.push(...inputCached._ops);
        inputCached._parentKey = inputName;
        inputCached._parentValues = this._argValues;

        // Shadow values are static and do not change, go ahead and
        // store their value on args.
        if (inputCached._isShadowBlock) {
          this._argValues[inputName] = inputCached._shadowValue;
        }
      }
    }

    // The final operation is this block itself. At the top most block is a
    // command block or a block that is being run as a monitor.
    if (this._definedBlockFunction) {
      this._ops.push(this);
    }
  }
}

/**
 * Utility function to determine if a value is a Promise.
 * @param {*} value Value to check for a Promise.
 * @return {boolean} True if the value appears to be a Promise.
 */
const isPromise = function (value) {
  return value !== null && typeof value === "object" && typeof value.then === "function";
};

/**
 * Execute a block.
 * @param {!Sequencer} sequencer Which sequencer is executing.
 * @param {!Thread} thread Thread which to read and execute.
 */
const execute = function (sequencer, thread) {
  const runtime = sequencer.runtime;

  // store sequencer and thread so block functions can access them through
  // convenience methods.
  blockUtility.sequencer = sequencer;
  blockUtility.thread = thread;

  // Current block to execute is the one on the top of the stack.
  const currentBlockId = thread.peekStack();
  const currentStackFrame = thread.peekStackFrame();

  let blockContainer = thread.blockContainer;
  let blockCached = BlocksExecuteCache.getCached(blockContainer, currentBlockId, BlockCached);
  if (blockCached === null) {
    blockContainer = runtime.flyoutBlocks;
    blockCached = BlocksExecuteCache.getCached(blockContainer, currentBlockId, BlockCached);
    // Stop if block or target no longer exists.
    if (blockCached === null) {
      // No block found: stop the thread; script no longer exists.
      sequencer.retireThread(thread);
      return;
    }
  }

  const ops = blockCached._ops;
  const length = ops.length;
  let i = 0;

  if (currentStackFrame.reported !== null) {
    const reported = currentStackFrame.reported;
    // Reinstate all the previous values.
    for (; i < reported.length; i++) {
      const { opCached: oldOpCached, inputValue } = reported[i];

      const opCached = ops.find((op) => op.id === oldOpCached);

      if (opCached) {
        const inputName = opCached._parentKey;
        const argValues = opCached._parentValues;

        if (inputName === "BROADCAST_INPUT") {
          // Something is plugged into the broadcast input.
          // Cast it to a string. We don't need an id here.
          argValues.BROADCAST_OPTION.id = null;
          argValues.BROADCAST_OPTION.name = cast.toString(inputValue);
        } else {
          argValues[inputName] = inputValue;
        }
      }
    }

    // Find the last reported block that is still in the set of operations.
    // This way if the last operation was removed, we'll find the next
    // candidate. If an earlier block that was performed was removed then
    // we'll find the index where the last operation is now.
    if (reported.length > 0) {
      const lastExisting = reported.reverse().find((report) => ops.find((op) => op.id === report.opCached));
      if (lastExisting) {
        i = ops.findIndex((opCached) => opCached.id === lastExisting.opCached) + 1;
      } else {
        i = 0;
      }
    }

    // The reporting block must exist and must be the next one in the sequence of operations.
    if (thread.justReported !== null && ops[i] && ops[i].id === currentStackFrame.reporting) {
      const opCached = ops[i];
      const inputValue = thread.justReported;

      thread.justReported = null;

      const inputName = opCached._parentKey;
      const argValues = opCached._parentValues;

      if (inputName === "BROADCAST_INPUT") {
        // Something is plugged into the broadcast input.
        // Cast it to a string. We don't need an id here.
        argValues.BROADCAST_OPTION.id = null;
        argValues.BROADCAST_OPTION.name = cast.toString(inputValue);
      } else {
        argValues[inputName] = inputValue;
      }

      i += 1;
    }

    currentStackFrame.reporting = null;
    currentStackFrame.reported = null;
    currentStackFrame.waitingReporter = false;
  }

  const start = i;

  for (; i < length; i++) {
    const lastOperation = i === length - 1;
    const opCached = ops[i];

    const blockFunction = opCached._blockFunction;

    // Update values for arguments (inputs).
    const argValues = opCached._argValues;

    // Fields are set during opCached initialization.

    // Blocks should glow when a script is starting,
    // not after it has finished (see #1404).
    // Only blocks in blockContainers that don't forceNoGlow
    // should request a glow.
    if (!blockContainer.forceNoGlow) {
      thread.requestScriptGlowInFrame = true;
    }

    // Inputs are set during previous steps in the loop.

    const primitiveReportedValue = blockFunction(argValues, blockUtility);

    const primitiveIsPromise = isPromise(primitiveReportedValue);
    if (primitiveIsPromise || currentStackFrame.waitingReporter) {
      if (primitiveIsPromise) {
        handlePromise(primitiveReportedValue, sequencer, thread, opCached, lastOperation);
      }

      // Store the already reported values. They will be thawed into the
      // future versions of the same operations by block id. The reporting
      // operation if it is promise waiting will set its parent value at
      // that time.
      thread.justReported = null;
      currentStackFrame.reporting = ops[i].id;
      currentStackFrame.reported = ops.slice(0, i).map((reportedCached) => {
        const inputName = reportedCached._parentKey;
        const reportedValues = reportedCached._parentValues;

        if (inputName === "BROADCAST_INPUT") {
          return {
            opCached: reportedCached.id,
            inputValue: reportedValues[inputName].BROADCAST_OPTION.name,
          };
        }
        return {
          opCached: reportedCached.id,
          inputValue: reportedValues[inputName],
        };
      });

      // We are waiting to be resumed later. Stop running this set of operations
      // and continue them later after thawing the reported values.
      break;
    } else if (thread.status === Thread.STATUS_RUNNING) {
      if (lastOperation) {
        handleReport(primitiveReportedValue, sequencer, thread, opCached, lastOperation);
      } else {
        // By definition a block that is not last in the list has a
        // parent.
        const inputName = opCached._parentKey;
        const parentValues = opCached._parentValues;

        if (inputName === "BROADCAST_INPUT") {
          // Something is plugged into the broadcast input.
          // Cast it to a string. We don't need an id here.
          parentValues.BROADCAST_OPTION.id = null;
          parentValues.BROADCAST_OPTION.name = cast.toString(primitiveReportedValue);
        } else {
          parentValues[inputName] = primitiveReportedValue;
        }
      }
    }
  }

  if (runtime.profiler !== null) {
    if (blockCached._profiler !== runtime.profiler) {
      _prepareBlockProfiling(runtime.profiler, blockCached);
    }
    // Determine the index that is after the last executed block. `i` is
    // currently the block that was just executed. `i + 1` will be the block
    // after that. `length` with the min call makes sure we don't try to
    // reference an operation outside of the set of operations.
    const end = Math.min(i + 1, length);
    for (let p = start; p < end; p++) {
      ops[p]._profilerFrame.count += 1;
    }
  }
};

/**
 * Handle any reported value from the primitive, either directly returned
 * or after a promise resolves.
 * @param {*} resolvedValue Value eventually returned from the primitive.
 * @param {!Sequencer} sequencer Sequencer stepping the thread for the ran
 * primitive.
 * @param {!Thread} thread Thread containing the primitive.
 * @param {!string} currentBlockId Id of the block in its thread for value from
 * the primitive.
 * @param {!string} opcode opcode used to identify a block function primitive.
 * @param {!boolean} isHat Is the current block a hat?
 */
// @todo move this to callback attached to the thread when we have performance
// metrics (dd)
const handleReport = function (resolvedValue, sequencer, thread, blockCached, lastOperation) {
  const currentBlockId = blockCached.id;
  const opcode = blockCached.opcode;
  const isHat = blockCached._isHat;

  thread.pushReportedValue(resolvedValue);
  if (isHat) {
    // Hat predicate was evaluated.
    if (sequencer.runtime.getIsEdgeActivatedHat(opcode)) {
      // If this is an edge-activated hat, only proceed if the value is
      // true and used to be false, or the stack was activated explicitly
      // via stack click
      if (!thread.stackClick) {
        const hasOldEdgeValue = thread.target.hasEdgeActivatedValue(currentBlockId);
        const oldEdgeValue = thread.target.updateEdgeActivatedValue(currentBlockId, resolvedValue);

        const edgeWasActivated = hasOldEdgeValue ? !oldEdgeValue && resolvedValue : resolvedValue;
        if (edgeWasActivated) {
          // TW: Resume the thread if we were paused for a promise.
          thread.status = Thread.STATUS_RUNNING;
        } else {
          sequencer.retireThread(thread);
        }
      }
    } else if (!resolvedValue) {
      // Not an edge-activated hat: retire the thread
      // if predicate was false.
      sequencer.retireThread(thread);
    }
  } else {
    // In a non-hat, report the value visually if necessary if
    // at the top of the thread stack.
    if (lastOperation && typeof resolvedValue !== "undefined" && thread.atStackTop()) {
      if (thread.stackClick) {
        sequencer.runtime.visualReport(currentBlockId, resolvedValue);
      }
      if (thread.updateMonitor) {
        const targetId = sequencer.runtime.monitorBlocks.getBlock(currentBlockId).targetId;
        if (targetId && !sequencer.runtime.getTargetById(targetId)) {
          // Target no longer exists
          return;
        }
        sequencer.runtime.requestUpdateMonitor(
          Map({
            id: currentBlockId,
            spriteName: targetId ? sequencer.runtime.getTargetById(targetId).getName() : null,
            value: resolvedValue,
          })
        );
      }
    }
    // Finished any yields.
    thread.status = Thread.STATUS_RUNNING;
  }
};

const handlePromise = (primitiveReportedValue, sequencer, thread, blockCached, lastOperation) => {
  if (thread.status === Thread.STATUS_RUNNING) {
    // Primitive returned a promise; automatically yield thread.
    thread.status = Thread.STATUS_PROMISE_WAIT;
  }
  // Promise handlers
  primitiveReportedValue.then(
    (resolvedValue) => {
      handleReport(resolvedValue, sequencer, thread, blockCached, lastOperation);
      // If it's a command block or a top level reporter in a stackClick.
      // TW: Don't mangle the stack when we just finished executing a hat block.
      // Hat block is always the top and first block of the script. There are no loops to find.
      if (lastOperation && !blockCached._isHat) {
        let stackFrame;
        let nextBlockId;
        do {
          // In the case that the promise is the last block in the current thread stack
          // We need to pop out repeatedly until we find the next block.
          const popped = thread.popStack();
          if (popped === null) {
            return;
          }
          nextBlockId = thread.target.blocks.getNextBlock(popped);
          if (nextBlockId !== null) {
            // A next block exists so break out this loop
            break;
          }
          // Investigate the next block and if not in a loop,
          // then repeat and pop the next item off the stack frame
          stackFrame = thread.peekStackFrame();
        } while (stackFrame !== null && !stackFrame.isLoop);

        thread.pushStack(nextBlockId);
      }
    },
    (rejectionReason) => {
      // Promise rejected: the primitive had some error.
      // Log it and proceed.
      log.warn("Primitive rejected promise: ", rejectionReason);
      thread.status = Thread.STATUS_RUNNING;
      thread.popStack();
    }
  );
};

/**
 * Start all relevant hats.
 * @param {!string} requestedHatOpcode Opcode of hats to start.
 * @param {object=} optMatchFields Optionally, fields to match on the hat.
 * @param {Target=} optTarget Optionally, a target to restrict to.
 * @return {Array.<Thread>} List of threads started by this function.
 */
function startHats(requestedHatOpcode, optMatchFields, optTarget) {
  if (!Object.prototype.hasOwnProperty.call(this._hats, requestedHatOpcode)) {
    // No known hat with this opcode.
    return;
  }
  const instance = this;
  const newThreads = [];
  // Look up metadata for the relevant hat.
  const hatMeta = instance._hats[requestedHatOpcode];

  for (const opts in optMatchFields) {
    if (!Object.prototype.hasOwnProperty.call(optMatchFields, opts)) continue;
    optMatchFields[opts] = optMatchFields[opts].toUpperCase();
  }

  // Consider all scripts, looking for hats with opcode `requestedHatOpcode`.
  this.allScriptsByOpcodeDo(
    requestedHatOpcode,
    (script, target) => {
      const { blockId: topBlockId, fieldsOfInputs: hatFields } = script;

      // Match any requested fields.
      // For example: ensures that broadcasts match.
      // This needs to happen before the block is evaluated
      // (i.e., before the predicate can be run) because "broadcast and wait"
      // needs to have a precise collection of started threads.
      for (const matchField in optMatchFields) {
        if (hatFields[matchField].value !== optMatchFields[matchField]) {
          // Field mismatch.
          return;
        }
      }

      if (hatMeta.restartExistingThreads) {
        // If `restartExistingThreads` is true, we should stop
        // any existing threads starting with the top block.
        for (let i = 0; i < this.threads.length; i++) {
          if (
            this.threads[i].target === target &&
            this.threads[i].topBlock === topBlockId &&
            // stack click threads and hat threads can coexist
            !this.threads[i].stackClick
          ) {
            newThreads.push(this._restartThread(this.threads[i]));
            return;
          }
        }
      } else {
        // If `restartExistingThreads` is false, we should
        // give up if any threads with the top block are running.
        for (let j = 0; j < this.threads.length; j++) {
          if (
            this.threads[j].target === target &&
            this.threads[j].topBlock === topBlockId &&
            // stack click threads and hat threads can coexist
            !this.threads[j].stackClick &&
            this.threads[j].status !== Thread.STATUS_DONE
          ) {
            // Some thread is already running.
            return;
          }
        }
      }
      // Start the thread with this top block.
      newThreads.push(this._pushThread(topBlockId, target));
    },
    optTarget
  );
  // For compatibility with Scratch 2, edge triggered hats need to be processed before
  // threads are stepped. See ScratchRuntime.as for original implementation
  newThreads.forEach((thread) => {
    execute(this.sequencer, thread);
    thread.goToNextBlock();
  });
  return newThreads;
}

export class ScratchAddonsProcedureBlocks {
  constructor(runtime) {
    /**
     * The runtime instantiating this block package.
     * @type {Vm.Runtime}
     */
    this.runtime = runtime;
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

  _pollute(util) {
    if (!util.saPolluted) {
      const Util = util.constructor.prototype;
      Util.procReturns = {};
      Util.onProcReturn = function (id, callback) {
        this.procReturns[id] = callback;
      };
      Util.procReturn = function (id, value) {
        this.procReturns[id](value);
      };
      Util.saPolluted = true;
      //}
      //if (!util.thread.saPolluted) {
      console.log("pollute!");
      // pollute Thread to emulate `&& !thread.peekStackFrame().waitingReporter` at scratch-vm/src/engine/sequencer.js#L236
      // this is incredibly painful and it's probably wrong
      // of course we could just rewrite the whole function for that one change... but where's the fun in that?
      util.thread.saPolluted = true;
      blockUtility = util;
      Thread = util.thread.constructor.prototype;
      /*const stepThread = Thread.stepThread;
      const peekStackFrame = Thread.peekStackFrame;
      const popStack = Thread.popStack;
      const goToNextBlock = Thread.goToNextBlock;
      const patch = function () {
        console.log("patch!");
        Thread.goToNextBlock = function () {
          console.log("gotonextblock!");
          if (Thread.peekStackFrame().waitingReporter) return;
          goToNextBlock.call(this);
          Thread.goToNextBlock = goToNextBlock;
          Thread.peekStackFrame = peekStackFrame;
        };
        Thread.popStack = function () {
          console.log("popstack!");
          Thread.goToNextBlock = function () {
            console.log("gotonextblock2!");
            patch();
            goToNextBlock.call(this);
          };
        };
      };
      Thread.stepThread = function (thread) {
        console.log("stepthread!");
        Thread.peekStackFrame = function () {
          console.log("peekstackframe!");
          patch();
          return peekStackFrame.call(this);
        };
        stepThread.call(this, thread);
        Thread.peekStackFrame = peekStackFrame;
        Thread.popStack = popStack;
        Thread.goToNextBlock = goToNextBlock;
      };*/
      util.sequencer.runtime.startHats = startHats;
      const Sequencer = util.sequencer.constructor.prototype;
      Sequencer.stepThread = function (thread) {
        console.log("step thread");
        let currentBlockId = thread.peekStack();
        if (!currentBlockId) {
          // A "null block" - empty branch.
          thread.popStack();

          // Did the null follow a hat block?
          if (thread.stack.length === 0) {
            thread.status = Thread.STATUS_DONE;
            return;
          }
        }
        // Save the current block ID to notice if we did control flow.
        while ((currentBlockId = thread.peekStack())) {
          let isWarpMode = thread.peekStackFrame().warpMode;
          if (isWarpMode && !thread.warpTimer) {
            // Initialize warp-mode timer if it hasn't been already.
            // This will start counting the thread toward `Sequencer.WARP_TIME`.
            thread.warpTimer = new Timer();
            thread.warpTimer.start();
          }
          // Execute the current block.
          if (this.runtime.profiler !== null) {
            if (executeProfilerId === -1) {
              executeProfilerId = this.runtime.profiler.idByName(executeProfilerFrame);
            }

            // Increment the number of times execute is called.
            this.runtime.profiler.increment(executeProfilerId);
          }
          if (thread.target === null) {
            this.retireThread(thread);
          } else {
            execute(this, thread);
          }
          thread.blockGlowInFrame = currentBlockId;
          // If the thread has yielded or is waiting, yield to other threads.
          if (thread.status === Thread.STATUS_YIELD) {
            // Mark as running for next iteration.
            thread.status = Thread.STATUS_RUNNING;
            // In warp mode, yielded blocks are re-executed immediately.
            if (isWarpMode && thread.warpTimer.timeElapsed() <= Sequencer.WARP_TIME) {
              continue;
            }
            return;
          } else if (thread.status === Thread.STATUS_PROMISE_WAIT) {
            // A promise was returned by the primitive. Yield the thread
            // until the promise resolves. Promise resolution should reset
            // thread.status to Thread.STATUS_RUNNING.
            return;
          } else if (thread.status === Thread.STATUS_YIELD_TICK) {
            // stepThreads will reset the thread to Thread.STATUS_RUNNING
            return;
          }
          // If no control flow has happened, switch to next block.
          if (thread.peekStack() === currentBlockId && !thread.peekStackFrame().waitingReporter) {
            thread.goToNextBlock();
          }
          // If no next block has been found at this point, look on the stack.
          while (!thread.peekStack()) {
            thread.popStack();

            if (thread.stack.length === 0) {
              // No more stack to run!
              thread.status = Thread.STATUS_DONE;
              return;
            }

            const stackFrame = thread.peekStackFrame();
            isWarpMode = stackFrame.warpMode;

            if (stackFrame.isLoop) {
              // The current level of the stack is marked as a loop.
              // Return to yield for the frame/tick in general.
              // Unless we're in warp mode - then only return if the
              // warp timer is up.
              if (!isWarpMode || thread.warpTimer.timeElapsed() > Sequencer.WARP_TIME) {
                // Don't do anything to the stack, since loops need
                // to be re-executed.
                return;
              }
              // Don't go to the next block for this level of the stack,
              // since loops need to be re-executed.
              continue;
            } else if (stackFrame.waitingReporter) {
              // This level of the stack was waiting for a value.
              // This means a reporter has just returned - so don't go
              // to the next block for this level of the stack.
              continue;
            }
            // Get next block of existing block on the stack.
            thread.goToNextBlock();
          }
        }
      };

      // however Thread#stopThisScript is small enough that rewriting it is ok
      Thread.stopThisScript = function () {
        let blockID = this.peekStack();
        while (blockID !== null) {
          const block = this.target.blocks.getBlock(blockID);
          if (
            (typeof block !== "undefined" &&
              ["procedures_call", "procedures_call_reporter", "procedures_call_boolean"].includes(block.opcode)) ||
            this.peekStackFrame().waitingReporter
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
    }
  }

  definition() {
    // No-op: execute the blocks.
  }

  call(args, util) {
    this._pollute(util);
    console.log("called!");
    if (util.stackFrame.executed) {
      console.log("executed!");
      const returnValue = util.stackFrame.returnValue;
      // This stackframe will be reused for other reporters in this block, so clean it up for them.
      // Can't use reset() because that will reset too much.
      const threadStackFrame = util.thread.peekStackFrame();
      threadStackFrame.params = null;
      delete util.stackFrame.returnValue;
      delete util.stackFrame.executed;
      return returnValue;
    }
    const procedureCode = args.mutation.proccode;
    const paramNamesIdsAndDefaults = util.getProcedureParamNamesIdsAndDefaults(procedureCode);
    console.log(paramNamesIdsAndDefaults);
    // If null, procedure could not be found, which can happen if custom
    // block is dragged between sprites without the definition.
    // Match Scratch 2.0 behavior and noop.
    if (paramNamesIdsAndDefaults === null) {
      return "";
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
    util.thread.peekStackFrame().waitingReporter = true;
    // Default return value
    util.stackFrame.returnValue = "7";
    util.startProcedure(util.thread, procedureCode);
    console.log("started procedure!");
    // pretend we're returning a promise so the sequencer waits for a reporter
    /*return {
            then () {
                console.log('then!')
                // if the thread status is STATUS_PROMISE_WAIT, reset it to STATUS_RUNNING
                if (util.thread.status === 1) util.thread.status = 0;
            }
        };*/
    //return new Promise((r) => setTimeout(() => r(5), 1000))
    /*return new Promise((resolve) => {
      util.onProcReturn("a", (v) => resolve(v));
      console.log(util.procReturns);
    });*/
  }

  return(args, util) {
    console.log("returned!");
    util.stopThisScript();
    // If used outside of a custom block, there may be no stackframe.
    if (util.thread.peekStackFrame()) {
      util.stackFrame.returnValue = args.return_value;
      //util.stackFrame.waitingReporter = false;
      //util.procReturn("a", args.return_value);
    }
  }
}
