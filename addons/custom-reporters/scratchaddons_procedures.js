export class ScratchAddonsProcedureBlocks {
    constructor (runtime) {
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
    getPrimitives () {
        return {
            procedures_definition_reporter: this.definition,
            procedures_defitinition_boolean: this.definition,
            procedures_call_reporter: this.call,
            prcoedures_call_boolean: this.call,
            procedures_return_reporter: this.return,
            procedures_return_boolean: this.return
        };
    }

    _pollute(util) {
        if (!util.saPolluted) {
            const Util = util.constructor.prototype;
            Util.procReturns = {};
            Util.onProcReturn = function (id, callback) {
                this.procReturns[id] = callback;
            }
            Util.procReturn = function(id, value) {
                this.procReturns[id](value);
            }
            Util.saPolluted = true;
        }
        if (!util.thread.saPolluted) {
            console.log('pollute!')
            // pollute Thread to emulate `&& !thread.peekStackFrame().waitingReporter` at scratch-vm/src/engine/sequencer.js#L236
            // this is incredibly painful and it's probably wrong
            // of course we could just rewrite the whole function for that one change... but where's the fun in that?
            util.thread.saPolluted = true;
            const Thread = util.thread.constructor.prototype;
            const stepThread = Thread.stepThread;
            const peekStackFrame = Thread.peekStackFrame;
            const popStack = Thread.popStack;
            const goToNextBlock = Thread.goToNextBlock;
            const patch = function () {
                console.log('patch!')
                Thread.goToNextBlock = function () {
                    console.log('gotonextblock!')
                    if (Thread.peekStackFrame().waitingReporter) return;
                    goToNextBlock.call(this);
                    Thread.goToNextBlock = goToNextBlock;
                    Thread.peekStackFrame = peekStackFrame;
                }
                Thread.popStack = function () {
                    console.log('popstack!')
                    Thread.goToNextBlock = function () {
                        console.log('gotonextblock2!')
                        patch()
                        goToNextBlock.call(this);
                    }
                }
            };
            Thread.stepThread = function (thread) {
                console.log('stepthread!')
                Thread.peekStackFrame = function () {
                    console.log('peekstackframe!')
                    patch()
                    return peekStackFrame.call(this);
                };
                stepThread.call(this, thread);
                Thread.peekStackFrame = peekStackFrame;
                Thread.popStack = popStack;
                Thread.goToNextBlock = goToNextBlock;
            }

            // however Thread#stopThisScript is small enough that rewriting it is ok
            Thread.stopThisScript = function () {
                let blockID = this.peekStack();
                while (blockID !== null) {
                    const block = this.target.blocks.getBlock(blockID);
                    if ((typeof block !== 'undefined' && block.opcode === 'procedures_call') ||
                        this.peekStackFrame().waitingReporter) {
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
            }
        }
    }

    definition () {
        // No-op: execute the blocks.
    }

    call (args, util) {
        this._pollute(util);
        console.log('called!')
        if (util.stackFrame.executed) {
            console.log('executed!')
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
        console.log(paramNamesIdsAndDefaults)
        // If null, procedure could not be found, which can happen if custom
        // block is dragged between sprites without the definition.
        // Match Scratch 2.0 behavior and noop.
        if (paramNamesIdsAndDefaults === null) {
            return '';
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
        util.stackFrame.returnValue = '7';
        //util.startProcedure(util.thread, procedureCode);
        console.log('started procedure!')
        // pretend we're returning a promise so the sequencer waits for a reporter
        /*return {
            then () {
                console.log('then!')
                // if the thread status is STATUS_PROMISE_WAIT, reset it to STATUS_RUNNING
                if (util.thread.status === 1) util.thread.status = 0;
            }
        };*/
        //return new Promise((r) => setTimeout(() => r(5), 1000))
        return new Promise((resolve) => {
            util.onProcReturn('a', (v) => resolve(v));
            console.log(util.procReturns)
        });
    }

    return (args, util) {
        console.log('returned!')
        util.stopThisScript();
        // If used outside of a custom block, there may be no stackframe.
        if (util.thread.peekStackFrame()) {
            util.stackFrame.returnValue = args.return_value;
            util.stackFrame.waitingReporter = false;
            util.procReturn('a', args.return_value);
        }
    }
}