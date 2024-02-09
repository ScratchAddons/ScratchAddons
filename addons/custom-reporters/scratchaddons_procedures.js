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

    definition () {
        // No-op: execute the blocks.
    }

    call (args, util) {
        //this._polluteUtil(util);
        console.log('called!')
        if (util.stackFrame.executed) {
          const returnValue = stackFrame.returnValue;
          // This stackframe will be reused for other reporters in this block, so clean it up for them.
          // Can't use reset() because that will reset too much.
          const threadStackFrame = util.thread.peekStackFrame();
          threadStackFrame.params = null;
          delete stackFrame.returnValue;
          delete stackFrame.executed;
          return returnValue;
        }
        const procedureCode = args.mutation.proccode;
        const paramNamesIdsAndDefaults = util.getProcedureParamNamesIdsAndDefaults(procedureCode);

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
        util.stackFrame.returnValue = '';
        util.startProcedure(util.thread, procedureCode);
    }

    return (args, util) {
        console.log('returned!')
        util.stopThisScript();
        // If used outside of a custom block, there may be no stackframe.
        if (util.thread.peekStackFrame()) {
            util.stackFrame.returnValue = args.return_value;
        }
    }
}